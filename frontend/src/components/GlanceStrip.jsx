import CountValue from "./CountValue";
import "../glancestrip.css";

// Two small building blocks shared by the money, elections and government pages, so a page opens with its headline figures and a plain "how to read this"
// before any detail. Figures count up when they first scroll into view (see CountValue); each tile has its own colour.

// `items`: [{ value: "£61m", label: "declared in a year", sub: "optional extra line", colour: "#1E4FB8" }]
export function GlanceStrip({ items, label = "At a glance" }) {
  const shown = items.filter((i) => i && i.value != null && i.value !== "");
  if (shown.length === 0) return null;
  return (
    <section className="glance" aria-label={label}>
      {shown.map((it, n) => (
        <div key={it.label} className="glance-tile" style={{ "--gc": it.colour ?? "#1E4FB8", "--gi": n }}>
          <b><CountValue>{String(it.value)}</CountValue></b>
          <span>{it.label}</span>
          {it.sub && <small>{it.sub}</small>}
        </div>
      ))}
    </section>
  );
}

// `steps`: [{ title, text }] shown as numbered, coloured cards.
export function HowToRead({ steps, title = "How to read this page" }) {
  const COLOURS = ["#1E4FB8", "#E0367A", "#1FA97C", "#E8741A"];
  return (
    <section className="howread" aria-label={title}>
      <h2>{title}</h2>
      <ol>
        {steps.map((s, i) => (
          <li key={s.title} style={{ "--hc": COLOURS[i % COLOURS.length] }}>
            <span aria-hidden="true">{i + 1}</span>
            <div><b>{s.title}</b><p>{s.text}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}
