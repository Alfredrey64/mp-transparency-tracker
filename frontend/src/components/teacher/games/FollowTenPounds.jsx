/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { TEN, tenPounds, poundText, howFar, shuffled } from "../../../lib/teacherGames";
import { HIGHER_LOWER, starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Dots, Stars } from "./kit";

// Follow the £10: ten pound coins to share out between the eight things the government spends on, then a reveal of where ten pounds of public spending
// really goes. The coins sit in a purse at the top and fade as they are placed, and the real figure slides in as a marker, so nothing moves on the page.
export default function FollowTenPounds() {
  const real = useMemo(() => tenPounds(), []);
  const order = useMemo(() => shuffled(real, 5), [real]);
  const [coins, setCoins] = useState({});
  const [shown, setShown] = useState(false);
  const placed = Object.values(coins).reduce((t, n) => t + n, 0);
  const left = TEN - placed;
  const result = shown ? howFar(coins, real) : null;
  const add = (k, d) => setCoins((c) => ({ ...c, [k]: Math.max(0, (c[k] ?? 0) + d) }));
  const restart = () => { setCoins({}); setShown(false); setHl(null); setBurst(0); };
  // Stage two: higher or lower. Two slices at a time, and the class says which gets more of every £10.
  const [hl, setHl] = useState(null);
  const [hi, setHi] = useState(0);
  const [pickedKey, setPickedKey] = useState(null);
  const [slips, setSlips] = useState(0);
  const [burst, setBurst] = useState(0);
  const pair = HIGHER_LOWER[hi]?.map((k) => real.find((r) => r.key === k));
  const bigger = pair ? (pair[0].pounds > pair[1].pounds ? pair[0] : pair[1]) : null;
  const startHl = () => { setHl("play"); setHi(0); setPickedKey(null); setSlips(0); };
  const choose = (k) => { if (pickedKey) return; setPickedKey(k); if (k !== bigger.key) setSlips((n) => n + 1); };
  const nextPair = () => { if (hi + 1 >= HIGHER_LOWER.length) { setHl("end"); setBurst((b) => b + 1); } else { setHi(hi + 1); setPickedKey(null); } };

  return (
    <div className="gm gm-ten">
      <Confetti burst={burst} />
      <p className="gm-help">Here is <b>£10</b> of everything the government plans to spend. Share it out between the eight things below, then find out where it really goes. A pound is a coin.</p>
      <div className="gm-purse" role="img" aria-label={`${left} of ${TEN} pounds left to place`}>
        {Array.from({ length: TEN }, (_, i) => <span key={i} className="gm-coin" data-used={i >= left ? "1" : "0"}>£1</span>)}
        <b className="gm-purse-n">{left === 0 ? "All placed" : `${left} left`}</b>
      </div>
      <ul className="gm-ten-grid">
        {order.map((r) => {
          const n = coins[r.key] ?? 0;
          const g = shown ? result.gaps.find((x) => x.key === r.key) : null;
          return (
            <li key={r.key} className="gm-pound" style={{ "--gc": r.colour }}>
              <b>{r.label}</b>
              <small>{r.example}</small>
              <div className="gm-pound-ctl">
                <button type="button" className="gm-step" aria-label={`Take a pound off ${r.label}`} onClick={() => add(r.key, -1)} disabled={n === 0 || shown}>−</button>
                <span className="gm-pound-n" aria-live="polite">£{n}</span>
                <button type="button" className="gm-step" aria-label={`Put a pound on ${r.label}`} onClick={() => add(r.key, 1)} disabled={left === 0 || shown}>+</button>
              </div>
              <div className="gm-bar" aria-hidden="true">
                <i style={{ width: `${n * 10}%` }} />
                <u style={{ left: `${g ? Math.min(100, g.real * 10) : 0}%`, opacity: shown ? 1 : 0 }} />
              </div>
              <em className="gm-real" data-on={shown ? "1" : "0"}>{shown ? `Really ${poundText(g.real)}` : "Really £?"}</em>
            </li>
          );
        })}
      </ul>
      <Coach mood={!shown ? "think" : result.misplaced < 2.5 ? "cheer" : "happy"} right={shown}>
        {!shown
          ? (left === 0 ? "All ten pounds are placed. Reveal where they really go." : "Place every coin, then reveal where the money really goes.")
          : `You put £${result.misplaced.toFixed(2).replace(/\.00$/, "")} in a different place from the real picture. The biggest surprise: ${result.biggest.label}, where you put £${result.biggest.guess} and ${poundText(result.biggest.real)} is the real figure.`}
      </Coach>
      <p className="gm-help gm-small">Based on the planned spending for 2025 to 26 on our Where taxes go page. The government also raises money by borrowing, so these are shares of what it spends, not of what it collects.</p>
      <div className="cr-row">
        {!shown && <button type="button" className="btn btn-primary btn-lg" onClick={() => setShown(true)} disabled={left !== 0}>Show where it really goes</button>}
        {shown && !hl && <button type="button" className="btn btn-primary btn-lg" onClick={startHl}>Next: higher or lower</button>}
        <button type="button" className="btn btn-secondary btn-lg" onClick={restart} disabled={placed === 0 && !shown}>Start again</button>
      </div>
      {hl === "play" && (
        <div className="gm-hl">
          <Dots at={hi + (pickedKey ? 1 : 0)} total={HIGHER_LOWER.length} label="Pairs" />
          <div className="gm-prompt" key={hi}><small>Pair {hi + 1} of {HIGHER_LOWER.length}</small><b>Which gets more of every £10?</b><span>Tap one.</span></div>
          <div className="gm-vs">
            {pair.map((r) => (
              <button key={r.key} type="button" className="gm-vs-card" style={{ "--gc": r.colour }} data-state={!pickedKey ? "idle" : r.key === bigger.key ? "right" : pickedKey === r.key ? "wrong" : "idle"} disabled={Boolean(pickedKey)} onClick={() => choose(r.key)}>
                <b>{r.label}</b><small>{r.example}</small>
                <span className="gm-vs-bar" aria-hidden="true"><i style={{ width: pickedKey ? `${r.pounds * 10}%` : "0%" }} /></span>
                <em>{pickedKey ? poundText(r.pounds) : "£?"}</em>
              </button>
            ))}
          </div>
          <Coach mood={!pickedKey ? "think" : pickedKey === bigger.key ? "happy" : "oops"} right={pickedKey === bigger.key}>{!pickedKey ? "Think about what the government spends most on." : `${bigger.label} gets more: ${poundText(bigger.pounds)} against ${poundText(pair.find((r) => r.key !== bigger.key).pounds)}.`}</Coach>
          <div className="cr-row">{pickedKey && <button type="button" className="btn btn-primary btn-lg" onClick={nextPair}>{hi + 1 >= HIGHER_LOWER.length ? "Finish" : "Next pair"}</button>}</div>
        </div>
      )}
      {hl === "end" && <div className="gm-end"><Stars n={starsFor(slips)} /><b>{HIGHER_LOWER.length - slips} of {HIGHER_LOWER.length} right</b><p>The biggest single slice is pensions and benefits. Ask the class which of the slices surprised them.</p></div>}
    </div>
  );
}
