// Small helpers shared by the builders that turn an official GOV.UK release into a file for Your area.
import { fetchRetry } from "../../httpFetch.js";

export const headers = { "User-Agent": "Mozilla/5.0 domesday-live" };

// The attachments listed on a GOV.UK page, through its content API (so a new edition is found without anyone changing an address).
export async function govAttachments(page) {
  const res = await fetchRetry(`https://www.gov.uk/api/content${page}`, { headers });
  if (!res.ok) throw new Error(`GOV.UK answered ${res.status} for ${page}`);
  const body = await res.json();
  return (body.details?.attachments ?? []).filter((a) => a.url && a.title);
}

export async function download(url) {
  const res = await fetchRetry(url, { headers });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// A published figure, or null where the table gives a code instead ([x] missing, [c] suppressed, [z] not applicable) or a blank.
export const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export const isCode = (s) => /^[A-Z]\d{8}$/.test(String(s ?? "").trim());

// The row of a table that holds its column names: the first row where a cell matches.
export const headerRow = (rows, test) => rows.findIndex((r) => r.some((c) => test(String(c ?? "").replace(/\s+/g, " ").trim())));
