import { mulberry32 } from "@/lib/utils";
import type { ReasoningStyle, Worker, WorkerAgent, WorkerRole } from "@/org/types";

const STYLES: ReasoningStyle[] = ["analytic", "synthetic", "skeptical", "procedural", "adversarial"];
const VERB: WorkerAgent["verbosity"][] = ["terse", "standard", "thorough"];
const RISK: WorkerAgent["riskTolerance"][] = ["conservative", "balanced", "exploratory"];

const DEPT_SPEC: Record<string, { spec: string[]; methods: string[] }> = {
  strategy: {
    spec: ["objective decomposition", "priority arbitration", "Owner alignment"],
    methods: ["bind to Owner objective", "name assumptions", "surface risks"],
  },
  engineering: {
    spec: ["architecture reasoning", "implementation", "debugging", "code review"],
    methods: ["constraints first", "smallest change", "test the edge"],
  },
  research: {
    spec: ["source verification", "evidence extraction", "contradiction detection"],
    methods: ["claim status on every sentence", "prefer primary evidence", "flag unknowns"],
  },
  quality: {
    spec: ["independent evaluation", "regression detection", "requirement tracing"],
    methods: ["do not trust the author", "require evidence", "fail closed"],
  },
  security: {
    spec: ["threat modeling", "policy enforcement", "prompt-injection defense"],
    methods: ["treat external content as untrusted", "least privilege", "log every probe"],
  },
  operations: {
    spec: ["queue discipline", "fair scheduling", "checkpoint recovery"],
    methods: ["preserve state", "never drop work", "rebalance before overload"],
  },
  knowledge: {
    spec: ["scoped retrieval", "knowledge status hygiene", "context firewall"],
    methods: ["verified only as truth", "summarize before expand", "no memory dump"],
  },
  skills: {
    spec: ["skill specification", "sandbox testing", "versioned deploy"],
    methods: ["generate → sandbox → test → approve", "always keep rollback"],
  },
  workforce: {
    spec: ["assignment", "coaching", "performance evidence"],
    methods: ["measure outcomes", "train before punish", "never delete identity"],
  },
  governance: {
    spec: ["constitution enforcement", "approval routing", "audit completeness"],
    methods: ["Owner is highest authority", "high-impact needs approval", "no silent bypass"],
  },
  recovery: {
    spec: ["fault isolation", "succession", "state restore"],
    methods: ["detect → contain → successor → resume", "never restart from zero"],
  },
  routing: {
    spec: ["model selection", "fallback", "cost/quality trade"],
    methods: ["smallest sufficient brain", "preserve task on switch", "record why"],
  },
};

const ROLE_SPEC: Partial<Record<WorkerRole, string[]>> = {
  qc: ["independent QC", "false-positive control", "requirement checklist"],
  tester: ["test generation", "failure reproduction", "adversarial cases"],
  security: ["red team", "permission escalation tests", "leak detection"],
  recovery: ["lease expiry", "reassignment", "checkpoint resume"],
  specialist: ["deep domain work", "escalation handling"],
  analyst: ["synthesis", "trend detection", "evidence packing"],
  executive: ["department health", "bottleneck detection", "Owner briefing"],
  manager: ["ledger of subtasks", "cross-manager coordination"],
  supervisor: ["team load", "assignment quality", "first review"],
};

export function registryId(workerId: string) {
  const n = Number(workerId.replace(/\D/g, "")) || 0;
  return `WORKER-${String(n).padStart(4, "0")}`;
}

export function makeAgent(worker: Omit<Worker, "agent"> | Worker, now = Date.now()): WorkerAgent {
  const n = Number(worker.id.replace(/\D/g, "")) || 1;
  const rand = mulberry32(1000 + n * 17);
  const dept = DEPT_SPEC[worker.departmentId] ?? DEPT_SPEC.strategy;
  const roleBits = ROLE_SPEC[worker.role] ?? [];
  const specPool = [...dept.spec, ...roleBits];
  const specialization = specPool[n % specPool.length];
  const methods = dept.methods;
  const style = STYLES[n % STYLES.length];
  const verbosity = VERB[Math.floor(rand() * VERB.length)];
  const riskTolerance =
    worker.role === "security" || worker.role === "qc" ? "conservative" : RISK[n % RISK.length];
  const prefs = [worker.modelId, "grok-fast", "local-heuristic"].filter(
    (v, i, a) => a.indexOf(v) === i,
  );
  return {
    registryId: registryId(worker.id),
    specialization,
    methodology: methods,
    style,
    verbosity,
    riskTolerance,
    policyVersion: "1.0.0",
    brainPreference: prefs,
    qualityThreshold: worker.role === "qc" ? 0.9 : 0.78,
    health: worker.status === "disabled" ? "suspended" : worker.reserved ? "unavailable" : "healthy",
    workload: 0,
    heartbeatAt: now,
    lessons: [],
    mistakes: [],
    achievements: [],
    unknowns: 0,
    escalations: 0,
    lastTrace: "",
  };
}

export function ensureAgent(worker: Worker, now = Date.now()): Worker {
  if (!worker.agent || !worker.agent.registryId) worker.agent = makeAgent(worker, now);
  if (!worker.performance.hallucinationFlags) worker.performance.hallucinationFlags = 0;
  if (worker.performance.cost == null) worker.performance.cost = 0;
  return worker;
}
