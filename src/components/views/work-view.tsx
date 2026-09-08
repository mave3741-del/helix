import { QUALITY_GATES } from "@/org/constitution";
import { taskTone } from "@/components/status";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { timeAgo } from "@/lib/utils";
import { useOrgStore } from "@/store/org-store";

export function WorkView() {
  const epoch = useOrgStore((s) => s.epoch);
  const order = useOrgStore((s) => s.taskOrder);
  const tasks = useOrgStore((s) => s.tasks);
  const selected = useOrgStore((s) => s.selectedTaskId);
  const objectives = useOrgStore((s) => s.objectives);
  const messages = useOrgStore((s) => s.messages);
  void epoch;

  const list = order.map((id) => tasks[id]).filter(Boolean);
  const task = (selected && tasks[selected]) || list[0];

  const queues = [
    ["ceo", objectives.filter((o) => o.status === "strategy" || o.status === "intake").length],
    ["worker", list.filter((t) => t.status === "queued" || t.status === "assigned" || t.status === "in_progress").length],
    ["qc", list.filter((t) => t.status === "qc").length],
    ["testing", list.filter((t) => t.status === "testing").length],
    ["recovery", list.filter((t) => t.status === "failed").length],
    ["approval", list.filter((t) => t.status === "awaiting_approval").length],
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Task system</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">Persistent work, not chat.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Ownership locks prevent duplicate work. Queues carry priority, retry, and cancellation.
          Structured messages replace agent chatter.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {queues.map(([name, n]) => (
          <Panel key={name} className="p-3">
            <p className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">{name}</p>
            <p className="mt-1 font-mono text-xl tabular-nums">{n}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,1fr)]">
        <Panel className="p-0 sm:p-0">
          {list.length === 0 ? (
            <p className="p-5 text-sm text-muted">No tasks. Dispatch an objective from Command.</p>
          ) : (
            <ul>
              {list.slice(0, 40).map((t) => (
                <li key={t.id}>
                  <button
                    className="flex w-full items-start justify-between gap-3 border-b border-border px-4 py-3 text-left hover:bg-card-elevated"
                    onClick={() => useOrgStore.getState().selectTask(t.id)}
                  >
                    <span>
                      <span className="block text-sm">{t.title}</span>
                      <span className="font-mono text-[10px] text-muted">
                        {t.id} · {t.departmentId} · gate {t.gate}/7
                      </span>
                    </span>
                    <Badge tone={taskTone(t.status)}>{t.status}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {task ? (
          <Panel>
            <PanelTitle kicker={task.id} title={task.title} />
            <Badge tone={taskTone(task.status)}>{task.status}</Badge>
            <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted">{task.description}</p>
            <div className="mt-4 space-y-1.5">
              {QUALITY_GATES.map((g, i) => (
                <div key={g} className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      task.gate > i ? "size-1.5 rounded-full bg-ok" : "size-1.5 rounded-full bg-muted/40"
                    }
                  />
                  <span className={task.gate > i ? "text-foreground" : "text-muted"}>{g}</span>
                </div>
              ))}
            </div>
            {task.output ? (
              <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-card-elevated p-3 font-mono text-[11px] leading-relaxed text-muted">
                {task.output}
              </pre>
            ) : null}
            <p className="mt-3 text-xs text-muted">
              Brain {task.brainId}
              {task.fallbacks.length ? ` → ${task.fallbacks.join(" → ")}` : ""} · claim {task.claim}
            </p>
            {task.qcNotes ? <p className="mt-2 text-xs text-warn">{task.qcNotes}</p> : null}
          </Panel>
        ) : null}
      </div>

      <Panel>
        <PanelTitle kicker="Communications" title="Structured messages only" />
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No chatter. Messages appear when work is assigned.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-auto">
            {[...messages].slice(-20).reverse().map((m) => (
              <li key={m.id} className="text-xs">
                <span className="font-mono text-muted">
                  {timeAgo(m.at)} · {m.kind} · {m.from} → {m.to}
                </span>
                <span className="mt-0.5 block text-muted">{m.body.slice(0, 180)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
