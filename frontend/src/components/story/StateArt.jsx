/** @jsxImportSource react */
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import { Rows } from "./CivilServiceArt";

// Pictures for the pages on how the state works (Courts, Monarchy, Watchdogs). Each plays once, when it scrolls into view, and is already finished for anyone who has
// asked for calmer motion. Every word in them is taken from the page they sit on.

// Steps in order, joined by lines that draw in turn. `vias` are short labels on the lines. Side by side on a wide screen, stacked on a narrow one (or always, with `down`).
export function Flow({ items, vias, down = false }) {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="sa-flow" data-go={go} data-down={down ? "1" : "0"}>
      <ol>
        {items.map((it, i) => {
          const Icon = it.icon;
          return [
            <li key={it.title} className="sa-node" style={{ "--tc": it.colour, "--i": i }}>
              {Icon && <span className="sa-ico" aria-hidden="true"><Icon size={22} /></span>}
              <b>{it.title}</b>
              <p>{it.text}</p>
            </li>,
            i < items.length - 1 && (
              <li key={`${it.title}-link`} className="sa-link" aria-hidden="true" style={{ "--i": i }}>
                <i />
                {vias?.[i] && <span>{vias[i]}</span>}
              </li>
            ),
          ];
        })}
      </ol>
    </figure>
  );
}

// Several separate sources that feed one result: their lines run down, join, and meet the result.
export function Converge({ sources, result }) {
  const [ref, go] = useGo(0.25);
  const n = sources.length;
  return (
    <figure ref={ref} className="sa-conv" data-go={go} style={{ "--n": n }}>
      <ul className="sa-conv-src">
        {sources.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title} style={{ "--tc": s.colour, "--i": i }}>
              {Icon && <span className="sa-ico" aria-hidden="true"><Icon size={22} /></span>}
              <b>{s.title}</b>
              <p>{s.text}</p>
            </li>
          );
        })}
      </ul>
      <div className="sa-conv-join" aria-hidden="true">
        <div className="sa-conv-stubs">{sources.map((s, i) => <i key={s.title} style={{ "--tc": s.colour, "--i": i }} />)}</div>
        <i className="sa-conv-bar" />
        <i className="sa-conv-down" />
      </div>
      <p className="sa-conv-result" style={{ "--tc": result.colour }}><b>{result.title}</b>{result.text && <span>{result.text}</span>}</p>
    </figure>
  );
}

// A fixed number of places that fill one after another.
export function Seats({ count, label }) {
  const [ref, go] = useGo(0.3);
  return (
    <figure ref={ref} className="sa-seats" data-go={go}>
      <div className="sa-seats-head"><b><AnimatedValue text={String(count)} /></b><span>{label}</span></div>
      <ol aria-hidden="true">
        {Array.from({ length: count }, (_, i) => <li key={i} style={{ "--i": i }} />)}
      </ol>
    </figure>
  );
}

// Who decides, and what that leaves for the person at the other end: one row each, the arrow drawing across before the answer slides in.
export function Handoff({ rows, left, right }) {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="sa-hand" data-go={go}>
      <div className="sa-hand-head" aria-hidden="true"><span>{left}</span><span>{right}</span></div>
      <ul>
        {rows.map((r, i) => (
          <li key={r.to} style={{ "--tc": r.colour, "--i": i }}>
            <span className="sa-hand-from">{r.from}</span>
            <i aria-hidden="true" />
            <span className="sa-hand-to">{r.to}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// Dated events down a line that draws itself, each dot appearing as the line reaches it.
export function Journey({ items, colour }) {
  const [ref, go] = useGo(0.2);
  return (
    <figure ref={ref} className="sa-journey" data-go={go} style={{ "--tc": colour }}>
      <ol>
        {items.map((it, i) => (
          <li key={it.when} style={{ "--i": i }}><b>{it.when}</b><span>{it.text}</span></li>
        ))}
      </ol>
    </figure>
  );
}

// A few kinds of thing side by side, each with its own colour, picture and one-line job.
export function Trio({ items }) {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="sa-trio" data-go={go}>
      <ul>
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <li key={it.title} style={{ "--tc": it.colour, "--i": i }}>
              <span className="sa-ico" aria-hidden="true"><Icon size={26} /></span>
              <small>{it.who}</small>
              <b>{it.title}</b>
              <p>{it.text}</p>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

// Two amounts drawn to the same scale, so the gap between them can be seen.
export function Amounts({ title, rows, note, colour }) {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="sa-amounts cs-card" data-go={go} style={{ "--tc": colour }}>
      <h3>{title}</h3>
      <Rows rows={rows} />
      {note && <figcaption>{note}</figcaption>}
    </figure>
  );
}
