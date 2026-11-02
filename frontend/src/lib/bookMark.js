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
// The front cover when the book is closed: an inset frame and a small diamond.
export const FRAME = "M65 21C77 13.500 96 12.500 112 16.500V62.500C96 59 77 60 65 67.500Z";
export const DIAMOND = "M89 33.500l5.500 7.500-5.500 7.500-5.500-7.500Z";
// A ribbon marker hanging from the spine.
export const RIBBON = "M57.500 74.200V82L60 79.800L62.500 82V74.200Z";
export const TEXT_RIGHT = path(BASE);
export const TEXT_LEFT = path(mirror(BASE).reverse()); // runs left to right, so the words read the right way up
export const RULES_RIGHT = RULES.map(([dy, a, b]) => path(part(down(BASE, dy), a, b)));
export const RULES_LEFT = RULES.map(([dy, a, b]) => path(part(mirror(down(BASE, dy)), a, b)));
