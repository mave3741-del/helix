# Helix 2.0

AI Organization OS. One Owner. One CEO. 1,000 persistent workers.

Helix 2.0 is an organizational operating system — not a chatbot and not a bag of independent agents. The organization is the intelligence. Models are replaceable brains.

## Download (runnable zip)

Click **Download** on the release. Unzip, then run `start.bat` (Windows) or `start.sh` (Mac/Linux).

| What | Link |
|---|---|
| **Helix-2.0.zip** | [Download](https://github.com/mave3741-del/Helix-2.0/releases/download/v2.0.0/Helix-2.0.zip) |
| **Release** | [v2.0.0](https://github.com/mave3741-del/Helix-2.0/releases/tag/v2.0.0) |
| **Project report** | [REPORT.md](./REPORT.md) · [REPORT.html](./REPORT.html) |

```bash
git clone https://github.com/mave3741-del/Helix-2.0.git
cd Helix-2.0
npm install
npm run dev
```

Needs [Node.js 20+](https://nodejs.org). See [START-HERE.txt](./START-HERE.txt).

## What it is

- **Owner** sets mission, objectives, and risk approvals
- **CEO** plans, delegates, and reports through BrainRuntime
- **8 executives / 12 departments / supervisors / 1,000 workers**
- Provider-agnostic brains (xAI, OpenAI, Anthropic, Gemini, OpenRouter, Groq, local Ollama / LM Studio / llama.cpp)
- Owner-managed API keys (never shown after save)
- Routing modes: Auto / Hybrid / Cloud first / Local only
- Authorized workspace tools (files, node, fetch) — not an unrestricted shell
- Independent **QC / testing / security** gates
- Organizational **memory**, **skill factory**, **governance**, **recovery**
- 18 built-in **acceptance scenarios**

Honest labels: implemented / configured / connected / runtime-verified. 1,000 identities are not 1,000 simultaneous LLM sessions.

## Brains

| Brain | Role |
|---|---|
| Grok 4.5 | Flagship reasoning / CEO strategy |
| Grok Fast | Low-latency structured work |
| Cloud Coder | Implementation and tests |
| Open Reasoner | Free-tier research and drafting |
| Local models | Ollama, LM Studio, llama.cpp |
| Local Heuristic | Always-on deterministic fallback |

A down brain is not an organizational failure. Fallback preserves task state.

## Stack

TanStack Start, React 19, Tailwind v4, Zustand + IndexedDB persistence.

Auth and database are off by default. Worker registry and task state survive restart in the browser.
