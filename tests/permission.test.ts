import { describe, it, expect } from 'vitest';
import { runPermission, isBotBlocked, hasContentSignals } from '../src/checks/permission.js';
import type { FetchResult } from '../src/types.js';

const mk = (robotsTxt: string | null): FetchResult => ({
  target: 'https://x.com', mode: 'url', fetchedAs: 'GPTBot', status: 200, ok: true,
  headers: {}, html: '<html></html>', robotsTxt, sitemapXml: null, llmsTxt: null,
  markdownContentType: null, timingMs: 1,
});

describe('isBotBlocked', () => {
  it('detects a blocked bot', () => {
    expect(isBotBlocked('User-agent: GPTBot\nDisallow: /', 'GPTBot')).toBe(true);
  });
  it('allows when not disallowed', () => {
    expect(isBotBlocked('User-agent: *\nAllow: /', 'GPTBot')).toBe(false);
  });
  it('wildcard Disallow blocks an unlisted bot', () => {
    expect(isBotBlocked('User-agent: *\nDisallow: /', 'GPTBot')).toBe(true);
  });
  it('a narrow disallow does not count as a full-site block', () => {
    expect(isBotBlocked('User-agent: GPTBot\nDisallow: /admin', 'GPTBot')).toBe(false);
  });
});

describe('hasContentSignals', () => {
  it('detects a Content-Signal directive', () => {
    expect(hasContentSignals('User-agent: *\nContent-Signal: search=yes, ai-train=no')).toBe(true);
  });
  it('false when absent', () => {
    expect(hasContentSignals('User-agent: *\nAllow: /')).toBe(false);
  });
});

describe('runPermission', () => {
  it('fails all when no robots.txt', () => {
    const r = runPermission({ fetch: mk(null) });
    expect(r.find((c) => c.id === 'pe-robots-exists')?.status).toBe('fail');
    expect(r.find((c) => c.id === 'pe-content-signals')?.status).toBe('fail');
  });
  it('passes robots + content-signals when present', () => {
    const r = runPermission({ fetch: mk('User-agent: *\nAllow: /\nContent-Signal: search=yes') });
    expect(r.find((c) => c.id === 'pe-robots-exists')?.status).toBe('pass');
    expect(r.find((c) => c.id === 'pe-ai-bots-allowed')?.status).toBe('pass');
    expect(r.find((c) => c.id === 'pe-content-signals')?.status).toBe('pass');
  });
  it('pins ai-bots-allowed = pass when robots.txt is absent', () => {
    const r = runPermission({ fetch: mk(null) });
    expect(r.find((c) => c.id === 'pe-ai-bots-allowed')?.status).toBe('pass');
  });
  it('reports only the blocked bots in a mixed robots.txt', () => {
    const robots = 'User-agent: GPTBot\nDisallow: /\nUser-agent: *\nAllow: /';
    const r = runPermission({ fetch: mk(robots) });
    const result = r.find((c) => c.id === 'pe-ai-bots-allowed');
    expect(result?.status).toBe('fail');
    expect(result?.message).toContain('GPTBot');
  });
});
