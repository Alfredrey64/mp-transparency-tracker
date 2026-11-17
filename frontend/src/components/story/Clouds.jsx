/** @jsxImportSource react */
import { rnd } from "./sceneKit";

// Clouds for the daytime scenes: a list of [x, y, scale, seed]. Each one is built from its seed, so no two have the same shape: most are heaps of puffs of different sizes (taller in the middle, flat underneath, shaded
// on the underside, sometimes with a small wisp beside them), and about one in five is a long, flat sheet. They drift once (sv-drift in dayscene.css) and then rest. Pure, so the same seed always draws the same cloud.
const DEFAULT = [[470, 46, 1, 3], [1010, 30, 1.2, 9], [700, 22, 0.7, 14]];
function cloud(seed) {
  const r = (k) => rnd(seed * 13 + k * 7 + 1);
  if (r(1) < 0.22) {
    const w = 46 + r(2) * 30;
    return (
      <>
        <ellipse cx={0} cy={0} rx={w} ry={4 + r(3) * 2.5} />
        <ellipse cx={-w * 0.35 + r(4) * 10} cy={-4.5} rx={w * 0.55} ry={3.6 + r(5) * 2} />
        <ellipse cx={w * 0.3 + r(6) * 12} cy={4.5} rx={w * 0.5} ry={3 + r(7) * 1.6} />
      </>
    );
  }
  const n = 4 + Math.floor(r(2) * 3);
  const w = 48 + r(3) * 36;
  const puffs = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const rad = (6.5 + 11 * Math.sin(Math.PI * t)) * (0.76 + 0.5 * r(20 + i));
    return { cx: (t - 0.5) * w + (r(10 + i) - 0.5) * 7, cy: -rad * 0.55 - r(30 + i) * 3, rad };
  });
  const wisp = r(8) < 0.55 ? { cx: (r(9) < 0.5 ? -1 : 1) * (w / 2 + 6 + r(11) * 14), rx: 9 + r(12) * 9, ry: 2.2 + r(13) * 1.6 } : null;
  return (
    <>
      <ellipse cx={0} cy={4.5} rx={w / 2 + 4} ry={3.6} fill="#C9D8EB" opacity=".6" />
      <ellipse cx={0} cy={1} rx={w / 2 + 7} ry={5.4} />
      {puffs.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r={p.rad} />)}
      {wisp && <ellipse cx={wisp.cx} cy={2} rx={wisp.rx} ry={wisp.ry} />}
    </>
  );
}
export default function Clouds({ list = DEFAULT }) {
  return (
    <g className="sv-clouds" fill="#fff" opacity=".93">
      {list.map(([x, y, k, seed], i) => <g key={x} transform={`translate(${x} ${y}) scale(${k})`}>{cloud(seed ?? Math.round(x / 7) + i * 5)}</g>)}
    </g>
  );
}
