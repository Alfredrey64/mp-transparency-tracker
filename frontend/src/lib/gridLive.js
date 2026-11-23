// Reading the Carbon Intensity API (api.carbonintensity.org.uk, run by the National Energy System Operator with the University of Oxford and the Environmental Defense Fund Europe) into the
// numbers the live grid panel on the electricity page shows. Nothing here fetches; GridLive.jsx does, and hands the answers to these. All three answers are for Great Britain, in half-hour steps.

export const API = "https://api.carbonintensity.org.uk";

// What each fuel is called, and whether it counts as low-carbon on the panel. Imports and biomass are kept apart on purpose: the API gives them their own lines, and what they are made
// from (and how their carbon is counted) is not something this panel can tell.
export const FUELS = {
  wind: { name: "Wind", colour: "#0E7490", group: "low" },
  solar: { name: "Solar", colour: "#D9A21B", group: "low" },
  hydro: { name: "Hydro", colour: "#2F80ED", group: "low" },
  nuclear: { name: "Nuclear", colour: "#7A5AF0", group: "low" },
  biomass: { name: "Biomass", colour: "#5E8C3A", group: "biomass" },
  imports: { name: "Imports", colour: "#8C97AD", group: "imports" },
  gas: { name: "Gas", colour: "#C0561F", group: "fossil" },
  coal: { name: "Coal", colour: "#3F4756", group: "fossil" },
  other: { name: "Other", colour: "#B9C0CE", group: "other" },
};

export const BANDS = {
  "very low": { colour: "#1F7A4D", words: "very low" },
  low: { colour: "#4C9A3E", words: "low" },
  moderate: { colour: "#C7871A", words: "moderate" },
  high: { colour: "#C0561F", words: "high" },
  "very high": { colour: "#B3262E", words: "very high" },
};

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// { from, to, forecast, actual, index } for the half hour now under way, or null if the answer is not what was expected.
export function parseNow(json) {
  const d = json?.data?.[0];
  const i = d?.intensity;
  if (!d || !i) return null;
  const value = num(i.actual) ?? num(i.forecast);
  if (value === null || !BANDS[i.index]) return null;
  return { from: d.from, to: d.to, value, actual: num(i.actual), forecast: num(i.forecast), index: i.index };
}

// [{ fuel, perc }] sorted largest first, with nothing under 0.05 kept, or null. The shares should add to about 100; if they are far from it the answer is not trusted.
export function parseMix(json) {
  const mix = json?.data?.generationmix;
  if (!Array.isArray(mix)) return null;
  const rows = mix.filter((m) => FUELS[m.fuel] && num(m.perc) !== null);
  const total = rows.reduce((s, m) => s + m.perc, 0);
  if (rows.length < 5 || total < 97 || total > 103) return null;
  return {
    from: json.data.from,
    to: json.data.to,
    rows: rows.filter((m) => m.perc >= 0.05).map((m) => ({ fuel: m.fuel, perc: m.perc })).sort((a, b) => b.perc - a.perc),
  };
}

// The share from wind, solar, hydro and nuclear, and the share from gas and coal.
export function groups(mix) {
  const sum = (g) => mix.rows.filter((r) => FUELS[r.fuel].group === g).reduce((s, r) => s + r.perc, 0);
  return { low: sum("low"), fossil: sum("fossil"), biomass: sum("biomass"), imports: sum("imports") };
}

// The day so far: one entry per half hour, { from, forecast, actual }, in time order. `actual` is null for half hours that have not happened yet.
export function parseDay(json) {
  const rows = json?.data;
  if (!Array.isArray(rows) || rows.length < 40) return null;
  const out = rows.map((r) => ({ from: r.from, forecast: num(r.intensity?.forecast), actual: num(r.intensity?.actual) }));
  if (out.some((r) => !r.from) || out.every((r) => r.actual === null)) return null;
  return out;
}

// The time of a half-hour as a UK clock time, "14:30".
export function clock(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London", hour12: false }).format(d);
}

// A plain sentence for what the figure means, using only what the API itself says about its band.
export function nowSentence(now) {
  return `${Math.round(now.value)} grams of carbon dioxide for every unit (kilowatt-hour) of electricity generated, which the operator rates as ${BANDS[now.index].words}.`;
}
