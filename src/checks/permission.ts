import type { CheckContext, CheckResult } from '../types.js';
import { WEIGHTS } from '../rubric.js';

export const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

/**
 * Returns true only when a full-site block (`Disallow: /`) applies to `ua`
 * (via a group that names the UA, or the `*` wildcard group when the UA has
 * no own group). Narrower disallows like `Disallow: /admin` are intentionally
 * NOT treated as blocking — this check is "is the whole site closed to this bot".
 */
export function isBotBlocked(robotsTxt: string, ua: string): boolean {
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim());
  const groups: { agents: string[]; disallows: string[] }[] = [];
  let current: { agents: string[]; disallows: string[] } | null = null;
  let lastWasAgent = false;
  for (const line of lines) {
    const [rawKey, ...rest] = line.split(':');
    if (!rest.length) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) { current = { agents: [], disallows: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (key === 'disallow' && current) {
      current.disallows.push(value);
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  const uaLower = ua.toLowerCase();
  const matching = groups.filter((g) => g.agents.includes(uaLower));
  const wildcard = groups.filter((g) => g.agents.includes('*'));
  const applicable = matching.length ? matching : wildcard;
  return applicable.some((g) => g.disallows.includes('/'));
}

export function hasContentSignals(robotsTxt: string): boolean {
  return /^\s*content-signal\s*:/im.test(robotsTxt);
}

export function runPermission(ctx: CheckContext): CheckResult[] {
  const w = WEIGHTS.permission;
  const { robotsTxt } = ctx.fetch;
  const results: CheckResult[] = [];
  const robots = robotsTxt && robotsTxt.trim().length > 0 ? robotsTxt : null;

  results.push(robots
    ? { id: 'pe-robots-exists', category: 'permission', score: w.robotsExists, max: w.robotsExists, status: 'pass', message: 'robots.txt is present.', fix: '' }
    : { id: 'pe-robots-exists', category: 'permission', score: 0, max: w.robotsExists, status: 'fail', message: 'No robots.txt found.', fix: 'Add a robots.txt at the site root that permits AI crawlers and points to your sitemap.' });

  const blocked = robots ? AI_BOTS.filter((b) => isBotBlocked(robots, b)) : [];
  results.push(blocked.length === 0
    ? { id: 'pe-ai-bots-allowed', category: 'permission', score: w.aiBotsAllowed, max: w.aiBotsAllowed, status: 'pass', message: 'No major AI crawler is blocked.', fix: '' }
    : { id: 'pe-ai-bots-allowed', category: 'permission', score: 0, max: w.aiBotsAllowed, status: 'fail', message: `These AI crawlers are blocked: ${blocked.join(', ')}.`, fix: 'Remove the Disallow: / rules for these user-agents so AI engines can read your content.' });

  results.push(robots && hasContentSignals(robots)
    ? { id: 'pe-content-signals', category: 'permission', score: w.contentSignals, max: w.contentSignals, status: 'pass', message: 'Content Signals declared in robots.txt.', fix: '' }
    : { id: 'pe-content-signals', category: 'permission', score: 0, max: w.contentSignals, status: 'fail', message: 'No Content Signals (search/ai-input/ai-train) in robots.txt.', fix: 'Declare a Content-Signal line in robots.txt to state how AI may use your content (e.g. "Content-Signal: search=yes, ai-input=yes, ai-train=no").' });

  return results;
}
