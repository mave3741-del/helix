import type { Brain, OrgSnapshot } from "@/org/types";
import { capabilityChain, type RoutingMode } from "./providers";

export function routingModeOf(state: OrgSnapshot): RoutingMode {
  return (state.runtime?.routingMode as RoutingMode) ?? (state.runtime?.liveMode ? "auto" : "local-only");
}

function isLocalBrain(b: Brain) {
  return b.id === "local-heuristic" || b.provider === "local" || b.provider === "ollama" || b.kind === "local" || b.kind === "heuristic";
}

export function routeBrain(state: OrgSnapshot, required: string, qualityNeed: number): Brain {
  const mode = routingModeOf(state);
  const chain = capabilityChain(required);
  const available = chain
    .map((id) => state.brains.find((b) => b.id === id))
    .filter((b): b is Brain => !!b && b.available);

  if (state.faults.modelFailure || state.faults.providerFailure || state.faults.rateLimit) {
    const local = state.brains.find((b) => b.id === "local-heuristic" && b.available);
    if (local) return local;
  }

  let pool = available;
  if (mode === "local-only") pool = available.filter(isLocalBrain);
  if (mode === "hybrid") {
    const local = available.filter(isLocalBrain);
    const cloud = available.filter((b) => !isLocalBrain(b));
    pool = [...local, ...cloud];
  }
  if (mode === "cloud-first") {
    const local = available.filter(isLocalBrain);
    const cloud = available.filter((b) => !isLocalBrain(b));
    pool = [...cloud, ...local];
  }

  const scored = pool
    .filter((b) => b.accuracy >= qualityNeed * 0.75)
    .sort((a, b) => {
      const fitA = a.capabilities.includes(required) ? 1 : 0;
      const fitB = b.capabilities.includes(required) ? 1 : 0;
      if (fitA !== fitB) return fitB - fitA;
      const connA = a.connection === "connected" ? 1 : 0;
      const connB = b.connection === "connected" ? 1 : 0;
      if (connA !== connB) return connB - connA;
      if (mode === "auto" && a.cost !== b.cost) return a.cost - b.cost;
      return a.latencyMs - b.latencyMs;
    });

  return scored[0] ?? state.brains.find((b) => b.id === "local-heuristic")!;
}
