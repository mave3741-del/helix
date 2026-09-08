import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle, Stat } from "@/components/ui/panel";
import { formatPct } from "@/lib/utils";
import { useOrgStore } from "@/store/org-store";

const STEPS = ["observe", "propose", "sandbox", "test", "benchmark", "qc", "approve", "deployed"];

export function ImproveView() {
  const epoch = useOrgStore((s) => s.epoch);
  const improvements = useOrgStore((s) => s.improvements);
  const kpis = useOrgStore((s) => s.kpis);
  void epoch;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Self-improvement</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">Controlled, never unrestricted.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          The organization can propose skills, routing, memory, and workflow changes. Production
          changes pass sandbox, test, benchmark, QC, and approval. Rollback is mandatory.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Panel>
          <Stat label="Reliability" value={formatPct(kpis.reliability)} />
        </Panel>
        <Panel>
          <Stat label="Token efficiency" value={formatPct(kpis.tokenEfficiency)} />
        </Panel>
        <Panel>
          <Stat label="QC catch" value={formatPct(kpis.qcCatchRate)} />
        </Panel>
        <Panel>
          <Stat label="Proposals" value={String(improvements.length)} />
        </Panel>
      </div>

      {improvements.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted">
            No proposals yet. Weaknesses detected during operation will appear here — or run the
            self-improvement scenario.
          </p>
          <Button className="mt-3" size="sm" onClick={() => useOrgStore.getState().runScenario("t11")}>
            Run self-improvement scenario
          </Button>
        </Panel>
      ) : (
        improvements.map((imp) => (
          <Panel key={imp.id}>
            <div className="flex items-start justify-between gap-2">
              <PanelTitle kicker={imp.metric} title={imp.title} />
              <Badge tone={imp.status === "deployed" ? "ok" : imp.status === "rolled_back" ? "danger" : "live"}>
                {imp.status}
              </Badge>
            </div>
            <p className="text-sm text-muted">{imp.observation}</p>
            <p className="mt-2 text-sm">{imp.proposal}</p>
            <ol className="mt-4 flex flex-wrap gap-1.5">
              {STEPS.map((st) => (
                <li
                  key={st}
                  className={
                    STEPS.indexOf(imp.status) >= STEPS.indexOf(st)
                      ? "rounded-sm bg-accent px-2 py-1 text-[10px] text-accent-foreground"
                      : "rounded-sm bg-card-elevated px-2 py-1 text-[10px] text-muted"
                  }
                >
                  {st}
                </li>
              ))}
            </ol>
          </Panel>
        ))
      )}
    </div>
  );
}
