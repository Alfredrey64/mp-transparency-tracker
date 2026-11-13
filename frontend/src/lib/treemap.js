// A squarified treemap (Bruls, Huizing and van Wijk): lays a list of values out as rectangles whose areas are in proportion to the values and which stay close to square.
// Give it the values in the order they should be placed (biggest first reads best) and the size of the space; it returns { [key]: { x, y, w, h } } in the same units.
// The budget map on the departments page calls it once for each year with the same order, so a department keeps its place and only changes size.
export function squarify(items, W, H) {
  const total = items.reduce((n, d) => n + d.value, 0);
  const out = {};
  if (!(total > 0)) return out;
  const scale = (W * H) / total;
  const nodes = items.map((d) => ({ key: d.key, area: d.value * scale }));
  let x = 0;
  let y = 0;
  let w = W;
  let h = H;
  const sum = (row) => row.reduce((n, r) => n + r.area, 0);
  // The worst (most stretched) shape in a row laid along a side of the given length.
  const worst = (row, side) => {
    const s = sum(row);
    const big = Math.max(...row.map((r) => r.area));
    const small = Math.min(...row.map((r) => r.area));
    return Math.max((side * side * big) / (s * s), (s * s) / (side * side * small));
  };
  const place = (row) => {
    const s = sum(row);
    if (w >= h) {
      const cw = s / h;
      let cy = y;
      for (const r of row) { const rh = r.area / cw; out[r.key] = { x, y: cy, w: cw, h: rh }; cy += rh; }
      x += cw;
      w -= cw;
    } else {
      const rh = s / w;
      let cx = x;
      for (const r of row) { const rw = r.area / rh; out[r.key] = { x: cx, y, w: rw, h: rh }; cx += rw; }
      y += rh;
      h -= rh;
    }
  };
  let row = [];
  let i = 0;
  while (i < nodes.length) {
    const side = Math.min(w, h);
    if (!row.length || worst([...row, nodes[i]], side) <= worst(row, side)) { row.push(nodes[i]); i++; } else { place(row); row = []; }
  }
  if (row.length) place(row);
  return out;
}
