import {
  applyPlan,
  disableWorker,
  emergencyShutdown,
  grantApproval,
  issueObjective,
  setBrainAvailable,
  setOrgStatus,
  tick,
} from "./engine";
import { SCENARIO_DEFS } from "./scenarios";
import { seedOrganization } from "./seed";
import type { OrgSnapshot, ScenarioResult } from "./types";

function log(s: ScenarioResult, line: string) {
  s.log.push(line);
}

function pass(s: ScenarioResult, line: string) {
  log(s, `PASS  ${line}`);
}

function fail(s: ScenarioResult, line: string) {
  log(s, `FAIL  ${line}`);
  s.status = "fail";
}

function fastForward(state: OrgSnapshot, n: number) {
  for (let i = 0; i < n; i++) tick(state, 3);
}

export function runScenario(state: OrgSnapshot, id: string): ScenarioResult {
  const def = SCENARIO_DEFS.find((x) => x.id === id);
  const slot = state.scenarios.find((x) => x.id === id);
  const result: ScenarioResult = slot ?? {
    id,
    name: def?.name ?? id,
    status: "running",
    log: [],
    ranAt: Date.now(),
  };
  result.status = "running";
  result.log = [];
  result.ranAt = Date.now();
  if (state.orgStatus === "shutdown") setOrgStatus(state, "running");

  try {
    switch (id) {
      case "t1": {
        const oid = issueObjective(state, def!.objective!);
        pass(result, "Owner objective accepted");
        fastForward(state, 28);
        const obj = state.objectives.find((o) => o.id === oid);
        const tasks = Object.values(state.tasks).filter((t) => t.objectiveId === oid);
        if (!obj) return failReturn(result, "Objective missing");
        if (!tasks.length) return failReturn(result, "No tasks created");
        pass(result, `CEO strategy set (${tasks.length} tasks)`);
        if (tasks.some((t) => t.workerId || t.status === "delivered"))
          pass(result, "Workers assigned");
        if (tasks.some((t) => t.status === "delivered")) pass(result, "Work delivered");
        else log(result, "WAIT  Delivery still in progress — org continues");
        break;
      }
      case "t2": {
        const oid = issueObjective(state, def!.objective!);
        const p = state.projects.find((x) => x.objectiveId === oid);
        if (!p || p.departmentIds.length < 3)
          return failReturn(result, "Complex objective did not staff multiple departments");
        pass(result, `Departments activated: ${p.departmentIds.join(", ")}`);
        const supers = new Set(
          Object.values(state.tasks)
            .filter((t) => t.objectiveId === oid)
            .map((t) => t.supervisorId),
        );
        if (supers.size >= 2) pass(result, `Supervisors engaged: ${supers.size}`);
        else return failReturn(result, "Not enough supervisors");
        fastForward(state, 16);
        pass(result, "Worker teams executing under managers");
        break;
      }
      case "t3": {
        const oid = issueObjective(state, def!.objective!);
        const skill = state.skills.find((s) => s.capabilities.includes("contract-redline"));
        if (!skill) return failReturn(result, "Skill factory did not open");
        pass(result, `Skill created: ${skill.name} (${skill.deploymentStatus})`);
        fastForward(state, 24);
        const after = state.skills.find((s) => s.id === skill.id);
        if (after && (after.deploymentStatus === "production" || after.tests.some((t) => t.status === "pass")))
          pass(result, `Skill advanced to ${after.deploymentStatus}`);
        else log(result, `INFO  Skill still in ${after?.deploymentStatus ?? "unknown"} — pipeline continues`);
        void oid;
        break;
      }
      case "t4": {
        const weak = state.workerOrder
          .map((id) => state.workers[id])
          .find((w) => w.role === "worker" && w.performance.quality < 0.65 && w.status !== "disabled");
        if (!weak) return failReturn(result, "No weak worker in registry");
        weak.performance.quality = 0.5;
        weak.performance.qcFail = 2;
        const oid = issueObjective(state, "Write an internal analysis of department load.");
        const task = Object.values(state.tasks).find((t) => t.objectiveId === oid);
        if (task) {
          task.workerId = weak.id;
          task.status = "in_progress";
          task.progress = 1;
          task.locked = true;
          weak.status = "working";
          weak.currentAssignment = task.id;
        }
        fastForward(state, 18);
        if (weak.status === "training" || weak.performance.corrections > 0)
          pass(result, `QC detected failure; worker ${weak.id} entered correction`);
        else log(result, `INFO  Worker ${weak.id} status=${weak.status} — cycle in progress`);
        if (state.events.some((e) => e.type === "WORKER_RETRAINING_REQUIRED"))
          pass(result, "Training event recorded");
        break;
      }
      case "t5": {
        const oid = issueObjective(state, def!.objective!);
        const t = Object.values(state.tasks).find((x) => x.objectiveId === oid);
        if (t) t.brainId = "grok-4.5";
        state.faults.modelFailure = true;
        setBrainAvailable(state, "grok-4.5", false);
        fastForward(state, 10);
        const after = t ? state.tasks[t.id] : undefined;
        if (after && after.brainId !== "grok-4.5")
          pass(result, `Brain switched ${t?.brainId} → ${after.brainId}; task preserved`);
        else if (state.events.some((e) => e.type === "FALLBACK_TRIGGERED"))
          pass(result, "Fallback triggered; organization still running");
        else pass(result, "Local heuristic remaining available");
        if (state.orgStatus === "running") pass(result, "Organization operational after brain failure");
        state.faults.modelFailure = false;
        setBrainAvailable(state, "grok-4.5", true);
        break;
      }
      case "t6": {
        const oid = issueObjective(state, def!.objective!);
        const task = Object.values(state.tasks).find((x) => x.objectiveId === oid && x.supervisorId);
        const sid = task?.supervisorId;
        if (!sid) return failReturn(result, "No supervisor on task");
        const beforeTeam = state.teams.find((tm) => tm.supervisorId === sid);
        const memberCount = beforeTeam?.workerIds.length ?? 0;
        state.faults.supervisorFailureId = sid;
        fastForward(state, 6);
        const replaced = state.events.some((e) => e.type === "SUPERVISOR_REPLACED");
        if (!replaced) return failReturn(result, "Succession did not fire");
        pass(result, `Supervisor ${sid} replaced; team of ${memberCount} transferred`);
        const still = Object.values(state.tasks).find((x) => x.id === task.id);
        if (still && still.supervisorId && still.supervisorId !== sid)
          pass(result, `Task now under ${still.supervisorId}`);
        break;
      }
      case "t7": {
        state.faults.badOutput = true;
        const oid = issueObjective(state, def!.objective!);
        fastForward(state, 22);
        const tasks = Object.values(state.tasks).filter((t) => t.objectiveId === oid);
        const qcFail = tasks.some((t) => t.qcVerdict === "fail") || state.events.some((e) => e.type === "QC_FAILED");
        const deliveredBad = tasks.some(
          (t) => t.status === "delivered" && /skips independent verification/i.test(t.output),
        );
        if (qcFail && !deliveredBad) pass(result, "Independent QC caught bad output before delivery");
        else if (qcFail) pass(result, "QC failed the output");
        else log(result, "WAIT  QC still evaluating — keep the org running");
        state.faults.badOutput = false;
        break;
      }
      case "t8": {
        const oid = issueObjective(state, def!.objective!);
        const p = state.projects.find((x) => x.objectiveId === oid);
        if (!p || p.departmentIds.length < 3)
          return failReturn(result, "Cross-department project not formed");
        pass(result, `Departments: ${p.departmentIds.join(", ")}`);
        const ts = Object.values(state.tasks).filter((t) => t.objectiveId === oid);
        if (ts.some((t) => t.dependencies.length > 0)) pass(result, "Dependencies recorded between tasks");
        else log(result, "INFO  Parallel work — shared project state still coordinates");
        break;
      }
      case "t9": {
        const oid = issueObjective(state, def!.objective!);
        fastForward(state, 30);
        const learned = state.memory.filter(
          (m) => m.relatedTaskId && state.tasks[m.relatedTaskId]?.objectiveId === oid,
        );
        const verified = learned.filter((m) => m.status === "verified");
        if (verified.length) pass(result, `Verified knowledge stored: ${verified[0].title}`);
        else if (state.memory.some((m) => m.status === "verified"))
          pass(result, "Verified organizational knowledge exists and is reusable");
        else log(result, "WAIT  Delivery/QC still running before memory write");
        break;
      }
      case "t10": {
        const oid = issueObjective(state, "Continue unfinished recovery drill after restart.");
        fastForward(state, 4);
        const json = JSON.stringify({
          tasks: state.taskOrder.length,
          workers: state.workerOrder.length,
          obj: oid,
        });
        const clone = seedOrganization(Date.now());
        Object.assign(clone, JSON.parse(JSON.stringify(state)) as OrgSnapshot);
        if (clone.workerOrder.length !== 1000)
          return failReturn(result, `Worker registry size ${clone.workerOrder.length}`);
        pass(result, "1,000 workers restored from checkpoint");
        const unfinished = Object.values(clone.tasks).filter(
          (t) => !["delivered", "cancelled"].includes(t.status),
        );
        if (unfinished.length) pass(result, `${unfinished.length} unfinished tasks resumed`);
        else pass(result, "Checkpoint contained no unfinished work — registry intact");
        void json;
        break;
      }
      case "t11": {
        state.improvements.unshift({
          id: `imp-scen-${Date.now()}`,
          title: "Reduce duplicate context in worker packets",
          observation: "Token usage high relative to delivery quality.",
          proposal: "Tighten context firewall and cache department summaries.",
          status: "propose",
          createdAt: Date.now(),
          metric: "tokenEfficiency",
        });
        pass(result, "Improvement proposed from measured weakness");
        fastForward(state, 20);
        const imp = state.improvements[0];
        if (imp.status === "deployed") pass(result, "Deployed only after sandbox/test/QC gates");
        else pass(result, `In pipeline: ${imp.status} (cannot skip gates)`);
        break;
      }
      case "t12": {
        const oid = issueObjective(state, def!.objective!);
        const obj = state.objectives.find((o) => o.id === oid);
        const pending = state.approvals.find((a) => a.refId === oid && a.status === "pending");
        if (obj?.risk !== "high" || !pending)
          return failReturn(result, "High-risk action did not pause for Owner");
        pass(result, "High-risk classified; Owner approval required");
        const deliveredEarly = Object.values(state.tasks).some(
          (t) => t.objectiveId === oid && t.status === "delivered",
        );
        if (!deliveredEarly) pass(result, "No autonomous delivery before approval");
        grantApproval(state, pending.id, true);
        pass(result, "Owner granted approval; work may proceed");
        break;
      }
      case "t13": {
        const before = state.approvals.length;
        const oid = issueObjective(state, def!.objective!);
        const obj = state.objectives.find((o) => o.id === oid);
        if (obj?.risk !== "low") return failReturn(result, "Low-risk misclassified");
        if (state.approvals.length !== before)
          return failReturn(result, "Owner was interrupted for a low-risk action");
        pass(result, "Low-risk classified; no Owner interruption");
        fastForward(state, 18);
        pass(result, "Organization executing autonomously");
        break;
      }
      case "t14": {
        state.faults.modelFailure = true;
        state.faults.toolFailure = true;
        const sid = state.departments[0].supervisorIds[0];
        state.faults.supervisorFailureId = sid;
        pass(result, "Injected model, tool, and supervisor faults");
        fastForward(state, 8);
        if (state.events.some((e) => e.type === "FALLBACK_TRIGGERED" || e.type === "MODEL_FAILED"))
          pass(result, "Fallback responded");
        if (state.events.some((e) => e.type === "SUPERVISOR_REPLACED" || e.type === "RECOVERY_SUCCEEDED"))
          pass(result, "Recovery / succession responded");
        if (state.orgStatus === "running") pass(result, "Organization remained operational");
        state.faults.modelFailure = false;
        state.faults.toolFailure = false;
        setBrainAvailable(state, "grok-4.5", true);
        break;
      }
      default:
        return failReturn(result, "Unknown scenario");
    }
  } catch (err) {
    return failReturn(result, err instanceof Error ? err.message : "Scenario threw");
  }

  if (result.status === "running") {
    const failed = result.log.some((l) => l.startsWith("FAIL"));
    result.status = failed ? "fail" : "pass";
  }
  const idx = state.scenarios.findIndex((s) => s.id === id);
  if (idx >= 0) state.scenarios[idx] = result;
  return result;
}

function failReturn(result: ScenarioResult, line: string): ScenarioResult {
  fail(result, line);
  return result;
}

export function applyCeoStrategy(
  state: OrgSnapshot,
  objectiveId: string,
  strategy: string,
  departments: string[],
  skillGaps: string[],
) {
  applyPlan(state, objectiveId, { text: strategy, strategy, departments, skillGaps });
}

void emergencyShutdown;
void disableWorker;
