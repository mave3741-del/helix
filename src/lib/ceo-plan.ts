import { createServerFn } from "@tanstack/react-start";

export type CeoPlanResult =
  | {
      ok: true;
      strategy: string;
      departments: string[];
      skillGaps: string[];
      risk: "low" | "medium" | "high";
    }
  | { ok: false; error: string };

export const planObjective = createServerFn({ method: "POST" })
  .validator((input: { text: string; mission: string }) => input)
  .handler(async ({ data }): Promise<CeoPlanResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "AI is not available in this environment" };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 700,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are the CEO of Helix, an AI organization OS. Return ONLY compact JSON with keys: strategy (string, 2-4 sentences), departments (array from: strategy, engineering, research, quality, security, operations, knowledge, skills, workforce, governance, recovery, routing), skillGaps (array of capability slugs, empty if none), risk (low|medium|high). Follow the Owner. Quality over speed. Do not treat unverified claims as fact.",
          },
          {
            role: "user",
            content: `MISSION: ${data.mission}\nOWNER OBJECTIVE: ${data.text}`,
          },
        ],
      }),
    });

    if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
    const body = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const text = body.choices[0]?.message.content ?? "";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) return { ok: false, error: "Unstructured CEO response" };
    try {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
        strategy?: string;
        departments?: string[];
        skillGaps?: string[];
        risk?: "low" | "medium" | "high";
      };
      return {
        ok: true,
        strategy: parsed.strategy ?? text.slice(0, 400),
        departments: parsed.departments ?? [],
        skillGaps: parsed.skillGaps ?? [],
        risk: parsed.risk ?? "low",
      };
    } catch {
      return { ok: false, error: "Could not parse CEO plan" };
    }
  });
