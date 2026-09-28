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
export const COLORS = {
  ink: "var(--c-ink)",
  inkSoft: "var(--c-ink-soft)",
  paper: "var(--c-paper)",
  paperCard: "var(--c-paper-card)",
  hairline: "var(--c-hairline)",
  accent: "#4F46E5",
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
export const FONT_MONO = "'IBM Plex Mono', monospace";

export const PAGE_PADDING = "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 40px) 60px";
