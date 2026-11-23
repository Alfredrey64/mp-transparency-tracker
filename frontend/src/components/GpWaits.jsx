/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { useGo } from "./story/useGo";
import Loading from "./Loading";
import { LoadFailedNote } from "./MpCards";
import { useDataFile } from "../lib/useDataFile";
import { gpAppointments } from "../lib/dataFiles";
import { allocate, dotBands, monthLabel, pointsChange, strip } from "../lib/gpWaits";
import "../gpwaits.css";

// "Seeing a GP": how long after booking GP appointments in England actually happen. A hundred dots stand for a hundred appointments that took place, coloured by the gap between booking and
// the day; the area picker changes the dots, the strip shows where every NHS area sits, and the line shows 30 months of "seen within two weeks". Everything comes from
// data/gpAppointments.json, rebuilt by fetch-gp-appointments.js whenever NHS England publishes a new month. The pictures draw themselves when they scroll into view.

const BAND_COLOURS = ["#0B5D55", "#0F766E", "#2BA394", "#86CDBF", "#F0C75E", "#E39A4E", "#C0561F"];
const BAND_NAMES = ["Same day", "1 day", "2 to 7 days", "8 to 14 days", "15 to 21 days", "22 to 28 days", "More than 28 days"];
const MODE_COLOURS = { "Face-to-Face": "#0F766E", Telephone: "#1D4ED8", "Video/Online": "#7A5AF0", "Home Visit": "#C7871A" };
const MODE_NAMES = { "Face-to-Face": "In person", Telephone: "Phone", "Video/Online": "Video or online", "Home Visit": "Home visit" };
const fmtN = (v) => Math.round(v).toLocaleString("en-GB");
const p1 = (v) => (v == null ? "–" : `${Number(v).toFixed(v >= 10 ? 0 : 1)}%`);

function Dots({ bands, area }) {
  const counts = useMemo(() => allocate(bands), [bands]);
  const dots = useMemo(() => dotBands(counts), [counts]);
  return (
    <div className="gpw-dots" role="img" aria-label={`Of every 100 appointments in ${area}, ${BAND_NAMES.map((n, i) => `${counts[i]} happened ${i === 0 ? "the same day" : i === 6 ? "more than 28 days after booking" : `${n} after booking`}`).filter((_, i) => counts[i] > 0).join(", ")}.`}>
      {dots.map((b, i) => <i key={i} style={{ "--c": BAND_COLOURS[b], "--k": i }} data-band={b} />)}
    </div>
  );
}

function Strip({ data, code }) {
  const boards = data.icbs;
  const values = boards.map((b) => b.within2w);
  const lo = Math.floor(Math.min(...values) / 5) * 5;
  const hi = Math.ceil(Math.max(...values) / 5) * 5;
  const pos = useMemo(() => strip(values, lo, hi), [values, lo, hi]);
  const sel = boards.findIndex((b) => b.code === code);
  const ticks = []; for (let t = lo; t <= hi; t += 5) ticks.push(t);
  const at = (v) => `${((v - lo) / (hi - lo)) * 100}%`;
  return (
    <div className="gpw-strip">
      <div className="gpw-track" role="img" aria-label={`Share of appointments within two weeks of booking in each of ${boards.length} NHS areas, from ${Math.min(...values)} to ${Math.max(...values)} percent. England as a whole: ${data.england.within2w} percent.`}>
        <i className="gpw-eng" style={{ left: at(data.england.within2w) }}><span>England {p1(data.england.within2w)}</span></i>
        {boards.map((b, i) => (
          <b key={b.code} className="gpw-pt" data-sel={i === sel ? "1" : "0"} style={{ left: `${pos[i].x * 100}%`, "--row": pos[i].row, "--k": i }} title={`${b.name}: ${p1(b.within2w)} within two weeks`} />
        ))}
        {sel >= 0 && <em className="gpw-you" style={{ left: `${pos[sel].x * 100}%` }}>{p1(boards[sel].within2w)}</em>}
      </div>
      <div className="gpw-ticks" aria-hidden="true">{ticks.map((t) => <span key={t} style={{ left: at(t) }}>{t}%</span>)}</div>
    </div>
  );
}

