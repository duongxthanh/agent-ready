# Playbook: React SPA (Vite / Create React App)

**Symptom (from the scan):** `stack` = `vite-react`/`spa` (or `cra`), Readability tier
near 0 — `re-has-text` and `re-not-spa-shell` fail because the served HTML is just
`<div id="root"></div>` + a module script. No-JS crawlers see nothing.

The fix is to put the real content into the **initial HTML response**. Three levels,
cheapest first.

## Level 1 — `<head>` + artifacts (🟢/🟡, no app-code change)

Already covered by the generators: inject title/meta/OG/canonical/`lang` and a JSON-LD
`<script>` into `index.html`, and add `robots.txt` / `sitemap.xml` / `llms.txt`. This
lifts Access/Permission/Understandability/Discoverability but **not** Readability — the
body is still empty. Do this first; it is safe and immediate.

## Level 2 — Prerender to static HTML (🔴, recommended for marketing sites)

Render each route to real HTML at build time so the body ships with content. Options:

- **`vite-plugin-prerender` / `vite-plugin-ssr` (vike)** for Vite.
- **`react-snap`** (framework-agnostic) — crawls the running build and writes static
  HTML per route. Minimal setup:
  ```jsonc
  // package.json
  "scripts": { "postbuild": "react-snap" }
  ```
  ```js
  // src/main.tsx — hydrate instead of render when prerendered markup exists
  import { hydrateRoot, createRoot } from 'react-dom/client';
  const el = document.getElementById('root')!;
  if (el.hasChildNodes()) hydrateRoot(el, <App />);
  else createRoot(el).render(<App />);
  ```
  react-snap writes the rendered DOM into `#root`, so the served HTML now contains the
  real text, headings, and landmarks the rubric rewards.

- **Migrate to a meta-framework** (Next.js / Astro / Remix) if the project is growing —
  the most durable fix, but the largest change. Recommend, don't perform, unless asked.

After prerendering, verify the built `index.html` (or per-route HTML) contains a
`<main>` with an `<h1>`, section headings, and real paragraph text.

## Level 3 — Manual prerendered fallback (last resort)

If a build-time prerender can't be added, write a static, semantic content block inside
`#root` in `index.html` that React hydrates over. Use **only the site's own factual
copy** (title, description, real section names) — never fabricated details. Structure:
```html
<div id="root">
  <main>
    <h1>…page title…</h1>
    <p>…lead paragraph from the real description…</p>
    <section><h2>…</h2><p>…</p></section>
    <nav aria-label="Primary"><a href="/">Home</a></nav>
  </main>
</div>
```
This is what an SSG would have emitted; it makes the content crawler-visible while the
SPA hydrates normally for users.

## Verify

Re-scan: `agent-visible <build-folder-or-url> --json`. Readability should jump toward
35/35 (`re-has-text`, `re-not-spa-shell`, `re-has-headings`, `re-semantic` all pass).
