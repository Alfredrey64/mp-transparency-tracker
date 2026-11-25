/** @jsxImportSource react */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useGo } from "./useGo";
import { lowData } from "../../lib/lowData";
import "../../watchdog.css";

// The picture at the top of the Spending watchdog page: one thing travelling the whole route. Public money is spent, the Office checks where it went, MPs question the people responsible,
// and the government replies in writing. The same small token changes into what each stage works with (a coin, then a report, then a question, then a letter) and moves from station to
// station by itself, once the picture is on screen. Pressing a station takes the token there and stops it; a pause button does the same. Every station always shows its own words, so nothing
// is hidden behind the movement, and with calmer motion the token simply rests at the first station.
//   stops  [{ icon, title, text, figure, colour }]  four stations, in order; `figure` is a real number from the data, printed in the station's own line

const EVERY = 3600; // ms between stations

// The four faces of the token, drawn in the station's own colour.
function Face({ i }) {
  const common = { viewBox: "0 0 32 32", width: 26, height: 26, fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  return (
    <svg className="wdg-face" data-face={i} {...common}>
      {i === 0 && <><circle cx="16" cy="16" r="11" /><path d="M19.800 11.600c-.6-1.400-2-2.200-3.600-2.200-2.200 0-3.800 1.400-3.800 3.400 0 1.200.4 2.200.4 3.400 0 1.600-.6 2.800-1.800 3.800h9.600M11.400 17h7.200" /></>}
      {i === 1 && <><path d="M8 4h10l6 6v18H8z" /><path d="M18 4v6h6" /><path d="m12 19 3 3 5.500-6" /></>}
      {i === 2 && <><path d="M5 7h22v14H15l-6 5v-5H5z" /><path transform="translate(0 -.4)" d="M13.400 12.600a2.600 2.600 0 1 1 3.400 2.500c-.6.300-.8.700-.8 1.300M16 18.600v.1" /></>}
      {i === 3 && <><rect x="4" y="8" width="24" height="17" rx="2.500" /><path d="m5 10 11 8.500L27 10" /></>}
    </svg>
  );
}

export default function WatchdogLoop({ stops, why, label, closing }) {
  const [ref, go] = useGo(0.25);
  const still = useReducedMotion() || lowData();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const track = useRef(null);
  const badges = useRef([]);
  const [pos, setPos] = useState(null);

  // Where each station's badge sits inside the track, so the token and the line behind it can travel between the real positions at any width.
  const measure = useCallback(() => {
    const t = track.current;
    if (!t) return;
    const box = t.getBoundingClientRect();
    setPos(badges.current.map((b) => {
      const r = b.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
    }));
  }, []);
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (go !== "1" || !playing || still) return undefined;
    const id = setInterval(() => setStep((s) => (s + 1) % stops.length), EVERY);
    return () => clearInterval(id);
  }, [go, playing, still, stops.length]);

  const horizontal = pos && pos.length > 1 && Math.abs(pos[1].x - pos[0].x) > Math.abs(pos[1].y - pos[0].y);
  const last = pos?.[pos.length - 1];
  const here = pos?.[step];
  const rail = pos && (horizontal
    ? { left: pos[0].x, top: pos[0].y - 2, width: last.x - pos[0].x, height: 4 }
    : { left: pos[0].x - 2, top: pos[0].y, width: 4, height: last.y - pos[0].y });
  const fill = pos && (horizontal ? { transform: `scaleX(${(here.x - pos[0].x) / Math.max(1, last.x - pos[0].x)})` } : { transform: `scaleY(${(here.y - pos[0].y) / Math.max(1, last.y - pos[0].y)})` });

  return (
    <section ref={ref} className="wdg" data-go={go} data-still={still ? "1" : "0"} aria-label={label}>
      {why && <p className="wdg-why"><strong>Why it matters</strong>{why}</p>}
      <div className="wdg-track" ref={track}>
        {pos && <span className="wdg-rail" aria-hidden="true" style={rail}><i data-h={horizontal ? "1" : "0"} style={fill} /></span>}
        <ol className="wdg-stops">
          {stops.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="wdg-stop" data-on={step === i ? "1" : "0"} data-done={step > i ? "1" : "0"} style={{ "--tc": s.colour, "--i": i }}>
                <button type="button" className="wdg-btn" aria-pressed={step === i} aria-label={`${s.title}. ${s.text}${s.figure ? `. ${s.figure}` : ""}`} onClick={() => { setStep(i); setPlaying(false); }}>
                  <span className="wdg-badge" ref={(el) => { badges.current[i] = el; }} aria-hidden="true"><i>{i + 1}</i></span>
                  <span className="wdg-words" aria-hidden="true">
                    <b>{Icon && <Icon size={19} />} {s.title}</b>
                    <small>{s.text}</small>
                    {s.figure && <em>{s.figure}</em>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {here && (
          <span className="wdg-token" aria-hidden="true" data-step={step} style={{ transform: `translate(${here.x}px, ${here.y}px)`, "--tc": stops[step].colour }}>
            <span className="wdg-tokin">{stops.map((_, i) => <Face key={i} i={i} />)}</span>
          </span>
        )}
      </div>
      <div className="wdg-foot">
        <p className="wdg-loop"><span className="wdg-loopline" aria-hidden="true" />{closing}</p>
        {!still && (
          <button type="button" className="wdg-play" aria-pressed={!playing} onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Play the journey"}
          </button>
        )}
      </div>
    </section>
  );
}
