import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useState } from "react";
import { Check, X, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

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
type Pair = { id: string; score: number; fields: Field[] };

const queue: Pair[] = [
  {
    id: "UBID-CAND-00481",
    score: 0.86,
    fields: [
      { label: "Business Name", a: "Acme Industries Pvt Ltd", b: "ACME Industries Private Limited", diff: "partial" },
      { label: "Address", a: "12, MG Road, Bengaluru 560001", b: "12 M.G. Rd, Bangalore - 560001", diff: "partial" },
      { label: "PAN", a: "AABCA1234F", b: "AABCA1234F", diff: "match" },
      { label: "GST", a: "29AABCA1234F1Z5", b: "29AABCA1234F2Z5", diff: "conflict" },
    ],
  },
  {
    id: "UBID-CAND-00482",
    score: 0.74,
    fields: [
      { label: "Business Name", a: "Bharat Steel Co", b: "Bharath Steels Company", diff: "partial" },
      { label: "Address", a: "Plot 9, GIDC, Surat", b: "Plot No.9, GIDC Phase II, Surat", diff: "partial" },
      { label: "PAN", a: "AAACB5566Q", b: "AAACB5566Q", diff: "match" },
      { label: "GST", a: "24AAACB5566Q1ZP", b: "—", diff: "conflict" },
    ],
  },
  {
    id: "UBID-CAND-00483",
    score: 0.91,
    fields: [
      { label: "Business Name", a: "Orion Tech Solutions", b: "Orion Tech Solutions Pvt Ltd", diff: "partial" },
      { label: "Address", a: "5th Flr, Cyber Hub, Gurugram", b: "5F Cyber Hub, Gurgaon", diff: "partial" },
      { label: "PAN", a: "AAFCO9988J", b: "AAFCO9988J", diff: "match" },
      { label: "GST", a: "06AAFCO9988J1Z2", b: "06AAFCO9988J1Z2", diff: "match" },
    ],
  },
];

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

function ReviewPage() {
  const [idx, setIdx] = useState(0);
  const [decided, setDecided] = useState<Record<string, "approved" | "rejected">>({});
  const pair = queue[idx];

  const next = () => setIdx((i) => Math.min(i + 1, queue.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  const approve = () => {
    setDecided((d) => ({ ...d, [pair.id]: "approved" }));
    toast.success(`${pair.id} merged into a single UBID`);
    if (idx < queue.length - 1) setTimeout(next, 250);
  };
  const reject = () => {
    setDecided((d) => ({ ...d, [pair.id]: "rejected" }));
    toast.error(`${pair.id} marked as separate entities`);
    if (idx < queue.length - 1) setTimeout(next, 250);
  };

  const decision = decided[pair.id];

  return (
    <PageShell
      title="Review Queue"
      subtitle="Side-by-side comparison of ambiguous candidates. Approve to merge into a single UBID, reject to keep separate."
      actions={
        <div className="glass-card flex items-center gap-3 px-4 py-2 text-xs">
          <span className="text-muted-foreground">Pending</span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{queue.length - Object.keys(decided).length}</span>
        </div>
      }
    >
      <div className="glass-card mb-4 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-semibold">{pair.id}</p>
            <p className="text-xs text-muted-foreground">Confidence {(pair.score * 100).toFixed(0)}% · {idx + 1} of {queue.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} disabled={idx === 0} className="rounded-md border border-border p-1.5 hover:bg-white/5 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} disabled={idx === queue.length - 1} className="rounded-md border border-border p-1.5 hover:bg-white/5 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(["A", "B"] as const).map((side) => (
          <div key={side} className="glass-card p-5 animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Record {side}</h3>
              <span className="text-xs text-muted-foreground">Source: {side === "A" ? "GST Dept." : "MCA Dept."}</span>
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
            onClick={reject}
            className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 transition"
          >
            <X className="h-4 w-4" /> Reject
          </button>
          <button
            onClick={approve}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-background shadow-glow-orange hover:opacity-90 transition"
          >
            <Check className="h-4 w-4" /> Approve & Merge
          </button>
        </div>
      </div>

      {decision && (
        <p className="mt-3 text-center text-xs text-muted-foreground animate-fade-in">
          Last decision: <span className={decision === "approved" ? "text-success" : "text-destructive"}>{decision}</span>
        </p>
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
