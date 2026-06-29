# Contributing to agent-ready

Thanks for helping make the web readable to AI agents. This project gets better the more real
sites it's tested against — so **bug reports with a URL are as valuable as code.**

## Ways to contribute (easiest first)

1. **Report a wrong score.** Found a site `agent-ready` grades too high or too low? Open an issue
   with the URL and what you'd expect. These reports directly improve the rubric.
2. **Add a check or tune a weight.** The rubric lives in [`src/rubric.ts`](src/rubric.ts) and each
   tier is a pure function in [`src/checks/`](src/checks/). Every check cites a primary standard —
   keep that discipline.
3. **Write a framework playbook.** Help the Claude Code skill fix more stacks. Playbooks live in
   [`skill/playbooks/`](skill/playbooks/) — copy an existing one as a template.
4. **Build an agent adapter.** Bring the scan→fix→prove loop to Cursor / Codex CLI / Gemini CLI.
   See the [roadmap](README.md#roadmap).

New here? Look for the [`good first issue`](https://github.com/duongxthanh/agent-ready/labels/good%20first%20issue) label.

## Ground rules

- **Determinism is sacred.** The core computes scores; models never guess them. Anything
  verifiable belongs in the deterministic CLI, not in a prompt.
- **No black box.** Every weight is public, every check is grounded in a cited standard.
- **Tests are the gate.** Every behavior change ships with a test.

## Dev setup

```bash
git clone https://github.com/duongxthanh/agent-ready
cd agent-ready
npm install
npm run build          # tsc → dist/
npm link               # optional: puts `agent-ready` on your PATH
```

## Before you open a PR

```bash
npm run typecheck      # tsc --noEmit — must be clean
npm test               # vitest — all tests must pass
npm run build          # must succeed
```

- One logical change per PR; write the failing test first when you can.
- Keep the README's promises true — if you change scoring, update `docs/VALIDATION.md`.
- ESM: every relative import ends in `.js` (e.g. `import { WEIGHTS } from '../rubric.js'`).

## Reporting a wrong score (template)

```
URL:               https://…
agent-ready says:  <grade> (<score>/100), tier breakdown
I expected:        <grade>, because <what the AI crawler can/can't see>
```

That's it. Open an issue and we'll dig in. 🙏
