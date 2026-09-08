# Helix

AI Organization OS. One Owner. One CEO. 1,000 persistent workers.

Helix is an organizational operating system — not a chatbot and not a bag of independent agents. The organization is the intelligence. Models are replaceable brains.

## What it is

- **Owner** sets mission, objectives, and risk approvals
- **CEO** plans, delegates, and reports
- **8 executives / 12 departments / supervisors / 1,000 workers**
- Independent **QC / testing / security** gates
- **OmniRoute** model routing with automatic fallback
- Organizational **memory**, **skill factory**, **governance**, **recovery**
- 14 built-in **acceptance scenarios**

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

Open the app, dispatch an objective from Command, or run the fourteen scenarios from Prove.

## Stack

TanStack Start, React 19, Tailwind v4, Zustand + IndexedDB persistence.

Auth and database are off by default. Worker registry and task state survive restart in the browser.
