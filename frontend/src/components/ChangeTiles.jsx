/** @jsxImportSource react */
import CountValue from "./CountValue";

// The four headline figures at the top of the What changed tab. Each is a card that says in a plain sentence what is being counted, shows its share of everything that
// changed as a bar, and is also the filter: pressing it shows just those changes in the list below. The window (7, 14 or 30 days) sits in the sentence above them.
//   tiles   [{ key, value, label, plain, colour, icon, share }]   share is 0 to 1
//   active  the key of the pressed tile, or "all"
export default function ChangeTiles({ total, windows, days, onDays, tiles, active, onPick, accent = "#E0367A" }) {
  return (
    <section className="ct" aria-label="What changed, at a glance" style={{ "--tw-accent": accent }}>
      <div className="ct-head">
        <p className="ct-sentence">
          In the last
          <span className="tw-window" role="group" aria-label="How far back">
            {windows.map((w) => <button key={w.days} type="button" aria-pressed={days === w.days} onClick={() => onDays(w.days)}>{w.label}</button>)}
          </span>
          Parliament recorded <b><CountValue>{String(total)}</CountValue></b> {total === 1 ? "change" : "changes"} we can follow.
        </p>
        {active !== "all" && <button type="button" className="ct-all" onClick={() => onPick("all")}>Show everything</button>}
      </div>
      <ul className="ct-tiles">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          return (
            <li key={t.key} style={{ "--kc": t.colour, "--i": i }}>
              <button type="button" aria-pressed={active === t.key} onClick={() => onPick(active === t.key ? "all" : t.key)}>
                <span className="ct-ico" aria-hidden="true"><Icon size={22} /></span>
                <b className="ct-n"><CountValue>{String(t.value)}</CountValue></b>
                <span className="ct-label">{t.label}</span>
                <small className="ct-plain">{t.plain}</small>
                <i className="ct-bar" aria-hidden="true"><u style={{ "--w": Math.max(0.03, Math.min(1, t.share)) }} /></i>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
