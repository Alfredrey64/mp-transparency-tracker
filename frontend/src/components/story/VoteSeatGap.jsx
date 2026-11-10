/** @jsxImportSource react */
import { useGo } from "./useGo";

// For each party, one line from 0 to all: a hollow ring where its share of the votes sits, a filled dot where its share of the seats sits, and the stretch between them drawn in
// the party's colour with the gap in points written beside it. The seats dot slides out from the votes ring once the chart scrolls into view. Plain bars cannot show a gap;
// this is the gap.
//   rows  [{ name, colour, votes, seats }]   votes and seats are percentages (0 to 100)
//   note  the source line under the chart
const TICKS = [0, 25, 50, 75, 100];

export default function VoteSeatGap({ rows, note, title = "Share of the votes and share of the seats" }) {
  const [ref, go] = useGo(0.3);
  return (
    <figure className="vg" ref={ref} data-go={go}>
      <figcaption className="vg-head">
        <b>{title}</b>
        <span className="vg-key" aria-hidden="true"><span><i className="v" />Share of the votes</span><span><i className="s" />Share of the seats</span></span>
      </figcaption>
      <ul className="vg-rows">
        {rows.map((r, i) => {
          const diff = Math.round((r.seats - r.votes) * 10) / 10;
          const more = diff >= 0;
          return (
            <li key={r.name} className="vg-row" style={{ "--tc": r.colour, "--pv": r.votes, "--ps": r.seats, "--lo": Math.min(r.votes, r.seats), "--gap": Math.abs(diff), "--i": i }} data-dir={more ? "up" : "down"}>
              <div className="vg-who"><h3><i aria-hidden="true" />{r.name}</h3><p>{r.votes}% of the votes became {r.seats}% of the seats.</p></div>
              <div className="vg-plot" role="img" aria-label={`${r.name}: ${r.votes} percent of the votes, ${r.seats} percent of the seats`}>
                <div className="vg-track">
                  <span className="vg-span" />
                  <span className="vg-pt v" />
                  <span className="vg-pt s" />
                </div>
              </div>
              <p className="vg-gap"><b>{more ? "+" : "−"}{Math.abs(diff).toFixed(1)}</b><span>{more ? "points more seats than votes" : "points fewer seats than votes"}</span></p>
            </li>
          );
        })}
      </ul>
      <div className="vg-axis" aria-hidden="true">
        <i />
        <p>{TICKS.map((t) => <span key={t} style={{ left: `${t}%` }}>{t === 0 ? "none" : t === 100 ? "all" : `${t}%`}</span>)}</p>
        <i />
      </div>
      {note && <p className="vg-note">{note}</p>}
    </figure>
  );
}
