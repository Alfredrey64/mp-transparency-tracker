/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { SCENARIOS, SEATS, majorityOf, seatsOf, verdict, smallestCoalitions, hemicycle } from "../../../lib/teacherGames";

// Build a majority: 650 seats in a half circle, with made-up parties. Tap parties to join them into a government. Their seats light up, a counter climbs to
// the line at 326, and the game says whether the group is short, enough, or has a party it did not need.
const R = 150;

export default function BuildMajority() {
  const [s, setS] = useState(0);
  const [chosen, setChosen] = useState([]);
  const [showBest, setShowBest] = useState(false);
  const scenario = SCENARIOS[s];
  const pts = useMemo(() => hemicycle(), []);
  const need = majorityOf();
  const v = verdict(scenario, chosen);
  const best = useMemo(() => smallestCoalitions(scenario), [scenario]);

  // Each party's seats are a block of the half circle, left to right.
  const owner = useMemo(() => {
    const out = [];
    scenario.parties.forEach(([name, , n]) => { for (let i = 0; i < n; i++) out.push(name); });
    return out;
  }, [scenario]);
  const colourOf = (name) => scenario.parties.find(([n]) => n === name)[1];
  const toggle = (name) => { setChosen((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name])); setShowBest(false); };
  const pick = (n) => { setS(n); setChosen([]); setShowBest(false); };
  const pct = Math.min(100, (v.seats / SEATS) * 100);

  return (
    <div className="gm gm-maj">
      <div className="gm-scen" role="tablist" aria-label="Scenario">
        {SCENARIOS.map((sc, n) => <button key={sc.key} type="button" role="tab" aria-selected={s === n} onClick={() => pick(n)}>{sc.title}</button>)}
      </div>
      <p className="gm-help">{scenario.blurb} Join parties together until they have more than half of the 650 seats. You need <b>{need}</b>.</p>
      <div className="gm-hemi">
        <svg viewBox={`-6 -6 ${R * 2 + 12} ${R + 30}`} role="img" aria-label={`${v.seats} of ${SEATS} seats chosen`}>
          {pts.map((p, i) => {
            const name = owner[i];
            const on = chosen.includes(name);
            return <circle key={i} cx={p.x} cy={p.y} r="3.6" fill={on ? colourOf(name) : "#C9D3E6"} opacity={on ? 1 : 0.55} className="gm-seat" />;
          })}
          <text x={R} y={R - 6} textAnchor="middle" fontSize="40" fontWeight="800" fill="#1B2438" fontFamily="Newsreader, Georgia, serif">{v.seats}</text>
          <text x={R} y={R + 14} textAnchor="middle" fontSize="11.500" fontWeight="700" fill="#5B6784" fontFamily="Public Sans, system-ui, sans-serif">of {SEATS} seats</text>
        </svg>
      </div>
      <div className="gm-meter" role="img" aria-label={`${v.seats} seats, ${need} needed`}>
        <i style={{ width: `${pct}%`, background: v.seats >= need ? "#1FA97C" : "#7A5AF0" }} />
        <u style={{ left: `${(need / SEATS) * 100}%` }}><small>{need}</small></u>
      </div>
      <div className="gm-parties">
        {scenario.parties.map(([name, colour, n]) => {
          const on = chosen.includes(name);
          return (
            <button key={name} type="button" className="gm-party" style={{ "--gc": colour }} aria-pressed={on} onClick={() => toggle(name)}>
              <i /><b>{name}</b><span>{n} seats</span><small>{on ? "In the government" : "Tap to join"}</small>
            </button>
          );
        })}
      </div>
      <p className="gm-verdict" data-state={v.state} aria-live="polite">
        {v.state === "empty" && "Choose a party to start."}
        {v.state === "short" && `Not enough yet: ${v.gap} ${v.gap === 1 ? "seat" : "seats"} short of a majority.`}
        {v.state === "best" && "A majority, with as few parties as possible. That is a stable government."}
        {v.state === "spare" && `A majority, but you did not need ${v.spare === 1 ? "one of those parties" : "all of those parties"}. Could fewer do it?`}
      </p>
      <div className="cr-row">
        <button type="button" className="btn btn-secondary" onClick={() => setShowBest((b) => !b)}>{showBest ? "Hide the answer" : "Show the smallest government"}</button>
        <button type="button" className="btn btn-secondary" onClick={() => { setChosen([]); setShowBest(false); }} disabled={!chosen.length}>Clear</button>
      </div>
      {showBest && <p className="gm-help">{best.length > 1 ? `Several pairs work: ${best.map((g) => g.join(" and ")).join("; ")}.` : `${best[0].join(" and ")} ${best[0].length === 1 ? "has" : "have"} ${seatsOf(scenario, best[0])} seats, enough on ${best[0].length === 1 ? "its own" : "their own"}.`} A group with more than half the seats can pass its laws. When nobody has enough, parties may share the government (a coalition) or one may govern as a minority.</p>}
    </div>
  );
}
