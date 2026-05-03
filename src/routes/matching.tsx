import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCallback, useState } from "react";
import { Sparkles, Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { API_BASE, getMatches, type MatchQueueItem, type MatchTier } from "@/lib/api";

export const Route = createFileRoute("/matching")({
  head: () => ({
    meta: [
      { title: "AI Matching — UBID" },
      { name: "description", content: "Run the UBID AI engine to match and dedupe business records across datasets." },
    ],
  }),
  component: MatchingPage,
});

function rawCell(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = raw[k];
    if (v === null || v === undefined) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  }
  return "";
}

function rawLabel(m: MatchQueueItem): { a: string; b: string } {
  const ra = m.record_a.raw as Record<string, unknown>;
  const rb = m.record_b.raw as Record<string, unknown>;
  const a = rawCell(ra, "business_name", "name", "reg_id") || m.record_a.record_id;
  const b = rawCell(rb, "business_name", "name", "factory_id") || m.record_b.record_id;
  return { a, b };
}

function displayStatus(m: MatchQueueItem): "Matched" | "Review" | "Rejected" | "Auto-link" | "No match" {
  if (m.status === "approved") return "Matched";
  if (m.status === "rejected") return "Rejected";
  if (m.tier === "AUTO_LINK") return "Auto-link";
  if (m.tier === "HUMAN_REVIEW") return "Review";
  return "No match";
}

function scoreFraction(score: number): number {
  return Math.min(1, Math.max(0, score / 100));
}

function scoreColor(s: number) {
  if (s >= 0.9) return "text-success border-success/40 bg-success/10";
  if (s >= 0.6) return "text-warning border-warning/40 bg-warning/10";
  return "text-destructive border-destructive/40 bg-destructive/10";
}

function statusBadge(s: ReturnType<typeof displayStatus>) {
  const map = {
    Matched: "bg-success/15 text-success border-success/30",
    "Auto-link": "bg-accent/15 text-accent border-accent/30",
    Review: "bg-warning/15 text-warning border-warning/30",
    Rejected: "bg-destructive/15 text-destructive border-destructive/30",
    "No match": "bg-muted text-muted-foreground border-border",
  } as const;
  return map[s];
}

function MatchingPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MatchQueueItem[]>([]);
  const [tierFilter, setTierFilter] = useState<MatchTier | "ALL">("ALL");

  const run = useCallback(async () => {
    setRunning(true);
    try {
      const tier = tierFilter === "ALL" ? undefined : tierFilter;
      const { matches } = await getMatches(tier);
      setResults(matches);
      if (!matches.length) toast.message("No pairs in queue — upload two CSVs on Upload first.");
      else toast.success(`Loaded ${matches.length} pair(s) from API`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load matches");
      setResults([]);
    } finally {
      setRunning(false);
    }
  }, [tierFilter]);

  return (
    <PageShell
      title="AI Matching Engine"
      subtitle={`Live data from GET /matches on ${API_BASE}. Upload CSVs first, then load pairs here.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as MatchTier | "ALL")}
            className="rounded-md border border-border bg-background/80 px-3 py-2 text-xs text-foreground"
          >
            <option value="ALL">All tiers</option>
            <option value="AUTO_LINK">AUTO_LINK</option>
            <option value="HUMAN_REVIEW">HUMAN_REVIEW</option>
            <option value="NO_MATCH">NO_MATCH</option>
          </select>
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-background shadow-glow-orange disabled:opacity-70"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {running ? "Loading…" : "Load matches from API"}
          </button>
        </div>
      }
    >
      {running && (
        <div className="glass-card grid place-items-center p-16 text-center animate-fade-in">
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-neon animate-pulse-glow">
            <Sparkles className="h-9 w-9 text-background" />
          </div>
          <p className="mt-6 text-lg font-semibold">Fetching match queue…</p>
          <p className="mt-1 text-sm text-muted-foreground">Reading scores, tiers, and record pairs from the backend</p>
        </div>
      )}

      {!running && results.length === 0 && (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground">
          Click <span className="font-medium text-primary">Load matches from API</span> after you have run{" "}
          <span className="text-foreground">POST /upload</span> with two CSV files.
        </div>
      )}

      {!running && results.length > 0 && (
        <div className="glass-card overflow-hidden animate-slide-up">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Match candidates</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{results.length} pair(s)</p>
            </div>
            <button type="button" onClick={() => void run()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <RotateCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Dept A</th>
                  <th className="px-5 py-3">Dept B</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Tier</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((m) => {
                  const { a, b } = rawLabel(m);
                  const sf = scoreFraction(m.score);
                  const st = displayStatus(m);
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="max-w-[220px] truncate px-5 py-3 font-medium" title={a}>
                        {a}
                      </td>
                      <td className="max-w-[220px] truncate px-5 py-3 text-foreground/90" title={b}>
                        {b}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex min-w-14 justify-center rounded-md border px-2 py-0.5 font-mono text-xs ${scoreColor(sf)}`}>
                            {m.score.toFixed(1)}
                          </span>
                          <div className="h-1.5 w-24 rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-gradient-neon" style={{ width: `${sf * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md border border-border px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">{m.tier}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(st)}`}>{st}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
