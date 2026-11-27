// fetch-portraits.js
//
// What this does, in plain terms:
// 1. Collects the member id of every MP, peer and former MP the site shows a face for (from the thumbnail address saved in the database).
// 2. For each one that does not yet have a small copy, downloads Parliament's thumbnail (a 230 KB bitmap), shrinks it to 128 pixels and saves it as a WebP of a few kilobytes at
//    frontend/public/portraits/<id>.webp. Copies already saved are left alone, so a daily run only fetches the newcomers.
//    Current MPs also get a sharper 240-pixel copy (Parliament's thumbnails are 240 pixels, so that is the most there is) at frontend/public/portraits/hd/<id>.webp, which the large face
//    on Your area uses; everywhere else keeps the small one, and Your area falls back to the small one if a sharp copy is missing.
//    Current MPs also get a copy of up to 512 pixels at frontend/public/portraits/hq/<id>.webp for the faces drawn large (the MP profile, My MP, Your area, the share image). The 240-pixel
//    thumbnail is all that Parliament's thumbnail address has, but its "Portrait" address (cropType=FullSize) holds the whole photograph at about 730 x 1100 pixels. Parliament's
//    face-centred square is found inside that photograph (portraitCrop.js) and cut from it, so the framing is the same as before and the detail is two to three times greater. If
//    Parliament has no large photograph for someone, or the square cannot be found with confidence, no sharp copy is made and the site uses the smaller ones.
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
import { toReadableImage, decodeBmp, encodePng } from "./portraitImage.js";
import { toGrey, findSquareCrop } from "./portraitCrop.js";
import { memberIdFromPortrait } from "./frontend/src/lib/portrait.js";

const OUT = "frontend/public/portraits";
const SIZE = 128;
const HD_OUT = "frontend/public/portraits/hd";
const HD_SIZE = 240;
const HQ_OUT = "frontend/public/portraits/hq";
const HQ_SIZE = 512;
const HQ_MAX_ERROR = 20; // average grey-level difference above which the crop is not trusted (a true cut scores 1 to 3, a slightly retouched one up to about 16, an unrelated picture 30 or more)
const TABLES = ["politicians", "peers", "former_mps"];

async function idsFromDatabase() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const ids = new Set();
  const mps = new Set();
  for (const table of TABLES) {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select("thumbnail_url").range(from, from + 999);
      if (error) { console.warn(`Could not read ${table}: ${error.message}`); break; }
      for (const row of data) { const id = memberIdFromPortrait(row.thumbnail_url); if (id) { ids.add(id); if (table === "politicians") mps.add(id); } }
      if (data.length < 1000) break;
    }
  }
  return { ids: [...ids], mps };
}

function toWebp(image, dest, size = SIZE, quality = 74) {
  const tmp = path.join(os.tmpdir(), `portrait-${process.pid}-${Math.random().toString(36).slice(2)}.${image.kind === "png" ? "png" : "jpg"}`);
  fs.writeFileSync(tmp, image.bytes);
  try {
    const r = spawnSync("cwebp", ["-quiet", "-q", String(quality), "-m", "6", "-resize", String(size), String(size), tmp, "-o", dest]);
    if (r.status !== 0) throw new Error(`cwebp failed: ${String(r.stderr || r.error).trim()}`);
  } finally { fs.rmSync(tmp, { force: true }); }
}

const isBmp = (buf) => buf.length > 54 && buf[0] === 0x42 && buf[1] === 0x4d;

// Makes the 480-pixel copy of one member. Returns "ok", or the reason there is none ("none" = Parliament has no large photograph, "format", "nomatch").
async function makeHq(id) {
  const get = async (cropType) => {
    const res = await fetchRetry(`https://members-api.parliament.uk/api/Members/${id}/Portrait?cropType=${cropType}`, {}, { gapMs: 0, retries: 2, timeoutMs: 90_000 });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  };
  const fullBuf = await get("FullSize");
  const refBuf = fullBuf && (await get("OneOne"));
  if (!fullBuf || !refBuf) return "none";
  if (!isBmp(fullBuf) || !isBmp(refBuf)) return "format";
  const full = decodeBmp(fullBuf), ref = decodeBmp(refBuf);
  const crop = findSquareCrop({ grey: toGrey(full.rgb, full.width, full.height), width: full.width, height: full.height }, { grey: toGrey(ref.rgb, ref.width, ref.height), width: ref.width, height: ref.height });
  if (!(crop.error <= HQ_MAX_ERROR) || crop.side < 160) return "nomatch";
  const tmp = path.join(os.tmpdir(), `portrait-hq-${process.pid}-${Math.random().toString(36).slice(2)}.png`);
  fs.writeFileSync(tmp, encodePng(full.width, full.height, full.rgb, 1));
  const dest = path.join(HQ_OUT, `${id}.webp`);
  try {
    const size = Math.min(HQ_SIZE, crop.side);
    const r = spawnSync("cwebp", ["-quiet", "-q", "86", "-m", "6", "-crop", String(crop.x), String(crop.y), String(crop.side), String(crop.side), "-resize", String(size), String(size), tmp, "-o", dest]);
    if (r.status !== 0) throw new Error(`cwebp failed: ${String(r.stderr || r.error).trim()}`);
  } finally { fs.rmSync(tmp, { force: true }); }
  return "ok";
}

