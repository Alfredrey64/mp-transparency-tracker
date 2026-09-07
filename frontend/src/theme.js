// Cool slate + teal — not navy/cream, not brown/terracotta.
// ink/paper/hairline/sidebar tokens resolve through CSS variables (defined in
// index.css) so dark mode can repaint them instantly with no re-render.
// brass/gold stay fixed hex because they're used in alpha-suffix tricks
// throughout the app (`${COLORS.brass}1A`) that don't work with var() —
// and a bright teal accent reads fine on both a light and a dark ground.
export const COLORS = {
  ink: "var(--c-ink)",
  inkSoft: "var(--c-ink-soft)",
  paper: "var(--c-paper)",
  paperCard: "var(--c-paper-card)",
  hairline: "var(--c-hairline)",
  brass: "#0D8A7A",
  gold: "#C9A227",
  sidebarBg: "var(--c-sidebar-bg)",
  sidebarBgDeep: "var(--c-sidebar-bg-deep)",
  sidebarText: "var(--c-sidebar-text)",
};

export const FONT_DISPLAY = "'Newsreader', Georgia, serif";
export const FONT_BODY = "'Public Sans', system-ui, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', monospace";

export const PAGE_PADDING = "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 40px) 60px";
