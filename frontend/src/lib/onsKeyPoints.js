// Turns a key-point template into a sentence using the latest figures.
//
// Tokens:  {value} the latest figure           {when} "in August 2026" / "in the year to March 2026"
//          {period} the bare period             {change} "up 0.3 percentage points on a year earlier"
//          {yearAgo} the figure a year before    {peak} / {peakWhen} the highest figure and when
// Returns a list of parts, { text, strong }, so the figures can be set in bold, or null if the series has no data.

import { formatValue, latestInfo, changeWords, whenPhrase, labelFor } from "./onsFormat";

const TOKEN = /\{(\w+)\}/g;

export function fillKeyPoint(template, def, points) {
  const info = latestInfo(def, points);
  if (!info) return null;
  let high = points[0];
  for (const p of points) if (p[1] > high[1]) high = p;
  const values = {
    value: formatValue(def.format, info.value),
    when: whenPhrase(def, info.period),
    period: labelFor(def, info.period),
    change: changeWords(info.change) || "little changed on a year earlier",
    yearAgo: info.before ? formatValue(def.format, info.before.value) : null,
    peak: formatValue(def.format, high[1]),
    peakWhen: labelFor(def, high[0]).replace(/^Year to/, "year to"),
  };
  const strongTokens = new Set(["value", "peak"]);
  const parts = [];
  let last = 0;
  for (const m of template.matchAll(TOKEN)) {
    const v = values[m[1]];
    if (v === undefined || v === null) return null;
    if (m.index > last) parts.push({ text: template.slice(last, m.index), strong: false });
    parts.push({ text: v, strong: strongTokens.has(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < template.length) parts.push({ text: template.slice(last), strong: false });
  return parts;
}

export const keyPointText = (parts) => parts.map((p) => p.text).join("");
