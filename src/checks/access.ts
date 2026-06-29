import type { CheckContext, CheckResult } from '../types.js';
import { WEIGHTS } from '../rubric.js';

const BLOCK_STATUSES = [401, 403, 429];

export function runAccess(ctx: CheckContext): CheckResult[] {
  const w = WEIGHTS.access;
  const { status, ok, mode, html } = ctx.fetch;
  const results: CheckResult[] = [];

  if (mode === 'folder') {
    results.push({ id: 'ac-http-ok', category: 'access', score: w.httpOk, max: w.httpOk, status: 'pass', message: 'Folder mode: HTTP status not applicable.', fix: '' });
    results.push({ id: 'ac-not-blocked', category: 'access', score: w.notBlocked, max: w.notBlocked, status: 'pass', message: 'Folder mode: bot access not applicable.', fix: '' });
    return results;
  }

  if (ok && status >= 200 && status < 300) {
    results.push({ id: 'ac-http-ok', category: 'access', score: w.httpOk, max: w.httpOk, status: 'pass', message: `HTTP ${status}.`, fix: '' });
  } else {
    results.push({ id: 'ac-http-ok', category: 'access', score: 0, max: w.httpOk, status: 'fail', message: `HTTP ${status || 'unreachable'} — agents cannot fetch the page.`, fix: 'Ensure the URL returns 200 OK without auth walls or redirect loops.' });
  }

  const blockedByStatus = BLOCK_STATUSES.includes(status);
  const emptyDoc = (html ?? '').trim().length === 0;
  if (!blockedByStatus && !emptyDoc) {
    results.push({ id: 'ac-not-blocked', category: 'access', score: w.notBlocked, max: w.notBlocked, status: 'pass', message: 'Server served content to the AI crawler user-agent.', fix: '' });
  } else {
    results.push({ id: 'ac-not-blocked', category: 'access', score: 0, max: w.notBlocked, status: 'fail', message: blockedByStatus ? `Server returned ${status} to the AI crawler user-agent (likely UA-based block).` : 'Server returned an empty document to the AI crawler user-agent.', fix: 'Do not block or cloak GPTBot/ClaudeBot/PerplexityBot by user-agent; serve them the same content as browsers.' });
  }

  return results;
}
