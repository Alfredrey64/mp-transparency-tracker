// The drawing of the Domesday Live book mark (viewBox 120 by 84), shared by src/components/LogoMark.jsx and scripts/build-og-image.mjs so the two cannot drift.
// Everything is cubic curves: the pages bow up in the middle, the words follow a curve parallel to the top edge, and the ruled lines under them are the same
// curve moved down and cut short, so the text looks printed on a curved page. The left page is the right page mirrored about x = 60.
const r = (n) => Math.round(n * 100) / 100;
const mirror = (c) => c.map(([x, y]) => [120 - x, y]);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const split = (c, t) => {
  const [a, b, d, e] = c, ab = lerp(a, b, t), bd = lerp(b, d, t), de = lerp(d, e, t), abd = lerp(ab, bd, t), bde = lerp(bd, de, t), m = lerp(abd, bde, t);
  return [[a, ab, abd, m], [m, bde, de, e]];
};
const part = (c, from, to) => split(split(c, from)[1], (to - from) / (1 - from))[0];
const path = ([a, b, c, d]) => `M${r(a[0])} ${r(a[1])}C${r(b[0])} ${r(b[1])} ${r(c[0])} ${r(c[1])} ${r(d[0])} ${r(d[1])}`;

// The baseline the words stand on, from the spine out on the right page. Each word is centred on its own page, like the title of a book.
const BASE = [[66, 37.5], [80, 32.5], [96, 31.5], [110, 35]];
// Distance below the baseline, and the stretch of the width each ruled line covers, centred, so the lines sit under the word like a subtitle.
const RULES = [[9.5, 0.2, 0.8], [16, 0.32, 0.68]];
const down = (c, dy) => c.map(([x, y]) => [x, y + dy]);

// The cover, in halves: the right half stays put and is what the closed book shows, the left half arrives when the cover swings open.
export const COVER_RIGHT = "M60 15C76 6 98 5 118 11V69C98 64 76 65 60 75Z";
export const COVER_LEFT = "M60 15C44 6 22 5 2 11V69C22 64 44 65 60 75Z";
export const PAGE_RIGHT = "M62 19C74 11 94 10 114 14V65C94 61 74 62 62 70Z";
export const PAGE_LEFT = "M58 19C46 11 26 10 6 14V65C26 61 46 62 58 70Z";
// A thin line along the bottom of each page: the stack of paper under the top sheet.
export const STACK_RIGHT = "M62 72.6C76 65 94 64 112 68";
export const STACK_LEFT = "M58 72.6C44 65 26 64 8 68";
// Where each page dips into the spine, drawn as a soft shadow.
export const SHADE_RIGHT = "M62 19C65 17.4 68 16.4 71 16V62.600C68 62.600 65 64 62 70Z";
export const SHADE_LEFT = "M58 19C55 17.4 52 16.4 49 16V62.600C52 62.600 55 64 58 70Z";
// The front cover when the book is closed: an inset frame, and the Houses of Parliament standing inside it. The silhouette is the app icon's drawing (see
// scripts/build-icons.mjs), laid out in that drawing's own units (x 40 to 456, y 24 to 430) and then bent to the cover: every point is moved so the skyline
// fills the frame with an even margin, and the ground line and the tops of the towers follow the curve of the cover's top and bottom edges instead of
// staying ruler-straight, which is what makes it look printed on the cover and not stuck on.
export const FRAME = "M65 21C77 13.500 96 12.500 112 16.500V62.500C96 59 77 60 65 67.500Z";
const FRAME_TOP = [[65, 21], [77, 13.5], [96, 12.5], [112, 16.5]];
const FRAME_BOTTOM = [[65, 67.5], [77, 60], [96, 59], [112, 62.5]];
const bez = (c, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * c[0][k] + 3 * u * u * t * c[1][k] + 3 * u * t * t * c[2][k] + t * t * t * c[3][k]); };
const edgeY = (c, x) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (bez(c, mid)[0] < x) lo = mid; else hi = mid; } return bez(c, (lo + hi) / 2)[1]; };
const MARGIN_X = 3.4, MARGIN_Y = 3.6;
const bend = ([x, y]) => {
  const px = 65 + MARGIN_X + ((x - 40) / 416) * (47 - 2 * MARGIN_X);
  const top = edgeY(FRAME_TOP, px) + MARGIN_Y, bottom = edgeY(FRAME_BOTTOM, px) - MARGIN_Y;
  return [px, top + ((y - 24) / 406) * (bottom - top)];
};
// Straight edges are cut into short pieces first, so that once bent they curve with the cover.
const outline = (pts) => {
  const out = [];
  pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6)); for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); });
  return "M" + out.map((q) => bend(q).map((v) => Math.round(v * 100) / 100).join(" ")).join("L") + "z";
};
const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const SKYLINE = [
  box(56, 324, 200, 100), ...[56, 82, 108, 134, 160, 186, 212, 238].map((x) => box(x, 306, 16, 18)),
  box(282, 126, 96, 16), box(292, 142, 76, 282), box(327, 24, 6, 30), box(396, 348, 44, 76), box(40, 424, 416, 6),
  [[292, 126], [330, 52], [368, 126]], [[396, 348], [418, 306], [440, 348]],
];
export const PARLIAMENT = SKYLINE.map(outline).join("");
const [CLOCK_X, CLOCK_Y] = bend([330, 190]);
export const CLOCK = { cx: Math.round(CLOCK_X * 100) / 100, cy: Math.round(CLOCK_Y * 100) / 100, r: 2.2 };
// A ribbon marker hanging from the spine.
export const RIBBON = "M57.500 74.200V82L60 79.800L62.500 82V74.200Z";
export const TEXT_RIGHT = path(BASE);
export const TEXT_LEFT = path(mirror(BASE).reverse()); // runs left to right, so the words read the right way up
export const RULES_RIGHT = RULES.map(([dy, a, b]) => path(part(down(BASE, dy), a, b)));
export const RULES_LEFT = RULES.map(([dy, a, b]) => path(part(mirror(down(BASE, dy)), a, b)));

