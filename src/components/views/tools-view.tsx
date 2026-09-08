import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelTitle } from "@/components/ui/panel";
import { runAuthorizedTool } from "@/runtime/tools/server";
import { TOOL_SPECS } from "@/runtime/tools/catalog";
import { useOrgStore } from "@/store/org-store";

export function ToolsView() {
  const epoch = useOrgStore((s) => s.epoch);
  const toolRuns = useOrgStore((s) => s.runtime?.toolRuns ?? 0);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("https://example.com");
  void epoch;

  async function run(label: string, job: Parameters<typeof runAuthorizedTool>[0]["data"]) {
    setBusy(true);
    try {
      const res = await runAuthorizedTool({ data: job });
      const line = `${res.ok ? "PASS" : "FAIL"} ${label}: ${res.output.slice(0, 280)}`;
      setLog((prev) => [line, ...prev].slice(0, 12));
      useOrgStore.getState().recordTool(res.ok, res.evidence, res.output);
    } catch (e) {
      setLog((prev) => [`FAIL ${label}: ${e instanceof Error ? e.message : "error"}`, ...prev].slice(0, 12));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Tool runtime</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">Authorized work, not unrestricted shell.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Tools run in a sandbox workspace. Unimplemented tools are labeled as such. Web pages are
          untrusted data, never instructions. {toolRuns} recorded runs this session.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TOOL_SPECS.map((t) => (
          <Panel key={t.name}>
            <div className="flex items-start justify-between gap-2">
              <PanelTitle kicker={t.category} title={t.name} />
              <Badge tone={!t.implemented ? "danger" : t.runtimeVerified || toolRuns > 0 && t.implemented ? "ok" : "live"}>
                {!t.implemented ? "architecture" : t.runtimeVerified ? "runtime-verified" : "implemented"}
              </Badge>
            </div>
            <p className="text-sm text-muted">{t.description}</p>
            <p className="mt-2 font-mono text-[11px] text-muted">
              risk {t.risk} · approval {t.approval}
            </p>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelTitle kicker="Authorized workspace" title="Run a real coding task" />
        <p className="text-sm text-muted">
          Writes Fibonacci source and tests into the sandbox, then executes them. Success is whatever
          the test process actually returns — not a hardcoded green badge.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void run("fibonacci", { name: "coding.fibonacci" })}>
            Run Fibonacci project
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void run("list", { name: "fs.list", path: "." })}
          >
            List workspace
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          <Button
            variant="secondary"
            disabled={busy || !url.trim()}
            onClick={() => void run("fetch", { name: "web.fetch", url: url.trim() })}
          >
            Fetch as untrusted data
          </Button>
        </div>
        {log.length ? (
          <ul className="mt-4 space-y-2 font-mono text-xs text-muted">
            {log.map((line, i) => (
              <li key={i} className="rounded-md bg-card-elevated px-3 py-2 whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>
    </div>
  );
}
