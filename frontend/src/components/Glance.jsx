import { COLORS, FONT_BODY, FONT_DISPLAY, chip } from "../theme";
import { card } from "../lib/onsStyles";

// Two small pictures for the top of a list page: a bar divided into shares (who won, why people left) and columns by year. Both grow into
// place as the card scrolls into view (see .bar-grow and .col-grow in chrome.css), and both carry their figures as text, so the picture is
// never the only way to read them.

const total = (items) => items.reduce((n, i) => n + i.value, 0);

export function GlanceCard({ id, title, lead, children, style }) {
  return (
    <section aria-labelledby={id} style={{ ...card, marginTop: 20, ...style }}>
      <h2 id={id} style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em", color: COLORS.ink, margin: 0 }}>{title}</h2>
      {lead && <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 680 }}>{lead}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

// One bar divided between the groups, with a key that gives each group's number and share. `items` is [{ label, value, colour }], largest first.
export function StackBar({ items, label }) {
  const all = total(items);
  if (!all) return null;
  return (
    <div>
      <div role="img" aria-label={label} style={{ display: "flex", gap: 3, height: 44, borderRadius: 12, overflow: "hidden" }}>
        {items.map((it, i) => {
          const share = it.value / all;
          const { background, color } = chip(it.colour);
          return (
            <span
              key={it.label} className="bar-grow" title={`${it.label}: ${it.value}`}
              style={{ flex: `${it.value} 1 0`, minWidth: 4, background, color, "--rv-d": `${i * 80}ms`, display: "flex", alignItems: "center", justifyContent: "center", font: `700 14px/1 ${FONT_BODY}`, fontVariantNumeric: "tabular-nums", overflow: "hidden" }}
            >
              {share >= 0.07 ? it.value : ""}
            </span>
          );
        })}
      </div>
      <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: "6px 18px", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>
        {items.map((it) => (
          <li key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 3, background: it.colour }} />
            {it.label} <strong style={{ color: COLORS.ink }}>{it.value}</strong>
            <span style={{ fontSize: 12.5 }}>({Math.round((it.value / all) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Columns by year. `years` is [{ year, parts: [{ label, value, colour }] }]: one part per column for a single series, several to stack.
export function YearColumns({ years, label, height = 150 }) {
  const slim = years.length <= 6;
  const top = Math.max(...years.map((y) => total(y.parts)), 1);
  const keys = [...new Map(years.flatMap((y) => y.parts).map((p) => [p.label, p.colour])).entries()];
  return (
    <div>
      <div role="img" aria-label={label} style={{ display: "flex", alignItems: "flex-end", gap: "clamp(3px, 1vw, 8px)", height, paddingTop: 18 }}>
        {years.map((y, i) => {
          const sum = total(y.parts);
          return (
            <div key={y.year} title={`${y.year}: ${sum}`} style={{ flex: slim ? "0 1 110px" : "1 1 0", minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
              <span style={{ font: `700 12px/1 ${FONT_BODY}`, color: COLORS.inkSoft, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{sum}</span>
              <div className="col-grow" style={{ width: "100%", height: `${(sum / top) * 100}%`, minHeight: 3, display: "flex", flexDirection: "column-reverse", gap: 1, borderRadius: "5px 5px 2px 2px", overflow: "hidden", "--rv-d": `${i * 45}ms` }}>
                {y.parts.map((p) => <span key={p.label} style={{ flex: `${p.value} 1 0`, background: p.colour }} />)}
              </div>
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" style={{ display: "flex", gap: "clamp(3px, 1vw, 8px)", marginTop: 6, borderTop: `1px solid ${COLORS.hairline}`, paddingTop: 6 }}>
        {years.map((y) => <span key={y.year} style={{ flex: slim ? "0 1 110px" : "1 1 0", minWidth: 0, textAlign: "center", font: `600 11.5px/1 ${FONT_BODY}`, color: COLORS.inkSoft }}>{years.length > 9 ? `’${String(y.year).slice(-2)}` : y.year}</span>)}
      </div>
      {keys.length > 1 && (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexWrap: "wrap", gap: "6px 18px", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          {keys.map(([name, colour]) => (
            <li key={name} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 3, background: colour }} />{name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
