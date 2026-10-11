// fetch-seat-hexes.js
//
// What this does, in plain terms:
// Downloads the hexagon layout of the 650 UK parliamentary constituencies
// (the 2024 boundaries) that the seat map is drawn from, keeps just each
// seat's ONS code, name, grid position and region, and saves it as
// frontend/src/data/seatHexes.json.
//
// The layout is "uk-constituencies-2023.hexjson" from Open Innovations'
// hexmaps (github.com/odileeds/hexmaps, MIT licence), a hand-placed hexagon
// per seat so that every seat is the same size and keeps its neighbours.
// It only changes when constituency boundaries do, so this is run by hand
// on those rare occasions, not by the daily workflow.
//
// Run it with: node fetch-seat-hexes.js

import { writeFileSync } from "fs";
import { fetchRetry } from "./httpFetch.js";

const SOURCE = "https://raw.githubusercontent.com/odileeds/hexmaps/master/maps/uk-constituencies-2023.hexjson";
const OUTPUT = "frontend/src/data/seatHexes.json";

const res = await fetchRetry(SOURCE);
if (!res.ok) throw new Error(`Download failed: ${res.status}`);
const data = await res.json();
const entries = Object.entries(data.hexes ?? {});
if (entries.length < 640) throw new Error(`Only ${entries.length} seats came back — leaving ${OUTPUT} unchanged.`);

const hexes = entries
  .map(([code, h]) => [code, h.n, h.q, h.r, h.region ?? null])
  .sort((a, b) => a[1].localeCompare(b[1]));
writeFileSync(OUTPUT, JSON.stringify({ layout: data.layout ?? "odd-r", source: "Open Innovations hexmaps, uk-constituencies-2023.hexjson (MIT)", hexes }) + "\n");
console.log(`Wrote ${hexes.length} seats to ${OUTPUT}`);
