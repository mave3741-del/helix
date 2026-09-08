import { QUALITY_GATES } from "@/org/constitution";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelTitle, Stat } from "@/components/ui/panel";
import { formatPct } from "@/lib/utils";
import { useOrgStore } from "@/store/org-store";

export function QualityView() {
  const epoch = useOrgStore((s) => s.epoch);
  const taskMap = useOrgStore((s) => s.tasks);
  const kpis = useOrgStore((s) => s.kpis);
  const eventsAll = useOrgStore((s) => s.events);
  const workers = useOrgStore((s) => s.workers);
  const order = useOrgStore((s) => s.workerOrder);
  void epoch;
  const tasks = Object.values(taskMap);
  const events = eventsAll.filter((e) => e.type.startsWith("QC") || e.type.startsWith("TEST"));
  const training = order.filter((id) => workers[id].status === "training");

  const qcAgents = Object.values(workers).filter((w) => w.role === "qc").length;
  const testers = Object.values(workers).filter((w) => w.role === "tester").length;
  const red = Object.values(workers).filter((w) => w.role === "security").length;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Quality system</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">No single-source trust.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          A worker’s own brain is never the only judge. Independent QC, testing, and red team optimize
          for finding failure — not looking successful.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Panel>
          <Stat label="QC agents" value={String(qcAgents)} />
        </Panel>
        <Panel>
          <Stat label="Testers" value={String(testers)} />
        </Panel>
        <Panel>
          <Stat label="Red team" value={String(red)} />
        </Panel>
        <Panel>
          <Stat label="Catch rate" value={formatPct(kpis.qcCatchRate)} />
        </Panel>
      </div>

      <Panel>
        <PanelTitle kicker="Gates" title="Seven-layer verification" />
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {QUALITY_GATES.map((g, i) => (
            <li key={g} className="rounded-md bg-card-elevated p-3">
              <p className="font-mono text-[10px] text-muted">0{i + 1}</p>
              <p className="mt-1 text-sm">{g}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle kicker="Correction" title="Workers in training" />
          {training.length === 0 ? (
            <p className="text-sm text-muted">No active coaching cycles.</p>
          ) : (
            <ul className="space-y-2">
              {training.slice(0, 12).map((id) => {
                const w = workers[id];
                return (
                  <li key={id} className="flex items-center justify-between text-sm">
                    <span>
                      {w.name}{" "}
                      <span className="font-mono text-[10px] text-muted">{w.id}</span>
                    </span>
                    <Badge tone="warn">training</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel>
          <PanelTitle kicker="Tape" title="QC and test events" />
          <ul className="max-h-72 space-y-2 overflow-auto">
            {[...events].slice(-16).reverse().map((e) => (
              <li key={e.id} className="text-xs">
                <Badge tone={e.type.includes("FAIL") ? "danger" : "ok"}>{e.type}</Badge>
                <span className="mt-1 block text-muted">{e.what}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <PanelTitle kicker="Recent verdicts" title="Independent of the author" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 font-medium">Task</th>
                <th className="py-2 font-medium">Author</th>
                <th className="py-2 font-medium">QC</th>
                <th className="py-2 font-medium">Verdict</th>
                <th className="py-2 font-medium">Claim</th>
              </tr>
            </thead>
            <tbody>
              {tasks
                .filter((t) => t.qcVerdict)
                .slice(0, 12)
                .map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="py-2">{t.title.slice(0, 40)}</td>
                    <td className="py-2 font-mono text-xs">{t.workerId}</td>
                    <td className="py-2 font-mono text-xs">{t.qcId}</td>
                    <td className="py-2">
                      <Badge tone={t.qcVerdict === "pass" ? "ok" : "danger"}>{t.qcVerdict}</Badge>
                    </td>
                    <td className="py-2 text-xs text-muted">{t.claim}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
