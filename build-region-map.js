// Builds frontend/src/data/regionMap.json: the outlines of the 12 UK regions and nations as
// small SVG paths, for the interactive map on the Regions page. Run it by hand when the
// boundaries change (rarely): `node build-region-map.js`. It is not part of the daily refresh.
//
// Boundaries: Office for National Statistics, International Territorial Level 1 (January 2025),
// generalised to 500m (BUC). Contains OS data © Crown copyright and database right 2025,
// licensed under the Open Government Licence v3.0. The outlines are simplified further here.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const URL_ = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/ITL1_JAN_2025_UK_BUC/FeatureServer/0/query?where=1%3D1&outFields=ITL125CD,ITL125NM&outSR=4326&f=geojson&maxAllowableOffset=0.004&geometryPrecision=4";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "frontend", "src", "data", "regionMap.json");
const KEYS = { TLC: "ne", TLD: "nw", TLE: "yh", TLF: "em", TLG: "wm", TLH: "east", TLI: "london", TLJ: "se", TLK: "sw", TLL: "wales", TLM: "scotland", TLN: "ni" };
const NAMES = { ne: "North East", nw: "North West", yh: "Yorkshire and the Humber", em: "East Midlands", wm: "West Midlands", east: "East of England", london: "London", se: "South East", sw: "South West", wales: "Wales", scotland: "Scotland", ni: "Northern Ireland" };

const SCALE = 78; // map units per degree of latitude
const KM_PER_DEGREE_LAT = 111;
const EPSILON = 0.011; // in degrees of latitude: about 0.9 km
const SMALLEST_ISLAND = 0.02; // square degrees, so Shetland and the Western Isles stay but skerries go

// Douglas-Peucker: drop points that stay within `eps` of the straight line between their neighbours.
function simplify(points, eps) {
  if (points.length < 4) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let far = -1;
    let farDist = 0;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((points[i][0] - ax) * dy - (points[i][1] - ay) * dx) / len;
      if (d > farDist) { farDist = d; far = i; }
    }
    if (far >= 0 && farDist > eps) { keep[far] = true; stack.push([a, far], [far, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

// A ring starts and ends on the same point, which leaves nothing to measure against, so it is split
// in two at the point farthest from the start and each half is simplified on its own.
function simplifyRing(ring, eps) {
  const pts = ring.slice(0, -1);
  if (pts.length < 6) return ring;
  let far = 1;
  let farDist = 0;
  pts.forEach((p, i) => {
    const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]);
    if (d > farDist) { farDist = d; far = i; }
  });
  const first = simplify(pts.slice(0, far + 1), eps);
  const second = simplify([...pts.slice(far), pts[0]], eps);
  return [...first, ...second.slice(1)];
}

const ringArea = (ring) => ring.reduce((sum, [x, y], i) => { const [nx, ny] = ring[(i + 1) % ring.length]; return sum + (x * ny - nx * y); }, 0) / 2;
const boxArea = (ring) => {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
};

const res = await fetch(URL_);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const geo = await res.json();

// Project longitude and latitude flat, shrinking longitude by cos(latitude) so shapes look right.
const k = Math.cos((55.5 * Math.PI) / 180);
const project = ([lon, lat]) => [lon * k, -lat];

const regions = geo.features.map((f) => {
  const key = KEYS[f.properties.ITL125CD];
  if (!key) throw new Error(`Unexpected region ${f.properties.ITL125CD}`);
  const polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
  const kept = polys
    .map((p) => p[0].map(project))
    .filter((ring) => boxArea(ring) >= SMALLEST_ISLAND || polys.length === 1)
    .map((ring) => simplifyRing(ring, EPSILON))
    .filter((ring) => ring.length >= 4);
  return { key, code: f.properties.ITL125CD, name: NAMES[key], rings: kept };
});

for (const r of regions) console.log(r.key, r.rings.length, r.rings.map((x) => x.length).join(","));
const all = regions.flatMap((r) => r.rings.flat());
const minX = Math.min(...all.map((p) => p[0]));
const minY = Math.min(...all.map((p) => p[1]));
const maxX = Math.max(...all.map((p) => p[0]));
const maxY = Math.max(...all.map((p) => p[1]));
const pad = 6;
const to = ([x, y]) => [Number(((x - minX) * SCALE + pad).toFixed(1)), Number(((y - minY) * SCALE + pad).toFixed(1))];
const width = Math.ceil((maxX - minX) * SCALE + pad * 2);
const height = Math.ceil((maxY - minY) * SCALE + pad * 2);

const out = {
  attribution: "Contains OS data © Crown copyright and database right 2025. Office for National Statistics, ITL1 January 2025 boundaries, generalised and simplified.",
  width,
  height,
  kmPerUnit: Number((KM_PER_DEGREE_LAT / SCALE).toFixed(3)),
  regions: regions.map((r) => {
    const rings = r.rings.map((ring) => ring.map(to));
    const d = rings.map((ring) => `M${ring.map((p) => p.join(" ")).join("L")}Z`).join("");
    // The middle of the biggest piece, for labels and markers.
    const biggest = rings.slice().sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))[0];
    const area = ringArea(biggest);
    let cx = 0;
    let cy = 0;
    biggest.forEach(([x, y], i) => {
      const [nx, ny] = biggest[(i + 1) % biggest.length];
      const cross = x * ny - nx * y;
      cx += (x + nx) * cross;
      cy += (y + ny) * cross;
    });
    return { key: r.key, code: r.code, name: r.name, d, cx: Number((cx / (6 * area)).toFixed(1)), cy: Number((cy / (6 * area)).toFixed(1)) };
  }),
};
fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
console.log(`Saved ${out.regions.length} regions, ${width}x${height}, ${(JSON.stringify(out).length / 1024).toFixed(1)} KB`);
