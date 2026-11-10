/** @jsxImportSource react */
import { useGo } from "./useGo";
import "../../changebars.css";

// How much each thing changed between two dates, as bars either side of a zero line: growth runs to the right in green, a fall to the left in rust, and every bar grows out of
// the zero line when it scrolls into view. Under each name are the two amounts it moved between, so the percentage is never the only figure.
//   items        [{ label, pct, beforeText, afterText }]   already in the order to show; positive pct first is the usual
//   beforeName   the earlier date, afterName the later one
//   upLabel / downLabel   the small headings over the two groups
//   note         the line of small print under the chart
const fmt = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;

export default function ChangeBars({ items, beforeName, afterName, upLabel = "Growing", downLabel = "Squeezed", note }) {
  const [ref, go] = useGo(0.2);
  const maxUp = Math.max(1, ...items.filter((i) => i.pct > 0).map((i) => i.pct));
  const maxDown = Math.max(0, ...items.filter((i) => i.pct < 0).map((i) => -i.pct));
  const span = maxUp + Math.max(maxDown, maxUp * 0.18);
  const zero = (span - maxUp) / span * 100;
  const groups = [
    { key: "up", label: upLabel, rows: items.filter((i) => i.pct >= 0) },
    { key: "down", label: downLabel, rows: items.filter((i) => i.pct < 0) },
  ].filter((g) => g.rows.length > 0);
  let k = 0;
  return (
    <figure ref={ref} className="cb" data-go={go} style={{ "--zero": `${zero}%` }}>
      <p className="cb-key"><span>From {beforeName} to {afterName}</span></p>
      {groups.map((g) => (
        <section key={g.key} className="cb-group" data-k={g.key} aria-label={g.label}>
          <h3><i aria-hidden="true" />{g.label}</h3>
          <ul>
            {g.rows.map((it) => {
              const w = (Math.abs(it.pct) / span) * 100;
              const idx = k++;
              return (
                <li key={it.label} style={{ "--k": idx }}>
                  <div className="cb-name"><b>{it.label}</b><small>{it.beforeText} <span aria-hidden="true">to</span><span className="sr-only"> in {afterName}, </span> {it.afterText}</small></div>
                  <div className="cb-track" aria-hidden="true"><div className="cb-in">
                    <i className="cb-zero" />
                    <u className="cb-bar" data-dir={it.pct < 0 ? "down" : "up"} style={{ width: `${Math.max(w, 1.2)}%`, ...(it.pct < 0 ? { right: `${100 - zero}%` } : { left: `${zero}%` }) }} />
                    <em className="cb-val" data-dir={it.pct < 0 ? "down" : "up"} style={it.pct < 0 ? { right: `calc(${100 - zero}% + ${Math.max(w, 1.2)}% + 8px)` } : { left: `calc(${zero}% + ${Math.max(w, 1.2)}% + 8px)` }}>{fmt(it.pct)}</em>
                  </div></div>
                  <span className="sr-only">{fmt(it.pct)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {note && <p className="cb-note">{note}</p>}
    </figure>
  );
}