function Trend({ data, board }) {
  const months = data.months;
  const eng = data.england.series;
  const mine = board ? board.series : null;
  const all = [...eng, ...(mine ?? [])].filter((v) => v != null);
  const lo = Math.floor(Math.min(...all) - 1);
  const hi = Math.ceil(Math.max(...all) + 1);
  const x = (i) => (i / (months.length - 1)) * 100;
  const y = (v) => 100 - ((v - lo) / (hi - lo)) * 100;
  const path = (s) => s.map((v, i) => (v == null ? "" : `${i && s[i - 1] != null ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)).join("");
  const label = (i) => new Date(Date.UTC(Number(months[i].slice(0, 4)), Number(months[i].slice(5)) - 1, 15)).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
  const ticks = [0, Math.round((months.length - 1) / 2), months.length - 1];
  const mean = eng.reduce((a, b) => a + (b ?? 0), 0) / eng.length;
  const dips = eng.map((v, i) => (v != null && v < mean - 3 ? i : -1)).filter((i) => i >= 0);
  return (
    <div className="gpw-trend">
      <div className="gpw-plot" role="img" aria-label={`Share of appointments within two weeks of booking, month by month from ${label(0)} to ${label(months.length - 1)}. England went from ${eng[0]} to ${eng.at(-1)} percent.`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[0, 50, 100].map((p) => <line key={p} x1="0" x2="100" y1={p} y2={p} className="gpw-grid" />)}
          <path d={path(eng)} className="gpw-line gpw-line-eng" />
          {mine && <path d={path(mine)} className="gpw-line gpw-line-me" key={board.code} />}
        </svg>
        <span className="gpw-yt" style={{ top: 0 }}>{hi}%</span>
        <span className="gpw-yt" style={{ top: "100%" }}>{lo}%</span>
      </div>
      <div className="gpw-xt" aria-hidden="true">{ticks.map((i) => <span key={i} style={{ left: `${x(i)}%` }} data-edge={i === 0 ? "l" : i === months.length - 1 ? "r" : ""}>{label(i)}</span>)}</div>
      <p className="gpw-key"><i className="gpw-k1" /> England {board && <><i className="gpw-k2" /> {board.name}</>}</p>
      {dips.length > 0 && <p className="gpw-note">England&apos;s share drops sharply in {dips.map(label).join(" and ")}, more than three points below the average of the months shown. The statistics do not say why, so compare a month with the same month a year earlier rather than with the month before.</p>}
    </div>
  );
}

function Mix({ title, items, names, colours }) {
  const rows = Object.entries(items).filter(([, v]) => v >= 0.5);
  return (
    <div className="gpw-mix">
      <h4>{title}</h4>
      <div className="gpw-mixbar" role="img" aria-label={`${title}: ${rows.map(([k, v]) => `${names[k] ?? k} ${Math.round(v)} percent`).join(", ")}.`}>
        {rows.map(([k, v], i) => <i key={k} style={{ flexGrow: v, background: colours[k] ?? "#8C97AD", "--i": i }}>{v >= 9 && <span>{Math.round(v)}%</span>}</i>)}
      </div>
      <ul>{rows.map(([k, v]) => <li key={k}><i style={{ background: colours[k] ?? "#8C97AD" }} aria-hidden="true" />{names[k] ?? k} <b>{v.toFixed(1)}%</b></li>)}</ul>
    </div>
  );
}

export default function GpWaits() {
  const { data, failed } = useDataFile(gpAppointments);
  const [code, setCode] = useState("england");
  const [ref, go] = useGo(0.12);
  if (failed) return <LoadFailedNote item="the GP appointment figures" />;
  if (!data) return <div className="gpw-hold"><Loading compact /></div>;
  const board = code === "england" ? null : data.icbs.find((b) => b.code === code) ?? null;
  const cur = board ?? data.england;
  const area = board ? board.name : "England";
  const staff = data.england.staff;
  return (
    <div ref={ref} className="gpw" data-go={go}>
      <div className="gpw-pick">
        <label htmlFor="gpw-area">Show me</label>
        <select id="gpw-area" value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="england">England as a whole</option>
          {data.icbs.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
        <span>{monthLabel(data.latest)}</span>
      </div>

      <div className="gpw-top">
        <div className="gpw-face">
          <h3 className="gpw-h">Of every 100 appointments in {area}, when did they happen after booking?</h3>
          <Dots bands={cur.bands} area={area} />
        </div>
        <div className="gpw-side">
          <ul className="gpw-legend">
            {BAND_NAMES.map((n, i) => <li key={n}><i style={{ background: BAND_COLOURS[i] }} aria-hidden="true" />{n}<b>{p1(cur.bands[i])}</b></li>)}
          </ul>
          <ul className="gpw-stats">
            <li><b>{p1(cur.within2w)}</b><span>within two weeks of booking, {pointsChange(cur.within2w, cur.yearAgo?.within2w) ?? "no figure for a year ago"}</span></li>
            <li><b>{p1(cur.over28)}</b><span>more than 28 days after booking</span></li>
            <li><b>{p1(cur.dna)}</b><span>of appointments missed (patient did not attend)</span></li>
          </ul>
        </div>
      </div>

      <h3 className="gpw-h">Where {board ? "this area sits among" : "every one of"} the {data.icbs.length} NHS areas: appointments within two weeks</h3>
      <Strip data={data} code={code} />

      <h3 className="gpw-h">The last {data.months.length} months</h3>
      <Trend data={data} board={board} />

      <div className="gpw-mixes">
        <Mix title={`How England's appointments happen, ${monthLabel(data.latest)}`} items={data.england.mode} names={MODE_NAMES} colours={MODE_COLOURS} />
        <Mix title="Who the appointment is with" items={{ GP: staff.GP, "Other Practice staff": staff["Other Practice staff"] }} names={{ GP: "A GP", "Other Practice staff": "Other practice staff (not a GP)" }} colours={{ GP: "#0F766E", "Other Practice staff": "#C7871A" }} />
      </div>

      <p className="gpw-foot">{fmtN(data.england.n)} appointments took place in England in {monthLabel(data.latest)}, from NHS England&apos;s &quot;Appointments in General Practice&quot; statistics. These count appointments recorded in GP practices&apos; systems, not people and not every contact with a practice, and the NHS areas shown are the integrated care boards named in NHS England's file. The gap between booking and the appointment is not a patient&apos;s wait for care: a same-day appointment may be urgent care offered on the day, and a later one may have been chosen. Shares are of appointments that took place and have a recorded gap; missed appointments are counted separately. The mix bars are shares of all appointments, so they add to less than 100% where NHS England's file records the type as unknown. Read {data.fetchedAt}.</p>
    </div>
  );
}
