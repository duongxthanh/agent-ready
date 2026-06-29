# Playbook: Next.js

**Symptom:** `stack` = `next`. Next can render server-side, so Readability failures
usually mean content is gated behind client-only rendering — e.g. a page or its data
is `'use client'` with content fetched in `useEffect`, so the initial HTML is empty.

## Diagnose

- App Router: is the page a Server Component (default) or marked `'use client'`? Content
  that must be crawlable should render in a Server Component, not be fetched client-side.
- Pages Router: is the page using `getStaticProps`/`getServerSideProps`, or is data
  fetched in the browser?
- Check the built/served HTML for the actual text — `view-source` or
  `agent-ready <url> --json`.

## Fix

1. **Render content server-side.**
   - App Router: keep the content component a **Server Component**; fetch data on the
     server (`async` component or `fetch` in the component). Push interactivity into
     small `'use client'` leaf components only.
   - Pages Router: use `getStaticProps` (SSG, preferred for marketing) or
     `getServerSideProps` so HTML ships with content. Add `generateStaticParams` /
     `getStaticPaths` for dynamic routes.

2. **Metadata (Understandability).** Use the App Router **Metadata API**:
   ```ts
   export const metadata = {
     title: '…', description: '…',
     openGraph: { title: '…', description: '…', images: ['/og.jpg'] },
     alternates: { canonical: 'https://…' },
   };
   ```
   Set `<html lang="…">` in the root layout.

3. **JSON-LD.** Render a `<script type="application/ld+json">` in the layout/page from
   the `generateJsonLd` output (use the right schema.org type).

4. **Artifacts.** Add `app/robots.ts` (or `public/robots.txt`) including the
   Content-Signal line, `app/sitemap.ts` (or `public/sitemap.xml`), and
   `public/llms.txt`. Next can also emit a `Link` header via `headers()` in
   `next.config.js` for the Discoverability `di-link-headers` check.

## Verify

Re-scan the built/running site. Readability and Understandability should reach full;
Discoverability gains sitemap/llms (+ Link header if configured).
