// Shared look for the Britain in numbers pages, so the sector pages and the
// compare-over-time page read as one family.

import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";

export const card = {
  background: COLORS.paperCard,
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: 22,
  padding: "clamp(18px, 4.5vw, 26px)",
  boxShadow: "0 18px 40px -26px rgba(0, 0, 0, 0.55)",
};

// Bold titles on every card.
export const cardTitle = { fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0, lineHeight: 1.25 };

export const smallTitle = { fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 4px" };

export const pillStyle = (on) => ({
  fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: on ? 700 : 600, padding: "7px 14px", borderRadius: 999, cursor: "pointer",
  border: `1px solid ${on ? COLORS.ink : COLORS.hairline}`, background: on ? COLORS.ink : "transparent", color: on ? COLORS.paper : COLORS.inkSoft,
  transition: "background 0.15s, color 0.15s, border-color 0.15s",
});

export const dateText = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
