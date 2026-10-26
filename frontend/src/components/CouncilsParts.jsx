// The small building blocks of the Your Council page: cards, headings, stat tiles, chips and bars.
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric, readable } from "../theme";
import CountUp from "./CountUp";
import { fmt, signed, scrollToId } from "./councilsUi";

// ---- Building blocks -----------------------------------------------------------
export function Card({ children, style, id, accent = "var(--page-accent, #2F80ED)" }) {
  return (
    <section id={id} className="ycard" style={{ "--ca": accent, scrollMarginTop: 14, ...style }}>
      {children}
    </section>
  );
}

export function SectionHead({ kicker, title, blurb, accent = COLORS.accent }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="ykicker" style={{ "--ka": accent }}>
        <span aria-hidden="true" />
        {kicker}
      </div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px, 3.4vw, 30px)", color: COLORS.ink, margin: "10px 0 0", letterSpacing: "-0.015em", lineHeight: 1.15 }}>{title}</h2>
      {blurb && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, margin: "8px 0 0", maxWidth: 680 }}>{blurb}</p>}
    </div>
  );
}

// One headline figure: an icon, a big number that counts up, what it is, and
// a line of context. Tapping it jumps to the part of the page that explains it.
export function StatCard({ icon: Icon, colour, value, format = fmt, label, caption, chip, target }) {
  const body = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
        <span style={{ width: 38, height: 38, borderRadius: 12, background: `${colour}1f`, color: readable(colour), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={19} />
        </span>
        {chip && <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: readable(colour), background: `${colour}1a`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{chip}</span>}
      </div>
      <div style={{ ...numeric, fontSize: "clamp(34px, 4.4vw, 46px)", fontWeight: 600, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.02em" }}>
        <CountUp value={value} format={format} duration={1.2} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, marginTop: 9 }}>{label}</div>
      {caption && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{caption}</div>}
    </>
  );
  const style = { "--sc": colour, textAlign: "left", display: "block", width: "100%", boxSizing: "border-box", color: "inherit", font: "inherit" };
  if (!target) return <div className="ystat" style={style}>{body}</div>;
  return (
    <button type="button" className="nclick ystat" onClick={() => scrollToId(target)} style={{ ...style, cursor: "pointer" }}>
      {body}
    </button>
  );
}

export function Chip({ colour, children, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, background: `${colour}1c`, border: `1px solid ${colour}55`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap", maxWidth: "100%", minWidth: 0, ...style }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colour, flexShrink: 0 }} />
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
    </span>
  );
}

export const Arrow = () => <span aria-hidden="true" style={{ color: COLORS.inkSoft, fontSize: 14 }}>→</span>;

// A horizontal bar with a value and an optional change. In a narrow column
// (compact) the label and value share a line and the bar sits under them, so
// the bar always has room.
export function Bar({ label, colour, fraction, value, delta, labelWidth = 170, compact = false }) {
  const change = delta != null && delta !== 0 && <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, marginLeft: 8, color: delta > 0 ? readable("#2F8F6A") : readable("#B5533C") }}>{signed(delta)}</span>;
  const track = (
    <span style={{ display: "block", height: 12, borderRadius: 6, background: `color-mix(in srgb, ${colour} 10%, ${COLORS.paper})`, overflow: "hidden" }}>
      <span className="bar-grow" style={{ display: "block", width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, minWidth: fraction > 0 ? 3 : 0, height: "100%", background: `linear-gradient(90deg, color-mix(in srgb, ${colour} 62%, #fff), ${colour})`, borderRadius: 6 }} />
    </span>
  );
  if (compact) {
    return (
      <div style={{ padding: "6px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>{label}</span>
          <span style={{ ...numeric, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, whiteSpace: "nowrap" }}>{value}{change}</span>
        </div>
        {track}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `minmax(90px, ${labelWidth}px) minmax(0, 1fr) auto`, gap: 12, alignItems: "center", padding: "5px 0" }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {track}
      <span style={{ ...numeric, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, textAlign: "right", whiteSpace: "nowrap", minWidth: 96 }}>{value}{change}</span>
    </div>
  );
}

// A count, then the move it counts: "31  Labour → No overall control".
export function MoveRow({ count, from, to, fromColour, toColour, bar }) {
  return (
    <div style={{ padding: "8px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", gap: 8, alignItems: "center" }}>
        <span style={{ ...numeric, fontSize: 20, fontWeight: 700, color: COLORS.ink, lineHeight: 1 }}>{fmt(count)}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <Chip colour={fromColour}>{from}</Chip>
          <Arrow />
          <Chip colour={toColour}>{to}</Chip>
        </span>
      </div>
      {bar != null && (
        <div style={{ height: 5, borderRadius: 3, background: COLORS.paper, margin: "8px 0 0 52px", overflow: "hidden" }}>
          <div style={{ width: `${bar * 100}%`, height: "100%", background: toColour, borderRadius: 3 }} />
        </div>
      )}
    </div>
  );
}
