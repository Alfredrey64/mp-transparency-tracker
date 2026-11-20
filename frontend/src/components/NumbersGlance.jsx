/** @jsxImportSource react */
import { useMemo } from "react";
import CountUp from "./CountUp";
import { IconPinHome, IconBriefcase, IconCoin, IconCouncil, IconHouse, IconTransport } from "./icons";
import { useDataFile } from "../lib/useDataFile";
import { localEconomy, councilServices } from "../lib/dataFiles";
import { seatRecord, claimantRow, payRow } from "../lib/localEconomyView";
import { roadRows } from "../lib/councilServices";
import { glanceTiles, FORMATS } from "../lib/numbersGlance";
import { scrollToId } from "../lib/scrollToId";
import "../areanumbers.css";

// The boxes at the top of Your area in numbers: six figures for this place, each set against England (or the UK) with a plain word for how they compare. Every box is a button that
// scrolls to the section with the detail. The figures come from files saved with the site, so nothing here waits on a lookup.

const ICONS = { place: IconPinHome, jobs: IconBriefcase, pay: IconCoin, tax: IconCouncil, homes: IconHouse, roads: IconTransport };

function Arrow({ kind }) {
  return (
    <svg className="mg-arrow" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
      {kind === "up" && <path d="M6 10V2.5M2.5 6 6 2.5 9.5 6" />}
      {kind === "down" && <path d="M6 2v7.5M2.5 6 6 9.5 9.5 6" />}
      {kind === "same" && <path d="M2 4.5h8M2 7.5h8" />}
    </svg>
  );
}

function Compare({ tile }) {
  const fmt = FORMATS[tile.format];
  const max = Math.max(tile.value, tile.ref ?? 0) || 1;
  return (
    <span className="mg-cmp" aria-hidden="true">
      <span className="mg-cmp-row"><em>Here</em><span className="mg-cmp-track"><i style={{ "--w": tile.value / max }} /></span><b>{fmt(tile.value)}</b></span>
      {tile.ref != null && <span className="mg-cmp-row mg-cmp-ref"><em>{tile.refName === "England average" ? "England" : tile.refName}</em><span className="mg-cmp-track"><i style={{ "--w": tile.ref / max }} /></span><b>{fmt(tile.ref)}</b></span>}
    </span>
  );
}

function Tenth({ decile }) {
  return (
    <span className="mg-tenth" aria-hidden="true">
      <span className="mg-tenth-strip">{Array.from({ length: 10 }, (_, n) => <i key={n} data-me={n + 1 === decile ? "true" : undefined} style={{ "--k": n }} />)}</span>
      <span className="mg-tenth-ends"><em>Most deprived</em><em>Least deprived</em></span>
    </span>
  );
}

export default function NumbersGlance({ data, x }) {
  const { result: r, council, county, regionName } = data;
  const econ = useDataFile(localEconomy);
  const svc = useDataFile(councilServices);
  const loading = !x || x.tax === undefined || x.snapshot === undefined || (!econ.data && !econ.failed) || (!svc.data && !svc.failed);
  const tiles = useMemo(() => {
    if (loading) return [];
    const seat = econ.data ? seatRecord(econ.data, r.codes, r.parliamentary_constituency) : null;
    return glanceTiles({
      nb: x.nb, tax: x.tax, snapshot: x.snapshot, regionName,
      claim: seat ? claimantRow(seat, econ.data) : null, pay: seat ? payRow(seat, econ.data) : null,
      roads: svc.data ? roadRows(svc.data, (county ?? council)?.id) : [],
    });
  }, [loading, x, econ.data, svc.data, r, council, county, regionName]);

  if (loading) return <div className="mg-glance" aria-hidden="true"><ul className="mg-tiles">{Array.from({ length: 6 }, (_, n) => <li key={n} className="mg-tile mg-tile-skel" />)}</ul></div>;
  if (tiles.length === 0) return null;
  return (
    <section className="mg-glance" aria-labelledby="mg-glance-h">
      <header>
        <h2 id="mg-glance-h">Your area at a glance</h2>
        <p>{tiles.length} numbers that sum up the place, each against the England figure. Press one to jump to the detail.</p>
      </header>
      <ul className="mg-tiles">
        {tiles.map((t, n) => {
          const Icon = ICONS[t.icon] ?? IconPinHome;
          const v = t.verdict;
          const spoken = `${t.label}: ${t.valueText ?? FORMATS[t.format](t.value)}.${v ? ` ${v.text}${t.ref != null ? `, which is ${FORMATS[t.format](t.ref)}` : ""}.` : ""} Press to see the detail.`;
          return (
            <li key={t.id}>
              <button type="button" className="mg-tile" style={{ "--tc": t.colour, "--n": n }} onClick={() => scrollToId(t.section)} aria-label={spoken}>
                <span className="mg-tile-top"><i className="mg-tile-icon" aria-hidden="true"><Icon size={18} /></i><span>{t.label}</span></span>
                <b className="mg-tile-value">{t.kind === "tenth" ? t.valueText : <CountUp value={t.value} format={FORMATS[t.format]} />}</b>
                {v && <span className="mg-chip" data-tone={v.tone}><Arrow kind={v.arrow} />{v.text}</span>}
                {t.kind === "tenth" ? <Tenth decile={t.decile} /> : <Compare tile={t} />}
                <small>{t.note}</small>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
