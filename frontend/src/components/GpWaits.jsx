/** @jsxImportSource react */
import { useEffect, useMemo, useRef, useState } from "react";
import { useGo } from "./story/useGo";
import Loading from "./Loading";
import { LoadFailedNote } from "./MpCards";
import { useDataFile } from "../lib/useDataFile";
import { gpAppointments } from "../lib/dataFiles";
import { allocate, dotBands, monthLabel, pointsChange, rankBoards, strip } from "../lib/gpWaits";
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
const pd = (v) => (v == null ? "–" : `${Number(v).toFixed(1)}%`); // one decimal always, so areas with close figures can be told apart
const signedPts = (v) => (v == null ? "–" : v === 0 ? "level" : `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`);
const TABLE_PAGE = 10;

function Dots({ bands, area }) {
  const counts = useMemo(() => allocate(bands), [bands]);
  const dots = useMemo(() => dotBands(counts), [counts]);
  return (
    <div className="gpw-dots" role="img" aria-label={`Of every 100 appointments in ${area}, ${BAND_NAMES.map((n, i) => `${counts[i]} happened ${i === 0 ? "the same day" : i === 6 ? "more than 28 days after booking" : `${n} after booking`}`).filter((_, i) => counts[i] > 0).join(", ")}.`}>
      {dots.map((b, i) => <i key={i} style={{ "--c": BAND_COLOURS[b], "--k": i }} data-band={b} />)}
    </div>
  );
}

// One of the two big pictures, in a box of its own: a heading, what it shows in plain words, how to read it, then the picture.
function Box({ title, id, explain, read, children }) {
  return (
    <section className="gpw-box" aria-labelledby={id}>
      <h3 className="gpw-bt" id={id}>{title}</h3>
      <p className="gpw-explain">{explain}</p>
      <ul className="gpw-how">{read.map((r) => <li key={r}>{r}</li>)}</ul>
      {children}
    </section>
  );
}

// Every NHS area as a dot along the share seen within two weeks. A dot can be hovered, tabbed to or pressed: it gets an outline and a label with the area's name, and pressing it picks that area for
// the whole page. Dots at or above England's figure are teal, those below are amber.
function Strip({ data, code, ranked, hot, setHot, pick }) {
  const boards = data.icbs;
  const values = boards.map((b) => b.within2w);
  const lo = Math.floor(Math.min(...values) / 5) * 5;
  const hi = Math.ceil(Math.max(...values) / 5) * 5;
  // Dots are 15 px across and need about 19 px between centres, so how close two may sit depends on how wide the strip is on this screen; the rows grow to fit.
  const trackRef = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = trackRef.current; if (!el) return undefined;
    const read = () => setWidth(Math.round(el.getBoundingClientRect().width));
    read();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pos = useMemo(() => strip(values, lo, hi, 19 / (width || 800), 16), [values, lo, hi, width]);
  const tallest = pos.reduce((m, p) => Math.max(m, p.row), 0);
  const rankOf = useMemo(() => Object.fromEntries(ranked.map((r) => [r.code, r.rank])), [ranked]);
  const eng = data.england.within2w;
  const ticks = []; for (let t = lo; t <= hi; t += 5) ticks.push(t);
  const at = (v) => `${((v - lo) / (hi - lo)) * 100}%`;
  return (
    <div className="gpw-strip">
      <div ref={trackRef} className="gpw-track" style={{ height: Math.max(96, 40 + (tallest + 1) * 17) }} role="group" aria-label={`Share of appointments within two weeks of booking in each of ${boards.length} NHS areas, from ${Math.min(...values)} to ${Math.max(...values)} percent. England as a whole: ${eng} percent. Each dot is a button that picks that area.`}>
        <i className="gpw-eng" style={{ left: at(eng) }}><span>England {pd(eng)}</span></i>
        {boards.map((b, i) => {
          const x = pos[i].x;
          return (
            <button key={b.code} type="button" className="gpw-pt" aria-pressed={b.code === code} data-sel={b.code === code ? "1" : "0"} data-hot={hot === b.code ? "1" : "0"} data-above={b.within2w >= eng ? "1" : "0"} data-edge={x < 0.2 ? "l" : x > 0.8 ? "r" : ""}
              style={{ position: "absolute", left: `${x * 100}%`, "--row": pos[i].row, "--k": i }} onClick={() => pick(b.code === code ? "england" : b.code)} onMouseEnter={() => setHot(b.code)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(b.code)} onBlur={() => setHot(null)}
              aria-label={`${b.name}: ${pd(b.within2w)} within two weeks, ranked ${rankOf[b.code]} of ${boards.length}`}>
              <span className="gpw-tip" aria-hidden="true"><b>{b.name}</b>{pd(b.within2w)} · ranked {rankOf[b.code]} of {boards.length}</span>
            </button>
          );
        })}
      </div>
      <div className="gpw-ticks" aria-hidden="true">{ticks.map((t) => <span key={t} style={{ left: at(t) }}>{t}%</span>)}</div>
      <p className="gpw-key gpw-key-dots"><i className="gpw-kd" data-above="1" /> At or above England <i className="gpw-kd" data-above="0" /> Below England <i className="gpw-kd" data-sel="1" /> The area picked</p>
    </div>
  );
}

