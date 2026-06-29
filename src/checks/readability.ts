import * as cheerio from 'cheerio';
import type { CheckContext, CheckResult } from '../types.js';
import { WEIGHTS } from '../rubric.js';

const MIN_WORDS = 50;
const SPA_MARKERS = ['__NEXT_DATA__', 'data-reactroot', 'ng-version'];
const MOUNT_IDS = ['root', 'app', '__next', '__nuxt'];

export function runReadability(ctx: CheckContext): CheckResult[] {
  const w = WEIGHTS.readability;
  const html = ctx.fetch.html;
  const $ = cheerio.load(html);
  $('script, style, noscript, template').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;

  const mountEmpty = MOUNT_IDS.some((id) => {
    const el = $(`#${id}`);
    return el.length > 0 && el.text().replace(/\s+/g, '').length === 0;
  });
  const hasMarker = SPA_MARKERS.some((m) => html.includes(m));
  const looksSpa = mountEmpty || hasMarker;
  const headings = $('h1, h2, h3').length;
  const semantic = $('main, article, section, nav').length;

  const results: CheckResult[] = [];

  results.push(words >= MIN_WORDS
    ? { id: 're-has-text', category: 'readability', score: w.hasText, max: w.hasText, status: 'pass', message: `${words} words of visible text in raw HTML.`, fix: '' }
    : { id: 're-has-text', category: 'readability', score: 0, max: w.hasText, status: 'fail', message: `Only ${words} words of visible text in raw HTML — AI crawlers (which do not run JS) will see almost nothing.`, fix: 'Server-render or pre-render your main content (SSR/SSG/prerender) so it is present in the initial HTML.', evidence: text.slice(0, 120) });

  if (looksSpa && words < MIN_WORDS) {
    results.push({ id: 're-not-spa-shell', category: 'readability', score: 0, max: w.notSpaShell, status: 'fail', message: 'Page is an empty client-rendered shell (mount node empty / SPA markers present).', fix: 'Adopt SSR/SSG so content is in the HTML response, not injected by JavaScript.', evidence: hasMarker ? 'SPA marker found' : 'empty mount node' });
  } else if (looksSpa) {
    results.push({ id: 're-not-spa-shell', category: 'readability', score: Math.round(w.notSpaShell / 2), max: w.notSpaShell, status: 'warn', message: 'SPA framework detected but content is present in HTML.', fix: 'Verify all key content is server-rendered, not just above-the-fold.' });
  } else {
    results.push({ id: 're-not-spa-shell', category: 'readability', score: w.notSpaShell, max: w.notSpaShell, status: 'pass', message: 'No empty client-render shell detected.', fix: '' });
  }

  results.push(headings > 0
    ? { id: 're-has-headings', category: 'readability', score: w.hasHeadings, max: w.hasHeadings, status: 'pass', message: `${headings} heading(s) found.`, fix: '' }
    : { id: 're-has-headings', category: 'readability', score: 0, max: w.hasHeadings, status: 'fail', message: 'No headings (h1–h3) in HTML.', fix: 'Add a clear <h1> and section headings so agents can parse document structure.' });

  results.push(semantic > 0
    ? { id: 're-semantic', category: 'readability', score: w.semantic, max: w.semantic, status: 'pass', message: `${semantic} semantic landmark(s).`, fix: '' }
    : { id: 're-semantic', category: 'readability', score: 0, max: w.semantic, status: 'warn', message: 'No semantic landmarks (main/article/section/nav).', fix: 'Use semantic HTML5 elements so agents can identify the main content.' });

  return results;
}
