import { describe, it, expect } from 'vitest';
import { runAccess } from '../src/checks/access.js';
import type { FetchResult } from '../src/types.js';

const base: FetchResult = {
  target: 'https://x.com', mode: 'url', fetchedAs: 'GPTBot', status: 200, ok: true,
  headers: {}, html: '<html><body><p>hello world content</p></body></html>',
  robotsTxt: null, sitemapXml: null, llmsTxt: null, markdownContentType: null, timingMs: 1,
};

describe('runAccess', () => {
  it('passes http-ok and not-blocked for a 200 with content', () => {
    const r = runAccess({ fetch: base });
    expect(r.find((c) => c.id === 'ac-http-ok')?.status).toBe('pass');
    expect(r.find((c) => c.id === 'ac-not-blocked')?.status).toBe('pass');
  });

  it('fails not-blocked on 403', () => {
    const r = runAccess({ fetch: { ...base, status: 403, ok: false, html: '' } });
    expect(r.find((c) => c.id === 'ac-not-blocked')?.status).toBe('fail');
    expect(r.find((c) => c.id === 'ac-http-ok')?.status).toBe('fail');
  });

  it('treats folder mode as not-applicable pass', () => {
    const r = runAccess({ fetch: { ...base, mode: 'folder', status: 0 } });
    expect(r.every((c) => c.status === 'pass')).toBe(true);
  });

  it('fails not-blocked on 401', () => {
    const r = runAccess({ fetch: { ...base, status: 401, ok: false, html: '' } });
    expect(r.find((c) => c.id === 'ac-not-blocked')?.status).toBe('fail');
  });

  it('fails not-blocked on 429', () => {
    const r = runAccess({ fetch: { ...base, status: 429, ok: false, html: '' } });
    expect(r.find((c) => c.id === 'ac-not-blocked')?.status).toBe('fail');
  });

  it('fails not-blocked on an empty 200 body', () => {
    const r = runAccess({ fetch: { ...base, status: 200, ok: true, html: '   ' } });
    expect(r.find((c) => c.id === 'ac-http-ok')?.status).toBe('pass');
    expect(r.find((c) => c.id === 'ac-not-blocked')?.status).toBe('fail');
  });
});
