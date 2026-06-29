# Demo: a SPA going from invisible → agent-ready

This folder is a **self-contained, reproducible demo** — no external site, no network.
It ships two snapshots of the same fictional business (*Driftwood Coffee Roasters*):

| Folder | What it is | Score |
|---|---|---|
| [`before/`](before/) | A typical client-rendered SPA build: real `<head>`, an **empty `<div id="root">`**, one script tag. This is exactly what a Vite/CRA app ships, and exactly what a no-JS AI crawler receives. | **33 / F** |
| [`after/`](after/) | The same site after applying agent-ready's fixes: pre-rendered content in the initial HTML + generated `robots.txt`, `sitemap.xml`, `llms.txt`, and schema.org JSON-LD. | **97 / A** |

## Reproduce it yourself

```bash
npm install && npm run build

node dist/cli.js ./demo/before    # → 33 / F  (readability 0/35 — empty SPA shell)
node dist/cli.js ./demo/after     # → 97 / A  (readability 35/35)
```

The numbers are computed by the deterministic core — you will get the same result on any
machine. The only two checks still failing in `after/` (`Link` headers and markdown
content negotiation, −3 pts) are **server-level** and can't be set by static files; the
rubric correctly keeps flagging them.

## How `after/` was built

Every artifact in `after/` was produced by agent-ready's own generators — nothing
hand-faked:

- `robots.txt` — `generateRobotsTxt` (with a `Content-Signal` line + sitemap pointer)
- `sitemap.xml` — `generateSitemap`
- `llms.txt` — `generateLlmsTxt`
- JSON-LD + meta tags in `index.html` — `generateJsonLd` / `generateMetaTags`
- the pre-rendered content block — the SPA fix from the React playbook in
  [`skill/playbooks/`](../skill/playbooks/)

That's the whole loop the tool automates: **scan → fix → re-scan to prove it.**
