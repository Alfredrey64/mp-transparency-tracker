// fetch-charities.js
//
// What this does, in plain terms:
// 1. Downloads the Charity Commission's weekly register extract (publicextract.charity, a zip of one tab-separated file, about 45 MB) from the Commission's public data site.
// 2. Reads it line by line and keeps only the entries for the think tanks the site lists, matched by exact registered name (see charityRegister.js and charityNames.js).
// 3. Writes frontend/src/data/thinkTankCharities.json for the Who funds think tanks page.
//
// A think tank that is not a registered charity (the Adam Smith Institute, the TaxPayers' Alliance and the Centre for Policy Studies are not) is simply not in the list. If the download fails, the file is not a valid zip,
// or too few of the names are found, the existing file is left as it is and the run fails. The extract is republished every week, so the file is only rewritten when a figure changes.
//
// Run it with: node fetch-charities.js

import { spawn } from "child_process";
import { createInterface } from "readline";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, createWriteStream } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { matchCharities, normalise } from "./charityRegister.js";
import { CHARITY_NAMES } from "./charityNames.js";

const OUTPUT = "frontend/src/data/thinkTankCharities.json";
const ZIP_URL = "https://ccewuksprdoneregsadata1.blob.core.windows.net/data/txt/publicextract.charity.zip";
const MIN_FOUND = Math.ceil(CHARITY_NAMES.length * 0.6);

// The site is fast for a small request but drops a long single download, so the file is fetched 4 MB at a time (HTTP Range requests), each piece tried up to four times.
const CHUNK = 4 * 1024 * 1024;
async function download(dir) {
  const file = join(dir, "register.zip");
  const out = createWriteStream(file);
  let size = Infinity;
  for (let from = 0; from < size; from += CHUNK) {
    for (let attempt = 1; ; attempt += 1) {
      try {
        const res = await fetch(ZIP_URL, { headers: { Range: `bytes=${from}-${from + CHUNK - 1}` }, signal: AbortSignal.timeout(2 * 60_000) });
        if (res.status !== 206) throw new Error(`${res.status} ${res.statusText}`);
        const total = Number(/\/(\d+)$/.exec(res.headers.get("content-range") ?? "")?.[1]);
        if (!Number.isFinite(total)) throw new Error("no size in the response");
        size = total;
        out.write(Buffer.from(await res.arrayBuffer()));
        break;
      } catch (err) {
        const why = `${err.message}${err.cause ? ` (${err.cause.code ?? err.cause.message})` : ""}`;
        console.error(`  bytes from ${from}: attempt ${attempt} failed: ${why}`);
        if (attempt === 4) throw new Error(`The download failed at ${from} of ${size} bytes: ${why}`);
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
  }
  await new Promise((resolve, reject) => { out.end(resolve); out.on("error", reject); });
  return file;
}

// The extract's header, plus every line whose name could be one of the wanted charities (a cheap check; matchCharities does the exact one).
async function candidateLines(zip) {
  const wanted = new Set(CHARITY_NAMES.map((w) => normalise(w.name)));
  const child = spawn("unzip", ["-p", zip], { stdio: ["ignore", "pipe", "inherit"] });
  const exited = new Promise((resolve, reject) => {
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`unzip exited with ${code}`))));
    child.on("error", reject);
  });
  const lines = [];
  let nameAt = -1;
  let total = 0;
  for await (const line of createInterface({ input: child.stdout, crlfDelay: Infinity })) {
    if (!lines.length) {
      lines.push(line.replace(/^﻿/, ""));
      nameAt = lines[0].split("\t").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, "")).indexOf("charityname");
      if (nameAt < 0) throw new Error("The extract has no charity_name column, so its layout has changed.");
      continue;
    }
    total += 1;
    if (wanted.has(normalise(line.split("\t")[nameAt]))) lines.push(line);
  }
  await exited;
  return { lines, total };
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "charities-"));
  try {
    console.log("Downloading the Charity Commission register extract...");
    const { lines, total } = await candidateLines(await download(dir));
    if (total < 100_000) throw new Error(`The extract has only ${total} charities, so it looks wrong and ${OUTPUT} was left as it is.`);
    const { found, notFound, ambiguous } = matchCharities(lines, CHARITY_NAMES);
    if (notFound.length) console.log(`Not on the register under that name: ${notFound.join(", ")}`);
    if (ambiguous.length) console.log(`More than one live entry, so left out: ${ambiguous.join(", ")}`);
    if (Object.keys(found).length < MIN_FOUND) throw new Error(`Only ${Object.keys(found).length} of ${CHARITY_NAMES.length} think tanks were found, so ${OUTPUT} was left as it is.`);
    const out = { source: "Charity Commission for England and Wales: register of charities, weekly extract", charities: found };
    const text = `${JSON.stringify(out)}\n`;
    if (existsSync(OUTPUT) && readFileSync(OUTPUT, "utf8") === text) return console.log(`Think tank charity figures unchanged (${total} charities on the register).`);
    writeFileSync(OUTPUT, text);
    console.log(`Wrote ${OUTPUT}: ${Object.keys(found).length} think tanks found among ${total} registered charities.`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((err) => { console.error("Something went wrong:", err.message); process.exit(1); });
