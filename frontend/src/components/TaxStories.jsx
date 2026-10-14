import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { storiesFor } from "../data/taxStories";
import { whenText } from "../lib/taxRates";

// The stories behind the biggest changes to this tax, from data/taxStories.js.

export default function TaxStories({ taxId, accent }) {
  const stories = storiesFor(taxId);
  if (!stories.length) return null;
  return (
    <section aria-labelledby="h-tax-stories" style={{ marginTop: 28 }}>
      <h3 id="h-tax-stories" style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: 0 }}>The story behind the changes</h3>
      <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 10 }}>
        {stories.map((s) => (
          <li key={s.id} style={{ padding: "13px 16px", borderRadius: 16, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${accent}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{whenText({ date: s.date, p: "m" })}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700, color: COLORS.ink, marginTop: 2 }}>{s.title}</div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 }}>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
