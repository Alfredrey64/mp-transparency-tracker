import { describe, it, expect } from "vitest";
import { findSquareCrop, fallbackCrop, shrink } from "./portraitCrop.js";

// A made-up photograph with enough detail (overlapping waves and a few blobs) that a square cut from it can only match in one place.
function photo(width, height) {
  const grey = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let v = 110 + 50 * Math.sin(x / 17) * Math.cos(y / 23) + 30 * Math.sin((x + 2 * y) / 31);
    for (const [bx, by, r, a] of [[90, 120, 40, 60], [210, 90, 28, -50], [150, 300, 50, 45], [60, 380, 30, -40]]) { const d = Math.hypot(x - bx, y - by); if (d < r) v += a * (1 - d / r); }
    grey[y * width + x] = v;
  }
  return { grey, width, height };
}

describe("finding Parliament's square inside the full-size photograph", () => {
  it("finds a square cut from the photograph and shrunk, to within a few pixels", () => {
    const full = photo(300, 450);
    const cut = { x: 62, y: 44, side: 196 };
    const crop = new Float32Array(cut.side * cut.side);
    for (let y = 0; y < cut.side; y++) for (let x = 0; x < cut.side; x++) crop[y * cut.side + x] = full.grey[(cut.y + y) * full.width + cut.x + x];
    const small = shrink(crop, cut.side, cut.side, 130, 130);
    const found = findSquareCrop(full, { grey: small, width: 130, height: 130 });
    expect(found.error).toBeLessThan(6);
    expect(Math.abs(found.x - cut.x)).toBeLessThanOrEqual(6);
    expect(Math.abs(found.y - cut.y)).toBeLessThanOrEqual(6);
    expect(Math.abs(found.side - cut.side)).toBeLessThanOrEqual(8);
  });

  it("reports a large error when the square is not part of the photograph", () => {
    const full = photo(300, 450);
    const other = photo(200, 200);
    for (let i = 0; i < other.grey.length; i++) other.grey[i] = 128 + 90 * Math.sin(i * 0.9) * Math.cos(i * 0.37); // unrelated noise
    expect(findSquareCrop(full, other).error).toBeGreaterThan(20);
  });

  it("falls back to a centred square from the top of the photograph, inside its edges", () => {
    const c = fallbackCrop(732, 1097);
    expect(c.y).toBe(0);
    expect(c.side).toBe(659);
    expect(c.x + c.side).toBeLessThanOrEqual(732);
    expect(fallbackCrop(300, 200).side).toBe(200);
  });
});
