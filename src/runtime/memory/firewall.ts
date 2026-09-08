import type { MemoryItem, MemoryLayer, OrgSnapshot, Worker } from "@/org/types";

const LAYER_RANK: Record<MemoryLayer, number> = {
  worker: 0,
  team: 1,
  department: 2,
  task: 2,
  project: 2,
  skill: 2,
  knowledge: 3,
  org: 3,
  audit: 4,
};

export function allowedLayers(worker: Worker): MemoryLayer[] {
  const cap = LAYER_RANK[worker.memoryScope] ?? 0;
  return (Object.keys(LAYER_RANK) as MemoryLayer[]).filter((l) => LAYER_RANK[l] <= cap);
}

export function scopedMemory(
  state: OrgSnapshot,
  worker: Worker,
  query: string,
  k = 4,
): MemoryItem[] {
  const q = query.toLowerCase();
  const layers = new Set(allowedLayers(worker));
  const secrets = /api[_-]?key|secret|password|credential|token\s*=/i;
  return state.memory
    .filter((m) => {
      if (!layers.has(m.layer)) return false;
      if (m.status === "rejected" || m.status === "deprecated") return false;
      if (secrets.test(m.content)) return false;
      if (m.layer === "worker" && m.ownerId !== worker.id && m.ownerId !== "ORG") return false;
      if (m.layer === "department" && m.ownerId !== worker.departmentId && m.ownerId !== "ORG") return false;
      if (m.layer === "team" && worker.teamId && m.ownerId !== worker.teamId && m.ownerId !== "ORG")
        return false;
      return true;
    })
    .map((m) => {
      let score = 0;
      if (m.tags.some((t) => q.includes(t) || t.includes(q))) score += 3;
      if (m.title.toLowerCase().includes(q)) score += 2;
      if (m.content.toLowerCase().includes(q)) score += 1;
      if (m.status === "verified") score += 2;
      if (m.claim === "verified_fact") score += 1;
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.m);
}

export function redactSecrets(text: string) {
  return text
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "[redacted-key]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|secret|password)\s*[:=]\s*\S+/gi, "$1=[redacted]");
}
