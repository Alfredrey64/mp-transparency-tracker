// Loads the ONS figures the pipeline saved and works out any derived series.
// Everything is loaded on demand, one file per page, so a visitor only pays
// for the page they are looking at (the compare page loads them all).

import { SECTORS, sectorByKey } from "../data/onsSectors";
import { derive } from "./onsDerive";

const FILES = import.meta.glob("../data/ons/*.json");

// Turns the raw saved file into { id: { def, points, freq, updated } } for every series on the page.
export function resolveSeries(sectorDef, data) {
  const out = {};
  const base = {};
  for (const def of sectorDef.series) {
    const raw = data?.series?.[def.id];
    if (raw) {
      base[def.id] = raw.points;
      out[def.id] = { def, points: raw.points, freq: raw.freq, updated: raw.updated, next: raw.next };
    }
  }
  for (const def of sectorDef.series) {
    if (!def.derive) continue;
    const points = derive(def.derive, base);
    if (points.length) {
      const from = out[def.derive.from];
      base[def.id] = points;
      out[def.id] = { def, points, freq: from?.freq, updated: from?.updated, next: from?.next };
    }
  }
  return out;
}

export async function loadSector(key) {
  const load = FILES[`../data/ons/${key}.json`];
  const def = sectorByKey(key);
  if (!load || !def) throw new Error(`No data for ${key}`);
  const mod = await load();
  const data = mod.default;
  return { def, data, series: resolveSeries(def, data) };
}

// Every page's series, keyed "<sector>.<id>" (see refOf in onsSectors.js).
export async function loadEverything() {
  const loaded = await Promise.all(SECTORS.map((s) => loadSector(s.key).catch(() => null)));
  const byRef = {};
  for (const sector of loaded) {
    if (!sector) continue;
    for (const [id, item] of Object.entries(sector.series)) {
      byRef[`${sector.def.key}.${id}`] = { ...item, sector: sector.def.key, sectorLabel: sector.def.label, accent: sector.def.accent };
    }
  }
  return byRef;
}
