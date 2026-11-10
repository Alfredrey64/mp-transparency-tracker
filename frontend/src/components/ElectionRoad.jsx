import { useReducedMotion } from "motion/react";
import { COLORS } from "../theme";
import { longDate } from "../lib/councils";
import { useInView } from "../lib/useInView";
import CountUp from "./CountUp";
import "../electionroad.css";

// "When councils next vote": the next election as a banner with a countdown and the share of all seats it covers, then every date as a bubble on a road, each bubble as big as
// the number of seats up that day. The bubbles pop up one after another when the box scrolls into view. On a phone the road runs downwards and the bubbles become bars.
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const DAY = 86400000;

export default function ElectionRoad({ dates, today = new Date() }) {
  const [ref, seen] = useInView(0.2);
  const still = useReducedMotion();
  const go = seen || still ? "1" : "0";
  if (!dates?.length) return null;
  const total = dates.reduce((n, d) => n + d.seats, 0);
  const max = Math.max(...dates.map((d) => d.seats));
  const next = dates[0];
  const share = total ? next.seats / total : 0;
  const days = Math.max(0, Math.ceil((new Date(`${next.date}T00:00:00Z`).getTime() - today.getTime()) / DAY));
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div ref={ref} className="er" data-go={go} style={{ "--paper": COLORS.paper, "--ink": COLORS.ink, "--soft": COLORS.inkSoft, "--line": COLORS.hairline }}>
      <div className="er-next">
        <div className="er-next-text">
          <span className="er-tag">Next up</span>
          <b className="er-date">{longDate(next.date)}</b>
          <span className="er-count"><span className="er-pulse" aria-hidden="true" />{days === 0 ? "Today" : <>In <b><CountUp value={days} /></b> {days === 1 ? "day" : "days"}</>}</span>
          <span className="er-sub"><b>{fmt(next.seats)}</b> seats · {next.councils} {next.councils === 1 ? "council" : "councils"}</span>
        </div>
        <div className="er-ring" role="img" aria-label={`${Math.round(share * 100)} per cent of all the seats that come up in these elections`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="12" />
            <circle className="er-arc" cx="60" cy="60" r={R} fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - share)} transform="rotate(-90 60 60)" style={{ "--c": C }} />
          </svg>
          <span><b>{Math.round(share * 100)}%</b><small>of all seats</small></span>
        </div>
      </div>

      <ol className="er-road" aria-label="Every election date, and the seats up on each">
        {dates.map((d, i) => {
          const size = 62 + 52 * Math.sqrt(d.seats / max);
          return (
            <li key={d.date} className="er-stop" data-first={i === 0 ? "1" : "0"} style={{ "--i": i, "--size": `${size.toFixed(0)}px`, "--frac": (d.seats / max).toFixed(3) }}>
              <span className="er-bubble">
                <span className="er-ping" aria-hidden="true" />
                <b>{fmt(d.seats)}</b>
                <small>seats</small>
              </span>
              <span className="er-bar" aria-hidden="true"><i /></span>
              <span className="er-info">
                <strong>{longDate(d.date)}</strong>
                <span><span className="er-seatsline">{fmt(d.seats)} seats · </span>{d.councils} {d.councils === 1 ? "council" : "councils"}{i === 0 ? " · next up" : ""}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
