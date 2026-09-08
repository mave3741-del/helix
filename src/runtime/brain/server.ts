import { createServerFn } from "@tanstack/react-start";

export type BrainGenerateInput = {
  brainId: string;
  fallbacks: string[];
  system: string;
  user: string;
  maxTokens: number;
  json?: boolean;
};

export type BrainGenerateResult =
  | {
      ok: true;
      text: string;
      brainId: string;
      provider: string;
      fallbackUsed: boolean;
      tokens: number;
      latencyMs: number;
    }
  | { ok: false; error: string; brainId: string; fallbackUsed: boolean };

type ChatOk = { ok: true; text: string; tokens: number; provider: string; model: string };
type ChatFail = { ok: false; error: string; status?: number };

const circuit: Record<string, { fails: number; openUntil: number }> = {};

function circuitOpen(id: string) {
  const c = circuit[id];
  return !!c && c.openUntil > Date.now();
}

function recordFail(id: string) {
  const c = (circuit[id] ??= { fails: 0, openUntil: 0 });
  c.fails += 1;
  if (c.fails >= 3) c.openUntil = Date.now() + 30_000;
}

function recordOk(id: string) {
  circuit[id] = { fails: 0, openUntil: 0 };
}

async function openaiCompat(args: {
  base: string;
  key: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  provider: string;
  json?: boolean;
}): Promise<ChatOk | ChatFail> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 18_000);
  try {
    const res = await fetch(`${args.base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.key}`,
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: args.model,
        max_tokens: args.maxTokens,
        temperature: 0.3,
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
        ...(args.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) return { ok: false, error: `${args.provider} ${res.status}`, status: res.status };
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    if (!text) return { ok: false, error: "empty completion" };
    return {
      ok: true,
      text,
      tokens: body.usage?.total_tokens ?? Math.ceil(text.length / 4),
      provider: args.provider,
      model: args.model,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  } finally {
    clearTimeout(t);
  }
}

function resolveEndpoint(brainId: string): {
  provider: string;
  model: string;
  base: string;
  key: string | undefined;
} | null {
  if (brainId === "grok-4.5" || brainId === "grok-fast") {
    return {
      provider: "xai",
      model: "grok-4.5",
      base: "https://api.x.ai/v1",
      key: process.env.XAI_API_KEY,
    };
  }
  if (brainId === "openai-gpt") {
    return {
      provider: "openai",
      model: "gpt-4.1-mini",
      base: "https://api.openai.com/v1",
      key: process.env.OPENAI_API_KEY,
    };
  }
  if (brainId === "anthropic-claude") {
    return {
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      base: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1",
      key: process.env.ANTHROPIC_API_KEY,
    };
  }
  if (brainId === "google-gemini") {
    return {
      provider: "google",
      model: "gemini-2.5-flash",
      base: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai",
      key: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
    };
  }
  if (brainId === "openrouter" || brainId === "open-reasoner") {
    return {
      provider: "openrouter",
      model: process.env.OPENROUTER_MODEL ?? "openrouter/auto",
      base: "https://openrouter.ai/api/v1",
      key: process.env.OPENROUTER_API_KEY,
    };
  }
  if (brainId === "omniroute") {
    const base = process.env.OMNIROUTE_BASE_URL;
    const key = process.env.OMNIROUTE_API_KEY;
    if (!base || !key) return null;
    return {
      provider: "omniroute",
      model: process.env.OMNIROUTE_MODEL ?? "auto",
      base,
      key,
    };
  }
  if (brainId === "ollama" || brainId === "cloud-coder") {
    const base = process.env.OLLAMA_BASE_URL;
    if (brainId === "ollama" && base) {
      return { provider: "ollama", model: process.env.OLLAMA_MODEL ?? "llama3.1", base, key: "ollama" };
    }
    if (brainId === "cloud-coder") {
      return {
        provider: "openai",
        model: process.env.CODER_MODEL ?? "gpt-4.1-mini",
        base: "https://api.openai.com/v1",
        key: process.env.OPENAI_API_KEY,
      };
    }
  }
  return null;
}

async function tryBrain(
  brainId: string,
  input: BrainGenerateInput,
): Promise<ChatOk | ChatFail> {
  if (brainId === "local-heuristic") {
    return { ok: false, error: "local-heuristic is client-side" };
  }
  if (circuitOpen(brainId)) return { ok: false, error: "circuit-open" };
  const ep = resolveEndpoint(brainId);
  if (!ep?.key) return { ok: false, error: `${brainId} not configured` };
  const result = await openaiCompat({
    base: ep.base,
    key: ep.key,
    model: ep.model,
    system: input.system,
    user: input.user,
    maxTokens: Math.min(input.maxTokens, 700),
    provider: ep.provider,
    json: input.json,
  });
  if (result.ok) recordOk(brainId);
  else recordFail(brainId);
  return result;
}

async function runGenerateChain(data: BrainGenerateInput): Promise<BrainGenerateResult> {
  const chain = [data.brainId, ...data.fallbacks.filter((id) => id !== data.brainId && id !== "local-heuristic")];
  const started = Date.now();
  let last = "no provider";
  for (let i = 0; i < chain.length; i++) {
    const id = chain[i];
    const result = await tryBrain(id, data);
    if (result.ok) {
      return {
        ok: true,
        text: result.text,
        brainId: id,
        provider: result.provider,
        fallbackUsed: i > 0,
        tokens: result.tokens,
        latencyMs: Date.now() - started,
      };
    }
    last = result.error;
    if (result.status === 401 || result.status === 403) break;
  }
  return { ok: false, error: last, brainId: data.brainId, fallbackUsed: chain.length > 1 };
}

export const generateBrain = createServerFn({ method: "POST" })
  .validator((input: BrainGenerateInput) => input)
  .handler(async ({ data }): Promise<BrainGenerateResult> => runGenerateChain(data));

export const planObjective = createServerFn({ method: "POST" })
  .validator((input: { text: string; mission: string }) => input)
  .handler(async ({ data }) => {
    const system =
      "You are the CEO of Helix, an AI organization OS. Return ONLY compact JSON with keys: strategy (string, 2-4 sentences), departments (array from: strategy, engineering, research, quality, security, operations, knowledge, skills, workforce, governance, recovery, routing), skillGaps (array of capability slugs, empty if none), risk (low|medium|high|critical). Follow the Owner. Quality over speed. Do not treat unverified claims as fact. Say if you need a specialist.";
    const result = await runGenerateChain({
      brainId: "grok-4.5",
      fallbacks: ["grok-fast", "open-reasoner"],
      system,
      user: `MISSION: ${data.mission}\nOWNER OBJECTIVE: ${data.text}`,
      maxTokens: 700,
      json: true,
    });
    if (!result.ok) return { ok: false as const, error: result.error };
    const text = result.text;
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) return { ok: false as const, error: "Unstructured CEO response" };
    try {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
        strategy?: string;
        departments?: string[];
        skillGaps?: string[];
        risk?: "low" | "medium" | "high" | "critical";
      };
      return {
        ok: true as const,
        strategy: parsed.strategy ?? text.slice(0, 400),
        departments: parsed.departments ?? [],
        skillGaps: parsed.skillGaps ?? [],
        risk: parsed.risk ?? "low",
        brainId: result.brainId,
        tokens: result.tokens,
      };
    } catch {
      return { ok: false as const, error: "Could not parse CEO plan" };
    }
  });

