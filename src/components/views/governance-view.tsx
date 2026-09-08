import { CONSTITUTION, SYSTEMS } from "@/org/constitution";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { timeAgo } from "@/lib/utils";
import { useOrgStore } from "@/store/org-store";

export function GovernanceView() {
  const epoch = useOrgStore((s) => s.epoch);
  const identity = useOrgStore((s) => s.identity);
  const approvals = useOrgStore((s) => s.approvals);
  const audit = useOrgStore((s) => s.audit);
  const orgStatus = useOrgStore((s) => s.orgStatus);
  void epoch;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Governance</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">Constitution first.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Risk-based autonomy: low-risk work proceeds; high-impact irreversible actions stop for
          Owner approval. Every important action is auditable.
        </p>
      </div>

      <Panel>
        <PanelTitle kicker="Identity" title={identity.name} />
        <label className="text-xs text-muted">Owner name</label>
        <Input
          className="mt-1 mb-3"
          value={identity.ownerName}
          onChange={(e) => useOrgStore.getState().setOwnerName(e.target.value)}
        />
        <label className="text-xs text-muted">Mission</label>
        <Textarea
          className="mt-1"
          value={identity.mission}
          onChange={(e) => useOrgStore.getState().setMission(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {orgStatus !== "running" ? (
            <Button size="sm" onClick={() => useOrgStore.getState().resume()}>
              Resume
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => useOrgStore.getState().pause()}>
              Pause
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => useOrgStore.getState().recover()}>
            Recover from checkpoint
          </Button>
          <Button size="sm" variant="danger" onClick={() => useOrgStore.getState().resetOrg()}>
            Reset organization
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelTitle kicker="Fifteen rules" title="Permanent constitution" />
        <ol className="space-y-3">
          {CONSTITUTION.map((c) => (
            <li key={c.n} className="grid grid-cols-[2.5rem_1fr] gap-3">
              <span className="font-mono text-xs text-muted">{String(c.n).padStart(2, "0")}</span>
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-sm text-muted">{c.rule}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel>
        <PanelTitle kicker="Systems" title="Spec coverage — operational layer" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEMS.map((s) => (
            <div key={s.id} className="rounded-md bg-card-elevated p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">{s.name}</p>
                <Badge tone="ok">live</Badge>
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted">§ {s.spec}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelTitle kicker="Approvals" title="Risk-based Owner gates" />
        {approvals.length === 0 ? (
          <p className="text-sm text-muted">No approval history yet.</p>
        ) : (
          <ul className="space-y-2">
            {approvals.slice(0, 12).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 rounded-md bg-card-elevated p-3">
                <div>
                  <p className="text-sm">{a.title}</p>
                  <p className="text-xs text-muted">{a.detail}</p>
                </div>
                <Badge tone={a.status === "granted" ? "ok" : a.status === "rejected" ? "danger" : "warn"}>
                  {a.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelTitle kicker="Audit" title="Who · what · when · why" />
        <ul className="max-h-80 space-y-2 overflow-auto">
          {[...audit].slice(-30).reverse().map((a) => (
            <li key={a.id} className="grid grid-cols-[5.5rem_1fr] gap-3 text-xs">
              <span className="font-mono text-muted tabular-nums">{timeAgo(a.at)}</span>
              <span>
                <span className="text-foreground">{a.what}</span>
                <span className="mt-0.5 block text-muted">
                  {a.who} · {a.why}
                  {a.result ? ` · ${a.result}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
