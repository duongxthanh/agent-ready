import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { FetchResult } from './types.js';

const DEFAULT_UA = 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)';

// SPA-fallback servers (Vite dev, Netlify/Vercel/CRA rewrites) return the app's
// index.html with HTTP 200 for unknown paths. A real robots.txt / sitemap.xml /
// llms.txt is never an HTML document, so a body that begins like one means the
// resource does not actually exist — treat it as absent, not present-but-wrong.
export function looksLikeHtmlDoc(body: string): boolean {
  return /^\uFEFF?\s*<(?:!doctype\s+html|html[\s/>])/i.test(body);
}

// robots.txt (RFC 9309 §2.3), sitemap.xml and llms.txt are ORIGIN-scoped: they live at the
// site root, never under the page being scanned. Joining them onto the target's path made
// every non-homepage URL look for /blog/post/robots.txt — a guaranteed 404 that silently
// cost 15 points (robots 5 + content-signals 3 + sitemap 4 + llms 3).
export function originOf(target: string): string {
  try {
    const { origin } = new URL(target);
    if (origin && origin !== 'null') return origin;
  } catch { /* not an absolute URL (folder path, bare host) — use it as given */ }
  return target.replace(/\/$/, '');
}

async function readIfExists(path: string): Promise<string | null> {
  try { return await readFile(path, 'utf8'); } catch { return null; }
}

async function isDir(target: string): Promise<boolean> {
  try { return (await stat(target)).isDirectory(); } catch { return false; }
}

export async function fetchTarget(
  target: string,
  opts: { mode?: 'url' | 'folder'; ua?: string; now?: () => number } = {},
): Promise<FetchResult> {
  const ua = opts.ua ?? DEFAULT_UA;
  const now = opts.now ?? (() => Date.now());
  const start = now();
  const mode = opts.mode ?? ((await isDir(target)) ? 'folder' : 'url');

  if (mode === 'folder') {
    const html = (await readIfExists(join(target, 'index.html'))) ?? '';
    return {
      target, mode: 'folder', fetchedAs: ua, status: 0, ok: !!html, headers: {},
      html,
      robotsTxt: await readIfExists(join(target, 'robots.txt')),
      sitemapXml: await readIfExists(join(target, 'sitemap.xml')),
      llmsTxt: await readIfExists(join(target, 'llms.txt')),
      markdownContentType: null,
      timingMs: now() - start,
      error: html ? undefined : 'index.html not found in folder',
    };
  }

  const base = originOf(target);
  const fetchText = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, { headers: { 'user-agent': ua } });
      if (!res.ok) return null;
      const body = await res.text();
      return looksLikeHtmlDoc(body) ? null : body;
    } catch { return null; }
  };
  const negotiateMarkdown = async (): Promise<string | null> => {
    try {
      const res = await fetch(target, { headers: { 'user-agent': ua, accept: 'text/markdown' } });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') ?? '';
      return ct.includes('text/markdown') ? ct.split(';')[0].trim() : null;
    } catch { return null; }
  };

  try {
    const res = await fetch(target, { headers: { 'user-agent': ua }, redirect: 'follow' });
    const html = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return {
      target, mode: 'url', fetchedAs: ua, status: res.status, ok: res.ok, headers, html,
      robotsTxt: await fetchText(`${base}/robots.txt`),
      sitemapXml: await fetchText(`${base}/sitemap.xml`),
      llmsTxt: await fetchText(`${base}/llms.txt`),
      markdownContentType: await negotiateMarkdown(),
      timingMs: now() - start,
    };
  } catch (e) {
    return {
      target, mode: 'url', fetchedAs: ua, status: 0, ok: false, headers: {}, html: '',
      robotsTxt: null, sitemapXml: null, llmsTxt: null, markdownContentType: null, timingMs: now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
