import { describe, it, expect } from "vitest";
import { readXlsx, columnIndex } from "./xlsx-lite.js";

// A tiny zip writer (files stored, not compressed) so the reader can be tested without a real spreadsheet.
function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBuf = Buffer.from(name);
    const data = Buffer.from(text);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBuf.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, dir, end]);
}

const workbook = zip({
  "xl/workbook.xml": '<workbook><sheets><sheet name="Table A1a" sheetId="1" r:id="rId1"/></sheets></workbook>',
  "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>',
  "xl/sharedStrings.xml": "<sst><si><t>Offence</t></si><si><t>Violence &amp; theft</t></si></sst>",
  "xl/worksheets/sheet1.xml":
    '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1"><v>2026</v></c></row><row r="3"><c r="A3" t="s"><v>1</v></c><c r="B3"><v>1.5</v></c><c r="C3" t="inlineStr"><is><t>[x]</t></is></c></row></sheetData></worksheet>',
});

describe("xlsx reader", () => {
  it("turns a column reference into an index", () => {
    expect(columnIndex("A1")).toBe(0);
    expect(columnIndex("C12")).toBe(2);
    expect(columnIndex("AA3")).toBe(26);
  });

  it("reads sheets into rows, with text, numbers and gaps in the right places", () => {
    const wb = readXlsx(workbook);
    const rows = wb["Table A1a"];
    expect(rows[0]).toEqual(["Offence", undefined, 2026]);
    expect(rows[1]).toBeUndefined();
    expect(rows[2]).toEqual(["Violence & theft", 1.5, "[x]"]);
  });

  it("rejects things that are not spreadsheets", () => {
    expect(() => readXlsx(Buffer.from("not a zip"))).toThrow();
  });
});
