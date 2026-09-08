import { generateBrain } from "@/lib/ceo-plan";
import { useOrgStore } from "@/store/org-store";
import { composeWorkerPolicy } from "@/runtime/worker/policy";

let draining = false;

export async function drainLiveQueue() {
  if (draining) return;
  const s = useOrgStore.getState();
  if (s.orgStatus !== "running" || !s.runtime?.liveMode) return;
  if (s.runtime.liveInflight > 0) return;
  const task = Object.values(s.tasks).find(
    (t) => t.livePending && t.status === "in_progress" && t.workerId,
  );
  if (!task || !task.workerId) return;
  const worker = s.workers[task.workerId];
  if (!worker) {
    s.failLive(task.id);
    return;
  }
  draining = true;
  s.beginLive();
  try {
    const skill = s.skills.find((x) => x.id === task.skillId);
    const policy = composeWorkerPolicy(s, worker, task, skill);
    const res = await generateBrain({
      data: {
        brainId: task.brainId,
        fallbacks: task.fallbacks,
        system: policy.system,
        user: policy.user,
        maxTokens: 450,
        routingMode: s.runtime?.routingMode,
      },
    });
    if (res.ok) s.applyLive(task.id, res.text, res.brainId, res.tokens);
    else s.failLive(task.id);
  } catch {
    useOrgStore.getState().failLive(task.id);
  } finally {
    draining = false;
  }
}
