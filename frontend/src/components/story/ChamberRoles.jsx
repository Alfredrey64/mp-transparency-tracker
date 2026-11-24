/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { lowData } from "../../lib/lowData";
import "../../chamberroles.css";

// The picture at the top of "The Speaker, whips and clerks": a simple plan of the Commons Chamber (a dot for a seat, not to scale, not a count of seats) with the three groups the page is about.
// Pressing a card, or waiting, moves the spotlight between them: the Speaker calls MPs to speak, the whips marshal their own side's members, the clerks pass papers between the Table and the Chair.
// The cards use the page's own words. The spotlight steps on by itself while the picture is on screen, until someone presses a card; calmer motion shows it still.

const GOV = "#2C5F9E";
const OPP = "#9A3F55";

const ROW_Y = [86, 122, 158, 194, 230, 266, 302];
const TIER_X = [60, 98, 136, 174];
const side = (xs, key) => xs.flatMap((x, c) => ROW_Y.map((y, r) => ({ x, y, key: `${key}${c}-${r}`, i: c * 7 + r, row: r, tier: c })));
const LEFT = side(TIER_X, "g");
const RIGHT = side(TIER_X.map((x) => 640 - x), "o");
const WHIP_ROW = 6;

export default function ChamberRoles({ roles }) {
  const [role, setRole] = useState(0);
  const [touched, setTouched] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const fig = useRef(null);
  const calm = useReducedMotion() || lowData();

  useEffect(() => {
    const el = fig.current;
    if (!el || typeof IntersectionObserver === "undefined") { setOnScreen(true); return undefined; }
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const auto = onScreen && !touched && !calm;
  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(() => setRole((r) => (r + 1) % roles.length), 5200);
    return () => clearTimeout(t);
  }, [auto, role, roles.length]);

  function pick(k) { setTouched(true); setRole(k); }
  const key = roles[role].key;
  return (
    <figure ref={fig} className="swr" data-role={key} data-calm={calm ? "1" : "0"} data-on={onScreen ? "1" : "0"}>
      <div className="swr-stage">
        <svg viewBox="0 0 640 352" role="img" aria-label="A plan of the House of Commons Chamber: the Speaker's chair at the top, the clerks at the Table below it, and MPs on the benches on each side, with a whip at the end of each side.">
          <rect className="swr-floor" x="236" y="62" width="168" height="248" rx="20" />
          {[0, 1].map((k) => <circle key={k} className="swr-ring" cx="320" cy="34" r="22" style={{ "--k": k }} />)}
          <g className="swr-spk">
            <rect x="294" y="12" width="52" height="40" rx="12" fill="#A9701F" />
            <circle cx="320" cy="32" r="11" fill="#FFF6DC" />
            <circle cx="320" cy="29" r="4.2" fill="#A9701F" />
            <path d="M311 40c2-5 16-5 18 0" fill="none" stroke="#A9701F" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g className="swr-clk">
            <rect className="swr-table" x="262" y="124" width="116" height="152" rx="10" />
            {[290, 320, 350].map((x) => <circle key={x} cx={x} cy="106" r="8.5" fill="#1F7A6E" />)}
            <rect className="swr-book" x="298" y="170" width="44" height="30" rx="4" />
            <path d="M320 170v30M304 178h10M326 178h10M304 186h10M326 186h10" stroke="#1F7A6E" strokeWidth="2" strokeLinecap="round" />
            {[0, 1, 2].map((k) => <rect key={k} className="swr-paper" x="313" y="96" width="14" height="18" rx="2" style={{ "--k": k }} />)}
          </g>
          <g className="swr-lines" aria-hidden="true">
            {ROW_Y.slice(0, WHIP_ROW).map((y, r) => <path key={`g${r}`} className="swr-line swr-lg" d={`M${TIER_X[3]} ${ROW_Y[WHIP_ROW]} L${TIER_X[3]} ${y}`} style={{ "--r": r }} />)}
            {ROW_Y.slice(0, WHIP_ROW).map((y, r) => <path key={`o${r}`} className="swr-line swr-lo" d={`M${640 - TIER_X[3]} ${ROW_Y[WHIP_ROW]} L${640 - TIER_X[3]} ${y}`} style={{ "--r": r }} />)}
          </g>
          <g className="swr-mps swr-gov" style={{ color: GOV }}>
            {LEFT.map((d) => (d.tier === 3 && d.row === WHIP_ROW
              ? <g key={d.key} className="swr-whip"><circle cx={d.x} cy={d.y} r="14" fill="none" stroke={GOV} strokeWidth="2.5" className="swr-whip-ring" /><circle cx={d.x} cy={d.y} r="9" fill={GOV} /></g>
              : <circle key={d.key} className={`swr-dot${d.tier === 1 && d.row === 2 ? " swr-up1" : ""}`} cx={d.x} cy={d.y} r="7" fill={GOV} style={{ "--i": d.i }} />))}
          </g>
          <g className="swr-mps swr-opp" style={{ color: OPP }}>
            {RIGHT.map((d) => (d.tier === 3 && d.row === WHIP_ROW
              ? <g key={d.key} className="swr-whip"><circle cx={d.x} cy={d.y} r="14" fill="none" stroke={OPP} strokeWidth="2.5" className="swr-whip-ring" /><circle cx={d.x} cy={d.y} r="9" fill={OPP} /></g>
              : <circle key={d.key} className={`swr-dot${d.tier === 2 && d.row === 3 ? " swr-up2" : ""}`} cx={d.x} cy={d.y} r="7" fill={OPP} style={{ "--i": d.i }} />))}
          </g>
          <text className="swr-side" x="117" y="342" textAnchor="middle">Government side</text>
          <text className="swr-side" x="523" y="342" textAnchor="middle">Opposition side</text>
        </svg>
        <figcaption>A simplified plan of the Commons Chamber: one dot is one seat, not to scale. The two sides face each other across the floor.</figcaption>
      </div>
      <div className="swr-cards" role="group" aria-label="Pick a group to see where it sits and what it does">
        {roles.map((r, k) => {
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={k === role}
              className="swr-card"
              style={{ "--c": r.colour }}
              onClick={() => pick(k)}
            >
              <span className="swr-ico" aria-hidden="true"><Icon size={22} /></span>
              <span className="swr-txt">
                <b>{r.title}</b>
                <span>{r.text}</span>
                <em>{r.badge}</em>
              </span>
              {k === role && auto && <i className="swr-timer" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </figure>
  );
}
