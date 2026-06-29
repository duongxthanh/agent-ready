import { describe, it, expect } from 'vitest';
import { runReadability } from '../src/checks/readability.js';
import type { FetchResult } from '../src/types.js';

const mk = (html: string): FetchResult => ({
  target: 'https://x.com', mode: 'url', fetchedAs: 'GPTBot', status: 200, ok: true,
  headers: {}, html, robotsTxt: null, sitemapXml: null, llmsTxt: null,
  markdownContentType: null, timingMs: 1,
});

const RICH = '<html><body><main><h1>Title</h1>' + '<p>' + 'word '.repeat(60) + '</p></main></body></html>';
const SHELL = '<html><body><div id="root"></div><script type="module" src="/a.js"></script></body></html>';

describe('runReadability', () => {
  it('passes on rich server-rendered content', () => {
    const r = runReadability({ fetch: mk(RICH) });
    expect(r.find((c) => c.id === 're-has-text')?.status).toBe('pass');
    expect(r.find((c) => c.id === 're-not-spa-shell')?.status).toBe('pass');
    expect(r.find((c) => c.id === 're-has-headings')?.status).toBe('pass');
    expect(r.find((c) => c.id === 're-semantic')?.status).toBe('pass');
  });

  it('fails text + spa-shell on an empty SPA shell', () => {
    const r = runReadability({ fetch: mk(SHELL) });
    expect(r.find((c) => c.id === 're-has-text')?.status).toBe('fail');
    expect(r.find((c) => c.id === 're-not-spa-shell')?.status).toBe('fail');
  });

  it('warns (not fail) when SPA markers are present but content is server-rendered', () => {
    const html = '<html><body data-reactroot><main><h1>T</h1><p>' + 'word '.repeat(60) + '</p></main></body></html>';
    const r = runReadability({ fetch: mk(html) });
    const spa = r.find((c) => c.id === 're-not-spa-shell');
    expect(spa?.status).toBe('warn');
    expect(spa?.score).toBeGreaterThan(0);
    expect(spa?.score).toBeLessThan(11);
    // text is present, so re-has-text still passes
    expect(r.find((c) => c.id === 're-has-text')?.status).toBe('pass');
  });
});
