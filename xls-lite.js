// A small, dependency-free reader for old Excel (.xls, BIFF8) files, which is still how NHS
// England publishes its A&E waiting time series. An .xls is an OLE2 "compound file": a tiny
// file system in which one stream, "Workbook", holds a list of records. This reads the file
// system, then the records for text (shared strings) and numbers, and returns each sheet as
// rows of cell values (numbers stay numbers, text stays text, blanks are null).

const MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const END = 0xfffffffe;

function compoundStream(buf, wanted) {
  if (!buf.subarray(0, 8).equals(MAGIC)) throw new Error("Not an .xls file");
  const sectorSize = 1 << buf.readUInt16LE(0x1e);
  const miniSize = 1 << buf.readUInt16LE(0x20);
  const sector = (n) => buf.subarray(512 + n * sectorSize, 512 + (n + 1) * sectorSize);

  // The sector allocation table, from the index sectors listed in the header (and any extra index sectors).
  const fatIds = [];
  for (let i = 0; i < 109; i++) {
    const id = buf.readUInt32LE(0x4c + i * 4);
    if (id < 0xfffffffa) fatIds.push(id);
  }
  let difat = buf.readUInt32LE(0x44);
  for (let n = buf.readUInt32LE(0x48); n > 0 && difat < 0xfffffffa; n--) {
    const s = sector(difat);
    for (let i = 0; i < sectorSize / 4 - 1; i++) {
      const id = s.readUInt32LE(i * 4);
      if (id < 0xfffffffa) fatIds.push(id);
    }
    difat = s.readUInt32LE(sectorSize - 4);
  }
  const fat = [];
  for (const id of fatIds) {
    const s = sector(id);
    for (let i = 0; i < sectorSize / 4; i++) fat.push(s.readUInt32LE(i * 4));
  }
  const chain = (start, table) => {
    const out = [];
    for (let id = start, guard = 0; id < 0xfffffffa && guard < 1e6; id = table[id], guard++) out.push(id);
    return out;
  };
  const read = (start) => Buffer.concat(chain(start, fat).map(sector));

  // The directory: 128-byte entries naming each stream.
  const dir = read(buf.readUInt32LE(0x30));
  const entries = [];
  for (let p = 0; p + 128 <= dir.length; p += 128) {
    const nameLen = dir.readUInt16LE(p + 64);
    entries.push({
      name: dir.toString("utf16le", p, p + Math.max(0, nameLen - 2)),
      type: dir[p + 66],
      start: dir.readUInt32LE(p + 116),
      size: dir.readUInt32LE(p + 120),
    });
  }
  const entry = entries.find((e) => e.type === 2 && wanted.includes(e.name));
  if (!entry) throw new Error("No workbook stream in the .xls file");
  if (entry.size >= buf.readUInt32LE(0x38)) return read(entry.start).subarray(0, entry.size);

  // Small streams live in the "mini stream" inside the root entry, with their own allocation table.
  const mini = read(entries[0].start);
  const miniFat = [];
  const miniTable = read(buf.readUInt32LE(0x3c));
  for (let i = 0; i + 4 <= miniTable.length; i += 4) miniFat.push(miniTable.readUInt32LE(i));
  return Buffer.concat(chain(entry.start, miniFat).map((id) => mini.subarray(id * miniSize, (id + 1) * miniSize))).subarray(0, entry.size);
}

function records(stream, from = 0) {
  const out = [];
  for (let p = from; p + 4 <= stream.length; ) {
    const id = stream.readUInt16LE(p);
    const len = stream.readUInt16LE(p + 2);
    out.push({ id, data: stream.subarray(p + 4, p + 4 + len), at: p });
    p += 4 + len;
    if (id === 0x000a && from > 0) break; // end of this sheet
  }
  return out;
}

