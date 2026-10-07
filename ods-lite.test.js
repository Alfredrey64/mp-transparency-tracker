import { describe, it, expect } from "vitest";
import zlib from "node:zlib";
import { readOds } from "./ods-lite.js";

// Builds a one-file zip holding content.xml, stored (not compressed) or deflated.
function zip(name, text, deflate) {
  const raw = Buffer.from(text, "utf8");
  const data = deflate ? zlib.deflateRawSync(raw) : raw;
  const nameBuf = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(deflate ? 8 : 0, 8);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(raw.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(deflate ? 8 : 0, 10);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(raw.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(0, 42);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + nameBuf.length, 12);
  end.writeUInt32LE(local.length + nameBuf.length + data.length, 16);
  return Buffer.concat([local, nameBuf, data, central, nameBuf, end]);
}

const xml = `<office:document-content><office:body><office:spreadsheet>
<table:table table:name="Data">
<table:table-row><table:table-cell office:value-type="string"><text:p>Date</text:p></table:table-cell><table:table-cell office:value-type="string"><text:p>Arrivals &amp; more</text:p></table:table-cell></table:table-row>
<table:table-row><table:table-cell office:value-type="date" office:date-value="2025-01-02T00:00:00"><text:p>02/01/2025</text:p></table:table-cell><table:table-cell office:value-type="float" office:value="12"><text:p>12</text:p></table:table-cell></table:table-row>
<table:table-row table:number-rows-repeated="2"><table:table-cell table:number-columns-repeated="2"/><table:table-cell office:value-type="float" office:value="7"/></table:table-row>
<table:table-row table:number-rows-repeated="1048000"><table:table-cell table:number-columns-repeated="1024"/></table:table-row>
</table:table>
<table:table table:name="Empty"><table:table-row/></table:table>
</office:spreadsheet></office:body></office:document-content>`;

describe("ods reader", () => {
  for (const deflate of [false, true]) {
    it(`reads text, dates, numbers and repeated cells (${deflate ? "deflated" : "stored"})`, () => {
      const book = readOds(zip("content.xml", xml, deflate));
      expect(Object.keys(book)).toEqual(["Data", "Empty"]);
      expect(book.Data[0]).toEqual(["Date", "Arrivals & more"]);
      expect(book.Data[1]).toEqual(["2025-01-02", 12]);
      expect(book.Data[2]).toEqual([null, null, 7]);
      expect(book.Data).toHaveLength(4);
    });
  }
});
