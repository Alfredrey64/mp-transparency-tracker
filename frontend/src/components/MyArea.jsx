/** @jsxImportSource react */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { partyColour } from "../lib/format";
import { PageHeader } from "./shared";
import { IconPinHome, IconSearch, IconCouncil, IconVote, IconHexMap, IconTrend, IconCalendar, IconPetition } from "./icons";
import { councilsForCodes, nextElectionText, longDate, controlColourOf, seatsByParty } from "../lib/councils";
import { daysUntil } from "../lib/localElections";
import CountUp from "./CountUp";
import { loadCouncillorList, councillorPath } from "../lib/councillorsView";
import { regionKeyOf, wardCouncillors, loadAreaFigures } from "../lib/areaFigures";
import { REGIONS } from "../data/regionMetrics";
import "../myarea.css";

// My area: type a postcode once and see your MP, constituency, council, councillors, next elections and how your region compares, on one page. The
// postcode is looked up with postcodes.io and kept only in this browser (the same place as the My MP page), never sent to us.

const KEY = "mp-transparency-my-postcode";
const initials = (name) => String(name ?? "").replace(/^(Rt Hon |Dr |Sir |Dame )+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function read() { try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; } }
function write(value) { try { if (value) localStorage.setItem(KEY, value); else localStorage.removeItem(KEY); } catch { /* storage is blocked: the page still works */ } }

async function lookUp(postcode) {
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
  const json = await res.json();
  if (!res.ok || json.status !== 200) throw new Error("postcode");
  const r = json.result;
  const [index, mpRes, councillors] = await Promise.all([
    import("../data/councilsIndex.json").then((m) => m.default),
    supabase.from("politicians").select("*").eq("constituency", r.parliamentary_constituency).limit(1),
    loadCouncillorList().catch(() => null),
  ]);
  const { district, county } = councilsForCodes(index.index, r.codes);
  const council = district ?? county;
  const regionKey = regionKeyOf(r);
  const figures = await loadAreaFigures(regionKey).catch(() => []);
  const mp = mpRes?.data?.[0] ?? null;
  const count = (table) => supabase.from(table).select("*", { count: "exact", head: true }).eq("politician_id", mp.id).then((x) => x.count ?? null).catch(() => null);
  const mpStats = mp ? await Promise.all([count("voting_records"), count("financial_interests"), count("written_questions")]) : null;
  return {
    mpStats,
    result: r, mp, council, county: district && county ? county : null, parties: index.parties,
    people: council && councillors ? wardCouncillors(councillors.rows, council.id, r.admin_ward) : [], councillorParties: councillors?.parties ?? [],
    regionName: REGIONS.find((x) => x.key === regionKey)?.name ?? r.region ?? r.country, figures,
  };
}

function Card({ i, colour, icon, title, className = "", children }) {
  return (
    <div className={`ma-card ${className}`} role="region" style={{ "--mc": colour, "--i": i }} aria-label={title}>
      <header><span className="ma-icon" aria-hidden="true">{icon}</span><h3>{title}</h3></header>
      {children}
    </div>
  );
}

// 650 dots, one for each seat in the Commons. Yours lights up and pulses; the rest ripple in from the corner.
function SeatDots({ name, colour }) {
  const COLS = 26;
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const mine = h % 650;
  return (
    <svg className="ma-dots" viewBox={`0 0 ${COLS * 10} ${Math.ceil(650 / COLS) * 10}`} role="img" aria-label={`${name} is one of 650 seats`}>
      {Array.from({ length: 650 }, (_, n) => {
        const x = (n % COLS) * 10 + 5;
        const y = Math.floor(n / COLS) * 10 + 5;
        return n === mine
          ? <g key={n}><circle className="ma-dot-ring" cx={x} cy={y} r="4" fill="none" stroke={colour} strokeWidth="1.5" /><circle cx={x} cy={y} r="4.2" fill={colour} /></g>
          : <circle key={n} className="ma-dot" cx={x} cy={y} r="2.1" style={{ animationDelay: `${((n % COLS) + Math.floor(n / COLS)) * 14}ms` }} />;
      })}
    </svg>
  );
}

// The time between this council election and the one before it, as a ring that fills, with the days still to go counted in the middle.
function Countdown({ days }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const elapsed = Math.min(1, Math.max(0, 1 - days / 1461));
  return (
    <div className="ma-ring" role="img" aria-label={`${days} days to go`}>
      <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r={R} className="ma-ring-bg" /><circle cx="60" cy="60" r={R} className="ma-ring-fg" strokeDasharray={C} style={{ "--c": C, "--to": C * (1 - elapsed) }} transform="rotate(-90 60 60)" /></svg>
      <div><b><CountUp value={days} /></b><span>days to go</span></div>
    </div>
  );
}

