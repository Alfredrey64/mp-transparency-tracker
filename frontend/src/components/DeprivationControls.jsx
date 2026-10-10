import { COLORS, FONT_BODY, solid } from "../theme";

// The controls on the Deprivation page, kept in one tidy bar: a segmented switch for a few choices, and a drop-down for a
// longer list. Both are keyboard friendly (arrow keys move through a switch).

const ACCENT = "#B4432F";

export function Segmented({ label, value, options, onChange, accent = COLORS.ink, small = false }) {
  const idx = options.findIndex((o) => o.id === value);
  const onKey = (e) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(idx + step + options.length) % options.length];
    onChange(next.id);
    requestAnimationFrame(() => e.currentTarget.parentElement?.querySelector('[aria-checked="true"]')?.focus());
  };
  return (
    <div role="radiogroup" aria-label={label} className="seg" style={{ display: "inline-flex", flexWrap: "wrap", maxWidth: "100%", gap: 2, padding: 3, border: `1px solid ${COLORS.hairline}`, borderRadius: 20, background: COLORS.paper }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} onClick={() => onChange(o.id)} onKeyDown={onKey}
            style={{ fontFamily: FONT_BODY, fontSize: small ? 13 : 14, fontWeight: on ? 700 : 600, padding: small ? "6px 12px" : "8px 16px", borderRadius: 999, border: "none", cursor: "pointer", background: on ? (accent === COLORS.ink ? accent : solid(accent)) : "transparent", color: on ? (accent === COLORS.ink ? COLORS.paper : "#fff") : COLORS.inkSoft, transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap" }}
          >
            <span className="seg-long">{o.label}</span>
            <span className="seg-short">{o.short ?? o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SelectField({ id, label, value, options, onChange }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label htmlFor={id} style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 6 }}>{label}</label>
      <select id={id} className="ons-chip" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box", cursor: "pointer" }}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

// A labelled row in the bar.
export function Row({ label, children, wide = false }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 6, gridColumn: wide ? "1 / -1" : undefined, minWidth: 0 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function ControlBar({ children }) {
  return (
    <section aria-label="Choose what to show" style={{ marginTop: 22, padding: "16px clamp(14px, 3vw, 22px) 18px", borderRadius: 20, border: `1px solid ${COLORS.hairline}`, background: COLORS.paperCard, display: "grid", gap: "14px 24px", containerType: "inline-size", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", alignItems: "end", boxShadow: `0 18px 40px -30px rgba(0,0,0,0.5), inset 0 3px 0 ${ACCENT}` }}>
      {children}
    </section>
  );
}

// "How to read the numbers": ten blocks, one picked out, so "1 in 10" and "twice the fair share" make sense before any figure appears.
export function HowToRead({ place, counts = "people", unit = "neighbourhood" }) {
  return (
    <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, maxWidth: 780 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}>How to read the numbers</div>
      <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4, margin: "10px 0 8px", maxWidth: 360 }}>
        {Array.from({ length: 10 }, (_, i) => <span key={i} style={{ height: 14, borderRadius: 4, background: i === 0 ? ACCENT : `${COLORS.inkSoft}4d` }} />)}
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>
        Picture every {unit} in {place} lined up from the most deprived to the least, and cut into ten equal groups. The red block is the most deprived group. If hardship were spread perfectly evenly, <strong style={{ color: COLORS.ink }}>1 in 10</strong> of the {counts} in any area would be in it. So &ldquo;about 1 in 5&rdquo; means an area has <strong style={{ color: COLORS.ink }}>twice its fair share</strong> of the most deprived group, and &ldquo;about 1 in 20&rdquo; means half.
      </p>
    </div>
  );
}
