import { COLORS, FONT_BODY } from "../theme";

// Shared by the Devolution and the union page's components.
export const ACCENT = "#9D174D";
export const li = { margin: "0 0 8px", paddingLeft: 2 };
export const group = (v) => Math.round(v).toLocaleString("en-GB");
export const jump = { marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" };
