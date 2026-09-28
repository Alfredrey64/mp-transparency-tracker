// An institutional palette drawn from the Palace itself rather than a
// generic dashboard default: deep committee-room green as the ground,
// antique gilt brass as the signature accent (the Mace, the gilding
// throughout the building), with the Commons' green benches and a garnet
// red (already used ad hoc across the app for warnings/gaps, now a real
// token) as secondary accents. ink/paper/hairline/sidebar tokens resolve
// through CSS variables (defined in index.css) so dark/light mode can
// repaint them instantly with no re-render. brass/gold/commonsGreen/garnet
// stay fixed hex because they're used in alpha-suffix tricks throughout the
// app (`${COLORS.brass}1A`) that don't work with var(), and because each is
// tuned to read clearly on both a light and a dark ground.
export const COLORS = {
  ink: "var(--c-ink)",
  inkSoft: "var(--c-ink-soft)",
  paper: "var(--c-paper)",
  paperCard: "var(--c-paper-card)",
  hairline: "var(--c-hairline)",
  brass: "#A87C3A",
  gold: "#C9A227",
  commonsGreen: "#3B6E52",
  garnet: "#9C3B3B",
  sidebarBg: "var(--c-sidebar-bg)",
  sidebarBgDeep: "var(--c-sidebar-bg-deep)",
  sidebarText: "var(--c-sidebar-text)",
};

// Caslon is the actual historic typeface of British government print — Acts
// of Parliament, royal proclamations, and print of state were set in it for
// two centuries, which is why "it's not in Caslon" was a real 18th-century
// complaint about a document not looking official. Libre Caslon Text is a
// faithful, screen-tuned revival, used here for exactly the reason the
// original was chosen: it reads as a record, not a pitch deck. Archivo is
// its sturdy, unfussy modern counterpart for interface chrome — a grotesque
// built for institutional/civic use rather than a startup's default sans,
// keeping the old-document headline and the modern tool around it from
// fighting each other. IBM Plex Mono stays untouched for tabular figures.
export const FONT_DISPLAY = "'Libre Caslon Text', Georgia, serif";
export const FONT_BODY = "'Archivo', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', monospace";

export const PAGE_PADDING = "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 40px) 60px";
