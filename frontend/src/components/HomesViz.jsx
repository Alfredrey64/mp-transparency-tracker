/** @jsxImportSource react */
import "../homesviz.css";

// The two pictures on the "New homes" card of Your area. Both are plain HTML that rise out of the ground once their card scrolls into view (the card sets data-in="true"; the rules in
// homesviz.css hold everything flat until then). They only draw the numbers they are given.

const n = (v) => Number(v).toLocaleString("en-GB");
const signed = (v) => (v < 0 ? `−${n(-v)}` : n(v));
const short = (year) => `${year.slice(2, 4)}–${year.slice(5)}`; // 2023-24 -> 23-24

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// A street of buildings, one per year, each as tall as the net homes added that year. The kind of building follows the height and nothing else: a terrace house with a chimney for the
// low years, a block of flats for the middle ones and a tower with a stepped top for the highest, so the picture never says more than the bar would. A year with no figure is a dashed
// plot, never a zero. The newest year (provisional) is hatched like a building under scaffolding.
const kind = (v, top) => (v == null ? "none" : v <= 0 || v / top < 0.12 ? "stub" : v / top < 0.45 ? "house" : v / top < 0.8 ? "block" : "tower");

export function Skyline({ years, values, colour, aria }) {
  const top = Math.max(...values.map((v) => v ?? 0), 1);
  const peak = values.reduce((b, v, k) => (v != null && (b < 0 || v > values[b]) ? k : b), -1);
  const last = values.length - 1;
  return (
    <figure className="hv-sky" style={{ "--hc": colour }}>
      <ol className="hv-houses" aria-label={aria}>
        {values.map((v, k) => (
          <li key={years[k]} style={{ "--h": Math.max(v ?? 0, 0) / top, "--k": k }} data-kind={kind(v, top)} data-state={v == null ? "none" : v < 0 ? "loss" : k === last ? "new" : "ok"} title={v == null ? `${years[k]}: no figure` : `${years[k]}: ${signed(v)} net new homes`}>
            <span className="hv-val">{v == null ? "" : k === last || k === peak || v < 0 ? signed(v) : ""}</span>
            <span className="hv-rise"><i /></span>
          </li>
        ))}
      </ol>
      <ol className="hv-years" aria-hidden="true">
        {years.map((y, k) => <li key={y} data-wide={k % 4 === last % 4 ? "1" : undefined} data-narrow={k % 7 === 0 ? "1" : undefined}>{short(y)}</li>)}
      </ol>
    </figure>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Every council in England piled up by how many homes it added for every 1,000 it has, with this council's own pile marked and a dashed line for England as a whole.
// Anything above `max` goes in the last pile, and anything below zero in the first.
export function Spread({ rates, rate, england, name, colour, max = 20, bins = 20 }) {
  const w = max / bins;
  const at = (v) => Math.min(bins - 1, Math.max(0, Math.floor(v / w)));
  const counts = Array.from({ length: bins }, () => 0);
  rates.forEach((v) => { counts[at(v)] += 1; });
  const tall = Math.max(...counts, 1);
  const pos = (v) => `${(Math.min(max, Math.max(0, v)) / max) * 100}%`;
  const mine = rate == null ? -1 : at(rate);
  const edge = rate == null ? "" : rate / max < 0.14 ? "l" : rate / max > 0.86 ? "r" : "";
  return (
    <figure className="hv-spread" style={{ "--hc": colour }}>
      <div className="hv-pile" role="img" aria-label={`Councils in England by homes added for every 1,000 homes, from none to ${max} or more. ${name ? `${name} is ${rate == null ? "not shown" : `at ${rate}`}. ` : ""}England as a whole is ${england}.`}>
        {counts.map((c, k) => <i key={k} className={k === mine ? "hv-mine" : undefined} style={{ "--h": c / tall, "--k": k }} title={`${(k * w).toFixed(0)}${k === bins - 1 ? " or more" : `–${((k + 1) * w).toFixed(0)}`} per 1,000: ${c} councils`} />)}
        <span className="hv-eng" style={{ left: pos(england) }}><em>England {england}</em></span>
        {rate != null && <span className="hv-pin" data-edge={edge} style={{ left: pos(rate) }}><b>{name} {rate}</b></span>}
      </div>
      <ol className="hv-axis" aria-hidden="true">
        {[0, 5, 10, 15, 20].map((t) => <li key={t} style={{ left: pos(t) }}>{t === max ? `${t}+` : t}</li>)}
      </ol>
      <p className="hv-axis-note">More new homes for their size &rarr;</p>
    </figure>
  );
}
