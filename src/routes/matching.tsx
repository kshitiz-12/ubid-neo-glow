import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useState } from "react";
import { Sparkles, Loader2, RotateCw } from "lucide-react";

export const Route = createFileRoute("/matching")({
  head: () => ({
    meta: [
      { title: "AI Matching — UBID" },
      { name: "description", content: "Run the UBID AI engine to match and dedupe business records across datasets." },
    ],
  }),
  component: MatchingPage,
});

type Result = {
  a: string;
  b: string;
  score: number;
  status: "Matched" | "Review" | "Rejected";
};

const sample: Result[] = [
  { a: "Acme Industries Pvt Ltd", b: "ACME INDUSTRIES PRIVATE LIMITED", score: 0.98, status: "Matched" },
  { a: "Bharat Steel Co", b: "Bharath Steels Co.", score: 0.84, status: "Review" },
  { a: "Sunrise Traders", b: "Sun Rise Trader's", score: 0.79, status: "Review" },
  { a: "Vega Logistics LLP", b: "Vegga Logistic LLP", score: 0.72, status: "Review" },
  { a: "Zenith Foods", b: "Zen Foods International", score: 0.41, status: "Rejected" },
  { a: "Orion Tech Solutions", b: "Orion Technology Solutions Pvt", score: 0.93, status: "Matched" },
  { a: "Krishna Mills", b: "Krishna Mils & Co", score: 0.88, status: "Matched" },
  { a: "Delta Agro", b: "Delta Agriculture Holdings", score: 0.55, status: "Review" },
];

function scoreColor(s: number) {
  if (s >= 0.9) return "text-success border-success/40 bg-success/10";
  if (s >= 0.7) return "text-warning border-warning/40 bg-warning/10";
  return "text-destructive border-destructive/40 bg-destructive/10";
}

function statusBadge(s: Result["status"]) {
  const map = {
    Matched: "bg-success/15 text-success border-success/30",
    Review: "bg-warning/15 text-warning border-warning/30",
    Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  } as const;
  return map[s];
}

function MatchingPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const run = async () => {
    setRunning(true);
    setResults([]);
    await new Promise((r) => setTimeout(r, 1800));
    setResults(sample);
    setRunning(false);
  };

  return (
    <PageShell
      title="AI Matching Engine"
      subtitle="Run probabilistic and embedding-based matching across your loaded datasets to surface duplicate entities."
      actions={
        <button
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-background shadow-glow-orange disabled:opacity-70"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {running ? "Running AI Matching..." : "Run AI Matching"}
        </button>
      }
    >
      {running && (
        <div className="glass-card grid place-items-center p-16 text-center animate-fade-in">
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-neon animate-pulse-glow">
            <Sparkles className="h-9 w-9 text-background" />
          </div>
          <p className="mt-6 text-lg font-semibold">Resolving entities…</p>
          <p className="mt-1 text-sm text-muted-foreground">Comparing names, addresses, identifiers across 1.2M records</p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Embedding similarity
            <span className="mx-2">·</span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Fuzzy match
            <span className="mx-2">·</span>
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Cross-ref
          </div>
        </div>
      )}

      {!running && results.length === 0 && (
        <div className="glass-card p-12 text-center text-sm text-muted-foreground">
          Click <span className="text-primary font-medium">Run AI Matching</span> to begin entity resolution.
        </div>
      )}

      {!running && results.length > 0 && (
        <div className="glass-card overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Match Candidates</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{results.length} pairs surfaced</p>
            </div>
            <button onClick={run} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <RotateCw className="h-3.5 w-3.5" /> Re-run
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Business A</th>
                  <th className="px-5 py-3">Business B</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="px-5 py-3 font-medium">{r.a}</td>
                    <td className="px-5 py-3 text-foreground/90">{r.b}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex min-w-14 justify-center rounded-md border px-2 py-0.5 text-xs font-mono ${scoreColor(r.score)}`}>
                          {(r.score * 100).toFixed(0)}%
                        </span>
                        <div className="h-1.5 w-24 rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-neon"
                            style={{ width: `${r.score * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}
