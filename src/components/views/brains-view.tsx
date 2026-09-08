import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { formatCompact, formatPct } from "@/lib/utils";
import { useOrgStore } from "@/store/org-store";

export function BrainsView() {
  const epoch = useOrgStore((s) => s.epoch);
  const brains = useOrgStore((s) => s.brains);
  const faults = useOrgStore((s) => s.faults);
  const budgets = useOrgStore((s) => s.budgets);
  const fallbacks = useOrgStore((s) => s.kpis.fallbacks);
  void epoch;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">OmniRoute</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">Models are replaceable brains.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          The organization owns memory, goals, and quality. Switching a brain never resets a task.
          Smallest sufficient model first. Automatic fallback when a provider fails.
        </p>
      </div>

      <Panel>
        <PanelTitle kicker="Fallback chain" title="Failure is not organizational failure" />
        <div className="flex flex-wrap items-center gap-2">
          {brains.map((b, i) => (
            <div key={b.id} className="flex items-center gap-2">
              {i > 0 ? <span className="text-muted">→</span> : null}
              <div className="rounded-md bg-card-elevated px-3 py-2">
                <p className="text-sm">{b.name}</p>
                <p className="font-mono text-[10px] text-muted">
                  {b.tier} · {b.available ? "up" : "down"}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">{fallbacks} fallback events recorded</p>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {brains.map((b) => (
          <Panel key={b.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <PanelTitle kicker={b.provider} title={b.name} />
                <p className="text-sm text-muted">{b.specialty}</p>
              </div>
              <Badge tone={b.available ? "ok" : "danger"}>{b.available ? "available" : "down"}</Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted">Accuracy</dt>
                <dd className="font-mono">{formatPct(b.accuracy)}</dd>
              </div>
              <div>
                <dt className="text-muted">Latency</dt>
                <dd className="font-mono">{b.latencyMs}ms</dd>
              </div>
              <div>
                <dt className="text-muted">Cost</dt>
                <dd className="font-mono">{b.cost}</dd>
              </div>
              <div>
                <dt className="text-muted">Tokens</dt>
                <dd className="font-mono">{formatCompact(b.tokensUsed)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">{b.capabilities.join(" · ")}</p>
            <Button
              className="mt-3"
              size="sm"
              variant={b.available ? "secondary" : "default"}
              onClick={() => useOrgStore.getState().toggleBrain(b.id, !b.available)}
            >
              {b.available ? "Disable brain" : "Enable brain"}
            </Button>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelTitle kicker="Budgets" title="Resource management" />
        <p className="font-mono text-sm tabular-nums">
          {formatCompact(budgets.tokens)} / {formatCompact(budgets.tokenCap)} tokens · {budgets.apiCalls} /{" "}
          {budgets.apiCap} CEO API calls
        </p>
        <div className="mt-3 h-1 rounded-full bg-card-elevated">
          <div
            className="h-1 rounded-full bg-accent"
            style={{ width: `${Math.min(100, (budgets.tokens / budgets.tokenCap) * 100)}%` }}
          />
        </div>
      </Panel>

      <Panel>
        <PanelTitle kicker="Fault injection" title="Resilience drills" />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["modelFailure", "Model failure"],
              ["providerFailure", "Provider failure"],
              ["toolFailure", "Tool failure"],
              ["rateLimit", "Rate limit"],
              ["badOutput", "Bad output"],
              ["failedDeploy", "Failed deploy"],
            ] as const
          ).map(([k, label]) => (
            <Button
              key={k}
              size="sm"
              variant={faults[k] ? "danger" : "secondary"}
              onClick={() => useOrgStore.getState().injectFault({ [k]: !faults[k] })}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Injected faults exercise fallback and recovery without resetting task state.
        </p>
      </Panel>
    </div>
  );
}
