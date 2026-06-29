<div align="center">

# 🤖 agent-ready

### Is your website invisible to ChatGPT?

[![npm](https://img.shields.io/npm/v/agent-visible?color=cb3837&logo=npm)](https://www.npmjs.com/package/agent-visible)
[![CI](https://img.shields.io/github/actions/workflow/status/duongxthanh/agent-ready/ci.yml?branch=master&logo=github&label=tests)](https://github.com/duongxthanh/agent-ready/actions)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code skill](https://img.shields.io/badge/Claude%20Code-skill-d97757)](skill/SKILL.md)
[![stars](https://img.shields.io/github/stars/duongxthanh/agent-ready?style=social)](https://github.com/duongxthanh/agent-ready/stargazers)

<p>
AI crawlers — <b>GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot</b> — <b>do not run JavaScript.</b><br/>
If your site renders client-side, AI search engines see an empty page. <code>agent-ready</code> tells<br/>
you what they actually receive, scores it against a <b>transparent rubric</b>, fixes it, and<br/>
<b>re-scans to prove the score went up.</b>
</p>

<!-- A short demo GIF can drop in here later; the transcript below is the real output of `node dist/cli.js ./demo/before` and `./demo/after`. -->

```console
$ npx agent-visible ./demo/before
agent-ready · rubric v2 · vite-react/spa
Agent-Readiness: Score: 33/100  (F)
  Access 15/15 · Permission 7/15 · Readability 0/35 · Understandability 11/25 · Discoverability 0/10
  ❌ Only 0 words of visible text in raw HTML — AI crawlers see almost nothing.
  ❌ Page is an empty client-rendered shell (mount node empty / SPA markers present).

# …apply the fixes (pre-render content + generate robots.txt / sitemap.xml / llms.txt / JSON-LD)…

$ npx agent-visible ./demo/after
Agent-Readiness: Score: 97/100  (A)
  Access 15/15 · Permission 15/15 · Readability 35/35 · Understandability 25/25 · Discoverability 7/10
```

<sub>Reproduce it yourself — the [`demo/`](demo/) folder is committed, no network needed.</sub>

```bash
npx agent-visible https://yoursite.com
```

<i>— or, in Claude Code: install the skill and just say <b>"make my site agent-ready"</b></i>

</div>

---

## The problem, in one sentence

Search is moving from Google to AI assistants. Those assistants read the web with crawlers that **fetch your raw HTML and never execute JavaScript**. A React/Vue/SPA site that looks perfect in a browser can be a blank `<div id="root">` to them — so you simply don't exist in the answer.

`agent-ready` measures that gap in seconds and closes it.

## Quick start

> Published on npm as **`agent-visible`** (the name `agent-ready` is reserved by npm's similarity guard). Same tool — `npx agent-visible` is the command.

```bash
# Scan any URL — no install needed
npx agent-visible https://yoursite.com

# Machine-readable report (for CI, dashboards, scripts)
npx agent-visible https://yoursite.com --json

# Works on a local dev server or a built folder too
npx agent-visible http://localhost:3000
npx agent-visible ./dist
```

You get a graded scorecard (**A–F**), the exact points lost per check, the detected framework + rendering mode, and a priority-ordered list of fixes. Full options in the **[usage guide](docs/USAGE.md)**.

## Fix it in one conversation — the Claude Code skill

The scanner tells you *what's wrong*. The **[Claude Code skill](skill/SKILL.md)** actually *fixes it* — and proves it worked:

1. **Scan** your site with the deterministic core.
2. **Detect** the framework (Next.js, Vite/React, Astro, Nuxt, SvelteKit…).
3. **Group fixes by risk** and ask you to approve each group:
   - 🟢 **Artifacts** — generate `llms.txt`, `robots.txt` (+ Content-Signals), `sitemap.xml`, schema.org JSON-LD, meta tags. *No code touched.*
   - 🟡 **`<head>` edits** — inject title / description / Open Graph / `lang` / canonical at the right place for your framework.
   - 🔴 **Rendering** — fix the SPA-invisibility itself, following a per-framework [playbook](skill/playbooks/) (advisor by default; opt-in to let it edit, always with a diff + your approval).
4. **Re-scan** and show the **before → after delta**.

> **The score is always computed by the deterministic core, never guessed by the model.** The skill is the brain that fixes; the core is the engine that proves. That separation is the whole point — you can trust the number.

```text
$ agent-visible https://acme-spa.example   →  F (12/100)  · readability 0/35
  …apply 🟢 artifacts + 🟡 head + 🔴 prerender…
$ agent-visible https://acme-spa.example   →  A (88/100)  · readability 33/35  ✅ proven
```

## What it checks — rubric v2 (total 100)

A five-tier funnel mirroring how a no-JS AI crawler reads a site:

| Tier | Points | Looks for |
|------|-------:|-----------|
| **Access** | 15 | reachable (HTTP 200); not blocked/cloaked for AI user-agents |
| **Permission** | 15 | `robots.txt` valid; AI bots not `Disallow`ed; `Content-Signal` declared |
| **Readability** | **35** | real text in raw HTML; empty-SPA-shell detection; headings; semantic landmarks |
| **Understandability** | 25 | schema.org JSON-LD; title; meta description; Open Graph; `lang`; canonical |
| **Discoverability** | 10 | `sitemap.xml`; `llms.txt`; Link headers; markdown negotiation |

**Readability is weighted heaviest** — the empty-SPA-shell problem is the #1 reason real sites are invisible to AI. Grades: **A ≥85 · B ≥70 · C ≥55 · D ≥35 · F <35**.

## Why a transparent rubric

Other agent-readiness scanners (including Cloudflare's `isitagentready.com`) keep their scoring math private. `agent-ready` does the opposite:

- **Every weight is published** in [`src/rubric.ts`](src/rubric.ts) — disagree with one? Edit it.
- **Every check cites a primary standard** — the [llms.txt spec](https://llmstxt.org/), [schema.org](https://schema.org/), [robots.txt RFC 9309](https://www.rfc-editor.org/rfc/rfc9309), the official GPTBot/ClaudeBot docs.
- **Verdicts are cross-validated** against that scanner on the signals both check — including the SPA-fallback false-positive trap. See [docs/VALIDATION.md](docs/VALIDATION.md).

No black box. No vibe. Just a number you can audit.

## Roadmap

`agent-ready` ships **Claude Code first** because that's where the fix-and-prove loop is tightest today. The deterministic core is agent-agnostic by design — next up is bringing the same skill to other coding agents:

- [x] Deterministic CLI scanner (rubric v2) + JSON output
- [x] Claude Code skill — scan → fix → re-scan, with per-framework playbooks
- [ ] **Cursor** adapter
- [ ] **Codex CLI / Gemini CLI** adapters
- [ ] Schema coverage beyond hospitality (e-commerce, docs, SaaS)
- [ ] GitHub Action — fail CI when agent-readiness drops

Want one of these? See **Contributing** — several are tagged [`good first issue`](https://github.com/duongxthanh/agent-ready/labels/good%20first%20issue).

## Contributing

Contributions are very welcome — the rubric and playbooks get better with more real-world sites tested against them.

- 🐛 **Found a site we score wrong?** Open an issue with the URL and the expected verdict — these are the most valuable reports.
- 🧩 **Add a framework playbook or a new check?** Start with [`good first issue`](https://github.com/duongxthanh/agent-ready/labels/good%20first%20issue) and read **[CONTRIBUTING.md](CONTRIBUTING.md)**.
- 🧪 Every change ships with a test — `npm test` (84 passing) and `npm run typecheck` are the gates.

```bash
git clone https://github.com/duongxthanh/agent-ready
cd agent-ready && npm install && npm run build && npm link
npm test
```

## License

[MIT](LICENSE) — use it, fork it, ship it.

---

<div align="center">
<sub>Built and maintained by <a href="https://github.com/duongxthanh">Thanh Dương</a> — a developer in Hội An, Việt Nam, shipping AI-readable sites for real hospitality businesses. If <code>agent-ready</code> made your site visible, a ⭐ helps others find it.</sub>
</div>
