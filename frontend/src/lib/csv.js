// Plain CSV the way Excel, Numbers, Google Sheets and pandas all read it:
// comma separated, CRLF line ends, fields quoted when they need it, and a
// UTF-8 byte-order mark so accents and "£" survive a double-click open.

// A cell beginning with = + - @ (or a tab/CR) is read by spreadsheets as a
// formula. These files include free text written by third parties, so any
// such text cell is prefixed with an apostrophe, which spreadsheets show as
// plain text. Numbers are left alone, so a negative figure stays a number.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
  if (value == null) return "";
  let text;
  if (typeof value === "number") text = Number.isFinite(value) ? String(value) : "";
  else if (typeof value === "boolean") text = value ? "true" : "false";
  else if (value instanceof Date) text = Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  else text = String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// columns: [{ header, key | value: (row) => any }]
export function toCsv(rows, columns) {
  const header = columns.map((c) => csvCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => csvCell(c.value ? c.value(row) : row[c.key])).join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
}

export function csvFilename(slug, now = new Date()) {
  const safe = String(slug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "data";
  return `${safe}-${now.toISOString().slice(0, 10)}.csv`;
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
