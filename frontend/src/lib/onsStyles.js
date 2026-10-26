// Shared look for the Britain in numbers pages, so the sector pages and the
// compare-over-time page read as one family.

import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";

export const card = {
  // A wash of the page's own colour at the top of the card, fading to the plain card, so the colour runs all the way down the page and not only in its band.
  background: "linear-gradient(170deg, color-mix(in srgb, var(--page-accent, var(--c-brand)) 6%, var(--c-paper-card)), var(--c-paper-card) 200px)",
  border: "1px solid color-mix(in srgb, var(--page-accent, var(--c-brand)) 16%, var(--c-hairline))",
  // A line in the page's own colour along the top.
  borderTop: "4px solid color-mix(in srgb, var(--page-accent, var(--c-brand)) 70%, var(--c-hairline))",
  borderRadius: 18,
  padding: "clamp(18px, 4.5vw, 28px)",
  boxShadow: "var(--shadow-1)",
};

// Bold titles on every card.
export const cardTitle = { fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0, lineHeight: 1.25 };

export const smallTitle = { fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 4px" };

export const pillStyle = (on) => ({
  fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: on ? 700 : 600, padding: "7px 14px", borderRadius: 8, cursor: "pointer",
  border: `1px solid ${on ? "color-mix(in srgb, var(--page-accent, var(--c-brand)) 80%, #000)" : COLORS.hairline}`, background: on ? "color-mix(in srgb, var(--page-accent, var(--c-brand)) 80%, #000)" : "transparent", color: on ? "#fff" : COLORS.inkSoft,
  transition: "background 0.15s, color 0.15s, border-color 0.15s",
});

export const dateText = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
