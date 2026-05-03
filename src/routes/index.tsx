import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Database, CheckCircle2, AlertCircle, Clock, ArrowUpRight, Sparkles, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { API_BASE, getMatches, getStats, type MatchQueueItem, type StatsResponse } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — UBID" },
      { name: "description", content: "Overview of records, matches and AI activity in UBID." },
    ],
  }),
  component: Dashboard,
});

function fmt(n: number): string {
  return n.toLocaleString();
}

function aggregateMatches(matches: MatchQueueItem[]) {
  let auto = 0;
  let human = 0;
  let none = 0;
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const m of matches) {
    if (m.tier === "AUTO_LINK") auto += 1;
    else if (m.tier === "HUMAN_REVIEW") human += 1;
    else none += 1;
    if (m.status === "pending") pending += 1;
    else if (m.status === "approved") approved += 1;
    else rejected += 1;
  }
  const tierBars = [
    { name: "Auto-link", count: auto, fill: "var(--neon-blue)" },
    { name: "Human review", count: human, fill: "var(--neon-orange)" },
    { name: "No match", count: none, fill: "oklch(0.62 0.24 27)" },
  ];
  const statusPie = [
    { name: "Pending", value: pending, color: "var(--neon-orange)" },
    { name: "Approved", value: approved, color: "var(--neon-blue)" },
    { name: "Rejected", value: rejected, color: "oklch(0.62 0.24 27)" },
  ].filter((d) => d.value > 0);

  const pieForChart =
    statusPie.length > 0
      ? statusPie
      : [{ name: "No pairs in queue", value: 1, color: "oklch(0.45 0.02 260)" }];

  return { tierBars, statusPie: pieForChart, totalPairs: matches.length };
}

