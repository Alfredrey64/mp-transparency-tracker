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

// The baseline the words stand on, from the spine out on the right page. The words sit either side of the spine at the same height, so UK Politics reads as one line.
const BASE = [[66, 36.5], [80, 33], [96, 32.2], [110, 35]];
// Distance below the baseline, and how much of the width (from the spine) each ruled line covers.
const RULES = [[9, 0.03, 0.97], [16, 0.03, 0.7], [23, 0.03, 0.84]];
const down = (c, dy) => c.map(([x, y]) => [x, y + dy]);

export const COVER = "M2 11C22 5 44 6 60 15C76 6 98 5 118 11V69C98 64 76 65 60 75C44 65 22 64 2 69Z";
export const PAGE_RIGHT = "M62 19C74 11 94 10 114 14V65C94 61 74 62 62 70Z";
export const PAGE_LEFT = "M58 19C46 11 26 10 6 14V65C26 61 46 62 58 70Z";
// A thin line along the bottom of both pages: the stack of paper under the top sheet.
export const STACK = "M8 68C27 64 46 65 60 73C74 65 93 64 112 68";
// A ribbon marker hanging from the spine.
export const RIBBON = "M57.5 74.2V82L60 79.8L62.5 82V74.2Z";
export const TEXT_RIGHT = path(BASE);
export const TEXT_LEFT = path(mirror(BASE).reverse()); // runs left to right, so the words read the right way up
export const RULES_RIGHT = RULES.map(([dy, a, b]) => path(part(down(BASE, dy), a, b)));
export const RULES_LEFT = RULES.map(([dy, a, b]) => path(part(mirror(down(BASE, dy)), a, b)));
