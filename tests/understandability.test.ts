import { describe, it, expect } from 'vitest';
import { runUnderstandability } from '../src/checks/understandability.js';
import type { FetchResult } from '../src/types.js';

const mk = (html: string): FetchResult => ({
  target: 'https://x.com', mode: 'url', fetchedAs: 'GPTBot', status: 200, ok: true,
  headers: {}, html, robotsTxt: null, sitemapXml: null, llmsTxt: null,
  markdownContentType: null, timingMs: 1,
});

const FULL = `<html lang="en"><head>
  <title>Hotel X</title>
  <meta name="description" content="A hotel">
  <meta property="og:title" content="Hotel X">
  <link rel="canonical" href="https://x.com">
  <script type="application/ld+json">{"@type":"Hotel"}</script>
</head><body></body></html>`;

describe('runUnderstandability', () => {
  it('passes all when head is complete', () => {
    const r = runUnderstandability({ fetch: mk(FULL) });
    for (const id of ['un-json-ld', 'un-title', 'un-meta-description', 'un-open-graph', 'un-lang', 'un-canonical']) {
      expect(r.find((c) => c.id === id)?.status).toBe('pass');
    }
  });

  it('fails json-ld and title on a bare doc', () => {
    const r = runUnderstandability({ fetch: mk('<html><head></head><body></body></html>') });
    expect(r.find((c) => c.id === 'un-json-ld')?.status).toBe('fail');
    expect(r.find((c) => c.id === 'un-title')?.status).toBe('fail');
  });

  it('treats absent soft signals as warn, not fail', () => {
    const r = runUnderstandability({ fetch: mk('<html><head></head><body></body></html>') });
    expect(r.find((c) => c.id === 'un-open-graph')?.status).toBe('warn');
    expect(r.find((c) => c.id === 'un-lang')?.status).toBe('warn');
    expect(r.find((c) => c.id === 'un-canonical')?.status).toBe('warn');
    expect(r.find((c) => c.id === 'un-meta-description')?.status).toBe('fail');
  });

  it('flags malformed JSON-LD as fail with a parse message', () => {
    const r = runUnderstandability({ fetch: mk('<html><head><script type="application/ld+json">{bad json,,}</script></head><body></body></html>') });
    const jsonLdCheck = r.find((c) => c.id === 'un-json-ld');
    expect(jsonLdCheck?.status).toBe('fail');
    expect(jsonLdCheck?.message).toMatch(/parse/i);
  });

  it('does not count a canonical link placed in the body', () => {
    const r = runUnderstandability({ fetch: mk('<html><head><title>T</title></head><body><link rel="canonical" href="https://x.com"></body></html>') });
    expect(r.find((c) => c.id === 'un-canonical')?.status).toBe('warn');
  });
});
