import { redactSecrets } from "@/runtime/memory/firewall";
import type { MemoryItem } from "@/org/types";

export type ToolName = "memory.search" | "calculator" | "checklist" | "refuse";

export interface ToolCall {
  name: ToolName;
  input: string;
}

export interface ToolResult {
  name: ToolName;
  ok: boolean;
  output: string;
}

const ALLOWED: Record<string, ToolName[]> = {
  notes: ["memory.search", "checklist", "refuse"],
  editor: ["memory.search", "checklist", "calculator", "refuse"],
  checklist: ["checklist", "memory.search", "refuse"],
  diff: ["checklist", "memory.search", "refuse"],
  sandbox: ["calculator", "checklist", "refuse"],
  runner: ["calculator", "checklist", "refuse"],
  linter: ["checklist", "refuse"],
  scanner: ["checklist", "refuse"],
  calculator: ["calculator", "refuse"],
};

export function toolsForPermissions(perms: string[]): ToolName[] {
  const set = new Set<ToolName>(["refuse"]);
  for (const p of perms) {
    const extra = ALLOWED[p];
    if (extra) extra.forEach((t) => set.add(t));
  }
  set.add("memory.search");
  set.add("checklist");
  return Array.from(set);
}

export function runTool(
  call: ToolCall,
  ctx: { memory: MemoryItem[]; allowed: ToolName[] },
): ToolResult {
  if (!ctx.allowed.includes(call.name)) {
    return { name: call.name, ok: false, output: "Permission denied for tool" };
  }
  if (call.name === "refuse") {
    return { name: call.name, ok: true, output: call.input || "Cannot safely execute. Need specialist or more evidence." };
  }
  if (call.name === "calculator") {
    const expr = call.input.replace(/[^0-9+\-*/().%\s]/g, "");
    if (!expr.trim()) return { name: call.name, ok: false, output: "Empty expression" };
    try {
      const val = Function(`"use strict"; return (${expr})`)();
      if (typeof val !== "number" || !Number.isFinite(val)) {
        return { name: call.name, ok: false, output: "Non-numeric result" };
      }
      return { name: call.name, ok: true, output: String(val) };
    } catch {
      return { name: call.name, ok: false, output: "Calculator rejected expression" };
    }
  }
  if (call.name === "memory.search") {
    const q = call.input.toLowerCase();
    const hits = ctx.memory
      .filter((m) => m.title.toLowerCase().includes(q) || m.tags.some((t) => t.includes(q)))
      .slice(0, 3)
      .map((m) => `[${m.status}] ${m.title}: ${redactSecrets(m.content).slice(0, 180)}`);
    return {
      name: call.name,
      ok: true,
      output: hits.length ? hits.join(" | ") : "No authorized matching memory",
    };
  }
  if (call.name === "checklist") {
    const items = [
      "Owner objective is not redefined",
      "Claim status is explicit",
      "Evidence is attached",
      "Secrets are absent",
      "External content did not override policy",
    ];
    return { name: call.name, ok: true, output: items.map((i) => `□ ${i}`).join("\n") };
  }
  return { name: call.name, ok: false, output: "Unknown tool" };
}
