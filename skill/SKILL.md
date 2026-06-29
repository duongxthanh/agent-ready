---
name: agent-ready
description: Use when a developer wants to make a website agent-ready — findable, readable, and understandable by AI crawlers/agents (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) that do NOT run JavaScript. Scans the site with a deterministic core, scores it on the transparent rubric v2 (reading-readiness funnel), detects the framework, proposes priority-ordered fixes with per-group approval, then re-scans to prove the score went up. Default mode advises and generates safe artifacts; opt-in apply mode edits the codebase. Also use preventively when starting a new web project.
---

# agent-ready

Make a website **readable by AI agents** and **prove** it. Every score comes from the
deterministic core (the `agent-visible` CLI), never from your own judgment — this is the
anti-hallucination guarantee. **You reason and fix; the core measures.**

AI answer engines like ChatGPT and Perplexity crawl with bots (GPTBot, ClaudeBot,
PerplexityBot, OAI-SearchBot) that **do not run JavaScript** — Google/Gemini's renderer
(WRS) is the notable exception. If a site renders content client-side, those non-JS bots
see an empty shell and the site is invisible in their answers. agent-ready measures what
those bots actually receive and closes the gap.

## Prerequisite

Install the scanner once so `agent-visible` is on PATH (run in the agent-ready repo):
`npm install && npm run build && npm link`
Then invoke it anywhere as `agent-visible <target> --json`. (Without `npm link`, run it
from the repo as `node dist/cli.js <target> --json`.)

## The rubric (v2 — total 100, transparent in `src/rubric.ts`)

A five-tier funnel mirroring how an AI crawler reads a site:

| Tier | Pts | Checks |
|------|----:|--------|
| **Access** | 15 | reachable (HTTP 200); not blocked/cloaked for AI user-agents |
| **Permission** | 15 | robots.txt valid; AI bots not Disallowed; Content-Signal declared |
| **Readability** | 35 | real text in raw HTML; not an empty SPA shell; headings; semantic landmarks |
| **Understandability** | 25 | schema.org JSON-LD; title; meta description; Open Graph; `lang`; canonical |
| **Discoverability** | 10 | sitemap.xml; llms.txt; Link headers; markdown negotiation |

Readability is weighted heaviest — the empty-SPA-shell problem is the #1 reason sites
are invisible to AI. The JSON `Report` also carries `rubricVersion` and a `stack`
profile (framework + rendering mode) from deterministic detection.

## Choose the mode

- **Retrofit** — an existing site: run the diagnose → fix → prove loop below.
- **Preventive** — a new/early project: skip scanning, advise architecture (see end).

Within Retrofit, choose how deep to fix:
- **Advisor + artifacts (default)** — generate the no-code artifacts and edit only the
  `<head>`; for rendering (the SPA fix) give a precise, framework-specific plan but do
  NOT touch app code.
- **Apply (opt-in — only when the user explicitly says "apply" / "fix the code")** —
  also perform the rendering fix in the codebase, per the framework playbook, with
  per-change approval and a diff shown before writing.

## Retrofit loop

1. **Locate the target.** Ask for a running URL (`http://localhost:5173`) or a build
   folder (`./dist`). Prefer a running dev server or a built folder. Do NOT auto-build
   an unfamiliar repo without explicit permission — building runs arbitrary code.

2. **Scan (deterministic).** Run `agent-visible <target> --json` and parse the `Report`.
   Report the score, grade, `stack` (framework/rendering), and every failing/warning
   check with its `fix` text. Do not invent findings beyond the Report.

3. **Group the fixes by risk and present them in order:**
   - 🟢 **No code changes** — generate `robots.txt` (with Content-Signal), `sitemap.xml`,
     `llms.txt`, schema.org JSON-LD. **Use the deterministic generators** (below); never
     hand-write these from imagination.
   - 🟡 **`<head>` only** — inject title, meta description, Open Graph, `lang`,
     canonical, and the JSON-LD `<script>`. Low risk, framework-aware placement.
   - 🔴 **Rendering (the SPA fix)** — make JS-invisible content present in the initial
     HTML (SSR/SSG/prerender). Framework-specific; read the matching playbook in
     [`playbooks/`](playbooks/). Advisory by default; only edit app code in apply mode.

4. **Approve per group.** Ask the user to approve EACH group separately. Always isolate
   🔴 and spell out the risk before touching app code.

5. **Apply** only the approved groups.

6. **Re-scan to prove it.** Run `agent-visible <target> --json` again and show the
   before → after delta — the new score and which checks flipped to pass. This closing
   proof is the whole point; never claim a fix worked without re-scanning.

## Generators (deterministic — import from the built package)

From the package's `dist/index.js` (or `src/index.ts`):
- `generateRobotsTxt({ sitemapUrl, contentSignals: { search, aiInput, aiTrain } })`
- `generateSitemap(urls: string[])`
- `generateLlmsTxt({ title, summary, links })`
- `generateMetaTags({ title, description, url?, siteName?, image? })`
- `generateJsonLd({ type, name, url?, description?, telephone?, priceRange?, image?, address?, geo?, openingHours? })`
  — pick the schema.org `type` that fits: `Organization`/`WebSite` (generic),
  `LocalBusiness`/`Hotel`/`Restaurant`/`TouristAttraction` (hospitality & local). Fill
  fields you can derive from the page; leave clear placeholders for the user to confirm
  (address, phone, hours) — never fabricate facts.

## Framework playbooks

Use the detected `stack.framework` to pick the rendering-fix playbook:
- React SPA (Vite/CRA) → [`playbooks/react-spa.md`](playbooks/react-spa.md)
- Next.js → [`playbooks/next.md`](playbooks/next.md)
- Astro / static site generators → [`playbooks/astro-static.md`](playbooks/astro-static.md)
- Nuxt / SvelteKit → [`playbooks/nuxt-sveltekit.md`](playbooks/nuxt-sveltekit.md)

## Preventive mode (installed from project start)

When scaffolding or extending a web project, advise the cheap-now decisions so the site
is never born at 0:
- Choose SSR/SSG/prerender for any content that must be visible to non-JS crawlers.
- Reserve slots for `robots.txt` (+ Content-Signal), `sitemap.xml`, `llms.txt`, and
  JSON-LD from day one.
- Use semantic HTML; set `<html lang>`, canonical, title, meta description, and Open
  Graph by default.

Motto: *don't fix agent-readiness later — be born agent-ready.*

## A note on user-agents & cloaking

The scanner fetches as an AI crawler UA (GPTBot by default; override with `--ua`).
That is intentional: it measures **what AI engines actually see**. If a site/CDN serves
different content to bots than to browsers (cloaking, or a tunnel's interstitial), the
score reflects the bot's view — which is the one that matters for AI visibility.
