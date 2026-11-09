// The colours of a party's banner and chart bars on the Party History page, worked out from the party's own brand colour so that each party looks like itself and its words are
// always readable. A bright brand colour (the Liberal Democrats' amber, the Greens' lime, Reform's turquoise) keeps its colour and takes dark text; a darker one takes white text,
// darkened only as far as it needs to be. (An earlier version darkened every colour for white text, which turned amber into brown.)

const INK = "#16120A";
const WHITE = "#FFFFFF";

const toRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (hex, other, t) => { const a = toRgb(hex); const b = toRgb(other); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };

export function luminance(hex) {
  const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = toRgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The most a colour may be darkened to carry white text before the party gets dark text on its own colour instead.
const MAX_DARKEN = 0.3;
const TARGET = 4.6;

const NAVY = "#0B1020";

// { from, to, fill, on, dark }: the banner's gradient from the corner where the words sit to the far corner, `fill` (the party's colour as a solid, for the chart bars and the
// lineage steps), the text colour on the banner, and whether that text is dark. A deep colour gets a rich, deep banner (its colour a shade darker towards navy, deeper still at
// the far corner) with white text; a bright one keeps its colour with dark text.
export function bannerColours(brand) {
  for (let t = 0; t <= MAX_DARKEN + 1e-9; t += 0.02) {
    const fill = mix(brand, "#000000", t);
    if (contrast(fill, WHITE) >= TARGET) return { from: mix(fill, NAVY, 0.18), to: mix(brand, NAVY, 0.55), fill, on: WHITE, dark: false };
  }
  return { from: brand, to: mix(brand, "#000000", 0.14), fill: brand, on: INK, dark: true };
}
