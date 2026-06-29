import { describe, it, expect } from 'vitest';
import { runDiscoverability } from '../src/checks/discoverability.js';
import type { FetchResult } from '../src/types.js';

const mk = (over: Partial<FetchResult>): FetchResult => ({
  target: 'https://x.com', mode: 'url', fetchedAs: 'GPTBot', status: 200, ok: true,
  headers: {}, html: '<html></html>', robotsTxt: null, sitemapXml: null, llmsTxt: null,
  markdownContentType: null, timingMs: 1, ...over,
});

describe('runDiscoverability', () => {
  it('passes everything when all signals present', () => {
    const r = runDiscoverability({ fetch: mk({
      sitemapXml: '<urlset></urlset>', llmsTxt: '# Site\n> summary',
      headers: { link: '</api>; rel="service-doc"' }, markdownContentType: 'text/markdown',
    }) });
    for (const id of ['di-sitemap', 'di-llms-txt', 'di-link-headers', 'di-markdown']) {
      expect(r.find((c) => c.id === id)?.status).toBe('pass');
    }
  });

  it('fails link-headers and markdown when absent', () => {
    const r = runDiscoverability({ fetch: mk({ sitemapXml: '<urlset></urlset>' }) });
    expect(r.find((c) => c.id === 'di-link-headers')?.status).toBe('fail');
    expect(r.find((c) => c.id === 'di-markdown')?.status).toBe('fail');
  });

  it('fails di-sitemap when absent', () => {
    const r = runDiscoverability({ fetch: mk({}) });
    expect(r.find((c) => c.id === 'di-sitemap')?.status).toBe('fail');
  });

  it('fails di-sitemap when present but not a valid urlset', () => {
    const r = runDiscoverability({ fetch: mk({ sitemapXml: '<html>not a sitemap</html>' }) });
    expect(r.find((c) => c.id === 'di-sitemap')?.status).toBe('fail');
  });

  it('fails di-llms-txt when absent', () => {
    const r = runDiscoverability({ fetch: mk({}) });
    expect(r.find((c) => c.id === 'di-llms-txt')?.status).toBe('fail');
  });

  it('fails di-llms-txt when present but missing a top-level # heading', () => {
    const r = runDiscoverability({ fetch: mk({ llmsTxt: 'no heading here' }) });
    expect(r.find((c) => c.id === 'di-llms-txt')?.status).toBe('fail');
  });

  it('passes di-sitemap and di-llms-txt when valid', () => {
    const r = runDiscoverability({ fetch: mk({ sitemapXml: '<urlset></urlset>', llmsTxt: '# Site' }) });
    expect(r.find((c) => c.id === 'di-sitemap')?.status).toBe('pass');
    expect(r.find((c) => c.id === 'di-llms-txt')?.status).toBe('pass');
  });
});
