// standardsText.js
//
// Gets the text of a Committee on Standards report from the Committees API, which serves the report's PDF (the committee's own web pages refuse scripted requests).
// pdfjs-dist reads the PDF; the text comes back as lines in reading order. Used by fetch-standards-details.js.

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { fetchRetry } from "./httpFetch.js";

const API = "https://committees-api.parliament.uk/api";

async function getJson(url) {
  const res = await fetchRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

// The report's text as an array of lines, or null when it has no PDF.
export async function reportLines(publicationId) {
  const pub = await getJson(`${API}/Publications/${publicationId}`);
  const doc = (pub.documents ?? []).find((d) => (d.files ?? []).some((f) => f.format === "pdf"));
  if (!doc) return null;
  const file = await getJson(`${API}/Publications/${publicationId}/Document/${doc.documentId}/OriginalFormat`);
  const pdf = await getDocument({ data: new Uint8Array(Buffer.from(file.data, "base64")), useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;
  const lines = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    let cur = "";
    for (const it of tc.items) {
      cur += it.str;
      if (it.hasEOL) { lines.push(cur); cur = ""; }
    }
    if (cur) lines.push(cur);
    lines.push("\f");
  }
  return lines;
}