function Bars({ figures }) {
  return (
    <div className="ma-bars">
      {figures.map((f, n) => {
        const max = Math.max(f.raw, f.ukRaw) || 1;
        return (
          <a key={f.id} className="ma-bar" href={f.link.href} style={{ "--fc": f.accent, "--n": n }}>
            <span className="ma-bar-label">{f.label}<small>{f.same ? "same as the UK" : f.higher ? "above the UK" : "below the UK"}</small></span>
            <span className="ma-bar-rows">
              <span className="ma-bar-row"><i style={{ "--w": f.raw / max }} /><b>{f.value}</b></span>
              <span className="ma-bar-row ma-bar-uk"><i style={{ "--w": f.ukRaw / max }} /><b>{f.uk}</b></span>
            </span>
          </a>
        );
      })}
      <p className="ma-legend"><span><i style={{ background: "#2F9E6E" }} />Your region</span><span><i style={{ background: "#9AA6B8" }} />The UK</span></p>
    </div>
  );
}

function Dashboard({ data, onForget }) {
  const { result: r, mp, mpStats, council, county, people, councillorParties, figures, regionName, parties } = data;
  const next = council?.next?.[0];
  const days = next ? daysUntil(next[0]) : null;
  const mpColour = partyColour(mp?.party_colour, "#1E4FB8");
  const seats = council ? seatsByParty(council, parties) : [];
  const place = [r.admin_ward, council?.name ?? r.admin_district ?? r.parliamentary_constituency].filter(Boolean).join(", ");
  return (
    <>
      <div className="ma-hero" style={{ "--mc": mpColour }}>
        <div className="ma-hero-art" aria-hidden="true"><i /><i /><i /></div>
        <span className="ma-pin" aria-hidden="true"><IconPinHome size={30} /></span>
        <div className="ma-hero-text">
          <p>You live in</p>
          <h2>{place}</h2>
          <div className="ma-chips">
            <span>{r.parliamentary_constituency}</span>
            <span>{regionName}</span>
            {council && <span>{council.control}</span>}
          </div>
        </div>
        <button type="button" className="ma-forget" onClick={onForget}>Use a different postcode</button>
      </div>

      <div className="ma-bento">
        <Card i={0} colour={mpColour} icon={<IconVote size={20} />} title="Your MP" className="ma-mpcard">
          {mp ? (
            <>
              <div className="ma-mp">
                {mp.thumbnail_url ? <img className="ma-photo" src={mp.thumbnail_url} alt="" loading="lazy" decoding="async" /> : <span className="ma-photo ma-photo-fallback" aria-hidden="true">{initials(mp.name)}</span>}
                <div><div className="ma-name">{mp.name}</div><div className="ma-sub">{mp.party}{mp.cabinet_role ? `, ${mp.cabinet_role}` : ""}</div><div className="ma-sub">MP for {r.parliamentary_constituency}</div></div>
              </div>
              {mpStats && (
                <div className="ma-stats">
                  {[["votes recorded", mpStats[0]], ["declared interests", mpStats[1]], ["questions asked", mpStats[2]]].filter(([, n]) => n !== null).map(([label, n]) => (
                    <div key={label}><b><CountUp value={n} /></b><span>{label}</span></div>
                  ))}
                </div>
              )}
              <div className="ma-actions">
                <a className="btn btn-primary" href={`#/mp/${mp.id}`}>Their record</a>
                <a className="btn btn-secondary" href="https://www.writetothem.com/" target="_blank" rel="noreferrer">Write to them</a>
              </div>
            </>
          ) : <p>We found the constituency ({r.parliamentary_constituency}) but couldn't match it to a current MP.</p>}
        </Card>

        <Card i={1} colour="#7A5AF0" icon={<IconCalendar size={20} />} title="Your next votes" className="ma-votes">
          {days !== null ? <Countdown days={days} /> : <p className="ma-big">No date set</p>}
          <p className="ma-sub" style={{ textAlign: "center" }}>{next ? `${longDate(next[0])}: ` : ""}{council ? nextElectionText(council) : "Your council's next election date is not recorded."}</p>
          <p className="ma-sub" style={{ textAlign: "center" }}>The next general election is due by 2029 at the latest.</p>
          <a className="ma-link" href="#/howtovote">Register and check what ID you need</a>
        </Card>

        <Card i={2} colour="#1FA97C" icon={<IconHexMap size={20} />} title="Your constituency" className="ma-seat">
          <SeatDots name={r.parliamentary_constituency} colour="#1FA97C" />
          <div className="ma-big">{r.parliamentary_constituency}</div>
          <p className="ma-sub">One of 650 seats in the House of Commons.</p>
          <a className="ma-link" href={`#/constituency/${encodeURIComponent(r.parliamentary_constituency)}`}>How close the last election was</a>
        </Card>

        <Card i={3} colour={council ? controlColourOf(council.control_by_seats) : "#E8741A"} icon={<IconCouncil size={20} />} title="Your council" className="ma-council">
          {council ? (
            <>
              <div className="ma-big">{council.name}</div>
              <p>{council.control}. {council.total} councillors in all.</p>
              <div className="ma-seatbar" role="img" aria-label="Seats by party">
                {seats.map((st, n) => <i key={st.idx} style={{ flexGrow: st.count, background: st.colour ?? "#8A94A6", "--n": n }} title={`${st.short}: ${st.count}`} />)}
                <u aria-hidden="true" title="Majority line" />
              </div>
              <div className="ma-key">{seats.slice(0, 5).map((st) => <span key={st.idx}><i style={{ background: st.colour ?? "#8A94A6" }} />{st.short} <b>{st.count}</b></span>)}</div>
              {county && <p className="ma-sub">County services such as roads and social care come from {county.name}.</p>}
              <a className="ma-link" href={`#/councils/${council.id}${r.admin_ward ? `/${encodeURIComponent(r.admin_ward)}` : ""}`}>Who runs it, and how it has changed</a>
            </>
          ) : <p>We couldn't match this postcode to a council. Try the <a href="#/councils">Your council</a> page.</p>}
        </Card>

        <Card i={4} colour="#E0367A" icon={<IconSearch size={20} />} title={r.admin_ward ? `Your ${r.admin_ward} councillors` : "Your councillors"} className="ma-people-card">
          {people.length > 0 ? (
            <div className="ma-tiles">
              {people.map((p, n) => {
                const party = councillorParties[p.party] ?? { name: "Unknown", colour: "#8A94A6" };
                return (
                  <a key={p.i} className="ma-tile" href={`#${councillorPath(p)}`} style={{ "--pc": party.colour, "--n": n }}>
                    <span className="ma-tile-av" aria-hidden="true">{initials(p.name)}</span>
                    <b>{p.name}</b><small>{party.name}</small>
                  </a>
                );
              })}
            </div>
          ) : <p>We couldn't match your ward to the councillor list. You can search it by name or council.</p>}
          <a className="ma-link" href="#/councillors">Search every councillor</a>
        </Card>

        <Card i={5} colour="#2F9E6E" icon={<IconTrend size={20} />} title={`How ${regionName ?? "your region"} compares`} className="ma-region">
          {figures.length > 0 ? <Bars figures={figures} /> : <p>Regional figures aren't available for this area.</p>}
          <a className="ma-link" href="#/regions">Compare every region</a>
        </Card>

        <Card i={6} colour="#E8741A" icon={<IconPetition size={20} />} title="Things you can do" className="ma-todo-card">
          <ul className="ma-todo">
            <li><span>1</span><p>Write to {mp ? mp.name : "your MP"} for free with <a href="https://www.writetothem.com/" target="_blank" rel="noreferrer">WriteToThem</a>. It also reaches your councillors.</p></li>
            <li><span>2</span><p>Check you're on the electoral register at <a href="https://www.gov.uk/register-to-vote" target="_blank" rel="noreferrer">gov.uk/register-to-vote</a>.</p></li>
            <li><span>3</span><p>Back a cause: <a href="#/petitions">sign or read the petitions</a> Parliament is looking at.</p></li>
          </ul>
        </Card>
      </div>
    </>
  );
}

export default function MyArea() {
  const [postcode, setPostcode] = useState(read);
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  const run = useCallback(async (value) => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await lookUp(value);
      write(value.trim());
      setState({ status: "ready", data, error: null });
    } catch (err) {
      setState({ status: "idle", data: null, error: err.message === "postcode" ? "We couldn't find that postcode. Check it is a full, valid UK postcode." : "That lookup didn't work just now. Try again in a moment." });
    }
  }, []);

  useEffect(() => { const saved = read(); if (saved) run(saved); }, [run]); // eslint-disable-line react-hooks/set-state-in-effect -- loads the saved postcode once, when the page opens

  const forget = () => { write(""); setPostcode(""); setState({ status: "idle", data: null, error: null }); };
  const submit = (e) => { e.preventDefault(); if (postcode.trim()) run(postcode); };
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconPinHome}
        kicker="Your area & your say"
        title="Your area"
        subtitle="Enter your postcode once to see your MP, your council and councillors, your next elections and how your part of the country compares, all on one page."
      />
      {state.status !== "ready" && (
        <>
          <form className="ma-form" onSubmit={submit}>
            <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Your postcode, for example SW1A 0AA" aria-label="Your postcode" autoComplete="postal-code" />
            <button type="submit" className="btn btn-primary" disabled={state.status === "loading"}>{state.status === "loading" ? "Looking…" : "Show my area"}</button>
          </form>
          {state.error && <p className="ma-err" role="alert">{state.error}</p>}
          <p className="ma-help">Your postcode is looked up once with postcodes.io and saved only in this browser, so you can skip this step next time. We never see it. See the <a href="#/privacy">privacy policy</a>.</p>
        </>
      )}
      {state.status === "ready" && <Dashboard data={state.data} onForget={forget} />}
      <p style={{ fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 26, maxWidth: 760 }}>
        Constituency and ward names come from postcodes.io (Ordnance Survey and ONS open data). Councils and councillors come from Open Council Data UK, and regional figures from the Office for National Statistics.
      </p>
    </div>
  );
}
