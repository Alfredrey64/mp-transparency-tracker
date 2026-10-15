// Re-runs the scripts that build the issue pages' data (Inequality, Defence, Education, Ageing and pensions, Brexit, the NHS) from the official sources, one
// after another, and writes a short report of which worked.
//
//   node frontend/scripts/refresh-issue-data.mjs [--summary <file>] [--only <name>]
//
// It changes only the data files under frontend/src/data. A script that fails leaves its file as it was, and the others still run, so one source being
// down does not stop the rest. The weekly workflow (.github/workflows/refresh-issue-data.yml) runs this, runs the tests, and opens a pull request with
// whatever changed, for a person to read before it goes live. The ONS series these scripts use are refreshed daily by fetch-data.yml.
//
// The order matters: Brexit's data is read by the NHS script (for regional populations), and the ONS series must already be fresh.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const STEPS = [
  { name: "inequality", script: "build-inequality-data.mjs", out: "inequalityData.json", what: "Inequality: income, poverty and wealth (ONS, DWP)" },
  { name: "place", script: "build-place-data.mjs", out: "inequalityPlace.json", what: "Inequality: regions and local areas (DWP, ONS)" },
  { name: "abroad", script: "build-international-inequality-data.mjs", out: "inequalityAbroad.json", what: "Inequality: other countries (OECD)" },
  { name: "defence", script: "build-defence-data.mjs", out: "defenceData.json", what: "Defence: spending and the armed forces (SIPRI, Ministry of Defence)" },
  { name: "education", script: "build-education-data.mjs", out: "educationData.json", what: "Education (Department for Education)" },
  { name: "ageing", script: "build-ageing-data.mjs", out: "ageingData.json", what: "Ageing and pensions: pension against prices and earnings (ONS)" },
  { name: "brexit", script: "build-brexit-data.mjs", out: "brexitData.json", what: "Brexit: GDP against other economies, trade, migration (OECD, ONS, HMRC)" },
  { name: "energy", script: "build-energy-data.mjs", out: "energyData.json", what: "Net zero and energy bills: emissions, electricity, bills, price cap (DESNZ, Ofgem, ONS, World Bank)" },
  { name: "trust", script: "build-trust-data.mjs", out: "trustData.json", what: "Trust in politics: trust in government and institutions (OECD Trust Survey)" },
  { name: "nhs", script: "build-health-data.mjs", out: "healthData.json", what: "The NHS: waiting times by region, series, comparisons (NHS England, ONS, World Bank)" },
];

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const only = arg("--only");
const summaryPath = arg("--summary");
const results = [];

for (const step of STEPS) {
  if (only && step.name !== only) continue;
  const file = path.join(here, "../src/data", step.out);
  const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  const started = Date.now();
  const run = spawnSync(process.execPath, [path.join(here, step.script)], { encoding: "utf8", timeout: 15 * 60 * 1000, cwd: path.join(here, "..") });
  const ok = run.status === 0;
  if (!ok && before !== null) fs.writeFileSync(file, before); // never leave a half-written file behind
  const after = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  // The "built" date changes on every run, so only a change to anything else counts as new figures.
  const strip = (t) => (t ?? "").replace(/"built":"[^"]*"/, "");
  const changed = ok && strip(before) !== strip(after);
  // If only the built date moved, put the old file back so the pull request holds real changes only.
  if (ok && !changed && before !== null) fs.writeFileSync(file, before);
  const tail = ((run.stderr || run.stdout) ?? "").trim().split("\n").slice(-3).join(" ").slice(0, 300);
  results.push({ ...step, ok, changed, seconds: Math.round((Date.now() - started) / 1000), error: ok ? null : tail || `exit ${run.status}` });
  console.log(`${ok ? (changed ? "CHANGED" : "same   ") : "FAILED "} ${step.name} (${results.at(-1).seconds}s)${ok ? "" : `: ${results.at(-1).error}`}`);
}

const lines = [
  "## Issue-page data refresh",
  "",
  `Run on ${new Date().toISOString().slice(0, 10)}. Each step rebuilds one data file from its official source.`,
  "",
  "| Page data | Result |",
  "| --- | --- |",
  ...results.map((r) => `| ${r.what} | ${r.ok ? (r.changed ? "New figures" : "No change") : `Failed: ${r.error.replace(/\|/g, "/")}`} |`),
  "",
  results.some((r) => !r.ok) ? "**A step failed.** Its file was left as it was. The usual cause is a publisher moving a file: check the address at the top of that script." : "Every step ran.",
  results.some((r) => r.changed) ? "Read the changes before merging: new figures can make a sentence on the page out of date, and the tests that tie the text to the data may fail on purpose." : "",
];
if (summaryPath) fs.writeFileSync(summaryPath, `${lines.join("\n")}\n`);
console.log(`\n${results.filter((r) => r.changed).length} changed, ${results.filter((r) => !r.ok).length} failed`);
process.exit(results.every((r) => r.ok) ? 0 : 2);
