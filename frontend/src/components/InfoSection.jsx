import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { Reveal } from "./Motion";

// One titled card on the pages about the site itself (About, Funding, Corrections and contact).
export default function InfoSection({ title, children }) {
  return (
    <Reveal as="section" style={{ marginBottom: 16, padding: "18px 22px 20px", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: "4px solid var(--page-accent, #2A9D8F)", borderRadius: 14, boxShadow: "var(--shadow-1)" }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, margin: "0 0 8px" }}>{title}</h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.7 }}>{children}</div>
    </Reveal>
  );
}
