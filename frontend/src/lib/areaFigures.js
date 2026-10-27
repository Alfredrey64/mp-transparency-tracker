// What the "My area" page works out from one postcode lookup (postcodes.io) and the figures saved with the site. Pure apart from loadAreaFigures,
// which reads the saved ONS files, so the rest can be tested.
import { REGIONS, METRICS, metricById } from "../data/regionMetrics";
import { loadSector } from "./onsData";
import { latestInfo, formatValue, changeWords } from "./onsFormat";
import { normCouncil } from "./councils";

// The region key for a postcodes.io result: England's regions have a `region`, the other three nations are named by `country`.
export function regionKeyOf(result) {
  const names = [result?.region, result?.country].filter(Boolean).map((n) => normCouncil(n));
  for (const n of names) {
    const hit = REGIONS.find((r) => normCouncil(r.name) === n || normCouncil(r.short) === n);
    if (hit) return hit.key;
  }
  return null;
}

// Where the postcode lookup's ward is among a council's councillors: every row of the councillor list in that council and ward.
export function wardCouncillors(rows, councilId, wardName) {
  const w = normCouncil(wardName);
  if (!w || !councilId) return [];
  const inCouncil = rows.filter((r) => r.councilId === councilId);
  const exact = inCouncil.filter((r) => normCouncil(r.ward) === w);
  if (exact.length) return exact;
  return inCouncil.filter((r) => { const x = normCouncil(r.ward); return x.includes(w) || w.includes(x); });
}

const SHOWN = ["pay", "price", "unemployment", "employment"];

// Four figures for the region, each beside the UK's, from the saved ONS files.
export async function loadAreaFigures(regionKey) {
  if (!regionKey) return [];
  const out = [];
  const sectors = new Map();
  const sector = (key) => { if (!sectors.has(key)) sectors.set(key, loadSector(key).catch(() => null)); return sectors.get(key); };
  for (const id of SHOWN) {
    const m = metricById(id);
    const ref = m?.series?.[regionKey];
    if (!ref) continue;
    const [own, uk] = await Promise.all([sector(ref.sector), sector(m.uk.sector)]);
    const a = own?.series?.[ref.id];
    const b = uk?.series?.[m.uk.id];
    if (!a || !b) continue;
    const here = latestInfo(a.def, a.points);
    const nation = latestInfo(b.def, b.points);
    if (!here || !nation) continue;
    out.push({
      id, label: m.label, accent: m.accent, link: m.link, value: formatValue(a.def.format, here.value), uk: formatValue(b.def.format, nation.value), when: here.label,
      raw: here.value, ukRaw: nation.value, higher: here.value > nation.value, same: here.value === nation.value, change: here.change ? changeWords(here.change) : "",
    });
  }
  return out;
}

export { METRICS };
