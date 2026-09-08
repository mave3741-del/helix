import { useMemo, useState } from "react";
import { workerTone } from "@/components/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelTitle, Stat } from "@/components/ui/panel";
import { formatPct } from "@/lib/utils";
import type { WorkerRole, WorkerStatus } from "@/org/types";
import { exportWorkerPackage } from "@/runtime/migrate";
import { useOrgStore } from "@/store/org-store";

const PAGE = 24;

export function WorkforceView() {
  const epoch = useOrgStore((s) => s.epoch);
  const order = useOrgStore((s) => s.workerOrder);
  const workers = useOrgStore((s) => s.workers);
  const depts = useOrgStore((s) => s.departments);
  const selected = useOrgStore((s) => s.selectedWorkerId);
  const kpis = useOrgStore((s) => s.kpis);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<WorkerRole | "all">("all");
  const [status, setStatus] = useState<WorkerStatus | "all">("all");
  const [page, setPage] = useState(0);
  void epoch;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return order.filter((id) => {
      const w = workers[id];
      if (!w) return false;
      if (role !== "all" && w.role !== role) return false;
      if (status !== "all" && w.status !== status) return false;
      if (!query) return true;
      return (
        w.id.toLowerCase().includes(query) ||
        w.name.toLowerCase().includes(query) ||
        w.title.toLowerCase().includes(query) ||
        w.departmentId.includes(query)
      );
    });
  }, [order, workers, q, role, status]);

  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const worker = selected ? workers[selected] : workers[slice[0]];
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Registry</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">Exactly 1,000 workers.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Persistent identities, not 1,000 running model sessions. Activated by workload. Memory,
          performance, and assignments survive brain replacement.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Panel>
          <Stat label="Registered" value={String(order.length)} />
        </Panel>
        <Panel>
          <Stat label="Available" value={String(kpis.availableWorkers)} />
        </Panel>
        <Panel>
          <Stat label="Active" value={String(kpis.activeWorkers)} />
        </Panel>
        <Panel>
          <Stat label="Training" value={String(kpis.trainingWorkers)} />
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search name, ID, department"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
          <select
            className="h-11 rounded-md border border-border bg-input px-3 text-sm"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as WorkerRole | "all");
              setPage(0);
            }}
          >
            <option value="all">All roles</option>
            {["executive", "manager", "supervisor", "worker", "qc", "tester", "security", "recovery", "specialist", "analyst"].map(
              (r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ),
            )}
          </select>
          <select
            className="h-11 rounded-md border border-border bg-input px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as WorkerStatus | "all");
              setPage(0);
            }}
          >
            <option value="all">All status</option>
            {["available", "assigned", "working", "qc", "training", "recovery", "reserved", "disabled"].map(
              (r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ),
            )}
          </select>
        </div>
        <p className="mt-2 text-xs text-muted">{filtered.length} matching identities</p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.9fr)]">
        <Panel className="overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-2 py-3 font-medium">Name</th>
                  <th className="px-2 py-3 font-medium">Role</th>
                  <th className="px-2 py-3 font-medium">Dept</th>
                  <th className="px-2 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Quality</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((id) => {
                  const w = workers[id];
                  return (
                    <tr
                      key={id}
                      className="cursor-pointer border-b border-border/70 hover:bg-card-elevated"
                      onClick={() => useOrgStore.getState().selectWorker(id)}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs">{w.id}</td>
                      <td className="px-2 py-2.5">{w.name}</td>
                      <td className="px-2 py-2.5 text-muted">{w.role}</td>
                      <td className="px-2 py-2.5 font-mono text-xs uppercase">{w.departmentId.slice(0, 3)}</td>
                      <td className="px-2 py-2.5">
                        <Badge tone={workerTone(w.status)}>{w.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs tabular-nums">
                        {formatPct(w.performance.quality)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="font-mono text-xs text-muted tabular-nums">
              {page + 1} / {pages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </Panel>

        {worker ? (
          <Panel>
            <PanelTitle kicker={worker.id} title={worker.name} />
            <p className="text-sm text-muted">{worker.title}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone={workerTone(worker.status)}>{worker.status}</Badge>
              <Badge>{worker.rank}</Badge>
              <Badge>{worker.modelId}</Badge>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Registry" v={worker.agent?.registryId ?? worker.id} />
              <Row k="Department" v={depts.find((d) => d.id === worker.departmentId)?.name ?? worker.departmentId} />
              <Row k="Supervisor" v={worker.supervisorId ?? "—"} />
              <Row k="Manager" v={worker.managerId ?? "—"} />
              <Row k="Specialization" v={worker.agent?.specialization ?? "—"} />
              <Row k="Style" v={worker.agent ? `${worker.agent.style} / ${worker.agent.verbosity}` : "—"} />
              <Row k="Health" v={worker.agent?.health ?? "—"} />
              <Row k="Assignment" v={worker.currentAssignment ?? "none"} />
              <Row k="Capabilities" v={worker.capabilities.join(", ")} />
              <Row k="Permissions" v={worker.permissions.join(", ")} />
              <Row k="Tools" v={worker.toolPermissions.join(", ")} />
              <Row k="Memory scope" v={worker.memoryScope} />
              <Row k="Done / fail" v={`${worker.performance.done} / ${worker.performance.fail}`} />
              <Row k="QC failures" v={String(worker.performance.qcFail)} />
              <Row k="Lessons" v={String(worker.agent?.lessons?.length ?? 0)} />
              <Row k="Mistakes" v={String(worker.agent?.mistakes?.length ?? 0)} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const pack = exportWorkerPackage(worker);
                  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${worker.agent?.registryId ?? worker.id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export agent package
              </Button>
              {worker.status !== "disabled" ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => useOrgStore.getState().disableWorker(worker.id, "Owner disable")}
                >
                  Disable worker
                </Button>
              ) : (
                <p className="text-xs text-danger">{worker.disabledReason}</p>
              )}
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="max-w-[60%] text-right font-mono text-xs">{v}</dd>
    </div>
  );
}
