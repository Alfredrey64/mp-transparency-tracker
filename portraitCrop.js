// portraitCrop.js — finds where Parliament's own square, face-centred portrait sits inside its full-size photograph.
//
// Parliament's Members API sends a member's picture three ways: a 240-pixel square (what the site has used so far), a 260-pixel square ("OneOne"), and the whole photograph, about
// 730 x 1100 pixels (cropType "FullSize"), which shows a lot more than a face. The square is a cut from the whole photograph, chosen by Parliament so the face is centred. To
// show a sharp face without choosing a crop by guesswork, this looks for that square inside the large photograph (it slides a shrunken copy of the square over a shrunken copy of the
// photograph and keeps the place where the two agree best) and returns the rectangle to cut from the large one. Pure and dependency-free, so it can be tested.
//
// Everything is greyscale. rgb buffers are width x height x 3 bytes, as decodeBmp in portraitImage.js returns them.

export function toGrey(rgb, width, height) {
  const out = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) out[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
  return out;
}

// Shrinks a greyscale image to w x h by averaging the pixels that fall in each new pixel (area sampling, so no stripes).
export function shrink(grey, width, height, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = (y * height) / h, y1 = ((y + 1) * height) / h;
    for (let x = 0; x < w; x++) {
      const x0 = (x * width) / w, x1 = ((x + 1) * width) / w;
      let sum = 0, weight = 0;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) {
        const wy = Math.min(yy + 1, y1) - Math.max(yy, y0);
        for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
          const wx = Math.min(xx + 1, x1) - Math.max(xx, x0);
          sum += grey[yy * width + xx] * wy * wx; weight += wy * wx;
        }
      }
      out[y * w + x] = sum / weight;
    }
  }
  return out;
}

// Mean absolute difference between the s x s window of `big` at (x, y) and `small` (s x s), each with its own average taken off so a slightly different brightness does not matter.
function difference(big, bw, x, y, small, s, smallMean) {
  let mean = 0;
  for (let j = 0; j < s; j++) { const row = (y + j) * bw + x; for (let i = 0; i < s; i++) mean += big[row + i]; }
  mean /= s * s;
  let total = 0;
  for (let j = 0; j < s; j++) { const row = (y + j) * bw + x; for (let i = 0; i < s; i++) total += Math.abs(big[row + i] - mean - (small[j * s + i] - smallMean)); }
  return total / (s * s);
}

const meanOf = (a) => { let t = 0; for (const v of a) t += v; return t / a.length; };

// Looks for the square. `full` and `ref` are { grey, width, height }. Returns { x, y, side, error } in the full photograph's own pixels. `error` is the average grey-level
// difference per pixel at the best place (a true cut is usually under 6; anything above about 20 means it was not found and the caller should not trust it).
export function findSquareCrop(full, ref) {
  const top = Math.min(full.width, full.height);
  // Coarse pass on a picture about 1/8 the size.
  const f = 8;
  const cw = Math.round(full.width / f), ch = Math.round(full.height / f);
  const big = shrink(full.grey, full.width, full.height, cw, ch);
  let best = { error: Infinity, x: 0, y: 0, side: top };
  const lo = Math.max(8, Math.floor((top * 0.3) / f)), hi = Math.min(cw, ch);
  for (let s = lo; s <= hi; s++) {
    const small = shrink(ref.grey, ref.width, ref.height, s, s);
    const sm = meanOf(small);
    for (let y = 0; y + s <= ch; y++) for (let x = 0; x + s <= cw; x++) {
      const e = difference(big, cw, x, y, small, s, sm);
      if (e < best.error) best = { error: e, x, y, side: s };
    }
  }
  // Fine pass on a picture 1/2 the size, around where the coarse pass landed.
  const g = 2;
  const fw = Math.round(full.width / g), fh = Math.round(full.height / g);
  const mid = shrink(full.grey, full.width, full.height, fw, fh);
  const scale = f / g;
  const cx = best.x * scale, cy = best.y * scale, cs = best.side * scale;
  let fine = { error: Infinity, x: cx, y: cy, side: cs };
  for (let s = Math.max(16, cs - 10); s <= Math.min(fw, fh, cs + 10); s++) {
    const small = shrink(ref.grey, ref.width, ref.height, s, s);
    const sm = meanOf(small);
    for (let y = Math.max(0, cy - 10); y + s <= fh && y <= cy + 10; y++) for (let x = Math.max(0, cx - 10); x + s <= fw && x <= cx + 10; x++) {
      const e = difference(mid, fw, x, y, small, s, sm);
      if (e < fine.error) fine = { error: e, x, y, side: s };
    }
  }
  const out = { x: Math.round(fine.x * g), y: Math.round(fine.y * g), side: Math.round(fine.side * g), error: fine.error };
  out.side = Math.min(out.side, full.width - out.x, full.height - out.y);
  return out;
}

// What to cut when the square cannot be found: a square from the top of the photograph, where a head and shoulders photograph keeps the face, a little narrower than the whole width
// so the face fills more of it.
export function fallbackCrop(width, height) {
  const side = Math.min(width, height, Math.round(width * 0.9));
  return { x: Math.round((width - side) / 2), y: 0, side, error: null };
}
