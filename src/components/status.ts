import type { OrgStatus, TaskStatus, WorkerStatus } from "@/org/types";

export function orgTone(s: OrgStatus) {
  if (s === "running") return "live" as const;
  if (s === "paused") return "warn" as const;
  if (s === "shutdown") return "danger" as const;
  if (s === "recovering") return "ok" as const;
  return "neutral" as const;
}

export function workerTone(s: WorkerStatus) {
  if (s === "working" || s === "assigned" || s === "qc") return "live" as const;
  if (s === "training" || s === "recovery") return "warn" as const;
  if (s === "disabled") return "danger" as const;
  if (s === "available") return "ok" as const;
  return "neutral" as const;
}

export function taskTone(s: TaskStatus) {
  if (s === "delivered") return "ok" as const;
  if (s === "failed" || s === "cancelled") return "danger" as const;
  if (s === "awaiting_approval" || s === "blocked") return "warn" as const;
  if (s === "queued" || s === "created") return "neutral" as const;
  return "live" as const;
}
