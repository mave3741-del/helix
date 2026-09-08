# Helix

AI Organization OS. One Owner. One CEO. 1,000 persistent workers.

Helix is an organizational operating system — not a chatbot and not a bag of independent agents. The organization is the intelligence. Models are replaceable brains.

## Download (report + source)

| What | Link |
|---|---|
| **Full zip** (report + source code) | [helix-source-and-report.zip](./helix-source-and-report.zip) |
| **Project report** (Markdown) | [REPORT.md](./REPORT.md) |
| **Project report** (HTML, print-ready) | [REPORT.html](./REPORT.html) |
| **GitHub Release v1.1.0** | [Releases](https://github.com/mave3741-del/helix/releases/tag/v1.1.0) |

Repo: [github.com/mave3741-del/helix](https://github.com/mave3741-del/helix)

## What it is

- **Owner** sets mission, objectives, and risk approvals
- **CEO** plans, delegates, and reports
- **8 executives / 12 departments / supervisors / 1,000 workers**
- Independent **QC / testing / security** gates
- Real **worker runtime** with live Grok 4.5 (capped) and local heuristic fallback
- **OmniRoute** model routing with automatic fallback
- Organizational **memory**, **skill factory**, **governance**, **recovery**
- 16 built-in **acceptance scenarios**

## Brains

| Brain | Role |
|---|---|
| Grok 4.5 | Flagship reasoning / CEO strategy |
| Grok Fast | Low-latency structured work |
| Cloud Coder | Implementation and tests |
| Open Reasoner | Free-tier research and drafting |
| Local Heuristic | Always-on deterministic fallback |

A down brain is not an organizational failure. Fallback preserves task state.

## Run

```bash
npm install
npm run dev
```

Open the app, dispatch an objective from Command, or run the sixteen scenarios from Prove.

## Stack

TanStack Start, React 19, Tailwind v4, Zustand + IndexedDB persistence.

Auth and database are off by default. Worker registry and task state survive restart in the browser.
