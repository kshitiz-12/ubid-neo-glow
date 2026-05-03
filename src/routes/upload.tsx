import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCallback, useState } from "react";
import { UploadCloud, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadCsvPair, API_BASE } from "@/lib/api";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Data — UBID" },
      { name: "description", content: "Upload CSV datasets from government departments into the UBID resolution engine." },
    ],
  }),
  component: UploadPage,
});

type Row = Record<string, string>;

function parseCsv(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1, 21).map((l) => {
    const cells = l.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
  return { headers, rows };
}

function UploadPage() {
  const [dragTarget, setDragTarget] = useState<"a" | "b" | null>(null);
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<{ headers: string[]; rows: Row[] }>({ headers: [], rows: [] });
  const [previewB, setPreviewB] = useState<{ headers: string[]; rows: Row[] }>({ headers: [], rows: [] });
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  const handleFile = useCallback(async (f: File, side: "a" | "b") => {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    const text = await f.text();
    const prev = parseCsv(text);
    if (side === "a") {
      setFileA(f);
      setPreviewA(prev);
    } else {
      setFileB(f);
      setPreviewB(prev);
    }
    setDone(false);
    setLastSummary(null);
    toast.success(`${f.name} loaded (${side === "a" ? "Dept A" : "Dept B"}) — ${(f.size / 1024).toFixed(1)} KB`);
  }, []);

  const onDrop = (e: React.DragEvent, side: "a" | "b") => {
    e.preventDefault();
    setDragTarget(null);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f, side);
  };

  const upload = async () => {
    if (!fileA || !fileB) {
      toast.error("Select both CSV files (Department A and Department B).");
      return;
    }
    setUploading(true);
    setDone(false);
    setLastSummary(null);
    try {
      const res = await uploadCsvPair(fileA, fileB);
      setDone(true);
      setLastSummary(
        `${res.candidate_pairs} candidate pairs · AUTO_LINK: ${res.tier_counts.AUTO_LINK ?? 0}, ` +
          `HUMAN_REVIEW: ${res.tier_counts.HUMAN_REVIEW ?? 0}, NO_MATCH: ${res.tier_counts.NO_MATCH ?? 0}`,
      );
      toast.success(`Pipeline complete — ${res.total_records} records ingested`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clear = (side?: "a" | "b") => {
    if (!side || side === "a") {
      setFileA(null);
      setPreviewA({ headers: [], rows: [] });
    }
    if (!side || side === "b") {
      setFileB(null);
      setPreviewB({ headers: [], rows: [] });
    }
    setDone(false);
    setLastSummary(null);
  };

  const dropClass = (side: "a" | "b") =>
    `glass-card relative grid place-items-center p-8 text-center transition-all ${
      dragTarget === side ? "border-primary shadow-glow-orange" : ""
    }`;

  return (
    <PageShell
      title="Upload Department Data"
      subtitle={`Pair two registers (e.g. shops vs factories). Files are sent to the API at ${API_BASE} — POST /upload.`}
    >
      <p className="mb-4 text-xs text-muted-foreground">
        Backend expects multipart fields <code className="rounded bg-white/10 px-1">dept_a</code> and{" "}
        <code className="rounded bg-white/10 px-1">dept_b</code>. After upload, open Matching or Review.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragTarget("a");
          }}
          onDragLeave={() => setDragTarget(null)}
          onDrop={(e) => onDrop(e, "a")}
          className={dropClass("a")}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Department A</p>
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-neon shadow-glow-blue">
            <UploadCloud className="h-6 w-6 text-background" />
          </div>
          <h3 className="text-sm font-semibold">CSV for dept A</h3>
          <p className="mt-1 text-xs text-muted-foreground">e.g. shop_establishment.csv</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition">
            Choose file
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0], "a")}
            />
          </label>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragTarget("b");
          }}
          onDragLeave={() => setDragTarget(null)}
          onDrop={(e) => onDrop(e, "b")}
          className={dropClass("b")}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Department B</p>
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-neon shadow-glow-orange">
            <UploadCloud className="h-6 w-6 text-background" />
          </div>
          <h3 className="text-sm font-semibold">CSV for dept B</h3>
          <p className="mt-1 text-xs text-muted-foreground">e.g. factories.csv</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition">
            Choose file
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0], "b")}
            />
          </label>
        </div>
      </div>

      {(fileA || fileB) && (
        <section className="glass-card mt-6 flex flex-wrap items-center justify-between gap-3 p-4 animate-slide-up">
          <div className="text-sm text-muted-foreground">
            {fileA && fileB ? (
              <span>
                Ready: <span className="font-medium text-foreground">{fileA.name}</span> +{" "}
                <span className="font-medium text-foreground">{fileB.name}</span>
              </span>
            ) : (
              <span>Select both files to enable upload.</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => clear()} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-white/5">
              Clear all
            </button>
            <button
              type="button"
              onClick={() => void upload()}
              disabled={uploading || !fileA || !fileB}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-neon px-5 py-2 text-sm font-semibold text-background shadow-glow-orange disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
              {uploading ? "Uploading…" : done ? "Done" : "Run pipeline"}
            </button>
            {done && (
              <Link to="/matching" className="text-xs font-medium text-primary hover:underline">
                View matches →
              </Link>
            )}
          </div>
        </section>
      )}

      {lastSummary && (
        <p className="mt-3 text-center text-xs text-muted-foreground animate-fade-in">{lastSummary}</p>
      )}

      {fileA && (
        <PreviewTable title="Department A preview" file={fileA} preview={previewA} onClear={() => clear("a")} />
      )}
      {fileB && (
        <PreviewTable title="Department B preview" file={fileB} preview={previewB} onClear={() => clear("b")} />
      )}
    </PageShell>
  );
}

function PreviewTable({
  title,
  file,
  preview,
  onClear,
}: {
  title: string;
  file: File;
  preview: { headers: string[]; rows: Row[] };
  onClear: () => void;
}) {
  return (
    <section className="glass-card mt-6 p-5 animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-accent/15 text-accent">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024).toFixed(1)} KB · {preview.rows.length} rows previewed
            </p>
          </div>
        </div>
        <button type="button" onClick={onClear} className="rounded-md p-2 text-muted-foreground hover:bg-white/5" aria-label="Clear">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {preview.headers.map((h) => (
                <th key={h} className="px-4 py-2.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {preview.rows.map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                {preview.headers.map((h) => (
                  <td key={h} className="px-4 py-2.5 whitespace-nowrap text-foreground/90">
                    {r[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
