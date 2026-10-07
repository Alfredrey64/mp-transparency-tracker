// A small, dependency-free reader for .ods (OpenDocument) spreadsheets, which is how
// the Home Office publishes its immigration and small boat statistics. An .ods is a zip
// holding content.xml; this turns each table into rows of cell values (numbers stay
// numbers, dates become "YYYY-MM-DD" text, everything else is text).

import { unzip } from "./xlsx-lite.js";

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const attr = (attrs, name) => new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1];
// Spreadsheets end with a long run of empty rows and columns; never expand those.
const MAX_REPEAT = 50;

function cellValue(attrs, inner) {
  const type = attr(attrs, "office:value-type");
  if (!type) return null;
  if (type === "float" || type === "percentage" || type === "currency") return Number(attr(attrs, "office:value"));
  if (type === "date") return attr(attrs, "office:date-value")?.slice(0, 10) ?? null;
  const text = [...(inner ?? "").matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)]
    .map((m) => decode(m[1].replace(/<text:s[^>]*\/>/g, " ").replace(/<[^>]+>/g, "")))
    .join("\n");
  return text === "" ? null : text;
}

function tableRows(xml) {
  const rows = [];
  for (const row of xml.matchAll(/<table:table-row([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-row>)/g)) {
    const repeat = Math.min(Number(attr(row[1], "table:number-rows-repeated") ?? 1), MAX_REPEAT);
    const cells = [];
    for (const c of (row[2] ?? "").matchAll(/<table:(?:covered-)?table-cell([^>]*?)(?:\/>|>([\s\S]*?)<\/table:(?:covered-)?table-cell>)/g)) {
      const times = Math.min(Number(attr(c[1], "table:number-columns-repeated") ?? 1), MAX_REPEAT);
      const value = cellValue(c[1], c[2]);
      for (let i = 0; i < times; i++) cells.push(value);
    }
    while (cells.length && cells[cells.length - 1] === null) cells.pop();
    for (let i = 0; i < repeat; i++) rows.push(cells.slice());
  }
  while (rows.length && !rows[rows.length - 1].length) rows.pop();
  return rows;
}

// Returns { "Sheet name": [[cell, ...], ...] }.
export function readOds(buf) {
  const files = unzip(buf);
  const content = files.get("content.xml");
  if (!content) throw new Error("No content.xml in the .ods file");
  const xml = content();
  const sheets = {};
  for (const t of xml.matchAll(/<table:table table:name="([^"]*)"[^>]*>([\s\S]*?)<\/table:table>/g)) {
    sheets[decode(t[1])] = tableRows(t[2]);
  }
  return sheets;
}
