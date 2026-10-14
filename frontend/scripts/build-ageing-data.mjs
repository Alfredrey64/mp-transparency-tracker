// Builds src/data/ageingData.json for the Ageing and pensions page: what the full State Pension would be each April if it had followed prices
// or average earnings instead of the triple lock, starting from the 2016 launch rate. Prices are the ONS consumer price index for April and earnings
// are the ONS average weekly earnings, averaged over February to April, both from the data the rest of the site already holds.
//
//   node scripts/build-ageing-data.mjs
//
// This is the site's own calculation, not an official one: the triple lock itself uses September's inflation and the May to July earnings growth, so
// the comparison is close but not exact.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PENSION_RATES } from "../src/data/ageing.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, "../src/data/ons", f), "utf8"));
const cpi = new Map(read("deflator.json").points);
const awe = new Map(read("prices.json").series["awe-weekly"].points);
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

const years = PENSION_RATES.map((r) => r.year);
const prices = years.map((y) => cpi.get(`${y}-04`));
const earnings = years.map((y) => round((awe.get(`${y}-02`) + awe.get(`${y}-03`) + awe.get(`${y}-04`)) / 3, 1));
if ([...prices, ...earnings].some((v) => !Number.isFinite(v))) throw new Error("Missing ONS figures for an April");

const data = {
  built: new Date().toISOString().slice(0, 10),
  years,
  pension: PENSION_RATES.map((r) => r.weekly),
  pricesIndex: prices,
  earningsWeekly: earnings,
};
const out = path.join(here, "../src/data/ageingData.json");
fs.writeFileSync(out, `${JSON.stringify(data)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
