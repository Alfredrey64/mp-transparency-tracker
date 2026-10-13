import { allTaxes, valueOn } from "./taxRates";

// The tax rates that are percentages, shaped like the ONS measures on the Compare over time page so they can be picked and drawn beside them.
// Each rate becomes a monthly series: the rate in force in the middle of each month, from when the record starts until now. Rates that are
// not percentages (allowances, pounds and pence) and rates that no longer apply are left out. They stay on the Tax rates through time page.

const SECTOR = "tax";
const refId = (key) => key.replace(/\./g, "_");

function activeLines(now) {
  const today = new Date(now).toISOString().slice(0, 10);
  return allTaxes().flatMap((tax) => tax.lines
    .filter((line) => line.unit === "pct" && valueOn(line, today) != null)
    .map((line) => ({ tax, line })));
}

// The measures to list: same shape as the ONS series definitions.
export function taxRateChoices(now = Date.now()) {
  return activeLines(now).map(({ tax, line }) => {
    const decimals = line.points.some((p) => p.value !== null && Math.round(p.value * 10) !== p.value * 10);
    return {
      id: refId(line.key),
      label: `${tax.name}: ${line.label}`,
      sentenceName: `${tax.name}, ${line.label.toLowerCase()}`,
      format: decimals ? "pct2" : "pct",
      kind: "rate",
      sector: SECTOR,
      sectorLabel: "Tax rates",
      explain: tax.summary,
    };
  });
}

// The monthly points for every rate, keyed like the other measures ("tax.<id>").
export function taxRateEntries(accent, now = Date.now()) {
  const today = new Date(now);
  const out = {};
  for (const { tax, line } of activeLines(now)) {
    const first = line.points[0].date;
    let y = Number(first.slice(0, 4));
    let m = Number(first.slice(5, 7));
    const points = [];
    while (y < today.getUTCFullYear() || (y === today.getUTCFullYear() && m <= today.getUTCMonth() + 1)) {
      const mm = String(m).padStart(2, "0");
      const v = valueOn(line, `${y}-${mm}-15`);
      if (v !== undefined && v !== null) points.push([`${y}-${mm}`, v]);
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    if (!points.length) continue;
    const decimals = line.points.some((p) => p.value !== null && Math.round(p.value * 10) !== p.value * 10);
    const def = { id: refId(line.key), label: `${tax.name}: ${line.label}`, sentenceName: `${tax.name}, ${line.label.toLowerCase()}`, format: decimals ? "pct2" : "pct", kind: "rate", explain: tax.summary };
    out[`${SECTOR}.${def.id}`] = { def, points, freq: "months", sector: SECTOR, sectorLabel: "Tax rates", accent };
  }
  return out;
}
