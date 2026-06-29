// tests/cli.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { main, isDirectRun } from '../src/cli.js';

const here = dirname(fileURLToPath(import.meta.url));
const siteDir = join(here, 'fixtures', 'site');

let out: string[];
beforeEach(() => { out = []; vi.spyOn(console, 'log').mockImplementation((m?: unknown) => { out.push(String(m)); }); });
afterEach(() => { vi.restoreAllMocks(); });

describe('cli', () => {
  it('prints JSON report for a folder target', async () => {
    const code = await main([siteDir, '--json']);
    expect(code).toBe(0);
    const report = JSON.parse(out.join('\n'));
    expect(report.score).toBeGreaterThan(0);
    expect(report.mode).toBe('folder');
  });

  it('returns exit code 2 with no target', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await main([])).toBe(2);
  });

  it('prints usage and exits 0 for --help', async () => {
    const code = await main(['--help']);
    expect(code).toBe(0);
    expect(out.join('\n')).toContain('Usage: agent-visible');
  });

  it('handles an unknown flag cleanly (exit 2, no throw)', async () => {
    const err: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((m?: unknown) => { err.push(String(m)); });
    const code = await main(['--bogus']);
    expect(code).toBe(2);
    expect(err.join('\n')).toContain('Usage: agent-visible');
  });

  it('reports rubricVersion 2 and a stack profile', async () => {
    const code = await main([siteDir, '--json']);
    expect(code).toBe(0);
    const report = JSON.parse(out.join('\n'));
    expect(report.rubricVersion).toBe(2);
    expect(report.stack).toBeTruthy();
    expect(typeof report.stack.framework).toBe('string');
  });

  it('isDirectRun detects invocation through a symlink (global bin / npx)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ar-cli-'));
    try {
      const real = join(dir, 'real.js');
      const link = join(dir, 'link.js');
      writeFileSync(real, '// entry');
      symlinkSync(real, link);
      const metaUrl = pathToFileURL(real).href;
      expect(isDirectRun(metaUrl, link)).toBe(true);  // invoked via symlink
      expect(isDirectRun(metaUrl, real)).toBe(true);  // invoked directly
      expect(isDirectRun(metaUrl, join(dir, 'missing.js'))).toBe(false);
      expect(isDirectRun(metaUrl, undefined)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
