/** @jsxImportSource react */
import { useGo } from "./useGo";
import "../../story.css";

// One long bar cut into pieces sized by their share of a whole, filling in from the left when it scrolls into view, with a key under it that says each piece in words (so colour is
// never the only sign). Used where one total is split between several parts.
//   items  [{ label, value, text, colour }]    value is the size of the piece; text is what to print for it
export default function ShareBar({ title, items, note }) {
  const [ref, go] = useGo(0.25);
  const total = items.reduce((sum, i) => sum + i.value, 0) || 1;
  return (
    <figure ref={ref} className="sb" data-go={go}>
      {title && <figcaption className="sb-title">{title}</figcaption>}
      <div className="sb-bar" role="img" aria-label={items.map((i) => `${i.label} ${i.text}`).join(", ")}>
        {items.map((it, k) => (
          <i key={it.label} style={{ flexGrow: it.value, "--tc": it.colour, "--k": k }} title={`${it.label}: ${it.text}`}>
            {it.value / total > 0.07 && <span>{Math.round((it.value / total) * 100)}%</span>}
          </i>
        ))}
      </div>
      <ul className="sb-key">
        {items.map((it, k) => (
          <li key={it.label} style={{ "--tc": it.colour, "--k": k }}><b>{it.label}</b><span>{it.text}</span></li>
        ))}
      </ul>
      {note && <p className="sb-note">{note}</p>}
    </figure>
  );
}