// Members the sharp copy could not be made for, with the reason and the day it was tried, so the daily run does not ask Parliament about them again every day.
const SKIP_FILE = path.join(HQ_OUT, "skipped.json");
const RETRY_AFTER_DAYS = 45;
const readSkipped = () => { try { return JSON.parse(fs.readFileSync(SKIP_FILE, "utf8")); } catch { return {}; } };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(HD_OUT, { recursive: true });
  fs.mkdirSync(HQ_OUT, { recursive: true });
  const given = process.argv.indexOf("--ids");
  const found = given > -1 ? { ids: process.argv[given + 1].split(",").map((s) => s.trim()).filter(Boolean), mps: null } : await idsFromDatabase();
  // --shard 2/4 takes every fourth member, so a first run over all 650 MPs can be split across several processes (the matching in makeHq is slow, about two seconds each).
  const shard = process.argv.indexOf("--shard");
  const [shardNo, shardOf] = shard > -1 ? process.argv[shard + 1].split("/").map(Number) : [0, 1];
  const ids = found.ids.filter((_, i) => i % shardOf === shardNo % shardOf);
  // With --ids every member named gets all the copies; otherwise only current MPs get the sharp ones.
  const wantsHd = (id) => (found.mps ? found.mps.has(id) : true);
  const skipped = readSkipped();
  const today = new Date().toISOString().slice(0, 10);
  const stale = (d) => !d || (Date.parse(today) - Date.parse(d)) / 86_400_000 > RETRY_AFTER_DAYS;
  const needSmall = (id) => !fs.existsSync(path.join(OUT, `${id}.webp`));
  const needHd = (id) => wantsHd(id) && !fs.existsSync(path.join(HD_OUT, `${id}.webp`));
  const needHq = (id) => wantsHd(id) && !fs.existsSync(path.join(HQ_OUT, `${id}.webp`)) && (given > -1 || stale(skipped[id]?.on));
  const missing = ids.filter((id) => needSmall(id) || needHd(id));
  console.log(`${ids.length} faces in use, ${missing.length} still need a small copy.`);
  let failed = 0;
  await mapLimit(missing, 4, async (id) => {
    try {
      const res = await fetchRetry(`https://members-api.parliament.uk/api/Members/${id}/Thumbnail`, {}, { gapMs: 0, retries: 2, timeoutMs: 30_000 });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const image = toReadableImage(Buffer.from(await res.arrayBuffer()));
      if (needSmall(id)) toWebp(image, path.join(OUT, `${id}.webp`));
      if (needHd(id)) toWebp(image, path.join(HD_OUT, `${id}.webp`), HD_SIZE, 82);
    } catch (e) {
      failed++;
      console.warn(`Member ${id}: ${e.message}`);
    }
  }, { pauseMs: 150 });
  console.log(`Small copies done. ${missing.length - failed} saved, ${failed} failed.`);

  const sharp = ids.filter(needHq);
  console.log(`${sharp.length} members need a sharp copy.`);
  const counts = { ok: 0, none: 0, format: 0, nomatch: 0, error: 0 };
  await mapLimit(sharp, 2, async (id) => {
    try {
      const result = await makeHq(id);
      counts[result]++;
      if (result !== "ok") skipped[id] = { why: result, on: today };
      else delete skipped[id];
    } catch (e) {
      counts.error++;
      console.warn(`Member ${id} (sharp copy): ${e.message}`);
    }
  }, { pauseMs: 150 });
  // Several shards write to one skipped list, so merge with what is on disk now instead of overwriting it.
  if (counts.none + counts.format + counts.nomatch + counts.ok) {
    const now = readSkipped();
    for (const id of sharp) { if (skipped[id]) now[id] = skipped[id]; else delete now[id]; }
    fs.writeFileSync(SKIP_FILE, `${JSON.stringify(Object.fromEntries(Object.entries(now).sort((a, b) => Number(a[0]) - Number(b[0]))))}\n`);
  }
  console.log(`Sharp copies done: ${counts.ok} saved, ${counts.none} with no large photograph, ${counts.format} in a format that cannot be read, ${counts.nomatch} where the face square was not found, ${counts.error} errors.`);
  // A member with no copy still shows (the host passes the request to Parliament, or the page uses the smaller copy), so a few failures are not an error; a wholesale failure is.
  if (tooManyFailed(failed, missing.length) && missing.length > 20) process.exitCode = 1;
  if (tooManyFailed(counts.error, sharp.length) && sharp.length > 20) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
