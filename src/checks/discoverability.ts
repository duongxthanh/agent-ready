import type { CheckContext, CheckResult } from '../types.js';
import { WEIGHTS } from '../rubric.js';

export function runDiscoverability(ctx: CheckContext): CheckResult[] {
  const w = WEIGHTS.discoverability;
  const { sitemapXml, llmsTxt, headers, markdownContentType } = ctx.fetch;
  const results: CheckResult[] = [];

  const sitemapValid = !!sitemapXml && /<urlset|<sitemapindex/i.test(sitemapXml);
  results.push(sitemapValid
    ? { id: 'di-sitemap', category: 'discoverability', score: w.sitemap, max: w.sitemap, status: 'pass', message: 'sitemap.xml present.', fix: '' }
    : { id: 'di-sitemap', category: 'discoverability', score: 0, max: w.sitemap, status: 'fail', message: sitemapXml ? 'sitemap.xml present but not a valid urlset.' : 'No sitemap.xml.', fix: 'Publish a sitemap.xml and reference it from robots.txt.' });

  const llmsValid = !!llmsTxt && llmsTxt.trim().startsWith('#');
  results.push(llmsValid
    ? { id: 'di-llms-txt', category: 'discoverability', score: w.llmsTxt, max: w.llmsTxt, status: 'pass', message: 'llms.txt present.', fix: '' }
    : { id: 'di-llms-txt', category: 'discoverability', score: 0, max: w.llmsTxt, status: 'fail', message: llmsTxt ? 'llms.txt present but missing a top-level "# Title".' : 'No llms.txt.', fix: 'Add an llms.txt at the root: an H1 title, a ">" summary line, and curated links to key pages.' });

  const linkHeader = headers['link'];
  results.push(linkHeader
    ? { id: 'di-link-headers', category: 'discoverability', score: w.linkHeaders, max: w.linkHeaders, status: 'pass', message: 'Link header present for agent discovery.', fix: '' }
    : { id: 'di-link-headers', category: 'discoverability', score: 0, max: w.linkHeaders, status: 'fail', message: 'No Link header (RFC 8288) on the homepage.', fix: 'Add a Link response header pointing agents to docs/catalogs (e.g. Link: </.well-known/api-catalog>; rel="api-catalog").' });

  results.push(markdownContentType
    ? { id: 'di-markdown', category: 'discoverability', score: w.markdown, max: w.markdown, status: 'pass', message: `Serves ${markdownContentType} when an agent requests markdown.`, fix: '' }
    : { id: 'di-markdown', category: 'discoverability', score: 0, max: w.markdown, status: 'fail', message: 'No markdown content negotiation (Accept: text/markdown returns HTML).', fix: 'Optionally serve a text/markdown representation when agents send Accept: text/markdown.' });

  return results;
}