// The areas in a table, highest share first. Hovering or pressing a row does the same to its dot.
function RankTable({ ranked, england, code, hot, setHot, pick, month }) {
  const [shown, setShown] = useState(TABLE_PAGE);
  const top = Math.max(...ranked.map((r) => r.within2w));
  return (
    <div className="gpw-tablewrap">
      <table className="gpw-table">
        <caption>NHS areas ranked by the share of appointments within two weeks of booking, {month}</caption>
        <thead><tr><th scope="col">Rank</th><th scope="col">NHS area</th><th scope="col">Within two weeks</th><th scope="col"><span className="gpw-wid">Compared with England</span><span className="gpw-nar">vs England (points)</span></th><th scope="col" className="gpw-col-wide">More than 28 days</th></tr></thead>
        <tbody>
          {ranked.slice(0, shown).map((r) => (
            <tr key={r.code} data-sel={r.code === code ? "1" : "0"} data-hot={hot === r.code ? "1" : "0"} onMouseEnter={() => setHot(r.code)} onMouseLeave={() => setHot(null)}>
              <td className="gpw-rk">{r.rank}</td>
              <th scope="row"><button type="button" className="gpw-link" aria-pressed={r.code === code} onClick={() => pick(r.code === code ? "england" : r.code)} onFocus={() => setHot(r.code)} onBlur={() => setHot(null)}>{r.name}</button></th>
              <td className="gpw-pc"><span className="gpw-bar" aria-hidden="true"><i style={{ width: `${(r.within2w / top) * 100}%` }} data-above={r.within2w >= england ? "1" : "0"} /></span><b>{pd(r.within2w)}</b></td>
              <td data-above={r.diff == null ? "" : r.diff >= 0 ? "1" : "0"} className="gpw-df">{signedPts(r.diff)}{r.diff ? <span className="gpw-wid"> points</span> : null}</td>
              <td className="gpw-col-wide">{pd(r.over28)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><th scope="row" colSpan={2}>England as a whole</th><td className="gpw-pc"><span className="gpw-bar" style={{ visibility: "hidden" }} aria-hidden="true" /><b>{pd(england)}</b></td><td>–</td><td className="gpw-col-wide">–</td></tr></tfoot>
      </table>
      {ranked.length > shown && <button type="button" className="gpw-more" onClick={() => setShown(Math.min(ranked.length, shown + TABLE_PAGE))}>Show {Math.min(TABLE_PAGE, ranked.length - shown)} more ({ranked.length - shown} left)</button>}
    </div>
  );
}

// The share seen within two weeks, month by month: England as a filled line and the picked area as an orange line. Moving the pointer along it (or pressing the left and right arrow keys
// while it is focused) reads off a month.
function Trend({ data, board }) {
  const months = data.months;
  const eng = data.england.series;
  const mine = board ? board.series : null;
  const [at, setAt] = useState(null);
  const all = [...eng, ...(mine ?? [])].filter((v) => v != null);
  const lo = Math.floor(Math.min(...all) - 1);
  const hi = Math.ceil(Math.max(...all) + 1);
  const n = months.length;
  const x = (i) => (i / (n - 1)) * 100;
  const y = (v) => 100 - ((v - lo) / (hi - lo)) * 100;
  const path = (s) => s.map((v, i) => (v == null ? "" : `${i && s[i - 1] != null ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)).join("");
  const label = (i) => new Date(Date.UTC(Number(months[i].slice(0, 4)), Number(months[i].slice(5)) - 1, 15)).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
  const long = (i) => monthLabel(months[i]);
  const ticks = months.map((_, i) => i).filter((i) => i % 6 === 0 && n - 1 - i >= 4).concat(n - 1);
  const mean = eng.reduce((a, b) => a + (b ?? 0), 0) / eng.length;
  const dips = eng.map((v, i) => (v != null && v < mean - 3 ? i : -1)).filter((i) => i >= 0);
  const fromPointer = (e) => { const r = e.currentTarget.getBoundingClientRect(); setAt(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))))); };
  const onKey = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step) { e.preventDefault(); setAt((a) => Math.max(0, Math.min(n - 1, (a ?? (step > 0 ? -1 : n)) + step))); }
    else if (e.key === "Home") { e.preventDefault(); setAt(0); } else if (e.key === "End") { e.preventDefault(); setAt(n - 1); } else if (e.key === "Escape") setAt(null);
  };
  const last = n - 1;
  return (
    <div className="gpw-trend">
      <div className="gpw-plot" tabIndex={0} role="group" aria-label={`Share of appointments within two weeks of booking, month by month from ${label(0)} to ${label(last)}. England went from ${eng[0]} to ${eng.at(-1)} percent. Use the left and right arrow keys to read each month.`}
        onPointerMove={fromPointer} onPointerDown={fromPointer} onPointerLeave={() => setAt(null)} onKeyDown={onKey} onBlur={() => setAt(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[0, 50, 100].map((p) => <line key={p} x1="0" x2="100" y1={p} y2={p} className="gpw-grid" />)}
          <path d={`${path(eng)}L100 100L0 100Z`} className="gpw-area" />
          <path d={path(eng)} className="gpw-line gpw-line-eng" />
          {mine && <path d={path(mine)} className="gpw-line gpw-line-me" key={board.code} />}
        </svg>
        <span className="gpw-yt" style={{ top: 0 }}>{hi}%</span>
        <span className="gpw-yt" style={{ top: "50%" }}>{(lo + hi) / 2}%</span>
        <span className="gpw-yt" style={{ top: "100%" }}>{lo}%</span>
        {at === null && <>
          <i className="gpw-dot gpw-dot-eng" style={{ left: `${x(last)}%`, top: `${y(eng[last])}%` }} aria-hidden="true" />
          {mine && mine[last] != null && <i className="gpw-dot gpw-dot-me" style={{ left: `${x(last)}%`, top: `${y(mine[last])}%` }} aria-hidden="true" />}
        </>}
        {at !== null && <>
          <i className="gpw-cross" style={{ left: `${x(at)}%` }} aria-hidden="true" />
          <i className="gpw-dot gpw-dot-eng" style={{ left: `${x(at)}%`, top: `${y(eng[at])}%` }} aria-hidden="true" />
          {mine && mine[at] != null && <i className="gpw-dot gpw-dot-me" style={{ left: `${x(at)}%`, top: `${y(mine[at])}%` }} aria-hidden="true" />}
          <div className="gpw-tipbox" data-side={x(at) > 62 ? "l" : "r"} style={{ left: `${x(at)}%` }} aria-hidden="true">
            <b>{long(at)}</b>
            <span><i className="gpw-k1" /> England {pd(eng[at])}</span>
            {mine && <span><i className="gpw-k2" /> {board.name} {pd(mine[at])}</span>}
          </div>
        </>}
      </div>
      <p className="gpw-sr" aria-live="polite">{at === null ? "" : `${long(at)}: England ${pd(eng[at])}${mine ? `, ${board.name} ${pd(mine[at])}` : ""}.`}</p>
      <div className="gpw-xt" aria-hidden="true">{ticks.map((i) => <span key={i} style={{ left: `${x(i)}%` }} data-edge={i === 0 ? "l" : i === last ? "r" : ""}>{label(i)}</span>)}</div>
      <p className="gpw-key"><i className="gpw-k1" /> England {board && <><i className="gpw-k2" /> {board.name}</>}</p>
      {dips.length > 0 && <p className="gpw-note">England&apos;s share drops sharply in {dips.map(label).join(" and ")}, more than three points below the average of the months shown. The statistics do not say why, so compare a month with the same month a year earlier rather than with the month before.</p>}
      <details className="gpw-months">
        <summary>See every month in a table</summary>
        <div className="gpw-tablewrap">
          <table className="gpw-table gpw-table-m">
            <caption>Share of appointments within two weeks of booking, by month</caption>
            <thead><tr><th scope="col">Month</th><th scope="col">England</th>{mine && <th scope="col">{board.name}</th>}</tr></thead>
            <tbody>{months.map((_, k) => months.length - 1 - k).map((i) => <tr key={i}><th scope="row">{long(i)}</th><td>{pd(eng[i])}</td>{mine && <td>{pd(mine[i])}</td>}</tr>)}</tbody>
          </table>
        </div>
      </details>
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
  const [hot, setHot] = useState(null);
  const [ref, go] = useGo(0.12);
  const ranked = useMemo(() => (data ? rankBoards(data.icbs, data.england.within2w) : []), [data]);
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

      <Box id="gpw-b-areas" title={`How the ${data.icbs.length} NHS areas compare`}
        explain={`England is split into ${data.icbs.length} NHS areas. Each dot below is one of them, placed by the share of its GP appointments that took place within two weeks of booking in ${monthLabel(data.latest)} (the same day, the next day, or up to 14 days later).`}
        read={["The further right a dot is, the larger the share of that area's appointments that happened soon after booking. Dots stacked up are areas with almost the same figure.", "The dashed line is England as a whole. Hover over a dot, tab to it or press it to see which area it is; pressing it picks that area for everything on this page.", "This measures the gap between booking and the appointment. It says nothing about the quality of care, and a longer gap is not always a wait for care that was needed sooner."]}>
        <Strip data={data} code={code} ranked={ranked} hot={hot} setHot={setHot} pick={setCode} />
        <h4 className="gpw-sub">The same areas, ranked from highest to lowest</h4>
        <RankTable ranked={ranked} england={data.england.within2w} code={code} hot={hot} setHot={setHot} pick={setCode} month={monthLabel(data.latest)} />
      </Box>

      <Box id="gpw-b-months" title={`The last ${data.months.length} months`}
        explain={`The same measure, the share of appointments seen within two weeks of booking, for every month from ${monthLabel(data.months[0])} to ${monthLabel(data.latest)}.`}
        read={[`The shaded line is England. ${board ? `The orange line is ${board.name}, picked above.` : "Pick an NHS area above (or press a dot) and its line is added in orange."}`, "Move along the chart, or use the left and right arrow keys, to read off any month. Dips are months when a smaller share of appointments took place soon after booking."]}>
        <Trend data={data} board={board} />
      </Box>

      <div className="gpw-mixes">
        <Mix title={`How England's appointments happen, ${monthLabel(data.latest)}`} items={data.england.mode} names={MODE_NAMES} colours={MODE_COLOURS} />
        <Mix title="Who the appointment is with" items={{ GP: staff.GP, "Other Practice staff": staff["Other Practice staff"] }} names={{ GP: "A GP", "Other Practice staff": "Other practice staff (not a GP)" }} colours={{ GP: "#0F766E", "Other Practice staff": "#C7871A" }} />
      </div>

      <p className="gpw-foot">{fmtN(data.england.n)} appointments took place in England in {monthLabel(data.latest)}, from NHS England&apos;s &quot;Appointments in General Practice&quot; statistics. These count appointments recorded in GP practices&apos; systems, not people and not every contact with a practice, and the NHS areas shown are the integrated care boards named in NHS England's file. The gap between booking and the appointment is not a patient&apos;s wait for care: a same-day appointment may be urgent care offered on the day, and a later one may have been chosen. Shares are of appointments that took place and have a recorded gap; missed appointments are counted separately. The mix bars are shares of all appointments, so they add to less than 100% where NHS England's file records the type as unknown. Read {data.fetchedAt}.</p>
    </div>
  );
}
