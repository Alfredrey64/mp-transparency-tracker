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
// Accent colours are bright, which suits fills and icons but is too pale to read as small text on the cream page. For text, this mixes the
// accent with the ink colour (about half and half in light mode; the pure accent in dark mode, where bright already reads well).
export const readable = (accent) => `color-mix(in srgb, ${accent} var(--acc-text, 100%), var(--c-ink))`;

// The opposite case: a bright accent used as a fill under white text. Mixed a little towards black so the white stays readable.
export const solid = (accent) => `color-mix(in srgb, ${accent} 74%, #101018)`;

export const COLORS = {
  ink: "var(--c-ink)",
  inkSoft: "var(--c-ink-soft)",
  paper: "var(--c-paper)",
  paperCard: "var(--c-paper-card)",
  hairline: "var(--c-hairline)",
  accent: "#4F46E5",
  // The base accent is tuned for white text on top of it (buttons) and
  // for text on a light page — against the sidebar's own dark ground it
  // loses almost all contrast, since both sit at a similarly low
  // luminance. This lighter variant is for exactly that one case: accent
  // text/icons directly on the dark sidebar.
  accentOnDark: "#8B85F5",
  gold: "#E8B93D",
  commonsGreen: "#1FA97C",
  garnet: "#E63946",
  sidebarBg: "var(--c-sidebar-bg)",
  sidebarBgDeep: "var(--c-sidebar-bg-deep)",
  sidebarText: "var(--c-sidebar-text)",
};

// A confident geometric sans for display type instead of another attempt at
// "distinguished serif" — Newsreader, then Caslon, both still read as
// old-fashioned once actually on screen, which was the real complaint. Space
// Grotesk has real character (look at its lowercase "g" and "a") without
// reaching for a serif's built-in gravitas, and works at both hero and
// small-label sizes. Archivo stays for body copy — a distinct enough sans
// that the two don't blur into one typeface, but still calm at reading
// sizes. IBM Plex Mono is untouched for tabular figures.
export const FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
export const FONT_BODY = "'Archivo', system-ui, sans-serif";
// The wordmark only: a confident, modern geometric sans with presence.
export const FONT_BRAND = "'Sora', 'Space Grotesk', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', monospace";
// For figures that are the point of a page — percentages, counts, majorities.
// Fraunces is a soft, high-contrast serif with distinctive numerals, which
// sets them apart from the grotesque headings and body text around them.
// Always used with lining, tabular figures (see numeric below) so columns of
// numbers line up and a "1" doesn't shrink into the text.
export const FONT_NUMERIC = "'Fraunces', Georgia, serif";
export const numeric = { fontFamily: FONT_NUMERIC, fontVariantNumeric: "lining-nums tabular-nums", fontFeatureSettings: "'lnum' 1, 'tnum' 1" };

export const PAGE_PADDING = "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 40px) 60px";
