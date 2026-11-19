// Reads one sheet of a very large .ods (OpenDocument spreadsheet) row by row without holding the file in memory. The CQC's ratings workbook is 27 MB zipped and over a
// gigabyte once unzipped, which is far past what a whole-file reader can hold, so this inflates the zip entry as a stream and hands each row to a callback as it appears.
// Pure Node, no dependencies.

import fs from "node:fs";
import zlib from "node:zlib";

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

// Where a named entry sits in a zip: found from the central directory at the end of the file.
export function findEntry(file, name) {
  const fd = fs.openSync(file, "r");
  try {
    const size = fs.fstatSync(fd).size;
    const tailLen = Math.min(size, 65557);
    const tail = Buffer.alloc(tailLen);
    fs.readSync(fd, tail, 0, tailLen, size - tailLen);
    const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (eocd < 0) throw new Error("Not a zip file");
    const count = tail.readUInt16LE(eocd + 10);
    const cdSize = tail.readUInt32LE(eocd + 12);
    const cdOffset = tail.readUInt32LE(eocd + 16);
    const cd = Buffer.alloc(cdSize);
    fs.readSync(fd, cd, 0, cdSize, cdOffset);
    let p = 0;
    for (let n = 0; n < count; n++) {
      if (cd.readUInt32LE(p) !== 0x02014b50) break;
      const method = cd.readUInt16LE(p + 10), compressed = cd.readUInt32LE(p + 20), nameLen = cd.readUInt16LE(p + 28), extraLen = cd.readUInt16LE(p + 30), commentLen = cd.readUInt16LE(p + 32), local = cd.readUInt32LE(p + 42);
      const entry = cd.toString("utf8", p + 46, p + 46 + nameLen);
      if (entry === name) {
        const head = Buffer.alloc(30);
        fs.readSync(fd, head, 0, 30, local);
        return { method, compressed, start: local + 30 + head.readUInt16LE(26) + head.readUInt16LE(28) };
      }
      p += 46 + nameLen + extraLen + commentLen;
    }
    throw new Error(`${name} not found in the zip`);
  } finally { fs.closeSync(fd); }
}

// The cell values of one row's inner XML, with repeated cells expanded (empties capped, since a sheet ends in thousands of them).
export function parseCells(inner) {
  const cells = [];
  const re = /<table:(?:covered-)?table-cell([^>]*?)(\/>|>([\s\S]*?)<\/table:(?:covered-)?table-cell>)/g;
  let m;
  while ((m = re.exec(inner))) {
    const repeat = /number-columns-repeated="(\d+)"/.exec(m[1]);
    const times = Math.min(repeat ? Number(repeat[1]) : 1, 40);
    let value = null;
    if (m[3] && /office:value-type="/.test(m[1])) {
      const num = /office:value-type="(float|percentage|currency)"/.test(m[1]) ? /office:value="([^"]*)"/.exec(m[1]) : null;
      if (num) value = Number(num[1]);
      else {
        const parts = [...m[3].matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)].map((t) => decode(t[1].replace(/<text:s[^>]*\/>/g, " ").replace(/<[^>]+>/g, "")));
        value = parts.join("\n");
      }
    }
    for (let i = 0; i < times; i++) cells.push(value);
  }
  while (cells.length && (cells[cells.length - 1] === null || cells[cells.length - 1] === "")) cells.pop();
  return cells;
}

// Calls onRow(cells) for every non-empty row of the named sheet, in order, and stops reading as soon as the sheet ends.
export async function streamOdsSheet(file, sheet, onRow, { entry = "content.xml" } = {}) {
  const e = findEntry(file, entry);
  if (e.method !== 8) throw new Error("Unsupported zip compression");
  const input = fs.createReadStream(file, { start: e.start, end: e.start + e.compressed - 1 });
  const inflate = input.pipe(zlib.createInflateRaw());
  inflate.setEncoding("utf8");
  let buf = "";
  let started = false;
  let rows = 0;
  outer: for await (const chunk of inflate) {
    buf += chunk;
    if (!started) {
      const at = buf.indexOf(`table:name="${sheet}"`);
      if (at < 0) { buf = buf.slice(-300); continue; }
      buf = buf.slice(at);
      started = true;
    }
    let pos = 0;
    for (;;) {
      const a = buf.indexOf("<table:table-row", pos);
      const end = buf.indexOf("</table:table>", pos);
      if (end >= 0 && (a < 0 || end < a)) break outer;
      if (a < 0) break;
      const gt = buf.indexOf(">", a);
      if (gt < 0) break;
      if (buf[gt - 1] === "/") { pos = gt + 1; continue; }
      const b = buf.indexOf("</table:table-row>", gt);
      if (b < 0) break;
      const cells = parseCells(buf.slice(gt + 1, b));
      if (cells.length) { rows++; onRow(cells); }
      pos = b + 18;
    }
    buf = buf.slice(pos);
  }
  input.destroy();
  inflate.destroy();
  return rows;
}
