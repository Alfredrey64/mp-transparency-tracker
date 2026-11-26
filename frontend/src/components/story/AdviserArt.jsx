/** @jsxImportSource react */
import { useGo } from "./useGo";
import "../../advisers.css";

// The three small pictures inside the figures at the top of the Special advisers page. Each is drawn from the same numbers the figure above it states, comes in once when it
// scrolls into view (a wave of dots, two bars, four ranges) and is hidden from screen readers, because the number and the line under it already say the same in words.
const n = (v) => Number(v ?? 0).toLocaleString("en-GB");
const BAND = ["#7B5BD6", "#2C7DA0", "#3F7D5C", "#B7791F"];

// One dot for each adviser.
export function AdviserDots({ count }) {
  const [ref, go] = useGo(0.3);
  return (
    <div ref={ref} className="av-art av-dots" data-go={go}>
      <div className="av-dotgrid">{Array.from({ length: count }, (_, i) => <i key={i} style={{ "--k": i }} />)}</div>
      <p>One dot for each adviser</p>
    </div>
  );
}

// The pay bill this year and last, drawn from zero so the difference is as big as it really is.
export function PayBars({ now, before }) {
  const [ref, go] = useGo(0.3);
  const top = Math.max(now.value, before.value);
  const diff = Math.round((now.value - before.value) * 10) / 10;
  return (
    <div ref={ref} className="av-art av-pay" data-go={go}>
      {[before, now].map((p, i) => (
        <span key={p.label} className={i ? "now" : "then"} style={{ "--k": i }}>
          <em>{p.label}</em>
          <span className="av-pay-track"><i style={{ "--w": `${(p.value / top) * 100}%` }} /></span>
          <b>{p.text}</b>
        </span>
      ))}
      {diff !== 0 && <p>{diff > 0 ? "Up" : "Down"} £{Math.abs(diff).toFixed(1)}m on the year before</p>}
    </div>
  );
}

// The four pay bands as ranges on one scale. Where they overlap, the pictures overlap, which is why a band alone does not fix a salary.
export function BandRanges({ bands, counts }) {
  const [ref, go] = useGo(0.3);
  const lo = Math.min(...bands.map((b) => b.from)), hi = Math.max(...bands.map((b) => b.to));
  const at = (v) => ((v - lo) / (hi - lo)) * 100;
  return (
    <div ref={ref} className="av-art av-bands" data-go={go}>
      <ul>
        {bands.map((b, i) => (
          <li key={b.band} style={{ "--k": i, "--c": BAND[i % BAND.length] }}>
            <em>Band {b.band}</em>
            <span className="av-track"><i style={{ marginLeft: `${at(b.from)}%`, width: `${at(b.to) - at(b.from)}%` }} /></span>
            <b>{n(counts.get(b.band) ?? 0)}</b>
          </li>
        ))}
      </ul>
      <p><span>£{n(lo)}</span><span>£{n(hi)}</span></p>
    </div>
  );
}
