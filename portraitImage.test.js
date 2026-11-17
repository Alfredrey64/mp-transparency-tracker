import { describe, it, expect } from "vitest";
import { decodeBmp, encodePng, toReadableImage } from "./portraitImage.js";

// a 2 x 2 bottom-up 32-bit bitmap: bottom row red, green; top row blue, white
function bmp() {
  const b = Buffer.alloc(54 + 16);
  b.write("BM", 0); b.writeUInt32LE(70, 2); b.writeUInt32LE(54, 10); b.writeUInt32LE(40, 14); b.writeInt32LE(2, 18); b.writeInt32LE(2, 22); b.writeUInt16LE(1, 26); b.writeUInt16LE(32, 28);
  const px = [[0, 0, 255], [0, 255, 0], [255, 0, 0], [255, 255, 255]]; // BGR, bottom row first
  px.forEach(([bl, g, r], i) => { b[54 + i * 4] = bl; b[55 + i * 4] = g; b[56 + i * 4] = r; b[57 + i * 4] = 0; });
  return b;
}
describe("portrait image reading", () => {
  it("reads a bitmap the right way up", () => {
    const { width, height, rgb } = decodeBmp(bmp());
    expect([width, height]).toEqual([2, 2]);
    expect([...rgb]).toEqual([0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 0]);
  });
  it("writes a PNG and passes PNG and JPEG through", () => {
    const png = toReadableImage(bmp());
    expect(png.kind).toBe("png");
    expect(png.bytes.subarray(1, 4).toString()).toBe("PNG");
    expect(encodePng(1, 1, Buffer.from([1, 2, 3])).length).toBeGreaterThan(40);
    expect(toReadableImage(Buffer.from([0xff, 0xd8, 0, 0])).kind).toBe("jpeg");
  });
  it("refuses what it cannot read instead of writing rubbish", () => {
    expect(() => decodeBmp(Buffer.from("nope"))).toThrow();
    expect(() => decodeBmp(Buffer.alloc(60))).toThrow();
  });
});
