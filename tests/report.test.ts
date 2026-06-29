import { describe, it, expect } from 'vitest';
import { buildReport } from '../src/index.js';
import { detectStack } from '../src/detect.js';
import { formatTerminal } from '../src/report.js';
import type { FetchResult } from '../src/types.js';

const fetch: FetchResult = {
  target: 'https://x.com', mode: 'url', fetchedAs: 'GPTBot', status: 200, ok: true,
  headers: {}, html: '<html lang="en"><head><title>T</title></head><body><main><h1>H</h1><p>' + 'w '.repeat(60) + '</p></main></body></html>',
  robotsTxt: null, sitemapXml: null, llmsTxt: null, markdownContentType: null, timingMs: 1,
};

describe('formatTerminal v2', () => {
  it('shows rubric version, grade and tier labels', () => {
    const report = buildReport(fetch, '2026-06-25T00:00:00Z', detectStack({ html: fetch.html }));
    const out = formatTerminal(report);
    expect(out).toContain('rubric v2');
    expect(out).toContain('Readability');
    expect(out).toMatch(/Score:\s*\d+\/100/);
  });
});
