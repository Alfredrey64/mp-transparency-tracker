/** @jsxImportSource react */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { partyColour } from "../lib/format";
import { PageHeader } from "./shared";
import { IconPinHome, IconSearch, IconCouncil, IconVote, IconHexMap, IconTrend, IconCalendar, IconPetition } from "./icons";
import { councilsForCodes, nextElectionText, longDate, controlColourOf } from "../lib/councils";
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
  return {
    result: r, mp: mpRes?.data?.[0] ?? null, council, county: district && county ? county : null, parties: index.parties,
    people: council && councillors ? wardCouncillors(councillors.rows, council.id, r.admin_ward) : [], councillorParties: councillors?.parties ?? [],
    regionName: REGIONS.find((x) => x.key === regionKey)?.name ?? r.region ?? r.country, figures,
  };
}

function Card({ i, colour, icon, title, children }) {
  return (
    <div className="ma-card" role="region" style={{ "--mc": colour, "--i": i }} aria-label={title}>
      <header><span className="ma-icon" aria-hidden="true">{icon}</span><h3>{title}</h3></header>
      {children}
    </div>
  );
}

function Dashboard({ data, onForget }) {
  const { result: r, mp, council, county, people, councillorParties, figures, regionName } = data;
  const next = council?.next?.[0];
  const mpColour = partyColour(mp?.party_colour, "#1E4FB8");
  return (
    <>
      <div className="ma-where">
        <div>
          <h2>{r.admin_ward ? `${r.admin_ward}, ` : ""}{council?.name ?? r.admin_district ?? r.parliamentary_constituency}</h2>
          <p>{r.parliamentary_constituency} constituency, {regionName}</p>
        </div>
        <button type="button" className="ma-forget" onClick={onForget}>Use a different postcode</button>
      </div>
      <div className="ma-grid">
        <Card i={0} colour={mpColour} icon={<IconVote size={20} />} title="Your MP">
          {mp ? (
            <>
              <div className="ma-mp">
                {mp.thumbnail_url ? <img className="ma-photo" src={mp.thumbnail_url} alt="" loading="lazy" decoding="async" /> : <span className="ma-photo ma-photo-fallback" aria-hidden="true">{initials(mp.name)}</span>}
                <div><div className="ma-big" style={{ fontSize: 24 }}>{mp.name}</div><div className="ma-sub">{mp.party}{mp.cabinet_role ? `, ${mp.cabinet_role}` : ""}</div></div>
              </div>
              <a className="ma-link" href={`#/mp/${mp.id}`}>Their votes, interests and activity</a>
            </>
          ) : <p>We found the constituency ({r.parliamentary_constituency}) but couldn't match it to a current MP.</p>}
        </Card>
        <Card i={1} colour="#1FA97C" icon={<IconHexMap size={20} />} title="Your constituency">
          <div className="ma-big">{r.parliamentary_constituency}</div>
          <p className="ma-sub">One of 650 seats. How close the last election was, who else stood, and how the seat has voted over time.</p>
          <a className="ma-link" href={`#/constituency/${encodeURIComponent(r.parliamentary_constituency)}`}>See the seat in detail</a>
        </Card>
        <Card i={2} colour={council ? controlColourOf(council.control_by_seats) : "#E8741A"} icon={<IconCouncil size={20} />} title="Your council">
          {council ? (
            <>
              <div className="ma-big">{council.name}</div>
              <p>{council.control}.</p>
              {county && <p className="ma-sub">County services such as roads and social care come from {county.name}.</p>}
              <a className="ma-link" href={`#/councils/${council.id}${r.admin_ward ? `/${encodeURIComponent(r.admin_ward)}` : ""}`}>Who runs it, and how it has changed</a>
            </>
          ) : <p>We couldn't match this postcode to a council. Try the <a href="#/councils">Your council</a> page.</p>}
        </Card>
        <Card i={3} colour="#E0367A" icon={<IconSearch size={20} />} title={r.admin_ward ? `Your ${r.admin_ward} councillors` : "Your councillors"}>
          {people.length > 0 ? (
            <div className="ma-people">
              {people.map((p) => {
                const party = councillorParties[p.party] ?? { name: "Unknown", colour: "#8A94A6" };
                return <a key={p.i} className="ma-person" href={`#${councillorPath(p)}`} style={{ "--pc": party.colour }}><i />{p.name}<small>{party.name}</small></a>;
              })}
            </div>
          ) : <p>We couldn't match your ward to the councillor list. You can search it by name or council.</p>}
          <a className="ma-link" href="#/councillors">Search every councillor</a>
        </Card>
        <Card i={4} colour="#7A5AF0" icon={<IconCalendar size={20} />} title="Your next votes">
          <ul>
            <li><b>General election:</b> due by 2029 at the latest, sooner if the Prime Minister calls one.</li>
            {council && <li><b>Council election:</b> {next ? `${longDate(next[0])}. ` : ""}{nextElectionText(council)}</li>}
          </ul>
          <a className="ma-link" href="#/howtovote">Register and check what ID you need</a>
        </Card>
        <Card i={5} colour="#2F9E6E" icon={<IconTrend size={20} />} title={`How ${regionName ?? "your region"} compares`}>
          {figures.length > 0 ? (
            <div className="ma-figs">
              {figures.map((f) => (
                <a key={f.id} className="ma-fig" href={f.link.href} style={{ "--fc": f.accent }}>
                  <span>{f.label}</span><b>{f.value}</b><small>UK: {f.uk}. {f.same ? "The same as the UK." : f.higher ? "Higher than the UK." : "Lower than the UK."}</small>
                </a>
              ))}
            </div>
          ) : <p>Regional figures aren't available for this area.</p>}
          <a className="ma-link" href="#/regions">Compare every region</a>
        </Card>
        <Card i={6} colour="#E8741A" icon={<IconPetition size={20} />} title="Things you can do">
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
