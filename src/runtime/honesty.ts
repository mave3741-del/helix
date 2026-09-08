export type CapabilityGrade = "implemented" | "configured" | "connected" | "runtime-verified" | "not-ready";

export interface HonestyRow {
  name: string;
  grade: CapabilityGrade;
  note: string;
}

export function honestyMatrix(args: {
  workerCount: number;
  liveMode: boolean;
  routingMode: string;
  liveTurns: number;
  localTurns: number;
  connectedProviders: number;
  configuredProviders: number;
  toolRuns: number;
  verifiedLessons: number;
}): HonestyRow[] {
  return [
    {
      name: "1,000 worker identities",
      grade: args.workerCount === 1000 ? "runtime-verified" : "not-ready",
      note: `${args.workerCount} persistent identities. They are not 1,000 simultaneous LLM sessions.`,
    },
    {
      name: "Local heuristic kernel",
      grade: "runtime-verified",
      note: "Always-on structured worker runtime. Deterministic. Not an LLM.",
    },
    {
      name: "Live LLM brains",
      grade: args.connectedProviders > 0 ? "connected" : args.configuredProviders > 0 ? "configured" : "implemented",
      note:
        args.connectedProviders > 0
          ? `${args.connectedProviders} provider(s) passed a live connection test.`
          : args.configuredProviders > 0
            ? "Keys or endpoints saved but not yet tested."
            : "Architecture ready. No cloud/local LLM is connected yet.",
    },
    {
      name: "Routing mode",
      grade: "implemented",
      note: `${args.routingMode}${args.liveMode ? "" : " (cloud calls suppressed)"}. Scheduler cap applies; workers queue.`,
    },
    {
      name: "Execution so far",
      grade: args.liveTurns > 0 ? "runtime-verified" : args.localTurns > 0 ? "implemented" : "implemented",
      note: `${args.liveTurns} live LLM turns · ${args.localTurns} local kernel turns.`,
    },
    {
      name: "Authorized workspace tools",
      grade: args.toolRuns > 0 ? "runtime-verified" : "implemented",
      note: args.toolRuns > 0 ? `${args.toolRuns} sandbox tool run(s) with evidence.` : "Filesystem, node runner, and fetch are implemented in the authorized workspace.",
    },
    {
      name: "Verified lessons",
      grade: args.verifiedLessons > 0 ? "runtime-verified" : "implemented",
      note: `${args.verifiedLessons} QC-gated memories. LLM text is never auto-promoted to world fact.`,
    },
  ];
}
