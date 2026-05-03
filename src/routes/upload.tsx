import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCallback, useState } from "react";
import { UploadCloud, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

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
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: Row[] }>({ headers: [], rows: [] });
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setFile(f);
    setDone(false);
    const text = await f.text();
    setPreview(parseCsv(text));
    toast.success(`${f.name} loaded — ${(f.size / 1024).toFixed(1)} KB`);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1600));
    setUploading(false);
    setDone(true);
    toast.success("Dataset queued for AI ingestion");
  };

  const clear = () => {
    setFile(null);
    setPreview({ headers: [], rows: [] });
    setDone(false);
  };

  return (
    <PageShell
      title="Upload Department Data"
      subtitle="Drop in a CSV from MCA, GST, PAN or any agency. UBID will normalize, deduplicate, and link records to a unified ID."
    >
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`glass-card relative grid place-items-center p-12 text-center transition-all ${
          drag ? "border-primary shadow-glow-orange" : ""
        }`}
      >
        <div className={`mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-neon shadow-glow-blue ${drag ? "scale-110" : ""} transition-transform`}>
          <UploadCloud className="h-8 w-8 text-background" />
        </div>
        <h3 className="text-lg font-semibold">Drag & drop your CSV here</h3>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse — up to 50MB</p>
        <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
          Choose file
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      {file && (
        <section className="glass-card mt-6 p-5 animate-slide-up">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-accent/15 text-accent">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · {preview.rows.length} rows previewed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clear} className="rounded-md p-2 text-muted-foreground hover:bg-white/5" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={upload}
                disabled={uploading || done}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-neon px-5 py-2 text-sm font-semibold text-background shadow-glow-orange disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                {uploading ? "Uploading..." : done ? "Uploaded" : "Upload to UBID"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} className="px-4 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    {preview.headers.map((h) => (
                      <td key={h} className="px-4 py-2.5 whitespace-nowrap text-foreground/90">{r[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageShell>
  );
}
