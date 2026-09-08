import { ArrowUpRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Panel, PanelTitle, Stat } from "@/components/ui/panel";
import { planObjective } from "@/lib/ceo-plan";
import { formatPct, timeAgo } from "@/lib/utils";
import { useOrgStore } from "@/store/org-store";

const SAMPLES = [
  "Prepare a one-page research brief on token-efficient organizational memory.",
  "Coordinate research, engineering, security, and quality to produce a verified routing policy.",
  "Reformat the internal department codes list and run a non-destructive self-check.",
  "Irreversible production deploy of a security-critical change plus financial commitment.",
];

export function CommandView() {
  const epoch = useOrgStore((s) => s.epoch);
  const identity = useOrgStore((s) => s.identity);
  const ceo = useOrgStore((s) => s.ceo);
  const kpis = useOrgStore((s) => s.kpis);
  const depts = useOrgStore((s) => s.departments);
  const stats = useOrgStore((s) => s.deptStats);
  const events = useOrgStore((s) => s.events);
  const approvalsAll = useOrgStore((s) => s.approvals);
  const projectsAll = useOrgStore((s) => s.projects);
  const planning = useOrgStore((s) => s.planning);
  const planError = useOrgStore((s) => s.planError);
  const runtime = useOrgStore((s) => s.runtime);
  const [text, setText] = useState("");
  void epoch;
  const approvals = approvalsAll.filter((a) => a.status === "pending");
  const projects = projectsAll.slice(0, 5);

  async function submit(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setText("");
    const store = useOrgStore.getState();
    const id = store.issue(value);
    store.setPlanning(true);
    try {
      const plan = await planObjective({ data: { text: value, mission: store.identity.mission } });
      if (plan.ok) store.applyCeoPlan(id, plan);
      else store.setPlanning(false, plan.error);
    } catch {
      store.setPlanning(false, "CEO brain unreachable — local strategy in effect");
    } finally {
      const s = useOrgStore.getState();
      if (s.planning) s.setPlanning(false, s.planError);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Owner command</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">The organization is the intelligence.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {identity.mission}
        </p>
        <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-live uppercase">
          Runtime {runtime?.mode ?? "production"} · live brains {runtime?.liveMode ? "on" : "off"} · cap{" "}
          {runtime?.liveCap ?? 4} cloud turns / objective burst
        </p>
      </div>

      <Panel className="rounded-2xl p-4 sm:p-6">
        <PanelTitle kicker="Issue objective" title="Speak to the CEO, not to 1,000 workers" />
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Direct the organization…"
          className="min-h-28 rounded-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(text);
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={() => void submit(text)} disabled={planning || !text.trim()}>
            {planning ? <Loader2 className="animate-spin" /> : <ArrowUpRight />}
            Dispatch
          </Button>
          <Button
            variant={runtime?.liveMode ? "default" : "secondary"}
            onClick={() => useOrgStore.getState().setLive(!runtime?.liveMode)}
          >
            {runtime?.liveMode ? "Live brains" : "Local only"}
          </Button>
          <span className="text-xs text-muted">⌘↵ to send · risk-classified automatically</span>
        </div>
        {planError ? <p className="mt-2 text-xs text-warn">{planError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              className="rounded-sm bg-card-elevated px-2.5 py-1.5 text-left text-xs text-muted hover:text-foreground"
            >
              {s.slice(0, 56)}…
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Panel>
          <Stat label="Success" value={formatPct(kpis.successRate)} />
        </Panel>
        <Panel>
          <Stat label="Quality" value={formatPct(kpis.quality)} />
        </Panel>
        <Panel>
          <Stat label="Available" value={String(kpis.availableWorkers)} hint="of 1,000" />
        </Panel>
        <Panel>
          <Stat label="Fallbacks" value={String(kpis.fallbacks)} hint="brain switches" />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          <PanelTitle kicker="Lattice" title="Twelve departments" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {depts.map((d) => {
              const st = stats[d.id];
              return (
                <div key={d.id} className="rounded-lg bg-card-elevated p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-muted">
                      {d.code}
                    </span>
                    {st?.active ? (
                      <span className="size-1.5 rounded-full bg-live live-dot" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-muted/40" />
                    )}
                  </div>
                  <p className="mt-1 text-sm">{d.name}</p>
                  <p className="mt-2 font-mono text-[11px] text-muted tabular-nums">
                    {st?.active ?? 0} live · {st?.queue ?? 0} queue
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelTitle kicker="CEO" title={ceo.name} action={<Badge tone="live">{ceo.status}</Badge>} />
            <p className="text-sm leading-relaxed text-muted">{ceo.lastBrief}</p>
          </Panel>
          <Panel>
            <PanelTitle
              kicker="Approvals"
              title="Owner gates"
              action={
                approvals.length ? <Badge tone="warn">{approvals.length} pending</Badge> : <Badge>none</Badge>
              }
            />
            {approvals.length === 0 ? (
              <p className="text-sm text-muted">Low-risk work stays autonomous.</p>
            ) : (
              <ul className="space-y-3">
                {approvals.slice(0, 4).map((a) => (
                  <li key={a.id} className="rounded-md bg-card-elevated p-3">
                    <p className="text-sm">{a.title}</p>
                    <p className="mt-1 text-xs text-muted">{a.detail}</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => useOrgStore.getState().approve(a.id, true)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => useOrgStore.getState().approve(a.id, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle kicker="Projects" title="Active work" />
          {projects.length === 0 ? (
            <p className="text-sm text-muted">No projects yet. Dispatch an objective.</p>
          ) : (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li key={p.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm">{p.name}</p>
                    <Badge tone={p.status === "delivered" ? "ok" : p.status === "awaiting_approval" ? "warn" : "live"}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-card-elevated">
                    <div
                      className="h-1 rounded-full bg-accent"
                      style={{ width: `${Math.round(p.progress * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <PanelTitle kicker="Tape" title="Organizational events" />
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {[...events].slice(-12).reverse().map((e) => (
              <li key={e.id} className="flex gap-3 text-xs">
                <span className="w-16 shrink-0 font-mono text-muted tabular-nums">{timeAgo(e.at)}</span>
                <span className="min-w-0">
                  <span className="font-mono text-[10px] text-live">{e.type}</span>
                  <span className="mt-0.5 block text-muted">{e.what}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
