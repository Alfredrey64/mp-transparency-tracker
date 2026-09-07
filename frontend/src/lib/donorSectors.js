import donorSectorData from "../data/donorSectors.json";
import donorSectorMeta from "../data/donorSectorsMeta.json";
import { COLORS } from "../theme";

export const SECTOR_COLORS = {
  "Energy & Oil/Gas": "#B5533C",
  "Mining & Extractives": "#8A6D1F",
  "Agriculture & Food": "#4C7A6B",
  "Tobacco": "#7A4B4B",
  "Alcohol & Gambling": "#B0508A",
  "Pharma & Healthcare": "#2F6F4E",
  "Construction & Property": "#A0522D",
  "Retail & Consumer": "#C08A2E",
  "Transport & Logistics": "#5B4E8A",
  "Media & Publishing": "#2E6F6F",
  "Tech & Telecoms": "#3A6EA5",
  "Finance & Banking": "#425073",
  "Legal & Professional Services": "#6B5B95",
  "Chemicals & Manufacturing": "#7A4B63",
  "Defence & Arms": "#4A4A4A",
  "Trade Unions": "#B5533C",
  "Other / Uncategorised": COLORS.inkSoft,
};

export function sectorColor(sector) {
  return SECTOR_COLORS[sector] ?? COLORS.inkSoft;
}

export const donorSectorMetadata = donorSectorMeta;

// Same normalisation as fetch-donor-sectors.js, so name variants like
// "Silverstone" and "Silverstone Circuits Ltd" resolve to the same identity
// even though the tagging script only ever saw one exact string.
export function normalizeDonorKey(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|plc|llp|the|company|co)\b/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Built once: normalised donor name -> tag, so a name variant that wasn't the
// exact string processed by the script can still resolve to the same tag.
const normalizedLookup = new Map();
for (const [name, tag] of Object.entries(donorSectorData)) {
  const key = normalizeDonorKey(name);
  if (key && !normalizedLookup.has(key)) normalizedLookup.set(key, tag);
}

export function getDonorSector(donorName) {
  if (!donorName) return null;
  const trimmed = donorName.trim();
  if (donorSectorData[trimmed]) return donorSectorData[trimmed];
  return normalizedLookup.get(normalizeDonorKey(trimmed)) ?? null;
}

export function summariseBySector(interests) {
  const totals = new Map();
  for (const item of interests) {
    if (!item.value_amount) continue;
    const tag = getDonorSector(item.donor_name);
    if (!tag) continue;
    const key = tag.sector;
    totals.set(key, (totals.get(key) ?? 0) + item.value_amount);
  }
  return [...totals.entries()]
    .map(([sector, total]) => ({ sector, total, color: sectorColor(sector) }))
    .sort((a, b) => b.total - a.total);
}
