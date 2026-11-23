/** @jsxImportSource react */
import { useState } from "react";
import { useGo } from "./useGo";
import Unfold from "../Unfold";
import { ELECTION_YEARS, MONTHS, countBy, niceTop, pathOf, stepPoints, yearFraction } from "../../lib/actsPace";
import "../../actspassed.css";

// "The Acts that have become law": the year's Acts of Parliament as they receive Royal Assent, set against last year's pace, and the number of Acts a year since 1990. All of it comes from
// frontend/src/data/acts.json, rebuilt every day by fetch-acts.js from legislation.gov.uk's own feed, so a new Act appears without anyone touching the page. Only Public General Acts are counted
// (not local or private Acts, the devolved parliaments' Acts or the many statutory instruments made under them). The pictures draw themselves once they scroll into view.

const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
const fmtFull = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthMid = (m) => (Date.UTC(2026, m, 15) - Date.UTC(2026, 0, 1)) / 86400000 / 365;

function Race({ acts, last, year, today }) {
  const thisPts = stepPoints(acts, yearFraction(today.replace(/^\d{4}/, String(year))));
  const lastPts = stepPoints(last);
  const top = niceTop(Math.max(acts.length, last.length));
  const lastSoFar = countBy(last, today);
  return (
    <figure className="acp-race">
      <div className="acp-plot" role="img" aria-label={`Acts made law, running total through the year. ${acts.length} so far in ${year}; ${lastSoFar} by this date in ${year - 1}, and ${last.length} in the whole of ${year - 1}.`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[0, 50, 100].map((p) => <line key={p} x1="0" x2="100" y1={p} y2={p} className="acp-grid" />)}
          <path d={pathOf(lastPts, top)} className="acp-last" />
          <path d={pathOf(thisPts, top)} className="acp-this" />
        </svg>
        <span className="acp-yt" style={{ top: 0 }}>{top}</span>
        <span className="acp-yt" style={{ top: "50%" }}>{top / 2}</span>
        <span className="acp-yt" style={{ top: "100%" }}>0</span>
        {acts.map((a, i) => (
          <i key={a.number} className="acp-dot" style={{ left: `${yearFraction(a.date) * 100}%`, top: `${100 - ((i + 1) / top) * 100}%`, "--k": i }} title={`${a.title}: ${fmtDay(a.date)}`} aria-hidden="true" />
        ))}
        <b className="acp-tag" style={{ left: `${yearFraction(today.replace(/^\d{4}/, String(year))) * 100}%`, top: `${100 - (acts.length / top) * 100}%` }} aria-hidden="true">{acts.length}</b>
      </div>
      <div className="acp-xt" aria-hidden="true">{MONTHS.map((m, i) => <span key={m} style={{ left: `${monthMid(i) * 100}%` }}>{m}</span>)}</div>
      <figcaption className="acp-key"><i className="acp-k1" /> {year} <i className="acp-k2" /> {year - 1}. Each dot is one Act becoming law; point at one to see which.</figcaption>
    </figure>
  );
}

function Years({ perYear, year }) {
  const years = Object.keys(perYear).map(Number).filter((y) => y >= 1990).sort((a, b) => a - b);
  const max = Math.max(...years.map((y) => perYear[y]));
  return (
    <figure className="acp-years">
      <div className="acp-bars" role="img" aria-label={`Public General Acts made each year from ${years[0]} to ${year}, between ${Math.min(...years.slice(0, -1).map((y) => perYear[y]))} and ${max} a year. ${year} is not over yet.`}>
        {years.map((y, k) => (
          <div key={y} className="acp-col" data-now={y === year ? "1" : "0"} data-elec={ELECTION_YEARS.has(y) ? "1" : "0"} style={{ "--h": perYear[y] / max, "--k": k }} title={`${y}: ${perYear[y]} Acts${y === year ? " so far" : ""}${ELECTION_YEARS.has(y) ? " (general election year)" : ""}`}>
            <i />
          </div>
        ))}
      </div>
      <div className="acp-ax" aria-hidden="true"><span>{years[0]}</span><span>2000</span><span>2010</span><span>2020</span><span>{year}</span></div>
      <figcaption className="acp-key"><i className="acp-k3" /> general election year (Parliament is dissolved for the campaign, so there are fewer sitting days) <i className="acp-k4" /> {year}, so far</figcaption>
    </figure>
  );
}

export default function ActsPassed({ data, today = new Date().toISOString().slice(0, 10) }) {
  const [ref, go] = useGo(0.15);
  const [all, setAll] = useState(false);
  const acts = data.thisYear;
  const year = data.year;
  const newest = [...acts].reverse();
  const lastBy = countBy(data.lastYear, today);
  const row = (a) => (
    <li key={a.number}>
      <time dateTime={a.date}>{fmtFull(a.date)}</time>
      <a href={`https://www.legislation.gov.uk/ukpga/${year}/${a.number}`} target="_blank" rel="noreferrer">{a.title}<span className="sr-only"> (opens in a new tab)</span></a>
      <span>{a.summary}</span>
    </li>
  );
  return (
    <div ref={ref} className="ap" data-go={go}>
      <ul className="acp-stats">
        <li><b>{acts.length}</b><span>Acts made law so far in {year}</span></li>
        <li><b>{lastBy}</b><span>by this date in {year - 1}</span></li>
        <li><b>{data.lastYear.length}</b><span>in the whole of {year - 1}</span></li>
      </ul>
      <h3 className="acp-h">The year so far, against last year</h3>
      <Race acts={acts} last={data.lastYear} year={year} today={today} />
      <h3 className="acp-h">Acts a year since 1990</h3>
      <Years perYear={data.perYear} year={year} />
      {acts.length > 0 && (
        <>
          <h3 className="acp-h">The newest Acts</h3>
          <ol className="acp-list">{newest.slice(0, 5).map(row)}</ol>
          {newest.length > 5 && (
            <>
              <Unfold open={all} settle><ol className="acp-list acp-more">{newest.slice(5).map(row)}</ol></Unfold>
              <button type="button" className="acp-btn" aria-expanded={all} onClick={() => setAll((v) => !v)}>{all ? "Show fewer" : `Show all ${newest.length} Acts of ${year}`}</button>
            </>
          )}
        </>
      )}
      <p className="acp-foot">Public General Acts only, counted by the date each became law (Royal Assent), from legislation.gov.uk. Local and private Acts, the Scottish, Welsh and Northern Ireland parliaments&apos; Acts and statutory instruments are not counted. A count of Acts says nothing about how big or important each one is: one Act can run to hundreds of pages and another to a few lines.</p>
    </div>
  );
}
