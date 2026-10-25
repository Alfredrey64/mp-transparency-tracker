// A brighter, more saturated pass on the palette — the previous
// aged-parchment/institutional-brass system read as drab rather than
// dignified once it was actually on screen. ink/paper/hairline/sidebar
// tokens resolve through CSS variables (defined in index.css) so dark/light
// mode can repaint them instantly; the ground itself moved from a warm tan
// parchment to a clean, near-white (light) / rich indigo-charcoal (dark),
// so colour comes from the accents against a quiet backdrop rather than
// from a tinted page. `accent` is the one sitewide primary (buttons, links,
// active states); gold/commonsGreen/garnet are narrower, meaning-specific
// accents (Royal Assent, the two Houses' actual bench colours, warnings).
// Each section of the sidebar also gets its own vivid accent (see
// Sidebar.jsx's SECTIONS) — that's the main mechanism for telling one part
// of the site from another at a glance, not a single colour repeated
// everywhere.
// Accent colours are often too pale (or, on the dark pages, too deep) to read as small text. For text, this mixes the accent with the ink colour by
// just enough to reach a contrast of about 4.8 to 1 on the page and its darkest tinted cards, separately for the light and the dark pages, so a
// colour that already reads well is left alone. A colour that is not plain hex falls back to half and half (light) or as it is (dark).
const toLinear = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const fromLinear = (c) => Math.round(255 * Math.max(0, Math.min(1, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)));
const parseHex = (hex) => {
  let h = String(hex).trim().replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(h) ? [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) : null;
};
const toOklab = ([r, g, b]) => {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const fromOklab = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(fromLinear);
};
const relLum = (rgb) => { const [r, g, b] = rgb.map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = relLum(a); const y = relLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mixOklab = (a, b, share) => { const p = toOklab(a); const q = toOklab(b); return fromOklab(p.map((v, i) => v * share + q[i] * (1 - share))); };
// The ink and the darkest backgrounds a bit of text can land on, light and dark (see index.css): the page, a card, a tinted chip.
const THEME_EDGES = {
  light: { ink: [10, 20, 36], worst: parseHex("#CBD3E2") },
  dark: { ink: [242, 245, 251], worst: parseHex("#243149") },
};
const shareFor = (rgb, edge, min = 4.8) => {
  for (let share = 100; share > 0; share -= 4) if (ratio(mixOklab(rgb, edge.ink, share / 100), edge.worst) >= min) return share;
  return 0;
};
const readableCache = new Map();
export const readable = (accent) => {
  if (readableCache.has(accent)) return readableCache.get(accent);
  const rgb = parseHex(accent);
  const out = rgb
    ? `light-dark(color-mix(in oklab, ${accent} ${shareFor(rgb, THEME_EDGES.light)}%, var(--c-ink)), color-mix(in oklab, ${accent} ${shareFor(rgb, THEME_EDGES.dark)}%, var(--c-ink)))`
    : `color-mix(in srgb, ${accent} var(--acc-text, 100%), var(--c-ink))`;
  readableCache.set(accent, out);
  return out;
};

// The opposite case: a bright accent used as a fill under white text. Mixed towards near-black by just enough for the white to reach a contrast of
// about 4.6 to 1 (never less than the 74% of the accent the site has always used where that is already enough).
const solidCache = new Map();
export const solid = (accent) => {
  if (solidCache.has(accent)) return solidCache.get(accent);
  const rgb = parseHex(accent);
  let share = 74;
  if (rgb) {
    const dark = [16, 16, 24];
    const white = [255, 255, 255];
    share = 100;
    while (share > 30 && ratio(mixOklab(rgb, dark, share / 100), white) < 4.6) share -= 2;
    share = Math.min(74, share);
  }
  const out = `color-mix(in oklab, ${accent} ${share}%, #101018)`;
  solidCache.set(accent, out);
  return out;
};

// Text that sits on a coloured fill: white or near-black, whichever reads better (at least 4.5 to 1 where either can). Colours must be hex.
const channel = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminance = (hex) => {
  let h = String(hex).replace("#", "").slice(0, 6);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
export const onFill = (fill) => {
  const l = luminance(fill);
  // A fill that is a theme colour (such as the soft ink) is dark on the light pages and light on the dark ones, so the page colour reads on it.
  if (l === null) return "var(--c-paper)";
  const dark = 0.0066; // luminance of #14121f, the dark text
  return (1.05) / (l + 0.05) >= (l + 0.05) / (dark + 0.05) ? "#ffffff" : "#14121f";
};

// A coloured fill and the text on it, as style properties. The fill is kept if white or dark text reads on it (4.5 to 1); otherwise it is darkened
// until white does, so a party colour in the middle of the range still gives readable initials.
export const chip = (fill) => {
  const rgb = parseHex(fill);
  if (!rgb) return { background: fill, color: onFill(fill) };
  if (ratio(rgb, [255, 255, 255]) >= 4.5) return { background: fill, color: "#ffffff" };
  if (ratio(rgb, [20, 18, 31]) >= 4.5) return { background: fill, color: "#14121f" };
  return { background: solid(fill), color: "#ffffff" };
};

export const COLORS = {
  ink: "var(--c-ink)",
  inkSoft: "var(--c-ink-soft)",
  paper: "var(--c-paper)",
  paperCard: "var(--c-paper-card)",
  paperSunk: "var(--c-paper-sunk)",
  brand: "var(--c-brand)",
  navy: "var(--c-navy)",
  hairline: "var(--c-hairline)",
  accent: "#1E4FB8",
  // The accent as text on the page or on a pale tint of itself, readable on both the light and the dark pages.
  accentText: readable("#1E4FB8"),
  // The base accent is tuned for white text on top of it (buttons) and
  // for text on a light page — against the sidebar's own dark ground it
  // loses almost all contrast, since both sit at a similarly low
  // luminance. This lighter variant is for exactly that one case: accent
  // text/icons directly on the dark sidebar.
  accentOnDark: "#9DBBFF",
  gold: "#E8B93D",
  commonsGreen: "#1FA97C",
  garnet: "#E63946",
  sidebarBg: "var(--c-sidebar-bg)",
  sidebarBgDeep: "var(--c-sidebar-bg-deep)",
  sidebarText: "var(--c-sidebar-text)",
};

// Type: Newsreader, a serif made for reading on screen, for headings and the big numbers of a page; Public Sans, a plain and legible sans designed
// for public services, for everything else. IBM Plex Mono is for tabular figures in dense tables.
export const FONT_DISPLAY = "'Newsreader', Georgia, serif";
export const FONT_BODY = "'Public Sans', system-ui, sans-serif";
// The wordmark: the same serif, heavier.
export const FONT_BRAND = "'Newsreader', Georgia, serif";
export const FONT_MONO = "'IBM Plex Mono', monospace";
// For figures that are the point of a page: percentages, counts, majorities. Public Sans with lining, tabular figures, so columns of numbers
// line up and a "1" does not shrink into the text.
export const FONT_NUMERIC = "'Public Sans', system-ui, sans-serif";
export const numeric = { fontFamily: FONT_NUMERIC, fontVariantNumeric: "lining-nums tabular-nums", fontFeatureSettings: "'lnum' 1, 'tnum' 1", fontWeight: 650, letterSpacing: "-0.01em" };

export const PAGE_PADDING = "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 40px) 60px";
