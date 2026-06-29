import * as cheerio from 'cheerio';
import type { CheckContext, CheckResult } from '../types.js';
import { WEIGHTS } from '../rubric.js';

export function runUnderstandability(ctx: CheckContext): CheckResult[] {
  const w = WEIGHTS.understandability;
  const $ = cheerio.load(ctx.fetch.html);
  const results: CheckResult[] = [];

  let validJsonLd = false;
  let parseError = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data && (data['@context'] || data['@type'] || Array.isArray(data))) validJsonLd = true;
    } catch { parseError = true; }
  });
  results.push(validJsonLd
    ? { id: 'un-json-ld', category: 'understandability', score: w.jsonLd, max: w.jsonLd, status: 'pass', message: 'Valid schema.org JSON-LD found.', fix: '' }
    : { id: 'un-json-ld', category: 'understandability', score: 0, max: w.jsonLd, status: 'fail', message: parseError ? 'JSON-LD present but failed to parse.' : 'No schema.org JSON-LD found.', fix: 'Add a JSON-LD <script type="application/ld+json"> describing your entity (e.g. Hotel, Restaurant, LocalBusiness).' });

  const title = $('head title').first().text().trim();
  results.push(title
    ? { id: 'un-title', category: 'understandability', score: w.title, max: w.title, status: 'pass', message: `Title: "${title}".`, fix: '' }
    : { id: 'un-title', category: 'understandability', score: 0, max: w.title, status: 'fail', message: 'No <title>.', fix: 'Add a descriptive <title>.' });

  const desc = $('head meta[name="description"]').attr('content')?.trim();
  results.push(desc
    ? { id: 'un-meta-description', category: 'understandability', score: w.metaDescription, max: w.metaDescription, status: 'pass', message: 'Meta description present.', fix: '' }
    : { id: 'un-meta-description', category: 'understandability', score: 0, max: w.metaDescription, status: 'fail', message: 'No meta description.', fix: 'Add <meta name="description"> summarizing the page.' });

  const og = $('head meta[property^="og:"]').length;
  results.push(og > 0
    ? { id: 'un-open-graph', category: 'understandability', score: w.openGraph, max: w.openGraph, status: 'pass', message: `${og} Open Graph tag(s).`, fix: '' }
    : { id: 'un-open-graph', category: 'understandability', score: 0, max: w.openGraph, status: 'warn', message: 'No Open Graph tags.', fix: 'Add og:title, og:description, og:image for richer agent/social previews.' });

  const lang = $('html').attr('lang')?.trim();
  results.push(lang
    ? { id: 'un-lang', category: 'understandability', score: w.lang, max: w.lang, status: 'pass', message: `lang="${lang}".`, fix: '' }
    : { id: 'un-lang', category: 'understandability', score: 0, max: w.lang, status: 'warn', message: 'No lang attribute on <html>.', fix: 'Add a lang attribute (e.g. <html lang="en">).' });

  const canonical = $('head link[rel="canonical"]').attr('href');
  results.push(canonical
    ? { id: 'un-canonical', category: 'understandability', score: w.canonical, max: w.canonical, status: 'pass', message: 'Canonical link present.', fix: '' }
    : { id: 'un-canonical', category: 'understandability', score: 0, max: w.canonical, status: 'warn', message: 'No canonical link.', fix: 'Add <link rel="canonical"> to avoid duplicate-content ambiguity.' });

  return results;
}