// Shared strings: one SST record plus any CONTINUE records, where a string can break across two
// of them and the second piece repeats the "is it 16-bit" flag.
function sharedStrings(recs, index) {
  const parts = [recs[index].data];
  for (let i = index + 1; i < recs.length && recs[i].id === 0x003c; i++) parts.push(recs[i].data);
  const unique = parts[0].readUInt32LE(4);
  let part = 0;
  let pos = 8;
  const strings = [];
  const take = (n) => {
    // Gives back n bytes, moving on to the next piece when this one runs out.
    const chunks = [];
    while (n > 0) {
      if (pos >= parts[part].length) { part++; pos = 0; if (part >= parts.length) break; }
      const k = Math.min(n, parts[part].length - pos);
      chunks.push(parts[part].subarray(pos, pos + k));
      pos += k;
      n -= k;
    }
    return Buffer.concat(chunks);
  };
  for (let s = 0; s < unique && part < parts.length; s++) {
    const head = take(3);
    if (head.length < 3) break;
    let chars = head.readUInt16LE(0);
    let flags = head[2];
    const runs = flags & 8 ? take(2).readUInt16LE(0) : 0;
    const ext = flags & 4 ? take(4).readUInt32LE(0) : 0;
    let text = "";
    while (chars > 0) {
      if (pos >= parts[part].length) { part++; pos = 0; if (part >= parts.length) break; flags = parts[part][pos++]; }
      const wide = flags & 1;
      const fit = Math.min(chars, Math.floor((parts[part].length - pos) / (wide ? 2 : 1)));
      const bytes = take(fit * (wide ? 2 : 1));
      text += wide ? bytes.toString("utf16le") : bytes.toString("latin1");
      chars -= fit;
      if (fit === 0 && pos >= parts[part].length) continue;
    }
    take(runs * 4 + ext);
    strings.push(text);
  }
  return strings;
}

// An "RK" number packs a 30-bit integer or float, optionally divided by 100.
function rk(value) {
  let n;
  if (value & 2) n = value >> 2;
  else {
    const b = Buffer.alloc(8);
    b.writeUInt32LE(value & 0xfffffffc, 4);
    n = b.readDoubleLE(0);
  }
  return value & 1 ? n / 100 : n;
}

export function readXls(buf) {
  const stream = compoundStream(buf, ["Workbook", "Book"]);
  const all = records(stream);
  const globals = [];
  for (const r of all) {
    globals.push(r);
    if (r.id === 0x000a) break;
  }
  const sstIndex = globals.findIndex((r) => r.id === 0x00fc);
  const strings = sstIndex >= 0 ? sharedStrings(globals, sstIndex) : [];
  const sheets = {};
  for (const r of globals.filter((g) => g.id === 0x0085)) {
    const offset = r.data.readUInt32LE(0);
    const nameLen = r.data[6];
    const wide = r.data[7] & 1;
    const name = wide ? r.data.toString("utf16le", 8, 8 + nameLen * 2) : r.data.toString("latin1", 8, 8 + nameLen);
    const rows = [];
    const put = (row, col, value) => {
      (rows[row] ??= [])[col] = value;
    };
    let lastFormula = null;
    for (const c of records(stream, offset)) {
      const d = c.data;
      if (c.id === 0x00fd) put(d.readUInt16LE(0), d.readUInt16LE(2), strings[d.readUInt32LE(6)] ?? null);
      else if (c.id === 0x0203) put(d.readUInt16LE(0), d.readUInt16LE(2), d.readDoubleLE(6));
      else if (c.id === 0x027e) put(d.readUInt16LE(0), d.readUInt16LE(2), rk(d.readUInt32LE(6)));
      else if (c.id === 0x00bd) {
        const row = d.readUInt16LE(0);
        const first = d.readUInt16LE(2);
        const last = d.readUInt16LE(d.length - 2);
        for (let col = first, p = 4; col <= last; col++, p += 6) put(row, col, rk(d.readUInt32LE(p + 2)));
      } else if (c.id === 0x0204) {
        const len = d.readUInt16LE(6);
        put(d.readUInt16LE(0), d.readUInt16LE(2), d[8] & 1 ? d.toString("utf16le", 9, 9 + len * 2) : d.toString("latin1", 9, 9 + len));
      } else if (c.id === 0x0006) {
        const row = d.readUInt16LE(0);
        const col = d.readUInt16LE(2);
        if (d.readUInt16LE(12) !== 0xffff) put(row, col, d.readDoubleLE(6));
        else lastFormula = { row, col };
      } else if (c.id === 0x0207 && lastFormula) {
        const len = d.readUInt16LE(0);
        put(lastFormula.row, lastFormula.col, d[2] & 1 ? d.toString("utf16le", 3, 3 + len * 2) : d.toString("latin1", 3, 3 + len));
        lastFormula = null;
      }
    }
    let width = 0;
    for (let i = 0; i < rows.length; i++) width = Math.max(width, rows[i]?.length ?? 0);
    sheets[name] = Array.from({ length: rows.length }, (_, i) => Array.from({ length: width }, (_, j) => rows[i]?.[j] ?? null));
  }
  return sheets;
}
