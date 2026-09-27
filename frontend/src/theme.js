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

// Newsreader carries the "official record" editorial voice (headlines,
// pull quotes); Plex Sans and Plex Mono are a genuine matched family — one
// designed as a pair, not two unrelated fonts pressed into service — so
// interface chrome and tabular data read as deliberately related rather
// than a display font plus whatever sans was the default for the last
// project. Public Sans (the US government's own typeface) is gone: an odd
// borrowed identity for a UK site, and itself a common civic-tech default.
export const FONT_DISPLAY = "'Newsreader', Georgia, serif";
export const FONT_BODY = "'IBM Plex Sans', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', monospace";

export const PAGE_PADDING = "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 40px) 60px";
