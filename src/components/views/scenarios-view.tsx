import { SCENARIO_DEFS } from "@/org/scenarios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { useOrgStore } from "@/store/org-store";

export function ScenariosView() {
  const epoch = useOrgStore((s) => s.epoch);
  const scenarios = useOrgStore((s) => s.scenarios);
  void epoch;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Acceptance</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">Prove the organization.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Fourteen non-negotiable tests. A working UI is not enough. Run each scenario against the
          live operating layer.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const store = useOrgStore.getState();
            for (const d of SCENARIO_DEFS) store.runScenario(d.id);
          }}
        >
          Run all fourteen
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {SCENARIO_DEFS.map((d) => {
          const r = scenarios.find((s) => s.id === d.id);
          const tone =
            r?.status === "pass" ? "ok" : r?.status === "fail" ? "danger" : r?.status === "running" ? "live" : "neutral";
          return (
            <Panel key={d.id}>
              <div className="flex items-start justify-between gap-2">
                <PanelTitle kicker={`TEST ${String(d.n).padStart(2, "0")}`} title={d.name} />
                <Badge tone={tone}>{r?.status ?? "idle"}</Badge>
              </div>
              <p className="text-sm text-muted">{d.spec}</p>
              <Button className="mt-3" size="sm" variant="secondary" onClick={() => useOrgStore.getState().runScenario(d.id)}>
                Run
              </Button>
              {r?.log.length ? (
                <pre className="mt-3 max-h-40 overflow-auto font-mono text-[11px] leading-relaxed text-muted">
                  {r.log.join("\n")}
                </pre>
              ) : null}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
