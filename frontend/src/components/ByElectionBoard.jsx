import { partyColour } from "../lib/format";
import { useGo } from "./story/useGo";
import AnimatedValue from "./story/AnimatedValue";
import "../byElections.css";

// The top of the by-elections page: a ring for how many seats changed hands, the figures beside it, every by-election laid out in the order it happened, and which party
// lost seats to which. It plays once as it scrolls into view. Colour is never the only sign: a seat that changed hands is a filled dot and a seat held is an outline.

const GAIN = "#E0367A";
const HOLD = "#2F9E6B";
const VACANT = "#B0473E";
const R = 42;
const C = 2 * Math.PI * R;

function Ring({ gains, total }) {
  const share = total ? gains / total : 0;
  return (
    <div className="be-ring" role="img" aria-label={`${gains} of ${total} by-elections changed the party that holds the seat`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={R} className="be-ring-track" />
        <circle cx="50" cy="50" r={R} className="be-ring-fill" style={{ strokeDasharray: `${C * share} ${C}` }} transform="rotate(-90 50 50)" />
      </svg>
      <div className="be-ring-mid"><b><AnimatedValue text={String(gains)} /></b><span>of {total}</span><em>changed hands</em></div>
    </div>
  );
}

export default function ByElectionBoard({ total, gains, holds, vacant, strip, moves, winners, StackBar }) {
  const [ref, go] = useGo(0.15);
  return (
    <div ref={ref} className="be" data-go={go}>
      <div className="be-top">
        <Ring gains={gains} total={total} />
        <ul className="be-figs">
          <li style={{ "--tc": "#1E4FB8", "--i": 0 }}><b><AnimatedValue text={String(total)} /></b><span>by-election{total === 1 ? "" : "s"} held</span></li>
          <li style={{ "--tc": GAIN, "--i": 1 }}><b><AnimatedValue text={String(gains)} /></b><span>seat{gains === 1 ? "" : "s"} changed hands</span></li>
          <li style={{ "--tc": HOLD, "--i": 2 }}><b><AnimatedValue text={String(holds)} /></b><span>held by the same party</span></li>
          {vacant > 0 && <li style={{ "--tc": VACANT, "--i": 3 }}><b><AnimatedValue text={String(vacant)} /></b><span>seat{vacant === 1 ? "" : "s"} vacant now</span></li>}
        </ul>
      </div>

      {strip.length > 0 && (
        <section className="be-block">
          <h3>Every by-election, in the order they happened</h3>
          <ol className="be-strip" aria-label="By-elections from oldest to newest">
            {strip.map((s, i) => {
              const colour = partyColour(s.colour, "#8A93A6");
              const label = `${s.name}: ${s.party ?? "unknown"} ${s.outcome === "gain" ? "gained" : s.outcome === "hold" ? "held" : "won"}`;
              return (
                <li key={s.id} className="be-dot" data-out={s.outcome ?? "none"} style={{ "--tc": colour, "--i": i }} title={label} aria-label={label} />
              );
            })}
          </ol>
          <p className="be-key"><span><i data-out="gain" />Seat changed hands</span><span><i data-out="hold" />Same party held it</span><small>Oldest on the left. Each dot takes the colour of the winning party.</small></p>
        </section>
      )}

      {moves.length > 0 && (
        <section className="be-block">
          <h3>Where the seats moved</h3>
          <ul className="be-moves">
            {moves.map((m, i) => (
              <li key={`${m.from}-${m.to}`} style={{ "--i": i }}>
                <span className="be-party" style={{ "--tc": partyColour(m.fromColour, "#8A93A6") }}>{m.from}</span>
                <span className="be-arrow" aria-hidden="true"><i /></span>
                <span className="be-party" style={{ "--tc": partyColour(m.toColour, "#8A93A6") }}>{m.to}</span>
                <b className="be-count">{m.count} seat{m.count === 1 ? "" : "s"}</b>
                <small>{m.seats.join(", ")}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {winners.length > 0 && (
        <section className="be-block">
          <h3>Who won them</h3>
          <StackBar items={winners} label={`By-election winners: ${winners.map((w) => `${w.label} ${w.value}`).join(", ")}`} />
        </section>
      )}
    </div>
  );
}
