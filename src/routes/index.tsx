import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Database, CheckCircle2, AlertCircle, Clock, ArrowUpRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — UBID" },
      { name: "description", content: "Overview of records, matches and AI activity in UBID." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Total Records", value: "1,284,930", delta: "+2.4%", icon: Database, accent: "text-neon-blue", glow: "shadow-glow-blue" },
  { label: "Matched Businesses", value: "846,201", delta: "+5.1%", icon: CheckCircle2, accent: "text-success", glow: "shadow-glow-blue" },
  { label: "Unmatched Records", value: "312,544", delta: "-1.2%", icon: AlertCircle, accent: "text-destructive", glow: "shadow-glow-orange" },
  { label: "Pending Reviews", value: "4,829", delta: "+312", icon: Clock, accent: "text-primary", glow: "shadow-glow-orange" },
];

const barData = [
  { day: "Mon", matched: 420, review: 90 },
  { day: "Tue", matched: 510, review: 120 },
  { day: "Wed", matched: 380, review: 70 },
  { day: "Thu", matched: 640, review: 140 },
  { day: "Fri", matched: 720, review: 160 },
  { day: "Sat", matched: 290, review: 60 },
  { day: "Sun", matched: 180, review: 40 },
];

const pieData = [
  { name: "Matched", value: 66, color: "var(--neon-blue)" },
  { name: "Review", value: 22, color: "var(--neon-orange)" },
  { name: "Conflict", value: 12, color: "oklch(0.62 0.24 27)" },
];

const activity = [
  { who: "AI Engine", what: "Resolved 1,204 entities", when: "2m ago", tag: "auto" },
  { who: "R. Sharma", what: "Approved 18 reviews in queue", when: "9m ago", tag: "review" },
  { who: "GST Dept.", what: "Uploaded gst_q3_2026.csv (84,210 rows)", when: "31m ago", tag: "upload" },
  { who: "AI Engine", what: "Flagged 47 conflicts for review", when: "1h ago", tag: "alert" },
  { who: "MCA Dept.", what: "Connected new data source", when: "3h ago", tag: "system" },
];

function Dashboard() {
  return (
    <PageShell
      title="Identity Resolution Overview"
      subtitle="A real-time snapshot of unified records across all connected government departments."
      actions={
        <div className="glass-card flex items-center gap-2 px-4 py-2 text-xs">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Last sync:</span>
          <span className="font-medium">just now</span>
        </div>
      }
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
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
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                <span className="text-success">{s.delta}</span>
                <span>vs last week</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="glass-card lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Weekly Resolution Activity</h2>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="day" stroke="oklch(0.7 0.02 260)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.02 260)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.04 260)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 8,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="matched" fill="var(--neon-blue)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="review" fill="var(--neon-orange)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase text-muted-foreground">Match Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={4}>
                  {pieData.map((d) => (
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
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            {pieData.map((d) => (
              <div key={d.name}>
                <div className="mx-auto h-1.5 w-8 rounded-full" style={{ background: d.color }} />
                <p className="mt-1.5 text-muted-foreground">{d.name}</p>
                <p className="font-semibold">{d.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Recent Activity</h2>
          <button className="text-xs text-primary hover:underline">View all</button>
        </div>
        <ul className="divide-y divide-border">
          {activity.map((a, i) => (
            <li key={i} className="flex items-center justify-between py-3 text-sm animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
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
