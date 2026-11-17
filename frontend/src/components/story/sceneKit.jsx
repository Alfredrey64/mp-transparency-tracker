/** @jsxImportSource react */
// Small helpers shared by the heading-band scenes (EconArt.jsx and EnvArt.jsx).

export const rnd = (i) => ((i * 9301 + 49297) % 233280) / 233280;

// Rows of lit windows on a block: [x, y, columns, rows, gap].
export const windows = (x, y, cols, rows, gx = 11, gy = 13, seed = 0) => Array.from({ length: cols * rows }, (_, i) => {
  const c = i % cols; const r = Math.floor(i / cols);
  return <rect key={`${x}-${y}-${i}`} className="hs-win" x={x + c * gx} y={y + r * gy} width="5" height="7" rx="1" style={{ "--d": `${0.6 + rnd(i + seed) * 3.4}s` }} />;
});
