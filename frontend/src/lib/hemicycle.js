// The dot positions for the half-circle seat chart (components/Hemicycle.jsx).

// Dots sit on concentric arcs, with more dots on the outer arcs. Sorting all of them by angle keeps each party's dots together as a wedge.
export function hemicycleDots(total, rows) {
  const radii = Array.from({ length: rows }, (_, i) => 0.42 + (0.58 * i) / (rows - 1));
  const sum = radii.reduce((n, r) => n + r, 0);
  const counts = radii.map((r) => Math.round((total * r) / sum));
  counts[rows - 1] += total - counts.reduce((n, c) => n + c, 0);
  const dots = [];
  radii.forEach((r, i) => {
    const n = counts[i];
    for (let j = 0; j < n; j++) dots.push({ r, a: Math.PI * (1 - (n === 1 ? 0.5 : j / (n - 1))) });
  });
  dots.sort((p, q) => q.a - p.a || p.r - q.r);
  return dots;
}
