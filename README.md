# Helix

AI Organization OS. One Owner. One CEO. 1,000 persistent workers.

Helix is an organizational operating system — not a chatbot and not a bag of independent agents. The organization is the intelligence. Models are replaceable brains.

## Download (runnable zip)

Click **Download** on the release. Unzip, then run `start.bat` (Windows) or `start.sh` (Mac/Linux).

| What | Link |
|---|---|
| **Helix.zip** (runnable source + report) | [Download Helix.zip](https://github.com/mave3741-del/helix/releases/download/v1.1.0/Helix.zip) |
| **Release page** | [v1.1.0](https://github.com/mave3741-del/helix/releases/tag/v1.1.0) |
| **Project report** | [REPORT.md](./REPORT.md) · [REPORT.html](./REPORT.html) |

Or clone:

```bash
git clone https://github.com/mave3741-del/helix.git
cd helix
npm install
npm run dev
```

Then open http://localhost:8080

Needs [Node.js 20+](https://nodejs.org). See [START-HERE.txt](./START-HERE.txt).

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

## Stack

TanStack Start, React 19, Tailwind v4, Zustand + IndexedDB persistence.

Auth and database are off by default. Worker registry and task state survive restart in the browser.
