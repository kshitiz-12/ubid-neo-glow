/** UBID FastAPI base URL. Override with `VITE_API_URL` in `.env`. */
export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export type MatchTier = "AUTO_LINK" | "HUMAN_REVIEW" | "NO_MATCH";
export type MatchStatus = "pending" | "approved" | "rejected";

export type SourceRecord = { source: string; id: string };

export type RegistryRow = {
  ubid: string;
  created_at: string;
  status: string;
  confidence_score: number;
  source_records: SourceRecord[];
};

export type MatchBreakdown = {
  name_jaro_winkler: number;
  address_token_sort: number;
  pan: number;
  phone_last8: number;
  weights: { name: number; address: number; pan: number; phone: number };
};

export type MatchRecord = {
  source: string;
  record_id: string;
  normalized: {
    name_clean: string;
    address_clean: string;
    pincode: string;
    pan: string | null;
    gstin: string | null;
    phone_last8: string | null;
  };
  raw: Record<string, unknown>;
};

export type MatchQueueItem = {
  id: number;
  record_a: MatchRecord;
  record_b: MatchRecord;
  score: number;
  breakdown: MatchBreakdown;
  tier: MatchTier;
  status: MatchStatus;
};

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) return JSON.stringify(j.detail);
    return res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function uploadCsvPair(deptA: File, deptB: File): Promise<UploadSummary> {
  const fd = new FormData();
  fd.append("dept_a", deptA, deptA.name);
  fd.append("dept_b", deptB, deptB.name);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<UploadSummary>;
}

export type UploadSummary = {
  ok: boolean;
  total_records: number;
  dept_a_rows: number;
  dept_b_rows: number;
  candidate_pairs: number;
  tier_counts: Record<string, number>;
  blocking: string;
};

export async function getMatches(tier?: MatchTier): Promise<{ matches: MatchQueueItem[]; count: number }> {
  const q = tier ? `?tier=${encodeURIComponent(tier)}` : "";
  const res = await fetch(`${API_BASE}/matches${q}`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<{ matches: MatchQueueItem[]; count: number }>;
}

export type StatsResponse = {
  total_records: number;
  auto_linked: number;
  pending_review: number;
  rejected: number;
  ubids_assigned: number;
};

export async function getStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<StatsResponse>;
}

export async function getRegistry(): Promise<{ ubids: RegistryRow[]; count: number }> {
  const res = await fetch(`${API_BASE}/registry`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<{ ubids: RegistryRow[]; count: number }>;
}

export async function approveMatch(
  id: number,
  body: { reviewer_id?: string; evidence?: Record<string, unknown> } = {},
): Promise<{ ok: boolean; ubid: string; match_id: number; status: string }> {
  const res = await fetch(`${API_BASE}/matches/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ reviewer_id: body.reviewer_id ?? "dashboard_user", evidence: body.evidence ?? {} }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<{ ok: boolean; ubid: string; match_id: number; status: string }>;
}

export async function rejectMatch(
  id: number,
  body: { reviewer_id?: string; evidence?: Record<string, unknown> } = {},
): Promise<{ ok: boolean; match_id: number; status: string }> {
  const res = await fetch(`${API_BASE}/matches/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ reviewer_id: body.reviewer_id ?? "dashboard_user", evidence: body.evidence ?? {} }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<{ ok: boolean; match_id: number; status: string }>;
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<{ status: string }>;
}
