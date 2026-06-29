# Using `agent-ready` on your own project

> Check whether AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) can actually **find, read, and understand** your site — get a 0–100 score with a transparent rubric, prioritized fixes, and a re-scan that *proves* the fix worked.

## 1. Requirements
- **Node.js ≥ 20** (`node -v`)
- **git**
- *(Optional)* Claude Code, if you want the guided fix workflow as a skill.

## 2. Install (from source)
> Not on npm yet — install from the repo.

```bash
git clone https://github.com/duongxthanh/agent-ready.git
cd agent-ready
npm install
npm run build
npm link        # makes the `agent-ready` command available everywhere
```

Verify:
```bash
agent-ready            # prints usage
```

## 3. Scan your project
Point it at **any one** of these — pick what you have:

```bash
# a) Your live/staging site
agent-ready https://your-site.com

# b) Your local dev server (start it first: npm run dev)
agent-ready http://localhost:3000

# c) Your production build output (before you deploy)
npm run build                 # in YOUR project → produces e.g. dist/ or build/
agent-ready ./dist
```

Machine-readable output for CI/scripts:
```bash
agent-ready ./dist --json
agent-ready https://your-site.com --markdown
```

### Example output
```
agent-ready · rubric v2 · vite-react/spa
Agent-Readiness: 38/100  (D)  — https://your-site.com
fetched as: GPTBot/1.0

Readability: 0/35
  ❌ Only 0 words of visible text in raw HTML — AI crawlers (which do not run JS) will see almost nothing.
      → Server-render or pre-render your main content (SSR/SSG/prerender).
Discoverability: 0/10
  ❌ No sitemap.xml.   → Publish a sitemap.xml and reference it from robots.txt.
  ❌ No llms.txt.      → Add an llms.txt at the root...
```

## 4. Read the score
| Band | Score |
|------|------:|
| A | ≥ 85 |
| B | ≥ 70 |
| C | ≥ 55 |
| D | ≥ 35 |
| F | < 35 |

Rubric v2 — five tiers (weights are public in [`src/rubric.ts`](../src/rubric.ts) — no black box): Access 15 · Permission 15 · **Readability 35** · Understandability 25 · Discoverability 10. The report also shows the detected `stack` (framework + rendering).

> If **Readability** is near 0, you have a client-rendered SPA that AI engines see as a blank page — that's the highest-impact thing to fix.

## 5. (Recommended) Use it as a Claude Code skill — the guided fix loop
This is where it shines: it scans, groups fixes by risk, asks your approval per group, applies them, then **re-scans to prove the score went up**.

```bash
# Install the skill (personal — available in every project)
mkdir -p ~/.claude/skills/agent-ready
cp -r skill/SKILL.md skill/playbooks ~/.claude/skills/agent-ready/
```

(Or per-project: `mkdir -p <your-project>/.claude/skills/agent-ready && cp -r skill/SKILL.md skill/playbooks <your-project>/.claude/skills/agent-ready/`.)

Then, in a Claude Code session inside your project, just say:

> "Make this site agent-ready" — or — "agent-ready: scan my localhost:3000 and fix what's safe"

The skill will: locate your site → run `agent-ready … --json` → propose

- 🟢 **no-code fixes** (`robots.txt` + Content-Signal, `sitemap.xml`, `llms.txt`, JSON-LD),
- 🟡 **`<head>` fixes** (title, meta description, Open Graph, `lang`, canonical, JSON-LD `<script>`),
- 🔴 **deep fixes** (SSR/prerender — per-framework [playbooks](../skill/playbooks/))

— and re-scan to show the before→after delta. By default it advises on 🔴 and only
generates the safe 🟢/🟡 fixes; say "apply the rendering fix" to opt into code edits. It
only changes what you approve.

## 6. Fixing the big one (SPA → invisible content)
The 🟢 quick wins are easy points. The hard 35 (Readability) means moving content into the initial HTML. The skill picks the matching [playbook](../skill/playbooks/) from the detected stack:

- **Vite + React SPA:** add prerendering (e.g. `vite-plugin-prerender` / `react-snap`) or migrate to an SSG/SSR framework.
- **Next.js / Nuxt / Astro / SvelteKit:** ensure pages are SSR/SSG/prerendered, not purely client-rendered.

Put `robots.txt`, `sitemap.xml`, `llms.txt` in your `public/` folder so the build copies them to the site root.

## 7. Uninstall
```bash
cd agent-ready && npm unlink        # remove the global command
rm -rf ~/.claude/skills/agent-ready # remove the skill
```
