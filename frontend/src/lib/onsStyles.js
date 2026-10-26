// Shared look for the Britain in numbers pages, so the sector pages and the
// compare-over-time page read as one family.

import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";

export const card = {
  background: COLORS.paperCard,
  border: `1px solid ${COLORS.hairline}`,
  // A line in the page's own colour along the top, so every page has its colour all the way down and not only in its band.
  borderTop: "3px solid color-mix(in srgb, var(--page-accent, var(--c-brand)) 60%, var(--c-hairline))",
  borderRadius: 14,
  padding: "clamp(18px, 4.5vw, 28px)",
  boxShadow: "var(--shadow-1)",
};

// Bold titles on every card.
export const cardTitle = { fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0, lineHeight: 1.25 };

export const smallTitle = { fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 4px" };

export const pillStyle = (on) => ({
  fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: on ? 700 : 600, padding: "7px 14px", borderRadius: 8, cursor: "pointer",
  border: `1px solid ${on ? COLORS.ink : COLORS.hairline}`, background: on ? COLORS.ink : "transparent", color: on ? COLORS.paper : COLORS.inkSoft,
  transition: "background 0.15s, color 0.15s, border-color 0.15s",
});

export const dateText = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
