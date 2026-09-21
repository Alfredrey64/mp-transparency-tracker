// fetch-ministerial-gifts.js
//
// What this does, in plain terms:
// 1. Every month, the Cabinet Office publishes a single "Register of
//    Ministers' Gifts and Hospitality" covering every government
//    department at once — each department's gifts and hospitality as a
//    separate CSV, bundled into one gov.uk publication. This finds the
//    most recently published one via gov.uk's own Content API.
// 2. Downloads and parses every department's CSV, skipping the (very
//    common) "Nil Return" rows where a minister had nothing to declare
//    that month, and matches each named minister against our existing
//    `politicians` table by name.
// 3. Replaces the `ministerial_gifts` table with this month's snapshot.
//
// What this deliberately doesn't cover yet: ministers' *meetings* with
// external organisations and lobbyists are published separately, per
// department, in a much less consistent format — a genuine gap, left out
// rather than built on a shaky, partial crawl.
//
// Run it with: node fetch-ministerial-gifts.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// A small, dependency-free CSV parser — handles quoted fields containing
// commas or newlines, and "" as an escaped quote, which the plain
// gov.uk CSVs here do use in free-text description fields.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  return rows;
}

async function findLatestPublicationPath() {
  const res = await fetch("https://www.gov.uk/api/content/government/collections/register-of-ministers-gifts-and-hospitality");
  if (!res.ok) throw new Error(`Could not load the gifts & hospitality collection: ${res.status}`);
  const data = await res.json();
  const docs = (data.links?.documents ?? []).filter((d) => /^Register of Ministers/i.test(d.title));
  if (docs.length === 0) throw new Error("No monthly gifts & hospitality publications found in the collection.");
  docs.sort((a, b) => new Date(b.public_updated_at) - new Date(a.public_updated_at));
  return { path: docs[0].base_path, title: docs[0].title };
}

async function fetchAttachments(publicationPath) {
  const res = await fetch(`https://www.gov.uk/api/content${publicationPath}`);
  if (!res.ok) throw new Error(`Could not load publication ${publicationPath}: ${res.status}`);
  const data = await res.json();
  return data.details?.attachments ?? [];
}

// Attachment titles look like "{Department} - Ministers' Gifts - {Month Year}"
// or "{Department} - The Prime Minister's Hospitality - {Month Year}".
function parseAttachmentTitle(title) {
  const kind = /hospitality/i.test(title) ? "hospitality" : /gifts/i.test(title) ? "gift" : null;
  const department = title.split(" - ")[0]?.trim() ?? null;
  return { kind, department };
}

function rowsFromCsv(csvText, department, kind, monthLabel, sourceUrl) {
  const table = parseCsv(csvText);
  if (table.length === 0) return [];
  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (name) => header.findIndex((h) => h.includes(name));
  const idxMinister = col("minister");
  const idxDate = col("date");
  const idxGift = col("gift");
  const idxGivenReceived = col("given or received");
  const idxWho = col("who gift");
  const idxValue = col("value");
  const idxOutcome = col("outcome");

  const rows = [];
  for (const r of table.slice(1)) {
    const minister = (r[idxMinister] ?? "").trim();
    if (!minister) continue;
    const isNilReturn = r.some((cell) => /nil return/i.test(cell));
    if (isNilReturn) continue;

    const rawValue = (r[idxValue] ?? "").replace(/[£,]/g, "").trim();
    const value = rawValue && !isNaN(Number(rawValue)) ? Number(rawValue) : null;

    rows.push({
      minister_name: minister,
      department,
      kind,
      date_or_period: (r[idxDate] ?? "").trim() || monthLabel,
      description: (r[idxGift] ?? "").trim() || null,
      given_or_received: (r[idxGivenReceived] ?? "").trim() || null,
      counterparty: idxWho >= 0 ? (r[idxWho] ?? "").trim() || null : null,
      value_amount: value,
      outcome: idxOutcome >= 0 ? (r[idxOutcome] ?? "").trim() || null : null,
      source_url: sourceUrl,
    });
  }
  return rows;
}

async function main() {
  console.log("Finding the latest monthly gifts & hospitality publication...");
  const { path, title } = await findLatestPublicationPath();
  console.log(`Using: ${title}\n`);

  const attachments = await fetchAttachments(path);
  const csvAttachments = attachments.filter((a) => a.content_type === "text/csv");
  console.log(`Found ${csvAttachments.length} department CSV files.\n`);

  const { data: politicians, error: politiciansError } = await supabase
    .from("politicians")
    .select("id, name");
  if (politiciansError) throw politiciansError;
  const nameToId = new Map(politicians.map((p) => [p.name.trim().toLowerCase(), p.id]));

  const monthLabel = title.replace(/^Register of Ministers'? Gifts and Hospitality:\s*/i, "");
  let allRows = [];
  for (const att of csvAttachments) {
    const { kind, department } = parseAttachmentTitle(att.title);
    if (!kind || !department) continue;
    try {
      const csvRes = await fetch(att.url);
      if (!csvRes.ok) continue;
      const csvText = await csvRes.text();
      const rows = rowsFromCsv(csvText, department, kind, monthLabel, att.url);
      allRows.push(...rows);
    } catch (err) {
      console.error(`  ⚠ Failed to fetch/parse "${att.title}": ${err.message}`);
    }
  }

  console.log(`Parsed ${allRows.length} declared gifts/hospitality entries (Nil Returns excluded).\n`);

  const withPoliticianId = allRows.map((r) => ({
    ...r,
    politician_id: nameToId.get(r.minister_name.trim().toLowerCase()) ?? null,
  }));
  const matched = withPoliticianId.filter((r) => r.politician_id !== null).length;
  console.log(`Matched ${matched} of ${withPoliticianId.length} entries to a tracked MP by name.`);

  console.log("\nReplacing ministerial_gifts table with this month's snapshot...");
  const { error: deleteError } = await supabase.from("ministerial_gifts").delete().neq("id", 0);
  if (deleteError) throw deleteError;

  const BATCH_SIZE = 100;
  let saved = 0;
  for (let i = 0; i < withPoliticianId.length; i += BATCH_SIZE) {
    const batch = withPoliticianId.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from("ministerial_gifts").insert(batch);
    if (insertError) {
      console.error(`  ⚠ Batch ${i / BATCH_SIZE + 1} failed: ${insertError.message}`);
      continue;
    }
    saved += batch.length;
  }

  console.log(`\nDone. Saved ${saved} of ${withPoliticianId.length} entries.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
