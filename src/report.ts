import type { FetchResult, Report } from './types.js';
import type { StackProfile } from './detect.js';
import { runChecks } from './checks/index.js';
import { aggregate } from './score.js';
import { gradeFor, RUBRIC_VERSION } from './rubric.js';

export function buildReport(fetch: FetchResult, now: string, stack: StackProfile): Report {
  const checks = runChecks({ fetch });
  const { categories, total, summary } = aggregate(checks);
  return {
    target: fetch.target,
    mode: fetch.mode,
    fetchedAs: fetch.fetchedAs,
    rubricVersion: RUBRIC_VERSION,
    stack,
    score: total,
    grade: gradeFor(total),
    categories,
    summary,
    generatedAt: now,
  };
}

const icon = (s: string) => (s === 'pass' ? '✅' : s === 'warn' ? '⚠️' : '❌');

export function formatTerminal(r: Report): string {
  const lines: string[] = [];
  lines.push(`agent-ready · rubric v${r.rubricVersion} · ${r.stack.framework}/${r.stack.rendering}`);
  lines.push(`Agent-Readiness: Score: ${r.score}/100  (${r.grade})  — ${r.target}`);
  lines.push(`fetched as: ${r.fetchedAs}  |  ✅ ${r.summary.passes}  ⚠️ ${r.summary.warns}  ❌ ${r.summary.fails}`);
  for (const cat of r.categories) {
    lines.push('');
    lines.push(`${cat.label}: ${cat.score}/${cat.max}`);
    for (const c of cat.checks) {
      lines.push(`  ${icon(c.status)} ${c.message}`);
      if (c.fix) lines.push(`      → ${c.fix}`);
    }
  }
  return lines.join('\n');
}

export function formatMarkdown(r: Report): string {
  const lines: string[] = [];
  lines.push(`# Agent-Readiness Report — ${r.target}`);
  lines.push(`rubric v${r.rubricVersion} · ${r.stack.framework}/${r.stack.rendering}`);
  lines.push('');
  lines.push(`**Score: ${r.score}/100 (${r.grade})** · ✅ ${r.summary.passes} · ⚠️ ${r.summary.warns} · ❌ ${r.summary.fails} · fetched as \`${r.fetchedAs}\``);
  for (const cat of r.categories) {
    lines.push('');
    lines.push(`## ${cat.label} — ${cat.score}/${cat.max}`);
    for (const c of cat.checks) {
      lines.push(`- ${icon(c.status)} ${c.message}${c.fix ? `\n  - **Fix:** ${c.fix}` : ''}`);
    }
  }
  return lines.join('\n');
}
