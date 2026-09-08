import assert from "node:assert/strict";
import test from "node:test";
import { seedOrganization } from "../org/seed.ts";
import { issueObjective, tick } from "../org/engine.ts";
import { scopedMemory } from "./memory/firewall.ts";
import { executeLocalWorker } from "./worker/kernel.ts";
import { exportWorkerPackage } from "./migrate.ts";
import { runTool, toolsForPermissions } from "./tools/runtime.ts";

test("exactly 1000 persistent worker identities", () => {
  const org = seedOrganization();
  assert.equal(org.workerOrder.length, 1000);
  const ids = new Set(org.workerOrder);
  assert.equal(ids.size, 1000);
  assert.ok(org.workerOrder[0] === "W-0001");
  assert.ok(org.workerOrder[999] === "W-1000");
  for (const id of org.workerOrder) {
    const w = org.workers[id];
    assert.ok(w.agent.registryId.startsWith("WORKER-"));
    assert.ok(w.agent.specialization.length > 0);
    assert.ok(w.agent.methodology.length > 0);
  }
});

test("workers are not identical copies", () => {
  const org = seedOrganization();
  const specs = new Set(org.workerOrder.map((id) => org.workers[id].agent.specialization));
  assert.ok(specs.size > 8);
  const styles = new Set(org.workerOrder.map((id) => org.workers[id].agent.style));
  assert.equal(styles.size, 5);
});

test("context firewall hides other-worker memory", () => {
  const org = seedOrganization();
  const worker = org.workers["W-0100"];
  org.memory.push({
    id: "secret-w",
    layer: "worker",
    ownerId: "W-0002",
    title: "private note",
    content: "should not leak",
    status: "verified",
    claim: "verified_fact",
    tags: ["research"],
    evidence: [],
    createdBy: "W-0002",
    createdAt: Date.now(),
    relatedSkillId: null,
    relatedTaskId: null,
  });
  const hits = scopedMemory(org, worker, "research", 8);
  assert.equal(hits.some((m) => m.id === "secret-w"), false);
});

test("local worker kernel produces evidence and does not self-certify as verified_fact", () => {
  const org = seedOrganization();
  const oid = issueObjective(org, "Prepare a one-page research brief on token-efficient memory.");
  tick(org, 8);
  const task = Object.values(org.tasks).find((t) => t.objectiveId === oid && t.workerId);
  assert.ok(task);
  if (task && task.workerId) {
    const w = org.workers[task.workerId];
    const turn = executeLocalWorker(org, w, task);
    assert.ok(turn.output.length > 40);
    assert.notEqual(turn.claim, "verified_fact");
    assert.ok(turn.evidence.length > 0);
    assert.ok(turn.trace.length > 0);
  }
});

test("calculator tool is sandboxed", () => {
  const allowed = toolsForPermissions(["editor"]);
  const ok = runTool({ name: "calculator", input: "2+2*3" }, { memory: [], allowed });
  assert.equal(ok.output, "8");
  const denied = runTool({ name: "calculator", input: "1" }, { memory: [], allowed: ["refuse"] });
  assert.equal(denied.ok, false);
});

test("worker package export is independently readable", () => {
  const org = seedOrganization();
  const pack = exportWorkerPackage(org.workers["W-0200"]);
  assert.equal(pack.identity.registryId, "WORKER-0200");
  assert.ok(pack.specialization);
  assert.ok(Array.isArray(pack.tools));
});