function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [charts, setCharts] = useState<ReturnType<typeof aggregateMatches> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    const settled = await Promise.allSettled([getStats(), getMatches()]);

    if (settled[0].status === "fulfilled") {
      setStats(settled[0].value);
    } else {
      setStats(null);
      toast.error(settled[0].reason instanceof Error ? settled[0].reason.message : "Could not load /stats");
    }

    if (settled[1].status === "fulfilled") {
      setCharts(aggregateMatches(settled[1].value.matches));
    } else {
      setCharts(null);
      toast.error(settled[1].reason instanceof Error ? settled[1].reason.message : "Could not load /matches");
    }

    setUpdatedAt(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = stats
    ? [
        { label: "Total records (last upload)", value: fmt(stats.total_records), delta: "", icon: Database, accent: "text-neon-blue", glow: "shadow-glow-blue" },
        { label: "UBIDs assigned", value: fmt(stats.ubids_assigned), delta: "", icon: CheckCircle2, accent: "text-success", glow: "shadow-glow-blue" },
        { label: "Pending human review", value: fmt(stats.pending_review), delta: "", icon: Clock, accent: "text-primary", glow: "shadow-glow-orange" },
        { label: "Rejected pairs", value: fmt(stats.rejected), delta: `Auto-linked: ${stats.auto_linked}`, icon: AlertCircle, accent: "text-destructive", glow: "shadow-glow-orange" },
      ]
    : [
        { label: "Total Records", value: "—", delta: "API offline?", icon: Database, accent: "text-neon-blue", glow: "shadow-glow-blue" },
        { label: "UBIDs assigned", value: "—", delta: "", icon: CheckCircle2, accent: "text-success", glow: "shadow-glow-blue" },
        { label: "Pending review", value: "—", delta: "", icon: Clock, accent: "text-primary", glow: "shadow-glow-orange" },
        { label: "Rejected", value: "—", delta: "", icon: AlertCircle, accent: "text-destructive", glow: "shadow-glow-orange" },
      ];

  const activity = stats
    ? [
        { who: "API", what: `GET /stats · total_records=${stats.total_records}`, when: updatedAt || "now", tag: "system" },
        { who: "UBID", what: `${stats.ubids_assigned} UBIDs in registry`, when: updatedAt || "now", tag: "auto" },
        { who: "Queue", what: `${stats.pending_review} pairs need human review`, when: updatedAt || "now", tag: "review" },
        ...(charts
          ? [{ who: "Matches", what: `${charts.totalPairs} candidate pairs loaded from /matches`, when: updatedAt || "now", tag: "upload" }]
          : []),
      ]
    : [
        { who: "API", what: "Start backend (uvicorn) and upload CSVs", when: "—", tag: "alert" },
        { who: "UBID", what: "No stats loaded yet", when: "—", tag: "system" },
      ];

  const hasChartData = charts && charts.totalPairs > 0;

  return (
    <PageShell
      title="Identity Resolution Overview"
      subtitle={`Live KPIs from ${API_BASE}/stats and charts from ${API_BASE}/matches (current SQLite queue).`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="glass-card inline-flex items-center gap-2 px-4 py-2 text-xs hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <div className="glass-card flex items-center gap-2 px-4 py-2 text-xs">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">API:</span>
            <span className="font-medium">{updatedAt ? `synced ${updatedAt}` : loading ? "loading…" : "idle"}</span>
          </div>
        </div>
      }
    >
      {!stats && !loading && (
        <p className="mb-4 text-sm text-muted-foreground">
          No stats yet — run the FastAPI server, then{" "}
          <Link to="/upload" className="text-primary hover:underline">
            upload two CSVs
          </Link>
          .
        </p>
      )}

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="glass-card group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl ${s.glow}`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{s.value}</p>
                </div>
                <div className={`grid h-10 w-10 place-items-center rounded-lg bg-white/5 ${s.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              {s.delta ? (
                <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  <span className="text-success">{s.delta}</span>
                </div>
              ) : (
                <div className="mt-4 text-xs text-muted-foreground">Live from SQLite via API</div>
              )}
            </div>
          );
        })}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Candidate pairs by tier</h2>
            <span className="text-xs text-muted-foreground">{charts ? `${charts.totalPairs} pairs` : "—"}</span>
          </div>
          {!charts && !loading && <p className="text-sm text-muted-foreground">Could not load match queue.</p>}
          {loading && charts === null && (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading charts…
            </div>
          )}
          {charts && !hasChartData && !loading && (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <p>No pairs in the queue yet.</p>
              <Link to="/upload" className="text-primary hover:underline">
                Upload two CSVs
              </Link>
            </div>
          )}
          {charts && hasChartData && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.tierBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                  <XAxis dataKey="name" stroke="oklch(0.7 0.02 260)" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="oklch(0.7 0.02 260)" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.18 0.04 260)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 8,
                    }}
                    formatter={(value: number) => [value, "Pairs"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Pairs" radius={[6, 6, 0, 0]}>
                    {charts.tierBars.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pairs by status</h2>
          {!charts && !loading && <p className="text-sm text-muted-foreground">No data.</p>}
          {loading && charts === null && (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            </div>
          )}
          {charts && !hasChartData && !loading && (
            <div className="flex h-72 items-center justify-center text-center text-xs text-muted-foreground">Upload to see status mix</div>
          )}
          {charts && hasChartData && (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.statusPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {charts.statusPie.map((d) => (
                        <Cell key={d.name} fill={d.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.04 260)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-center text-xs">
                {charts.statusPie.map((d) => (
                  <div key={d.name}>
                    <div className="mx-auto h-1.5 w-8 rounded-full" style={{ background: d.color }} />
                    <p className="mt-1.5 text-muted-foreground">{d.name}</p>
                    <p className="font-semibold">{d.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</h2>
          <Link to="/matching" className="text-xs text-primary hover:underline">
            View matches
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {activity.map((a, i) => (
            <li key={`${a.what}-${i}`} className="flex items-center justify-between py-3 text-sm animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3">
                <Tag tag={a.tag} />
                <div>
                  <p className="font-medium">{a.what}</p>
                  <p className="text-xs text-muted-foreground">{a.who}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{a.when}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

function Tag({ tag }: { tag: string }): ReactNode {
  const map: Record<string, string> = {
    auto: "bg-accent/15 text-accent",
    review: "bg-primary/15 text-primary",
    upload: "bg-success/15 text-success",
    alert: "bg-destructive/15 text-destructive",
    system: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-md text-[10px] uppercase tracking-wider ${map[tag] ?? map.system}`}>
      {tag.slice(0, 3)}
    </span>
  );
}
