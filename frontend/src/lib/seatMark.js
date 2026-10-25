// A faint chamber seating plan drawn as dots in concentric arcs: the mark behind the page headers and the home page. Built once as an image the CSS can use.
function dots(rows, perRow0, step, cx, cy, r0, dr, radius) {
  let out = "";
  for (let r = 0; r < rows; r += 1) {
    const n = perRow0 + r * step;
    const radiusRow = r0 + r * dr;
    for (let i = 0; i < n; i += 1) {
      const a = Math.PI - (Math.PI * i) / (n - 1);
      out += `<circle cx='${(cx + radiusRow * Math.cos(a)).toFixed(1)}' cy='${(cy - radiusRow * Math.sin(a)).toFixed(1)}' r='${radius}'/>`;
    }
  }
  return out;
}

export const HEMICYCLE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 270' fill='white'>${dots(7, 14, 6, 260, 262, 90, 24, 4.2)}</svg>`,
)}")`;
