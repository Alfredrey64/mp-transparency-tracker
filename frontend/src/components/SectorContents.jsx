import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { card, cardTitle } from "../lib/onsStyles";
import { scrollToCard } from "../lib/scrollToCard";

// "What is on this page": every chart and explorer on a Britain in numbers page as one grid of buttons, so nothing hides off the edge
// of a scrolling row. A switch turns it into a menu: pick one and only that chart is shown, or leave it off and the buttons jump down
// the page.

function Item({ n, item, on, accent, onPick }) {
  return (
    <li style={{ minWidth: 0 }}>
      <button
        type="button" onClick={() => onPick(item.id)} aria-pressed={on} className="ons-tap"
        style={{
          display: "grid", gridTemplateColumns: "26px minmax(0, 1fr)", gap: 10, alignItems: "center", width: "100%", textAlign: "left", cursor: "pointer", font: "inherit",
          padding: "9px 12px 9px 9px", borderRadius: 12, border: `1px solid ${on ? accent : COLORS.hairline}`, background: on ? `${accent}1c` : COLORS.paper, color: COLORS.ink,
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, background: on ? accent : `${accent}22`, color: on ? "#fff" : COLORS.ink }}>{n}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: on ? 700 : 600, lineHeight: 1.3, overflowWrap: "anywhere" }}>{item.label}</span>
      </button>
    </li>
  );
}

export default function SectorContents({ groups, focusId, onFocus, accent }) {
  const all = groups.flatMap((g) => g.items);
  const focusMode = focusId !== null;
  const pick = (id) => {
    if (focusMode) {
      onFocus(id);
      requestAnimationFrame(() => document.getElementById("ons-contents")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else scrollToCard(id);
  };
  // Each group's first number, so the badges run on from one group to the next.
  const starts = groups.map((_, i) => groups.slice(0, i).reduce((n, g) => n + g.items.length, 0));
  return (
    <section id="ons-contents" aria-labelledby="h-contents" className="ons-noprint" style={{ ...card, marginTop: 22, scrollMarginTop: 70 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px 20px" }}>
        <div>
          <h2 id="h-contents" style={cardTitle}>Everything on this page</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "4px 0 0" }}>{all.length} charts and tools. {focusMode ? "Pick one to see only that." : "Tap one to jump to it."}</p>
        </div>
        <button
          type="button" role="switch" aria-checked={focusMode} onClick={() => onFocus(focusMode ? null : all[0]?.id ?? null)} className="ons-tap"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}
        >
          <span aria-hidden="true" style={{ position: "relative", width: 40, height: 22, borderRadius: 11, background: focusMode ? accent : COLORS.hairline, transition: "background 0.15s" }}>
            <span style={{ position: "absolute", top: 3, left: focusMode ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
          </span>
          Show one chart at a time
        </button>
      </div>
      {groups.map((g, gi) => g.items.length > 0 && (
        <div key={g.title} style={{ marginTop: 16 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: COLORS.inkSoft, margin: "0 0 8px" }}>{g.title}</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(230px, 100%), 1fr))", gap: 8 }}>
            {g.items.map((item, i) => <Item key={item.id} n={starts[gi] + i + 1} item={item} on={focusMode && focusId === item.id} accent={accent} onPick={pick} />)}
          </ul>
        </div>
      ))}
      {focusMode && (
        <button type="button" onClick={() => onFocus(null)} className="ons-tap" style={{ marginTop: 14, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          Show every chart again
        </button>
      )}
    </section>
  );
}
