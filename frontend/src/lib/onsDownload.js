// Downloads for the Britain in numbers pages: the figures behind a chart as a
// spreadsheet file, and a chart as a picture. Builds on the site's shared CSV
// helpers in csv.js, which also guard against spreadsheet formula injection.

import { csvCell } from "./csv";

const line = (cells) => cells.map(csvCell).join(",");

// One series: period, value, and (when inflation has been taken out) the adjusted value.
export function seriesCsv({ title, source, points, adjusted, unit }) {
  const rows = [line(["series", "period", "value", ...(adjusted ? ["value_with_inflation_removed"] : []), "unit", "source"])];
  points.forEach(([period, value], i) => {
    rows.push(line([title, period, value, ...(adjusted ? [adjusted[i]?.[1] ?? ""] : []), unit, source]));
  });
  return `${rows.join("\r\n")}\r\n`;
}

// Several places side by side: one row per period, one column per place.
export function placesCsv({ places, source, unit }) {
  const periods = [...new Set(places.flatMap((p) => p.points.map(([period]) => period)))].sort();
  const lookups = places.map((p) => new Map(p.points));
  const rows = [line(["period", ...places.map((p) => p.name), "unit", "source"])];
  for (const period of periods) rows.push(line([period, ...lookups.map((m) => m.get(period) ?? ""), unit, source]));
  return `${rows.join("\r\n")}\r\n`;
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
