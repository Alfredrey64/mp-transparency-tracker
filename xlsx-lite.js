// A small, dependency-free reader for .xlsx files, enough to pull tables out of
// the spreadsheets the ONS publishes. An .xlsx is a zip of XML files: this reads
// the zip's index, inflates the parts it needs and turns each sheet into rows of
// cell values (numbers stay numbers, text stays text).

import zlib from "node:zlib";

export function unzip(buf) {
  // Find the end-of-central-directory record, then walk the central directory.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Not a zip file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Bad zip directory");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(start, start + compSize);
    files.set(name, () => (method === 0 ? data : zlib.inflateRawSync(data)).toString("utf8"));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

// "C12" -> column index 2.
export function columnIndex(ref) {
  const letters = /^[A-Z]+/.exec(ref)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function sharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
}

function sheetRows(xml, strings) {
  const rows = [];
  for (const row of xml.matchAll(/<row [^>]*?r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const c of row[2].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      if (!ref) continue;
      const type = /t="(\w+)"/.exec(attrs)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[2] ?? "")?.[1];
      let value = null;
      if (type === "inlineStr") value = decode(/<t[^>]*>([\s\S]*?)<\/t>/.exec(c[2] ?? "")?.[1] ?? "");
      else if (v !== undefined) value = type === "s" ? strings[Number(v)] : type === "str" ? decode(v) : Number.isNaN(Number(v)) ? decode(v) : Number(v);
      cells[columnIndex(ref)] = value;
    }
    rows[Number(row[1]) - 1] = cells;
  }
  return rows;
}

// Returns { sheetName: rows[] } for every sheet in the workbook.
export function readXlsx(buf) {
  const files = unzip(buf);
  const get = (name) => files.get(name)?.();
  const workbook = get("xl/workbook.xml");
  const rels = get("xl/_rels/workbook.xml.rels");
  if (!workbook || !rels) throw new Error("Not an xlsx workbook");
  const strings = sharedStrings(get("xl/sharedStrings.xml"));
  const target = Object.fromEntries([...rels.matchAll(/<Relationship [^>]*>/g)].map((m) => [/Id="([^"]+)"/.exec(m[0])?.[1], /Target="([^"]+)"/.exec(m[0])?.[1]]));
  const out = {};
  for (const m of workbook.matchAll(/<sheet [^>]*>/g)) {
    const name = decode(/name="([^"]+)"/.exec(m[0])[1]);
    const rid = /r:id="([^"]+)"/.exec(m[0])?.[1];
    const path = target[rid]?.replace(/^\/?(xl\/)?/, "xl/");
    const xml = path && get(path);
    if (xml) out[name] = sheetRows(xml, strings);
  }
  return out;
}
