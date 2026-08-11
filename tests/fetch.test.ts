// tests/fetch.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchTarget, looksLikeHtmlDoc, originOf } from '../src/fetch.js';

const here = dirname(fileURLToPath(import.meta.url));
const siteDir = join(here, 'fixtures', 'site');

describe('fetchTarget folder mode', () => {
  it('reads index.html + sibling files from a directory', async () => {
    const r = await fetchTarget(siteDir);
    expect(r.mode).toBe('folder');
    expect(r.html).toContain('<h1>Fixture Site</h1>');
    expect(r.robotsTxt).toContain('User-agent: *');
    expect(r.sitemapXml).toContain('<urlset');
    expect(r.llmsTxt).toContain('# Fixture Site');
  });
});

describe('fetchTarget url mode', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('parses status, html, and sibling files', async () => {
    const mk = (body: string, status = 200) =>
      new Response(body, { status, headers: { 'content-type': 'text/html' } });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/robots.txt')) return mk('User-agent: *\nAllow: /');
      if (url.endsWith('/sitemap.xml')) return mk('<urlset></urlset>');
      if (url.endsWith('/llms.txt')) return mk('# Site');
      return mk('<html><body><h1>Hi</h1></body></html>');
    }));
    const r = await fetchTarget('https://example.com', { mode: 'url' });
    expect(r.mode).toBe('url');
    expect(r.status).toBe(200);
    expect(r.ok).toBe(true);
    expect(r.html).toContain('<h1>Hi</h1>');
    expect(r.robotsTxt).toContain('User-agent: *');
    expect(r.sitemapXml).toContain('<urlset');
    expect(r.llmsTxt).toContain('# Site');
  });

  it('returns a FetchResult (does not throw) on network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('boom'); }));
    const r = await fetchTarget('https://nope.invalid', { mode: 'url' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(0);
    expect(r.error).toContain('boom');
  });

  it('treats SPA-fallback HTML for robots/sitemap/llms as absent (not present)', async () => {
    // Server returns the app shell (200, text/html) for EVERY path — Vite dev /
    // Netlify / Vercel SPA rewrite behavior.
    const shell = '<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div></body></html>';
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(shell, { status: 200, headers: { 'content-type': 'text/html' } })));
    const r = await fetchTarget('https://spa.example.com', { mode: 'url' });
    expect(r.html).toContain('<div id="root">'); // main page is still captured
    expect(r.robotsTxt).toBeNull();
    expect(r.sitemapXml).toBeNull();
    expect(r.llmsTxt).toBeNull();
  });

  it('looks for robots/sitemap/llms at the origin when the target is a sub-page', async () => {
    // robots.txt / sitemap.xml / llms.txt live at the site root. Joining them onto the
    // target's PATH (…/blog/post/robots.txt) always 404s, so every non-homepage URL
    // silently lost 15 points.
    const asked: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      asked.push(url);
      const mk = (body: string) => new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } });
      if (url === 'https://example.com/robots.txt') return mk('User-agent: *\nAllow: /');
      if (url === 'https://example.com/sitemap.xml') return mk('<urlset></urlset>');
      if (url === 'https://example.com/llms.txt') return mk('# Site');
      if (url === 'https://example.com/blog/post-1?ref=x') {
        return new Response('<html><body><h1>Post</h1></body></html>', { status: 200, headers: { 'content-type': 'text/html' } });
      }
      return new Response('not found', { status: 404 });
    }));
    const r = await fetchTarget('https://example.com/blog/post-1?ref=x', { mode: 'url' });
    expect(r.html).toContain('<h1>Post</h1>');
    expect(r.robotsTxt).toContain('User-agent: *');
    expect(r.sitemapXml).toContain('<urlset');
    expect(r.llmsTxt).toContain('# Site');
    expect(asked).not.toContain('https://example.com/blog/post-1/robots.txt');
  });

  it('captures markdown-negotiation content-type', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      const accept = (init?.headers as Record<string, string> | undefined)?.['accept'] ?? '';
      if (accept.includes('text/markdown')) {
        return new Response('# Home', { status: 200, headers: { 'content-type': 'text/markdown' } });
      }
      return new Response('<html><body><h1>Hi</h1></body></html>', { status: 200, headers: { 'content-type': 'text/html' } });
    }));
    const r = await fetchTarget('https://md.example.com', { mode: 'url' });
    expect(r.markdownContentType).toBe('text/markdown');
  });

  it('markdownContentType is null in folder mode', async () => {
    const r = await fetchTarget(siteDir);
    expect(r.markdownContentType).toBeNull();
  });
});

describe('originOf', () => {
  it('reduces any absolute URL to its origin, and leaves non-URL targets alone', () => {
    expect(originOf('https://example.com/blog/post-1?ref=x#top')).toBe('https://example.com');
    expect(originOf('https://example.com/')).toBe('https://example.com');
    expect(originOf('https://example.com')).toBe('https://example.com');
    expect(originOf('http://localhost:3000/app/page')).toBe('http://localhost:3000');
    expect(originOf('./dist/')).toBe('./dist');
  });
});

describe('looksLikeHtmlDoc', () => {
  it('detects HTML documents but not robots/sitemap/llms content', () => {
    expect(looksLikeHtmlDoc('<!DOCTYPE html><html>')).toBe(true);
    expect(looksLikeHtmlDoc('  \n<html lang="en">')).toBe(true);
    expect(looksLikeHtmlDoc('User-agent: *\nAllow: /')).toBe(false);
    expect(looksLikeHtmlDoc('<?xml version="1.0"?>\n<urlset></urlset>')).toBe(false);
    expect(looksLikeHtmlDoc('# Site\n\n> summary')).toBe(false);
  });
});