// Depth. The covers have thickness: a board edge hangs under each cover's bottom edge, and above it the block of paper shows as a pale band with fine leaf lines.
// The top edge of each cover catches the light. The left halves are the right halves mirrored about x = 60.
export const THICK_RIGHT = "M60 75C76 65 98 64 118 69V72.600C98 67.600 76 68.600 60 78.600Z";
export const THICK_LEFT = "M60 75C44 65 22 64 2 69V72.600C22 67.600 44 68.600 60 78.600Z";
export const EDGE_RIGHT = "M62 70C74 62 94 61 114 65V68.200C94 64.200 74 65.200 62 73.200Z";
export const EDGE_LEFT = "M58 70C46 62 26 61 6 65V68.200C26 64.200 46 65.200 58 73.200Z";
export const EDGE_LINES_RIGHT = ["M62 71.100C74 63.100 94 62.100 114 66.100", "M62 72.200C74 64.200 94 63.200 114 67.200"];
export const EDGE_LINES_LEFT = ["M58 71.100C46 63.100 26 62.100 6 66.100", "M58 72.200C46 64.200 26 63.200 6 67.200"];
export const LIGHT_RIGHT = "M60 15C76 6 98 5 118 11";
export const LIGHT_LEFT = "M60 15C44 6 22 5 2 11";
// The closed book seen a little from the right and above: the fore-edge of the paper shows as a pale strip down the right side of the cover, and a groove runs down
// the cover beside the spine where a hardback hinges. These show only before the cover opens (see .lg-cl in chrome.css).
export const FOREEDGE = "M118 11L123.500 13.600V71.600L118 69Z";
export const FOREEDGE_CORNER = "M118 69L123.500 71.600V74.300L118 72.600Z";
export const FOREEDGE_LINES = ["M119.500 12.300V70.100", "M120.800 12.900V70.700", "M122.100 13.300V71.200"];
export const GROOVE = "M64 19.500V68.500";
