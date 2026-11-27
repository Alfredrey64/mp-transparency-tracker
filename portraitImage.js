// portraitImage.js — turns what Parliament's Members API sends as a "thumbnail" into something a converter can read.
//
// The reply is labelled image/jpeg but is an uncompressed Windows bitmap (240 x 240, 32 bits a pixel, about 230 KB). The WebP tool cannot read bitmaps, so this reads the bitmap
// and writes the same picture as a PNG (the tool then shrinks it and saves it as WebP). A reply that is already a PNG or JPEG is passed on untouched. No dependencies.

import zlib from "node:zlib";

const CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  return table;
})();
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

// width x height pixels of red, green, blue (3 bytes each) -> a PNG file
export function encodePng(width, height, rgb, level = 9) {
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) { rows[y * (width * 3 + 1)] = 0; rgb.copy(rows, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3); }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(width, 0); head.writeUInt32BE(height, 4); head[8] = 8; head[9] = 2; // 8 bits, colour
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", head), chunk("IDAT", zlib.deflateSync(rows, { level })), chunk("IEND", Buffer.alloc(0))]);
}

// An uncompressed 24 or 32-bit Windows bitmap -> { width, height, rgb }, or throws.
export function decodeBmp(buf) {
  if (buf.length < 54 || buf[0] !== 0x42 || buf[1] !== 0x4d) throw new Error("not a bitmap");
  const offset = buf.readUInt32LE(10);
  const width = buf.readInt32LE(18);
  const rawHeight = buf.readInt32LE(22);
  const bits = buf.readUInt16LE(28);
  const compression = buf.readUInt32LE(30);
  if (![24, 32].includes(bits) || ![0, 3].includes(compression) || width <= 0 || width > 4000 || !rawHeight || Math.abs(rawHeight) > 4000) throw new Error("unsupported bitmap");
  const height = Math.abs(rawHeight);
  const bottomUp = rawHeight > 0;
  const step = bits / 8;
  const stride = Math.ceil((width * step) / 4) * 4;
  if (buf.length < offset + stride * height) throw new Error("bitmap is cut short");
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    const from = offset + (bottomUp ? height - 1 - y : y) * stride;
    for (let x = 0; x < width; x++) {
      const p = from + x * step;
      const q = (y * width + x) * 3;
      rgb[q] = buf[p + 2]; rgb[q + 1] = buf[p + 1]; rgb[q + 2] = buf[p];
    }
  }
  return { width, height, rgb };
}

// What to hand to the WebP tool: { kind: "png"|"jpeg", bytes } from whatever Parliament sent.
export function toReadableImage(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { kind: "png", bytes: buf };
  if (buf[0] === 0xff && buf[1] === 0xd8) return { kind: "jpeg", bytes: buf };
  const { width, height, rgb } = decodeBmp(buf);
  return { kind: "png", bytes: encodePng(width, height, rgb) };
}
