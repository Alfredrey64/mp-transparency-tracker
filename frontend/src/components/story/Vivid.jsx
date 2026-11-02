/** @jsxImportSource react */
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import "../../story.css";

// The bold pictures that open the pages on how the state works, and the two diagrams that carry the Civil Service page. They play once as they scroll into view, and
// the lines that join the steps keep a slow march going while the page is open (not for anyone who has asked for calmer motion). Every word comes from the page it sits on.

// A coloured banner at the top of a page: the reason it matters in a sentence, then the page's idea as a short chain of stops with a flow running along it, then the
// page's key figures. It takes the place of the row of figure tiles and the "Why it matters" box.
//   stops    [{ icon, title, text, colour }]   each a round badge with a title and a line under it
//   figures  [{ value, label, sub }]
//   extra    a picture drawn between the chain and the figures
//   siren    true for a slow blue and red wash along the top edge (the police page)
//   colours  [dark, bright, accent]            the three colours the banner is washed with
export function Hero({ why, stops, figures, extra, siren = false, colours = ["#1B2A6B", "#2E7DD1", "#7B3FA0"], label = "At a glance" }) {
  const [ref, go] = useGo(0.15);
  return (
    <section ref={ref} className="vv-hero" data-go={go} data-siren={siren ? "1" : "0"} aria-label={label} style={{ "--h1": colours[0], "--h2": colours[1], "--h3": colours[2] }}>
      {why && <p className="vv-why"><strong>Why it matters</strong>{why}</p>}
      {stops && (
        <ol className="vv-route">
          {stops.map((s, i) => {
            const Icon = s.icon;
            return [
              <li key={s.title} className="vv-stop" style={{ "--tc": s.colour, "--i": i }}>
                <span className="vv-badge" aria-hidden="true">{Icon && <Icon size={30} />}</span>
                <b>{s.title}</b>
                {s.text && <small>{s.text}</small>}
              </li>,
              i < stops.length - 1 && <li key={`${s.title}-link`} className="vv-link" aria-hidden="true" style={{ "--i": i }}><i /></li>,
            ];
          })}
        </ol>
      )}
      {extra}
      {figures && (
        <ul className="vv-figs">
          {figures.map((f, i) => (
            <li key={f.label} style={{ "--i": i }}>
              <b><AnimatedValue text={f.value} /></b>
              <span>{f.label}</span>
              {f.sub && <em>{f.sub}</em>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// "If it were 100 people": a grid of 100 dots for each share, filling in one after another.
//   items  [{ label, value (the percentage), text (what to print), note, colour }]
export function Dots({ title, items, note }) {
  const [ref, go] = useGo(0.2);
  return (
    <figure ref={ref} className="vv-dots" data-go={go}>
      {title && <figcaption className="vv-dots-title">{title}</figcaption>}
      <div className="vv-dots-grid">
        {items.map((it, i) => (
          <section key={it.label} className="vv-dotcard" style={{ "--tc": it.colour, "--i": i }}>
            <h3>{it.label}</h3>
            <b><AnimatedValue text={it.text} /></b>
            <div className="vv-dotgrid" role="img" aria-label={`${it.text} ${it.label.toLowerCase()}`}>
              {Array.from({ length: 100 }, (_, k) => <i key={k} data-on={k < Math.round(it.value) ? "1" : "0"} style={{ "--k": k }} />)}
            </div>
            {it.note && <p>{it.note}</p>}
          </section>
        ))}
      </div>
      {note && <p className="vv-dots-note">{note}</p>}
    </figure>
  );
}

// What changes when a government changes, and what stays: three rows of people, the ones who go fading out and the new ones arriving, the civil servants standing still.
//   tiers  [{ name, colour, before, after, stays }]
export function Swap({ tiers, head = "What happens to each when the government changes", before = "Before the change", after = "After the change", moment = "The government changes" }) {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="vv-swap" data-go={go}>
      <figcaption>{head}</figcaption>
      <div className="vv-swap-axis" aria-hidden="true"><span>{before}</span><span className="vv-moment">{moment}</span><span>{after}</span></div>
      <ul>
        {tiers.map((t, i) => (
          <li key={t.name} className="vv-tier" data-stays={t.stays ? "1" : "0"} style={{ "--tc": t.colour, "--i": i }}>
            <b className="vv-tier-name">{t.name}</b>
            <div className="vv-side vv-was">
              <span className="vv-crowd" aria-hidden="true">{[0, 1, 2, 3].map((k) => <i key={k} style={{ "--k": k }} />)}</span>
              <span className="vv-say">{t.before}</span>
            </div>
            <i className="vv-mid" aria-hidden="true" />
            <div className="vv-side vv-now">
              <span className="vv-crowd" aria-hidden="true">{[0, 1, 2, 3].map((k) => <i key={k} style={{ "--k": k }} />)}</span>
              <span className="vv-say">{t.after}</span>
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// Two shares side by side for each party, so the gap between them can be seen: the share of the votes, and the share of the seats it turned into. It sits on the
// banner of the opinion poll page.
//   rows  [{ name, colour, votes, seats, votesText, seatsText }]  votes and seats are percentages
export function VotesSeats({ rows, votesName = "Share of the vote", seatsName = "Share of the seats" }) {
  return (
    <div className="vv-vs">
      <p className="vv-vs-key" aria-hidden="true"><span><i className="v" />{votesName}</span><span><i className="s" />{seatsName}</span></p>
      {rows.map((r, i) => (
        <section key={r.name} className="vv-vs-row" style={{ "--tc": r.colour, "--i": i }}>
          <h3>{r.name}</h3>
          <div className="vv-vs-line"><span className="vv-vs-bar v"><i style={{ width: `${Math.max(1.5, r.votes)}%` }} /></span><b><AnimatedValue text={r.votesText} /></b><small>{r.votesSub}</small></div>
          <div className="vv-vs-line"><span className="vv-vs-bar s"><i style={{ width: `${Math.max(1.5, r.seats)}%` }} /></span><b><AnimatedValue text={r.seatsText} /></b><small>{r.seatsSub}</small></div>
        </section>
      ))}
    </div>
  );
}

// A quiet row of key figures for a page that does not open with the banner: big numerals separated by hairlines, counting up as they scroll into view.
//   items  [{ value, label, sub }]
export function Figures({ items, label = "Key figures" }) {
  const [ref, go] = useGo(0.2);
  return (
    <section ref={ref} className="vv-plainfigs" data-go={go} aria-label={label}>
      <ul>
        {items.map((f, i) => (
          <li key={f.label} style={{ "--i": i }}>
            <b><AnimatedValue text={f.value} /></b>
            <span>{f.label}</span>
            {f.sub && <em>{f.sub}</em>}
          </li>
        ))}
      </ul>
    </section>
  );
}
