/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { TEN, tenPounds, poundText, howFar, shuffled } from "../../../lib/teacherGames";

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
  const restart = () => { setCoins({}); setShown(false); };

  return (
    <div className="gm gm-ten">
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
      <p className="gm-feedback" aria-live="polite" data-right={shown ? "1" : "0"}>
        {!shown
          ? (left === 0 ? "All ten pounds are placed. Reveal where they really go." : "Place every coin, then reveal where the money really goes.")
          : `You put £${result.misplaced.toFixed(2).replace(/\.00$/, "")} in a different place from the real picture. The biggest surprise: ${result.biggest.label}, where you put £${result.biggest.guess} and ${poundText(result.biggest.real)} is the real figure.`}
      </p>
      <p className="gm-help gm-small">Based on the planned spending for 2025 to 26 on our Where taxes go page. The government also raises money by borrowing, so these are shares of what it spends, not of what it collects.</p>
      <div className="cr-row">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => setShown(true)} disabled={left !== 0 || shown}>Show where it really goes</button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={restart} disabled={placed === 0 && !shown}>Start again</button>
      </div>
    </div>
  );
}
