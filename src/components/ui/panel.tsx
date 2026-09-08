import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelTitle({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        {kicker ? (
          <p className="mb-1 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            {kicker}
          </p>
        ) : null}
        <h2 className="text-sm font-medium tracking-tight text-foreground">{title}</h2>
      </div>
      {action}
    </header>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
