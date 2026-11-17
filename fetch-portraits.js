// fetch-portraits.js
//
// What this does, in plain terms:
// 1. Collects the member id of every MP, peer and former MP the site shows a face for (from the thumbnail address saved in the database).
// 2. For each one that does not yet have a small copy, downloads Parliament's thumbnail (a 230 KB bitmap), shrinks it to 128 pixels and saves it as a WebP of a few kilobytes at
//    frontend/public/portraits/<id>.webp. Copies already saved are left alone, so a daily run only fetches the newcomers.
// 3. The site points every face at /portraits/<id>.webp (frontend/src/lib/portrait.js). A face with no copy yet is still shown: the host passes the request on to Parliament.
//
// Needs the `cwebp` tool (macOS: brew install webp; Ubuntu: apt-get install webp).
//
// Run it with: node fetch-portraits.js   (add --ids 172,4212 to fetch particular members only)

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import os from "node:os";
import { createClient } from "@supabase/supabase-js";
import { fetchRetry, mapLimit, tooManyFailed } from "./httpFetch.js";
import { toReadableImage } from "./portraitImage.js";
import { memberIdFromPortrait } from "./frontend/src/lib/portrait.js";

const OUT = "frontend/public/portraits";
const SIZE = 128;
const TABLES = ["politicians", "peers", "former_mps"];

async function idsFromDatabase() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const ids = new Set();
  for (const table of TABLES) {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select("thumbnail_url").range(from, from + 999);
      if (error) { console.warn(`Could not read ${table}: ${error.message}`); break; }
      for (const row of data) { const id = memberIdFromPortrait(row.thumbnail_url); if (id) ids.add(id); }
      if (data.length < 1000) break;
    }
  }
  return [...ids];
}

function toWebp(image, dest) {
  const tmp = path.join(os.tmpdir(), `portrait-${process.pid}-${Math.random().toString(36).slice(2)}.${image.kind === "png" ? "png" : "jpg"}`);
  fs.writeFileSync(tmp, image.bytes);
  try {
    const r = spawnSync("cwebp", ["-quiet", "-q", "74", "-m", "6", "-resize", String(SIZE), String(SIZE), tmp, "-o", dest]);
    if (r.status !== 0) throw new Error(`cwebp failed: ${String(r.stderr || r.error).trim()}`);
  } finally { fs.rmSync(tmp, { force: true }); }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const given = process.argv.indexOf("--ids");
  const ids = given > -1 ? process.argv[given + 1].split(",").map((s) => s.trim()).filter(Boolean) : await idsFromDatabase();
  const missing = ids.filter((id) => !fs.existsSync(path.join(OUT, `${id}.webp`)));
  console.log(`${ids.length} faces in use, ${missing.length} still need a small copy.`);
  let failed = 0;
  await mapLimit(missing, 4, async (id) => {
    try {
      const res = await fetchRetry(`https://members-api.parliament.uk/api/Members/${id}/Thumbnail`, {}, { gapMs: 0, retries: 2, timeoutMs: 30_000 });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toWebp(toReadableImage(Buffer.from(await res.arrayBuffer())), path.join(OUT, `${id}.webp`));
    } catch (e) {
      failed++;
      console.warn(`Member ${id}: ${e.message}`);
    }
  }, { pauseMs: 150 });
  console.log(`Done. ${missing.length - failed} saved, ${failed} failed.`);
  // A member with no copy still shows (the host passes the request to Parliament), so a few failures are not an error; a wholesale failure is.
  if (tooManyFailed(failed, missing.length) && missing.length > 20) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
