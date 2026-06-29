#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { realpathSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchTarget } from './fetch.js';
import { buildReport, formatTerminal, formatMarkdown } from './report.js';
import { detectStack } from './detect.js';
import type { FetchResult, StackProfile } from './types.js';

// True when this module is the entry point — robust to symlinks (npm link /
// global bin / npx), where process.argv[1] is the symlink, not the real file.
export function isDirectRun(metaUrl: string, argv1: string | undefined): boolean {
  if (!argv1) return false;
  try {
    return metaUrl === pathToFileURL(realpathSync(argv1)).href;
  } catch {
    return false;
  }
}

const USAGE = 'Usage: agent-ready <url|folder> [--json] [--markdown] [--ua <name>] [--help]';

async function profileStack(target: string, fetched: FetchResult): Promise<StackProfile> {
  if (fetched.mode === 'folder') {
    const packageJson = await readFile(join(target, 'package.json'), 'utf8').catch(() => undefined);
    const files = await readdir(target).catch(() => [] as string[]);
    return detectStack({ packageJson, files, html: fetched.html });
  }
  return detectStack({ html: fetched.html });
}

export async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        json: { type: 'boolean', default: false },
        markdown: { type: 'boolean', default: false },
        ua: { type: 'string' },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
  } catch (e) {
    // Unknown flag / bad value: report cleanly instead of dumping a stack trace.
    console.error(`agent-ready: ${e instanceof Error ? e.message : String(e)}`);
    console.error(USAGE);
    return 2;
  }
  const { values, positionals } = parsed;
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  const target = positionals[0];
  if (!target) {
    console.error(USAGE);
    return 2;
  }
  const fetched = await fetchTarget(target, { ua: values.ua as string | undefined });
  const stack = await profileStack(target, fetched);
  const report = buildReport(fetched, new Date().toISOString(), stack);
  if (values.json) console.log(JSON.stringify(report, null, 2));
  else if (values.markdown) console.log(formatMarkdown(report));
  else console.log(formatTerminal(report));
  return 0;
}

// Run only when invoked directly (including via a symlinked global bin).
if (isDirectRun(import.meta.url, process.argv[1])) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
