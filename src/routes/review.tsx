import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCallback, useEffect, useState } from "react";
import { Check, X, ChevronLeft, ChevronRight, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { API_BASE, approveMatch, getMatches, rejectMatch, type MatchQueueItem } from "@/lib/api";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review Queue — UBID" },
      { name: "description", content: "Manually adjudicate ambiguous matches surfaced by the UBID AI engine." },
    ],
  }),
  component: ReviewPage,
});

type Diff = "match" | "partial" | "conflict";

type Field = { label: string; a: string; b: string; diff: Diff };

type Pair = { matchId: number; displayId: string; score: number; fields: Field[]; sourceA: string; sourceB: string };

const diffStyles: Record<Diff, string> = {
  match: "border-success/40 bg-success/10 text-success",
  partial: "border-warning/40 bg-warning/10 text-warning",
  conflict: "border-destructive/40 bg-destructive/10 text-destructive",
};

const diffLabel: Record<Diff, string> = {
  match: "Match",
  partial: "Partial",
  conflict: "Conflict",
};

function str(raw: Record<string, unknown>, key: string): string {
  const v = raw[key];
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function idDiff(a: string, b: string): Diff {
  const na = a.trim();
  const nb = b.trim();
  if (!na && !nb) return "match";
  if (!na || !nb) return "conflict";
  if (na === nb) return "match";
  return "conflict";
}

function textDiff(a: string, b: string): Diff {
  const na = a.trim();
  const nb = b.trim();
  if (!na && !nb) return "match";
  if (na === nb) return "match";
  if (na.toLowerCase() === nb.toLowerCase()) return "partial";
  return "partial";
}

function matchToPair(m: MatchQueueItem): Pair {
  const ra = m.record_a.raw;
  const rb = m.record_b.raw;
  const nameA = str(ra, "business_name") || str(ra, "name");
  const nameB = str(rb, "business_name") || str(rb, "name");
  const addrA = str(ra, "address");
  const addrB = str(rb, "address");
  const panA = str(ra, "pan");
  const panB = str(rb, "pan");
  const gstA = str(ra, "gstin");
  const gstB = str(rb, "gstin");

  const fields: Field[] = [
    { label: "Business Name", a: nameA || "—", b: nameB || "—", diff: textDiff(nameA, nameB) },
    { label: "Address", a: addrA || "—", b: addrB || "—", diff: textDiff(addrA, addrB) },
    { label: "PAN", a: panA || "—", b: panB || "—", diff: idDiff(panA, panB) },
    { label: "GSTIN", a: gstA || "—", b: gstB || "—", diff: idDiff(gstA, gstB) },
  ];

  return {
    matchId: m.id,
    displayId: `UBID-CAND-${String(m.id).padStart(5, "0")}`,
    score: m.score,
    fields,
    sourceA: m.record_a.source,
    sourceB: m.record_b.source,
  };
}

function ReviewPage() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<Pair[]>([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { matches } = await getMatches("HUMAN_REVIEW");
      const pending = matches.filter((m) => m.status === "pending");
      const pairs = pending.map(matchToPair);
      setQueue(pairs);
      setIdx((i) => (pairs.length ? Math.min(i, pairs.length - 1) : 0));
      if (!pairs.length) toast.message("No pending human-review pairs — upload CSVs or approve/reject items.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load queue");
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pair = queue[idx];
  const pendingCount = queue.length;

  const next = () => setIdx((i) => Math.min(i + 1, Math.max(queue.length - 1, 0)));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  const removePairFromQueue = (matchId: number) => {
    let nextIdx = 0;
    setQueue((prev) => {
      const oldIdx = prev.findIndex((p) => p.matchId === matchId);
      const nq = prev.filter((p) => p.matchId !== matchId);
      nextIdx = nq.length === 0 ? 0 : oldIdx >= nq.length ? nq.length - 1 : oldIdx;
      return nq;
    });
    setIdx(nextIdx);
  };

  const approve = async () => {
    if (!pair || busy) return;
    setBusy(true);
    try {
      const res = await approveMatch(pair.matchId);
      toast.success(`UBID ${res.ubid.slice(0, 8)}… assigned`);
      removePairFromQueue(pair.matchId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!pair || busy) return;
    setBusy(true);
    try {
      await rejectMatch(pair.matchId);
      toast.error(`${pair.displayId} marked as separate entities`);
      removePairFromQueue(pair.matchId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      title="Review Queue"
      subtitle={`Pending HUMAN_REVIEW pairs from ${API_BASE}. Approve assigns a UBID; reject keeps entities separate.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || busy}
            className="glass-card inline-flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
          <div className="glass-card flex items-center gap-3 px-4 py-2 text-xs">
            <span className="text-muted-foreground">Pending</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{pendingCount}</span>
          </div>
        </div>
      }
    >
      {loading && (
        <div className="glass-card flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading review queue…
        </div>
      )}

      {!loading && queue.length === 0 && (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          Nothing to review.{" "}
          <Link to="/upload" className="text-primary hover:underline">
            Upload two CSVs
          </Link>{" "}
          first, then check again.
        </div>
      )}

      {!loading && pair && (
        <>
          <div className="glass-card mb-4 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-semibold">{pair.displayId}</p>
                <p className="text-xs text-muted-foreground">
                  API id {pair.matchId} · Score {pair.score.toFixed(1)} · {idx + 1} of {queue.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={prev} disabled={idx === 0 || busy} className="rounded-md border border-border p-1.5 hover:bg-white/5 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={idx === queue.length - 1 || busy}
                className="rounded-md border border-border p-1.5 hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(
              [
                ["A", pair.sourceA] as const,
                ["B", pair.sourceB] as const,
              ] as const
            ).map(([side, src]) => (
              <div key={side} className="glass-card p-5 animate-slide-up">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Record {side}</h3>
                  <span className="text-xs text-muted-foreground">Source: {src}</span>
                </div>
                <dl className="space-y-3">
                  {pair.fields.map((f) => (
                    <div key={f.label} className={`rounded-lg border p-3 ${diffStyles[f.diff]}`}>
                      <dt className="flex items-center justify-between text-[10px] uppercase tracking-wider opacity-80">
                        <span>{f.label}</span>
                        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px]">{diffLabel[f.diff]}</span>
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{side === "A" ? f.a : f.b}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div className="glass-card mt-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Legend color="success" label="Match" />
              <Legend color="warning" label="Partial" />
              <Legend color="destructive" label="Conflict" />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void reject()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Reject
              </button>
              <button
                type="button"
                onClick={() => void approve()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-background shadow-glow-orange transition hover:opacity-90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve &amp; merge
              </button>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

function Legend({ color, label }: { color: "success" | "warning" | "destructive"; label: string }) {
  const map = {
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  } as const;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${map[color]}`} />
      {label}
    </span>
  );
}
