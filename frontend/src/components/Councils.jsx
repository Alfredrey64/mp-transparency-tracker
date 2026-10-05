import { useState, useEffect, useMemo } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import {
  seatsByParty, majorityOf, nextElectionText, longDate, searchCouncils, councilsForCodes, nationalSummary, historyRows, findWard, normCouncil, partyDisplay,
} from "../lib/councils";
import { loadCouncilDetail } from "../lib/councilDetail";
import { councilShareSpec } from "../lib/shareSpecs";
import { councilMeaning, councilChangeMeaning } from "../lib/councilMeaning";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconCouncil } from "./icons";
import { Tile, Figure } from "./NumbersKit";
import BarRow from "./BarRow";
import WhatThisMeans from "./WhatThisMeans";
import ShareButton from "./ShareButton";

// Your Council: who runs the councils, who sits on yours, and when they next
// stand for election. The data is Open Council Data UK's (CC BY-SA 4.0). A
// postcode finds your council and ward; the address (#/councils/<id>/<ward>)
// can be shared. Parish and town councils aren't covered.

const goHash = (hash) => {
  window.location.hash = hash;
};
const goCouncil = (id, ward, county) => {
  const parts = [encodeURIComponent(id)];
  if (ward || county) parts.push(encodeURIComponent(ward ?? ""));
  if (county) parts.push(encodeURIComponent(county));
  goHash(`#/councils/${parts.join("/")}`);
};

const HISTORY_COLOURS = { con: "#0063ba", lab: "#d50000", ld: "#fc7d0b", green: "#78b82a", ukip: "#70147a", ref: "#12b6cf", pc: "#348837", snp: "#d9b900", other: "#909090" };
const HISTORY_LABELS = { con: "Conservative", lab: "Labour", ld: "Liberal Democrat", green: "Green", ukip: "UKIP", ref: "Reform UK", pc: "Plaid Cymru", snp: "SNP", other: "Others" };
const KEYS = Object.keys(HISTORY_COLOURS);

const input = { width: "100%", boxSizing: "border-box", padding: "13px 16px", fontFamily: FONT_BODY, fontSize: 16, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink };
const linkButton = { background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent };

// ---- Finding a council ------------------------------------------------------
function Finder({ index }) {
  const [postcode, setPostcode] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ busy: false, error: null });
  const matches = useMemo(() => searchCouncils(index, query), [index, query]);

  async function lookup(e) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setState({ busy: true, error: null });
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        setState({ busy: false, error: "Couldn't find that postcode. Check it's a full, valid UK postcode." });
        return;
      }
      const { district, county } = councilsForCodes(index, data.result.codes);
      const main = district ?? county;
      if (!main) {
        setState({ busy: false, error: `Found the area (${data.result.admin_district ?? "unknown"}) but couldn't match it to a council in our data. Try searching by name instead.` });
        return;
      }
      setState({ busy: false, error: null });
      goCouncil(main.id, data.result.admin_ward, district && county ? county.id : null);
    } catch {
      setState({ busy: false, error: "Something went wrong looking that up. Please try again." });
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: 22 }}>
      <form onSubmit={lookup}>
        <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Find your council by postcode</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g. E8 1DY" aria-label="Your postcode" style={input} autoComplete="postal-code" />
          <button type="submit" disabled={state.busy} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: "#fff", background: COLORS.accent, border: "none", borderRadius: 10, padding: "0 20px", cursor: "pointer", opacity: state.busy ? 0.7 : 1 }}>
            {state.busy ? "…" : "Find"}
          </button>
        </div>
        {state.error && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#9C3B3B", marginTop: 8 }}>{state.error}</div>}
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6 }}>Your postcode is looked up once, with postcodes.io, and isn't stored.</div>
      </form>
      <div>
        <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Or search for a council by name</label>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Hackney, Kent, Edinburgh" aria-label="Search for a council" style={input} />
        {matches.length > 0 && (
          <div style={{ marginTop: 6, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden", background: COLORS.paperCard }}>
            {matches.map((c) => (
              <button key={c.id} type="button" className="nclick" onClick={() => goCouncil(c.id)} style={{ display: "flex", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "9px 12px", cursor: "pointer", color: "inherit" }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{c.name}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{c.control}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- The whole country -------------------------------------------------------
function Overview({ index, parties }) {
  const s = useMemo(() => nationalSummary(index, parties), [index, parties]);
  const [list, setList] = useState("");
  const [all, setAll] = useState(false);
  const shown = useMemo(() => {
    const q = normCouncil(list);
    const rows = q ? index.filter((c) => normCouncil(c.name).includes(q) || normCouncil(c.control).includes(q)) : index;
    return all || q ? rows : rows.slice(0, 24);
  }, [index, list, all]);
  const topParty = s.byParty[0];
  const nextDate = s.nextDates[0];
  const maxParty = Math.max(1, ...s.byParty.slice(0, 8).map((p) => p.count));
  const maxControl = Math.max(1, ...s.control.map((c) => c.count));

  return (
    <div className="bento" style={{ marginTop: 28 }}>
      <div className="bento-grid">
        <Tile span="s4" edge="people" title="At a glance" note="Every council in England, Scotland, Wales and Northern Ireland.">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Figure value={s.councillors} format={(n) => Math.round(n).toLocaleString("en-GB")} label="councillors" note={`on ${s.councils} councils`} />
            {topParty && <Figure value={topParty.pct} format={(n) => `${Math.round(n)}%`} label={`are ${topParty.short}`} note={`${topParty.count.toLocaleString("en-GB")} councillors, the largest party`} />}
            {nextDate && <Figure value={nextDate.seats} format={(n) => Math.round(n).toLocaleString("en-GB")} label={`seats up next, on ${longDate(nextDate.date)}`} note={`${nextDate.councils} councils`} />}
          </div>
        </Tile>

        <Tile span="s8" edge="seats" title="Councillors by party" delay={0.05} note="Every elected councillor, by party. Independents and small local parties are grouped as 'Independent or other' unless they are big enough to list.">
          {s.byParty.slice(0, 8).map((p, i) => (
            <BarRow key={p.idx} label={p.short} color={p.colour} fraction={p.count / maxParty} valueText={p.count.toLocaleString("en-GB")} detail={`${(Math.round(p.pct * 10) / 10).toFixed(1)}%`} labelWidth={180} valueWidth={120} delay={i * 0.04} />
          ))}
        </Tile>

        <Tile span="s6" edge="change" title="Who runs the councils" note="Which party, or kind of arrangement, runs each council today. A council with no overall control has no party with more than half the seats.">
          {s.control.map((c, i) => (
            <BarRow key={c.group} label={c.group} color={c.colour} fraction={c.count / maxControl} valueText={String(c.count)} detail={`${Math.round((c.count / s.councils) * 100)}%`} labelWidth={170} valueWidth={96} delay={i * 0.04} />
          ))}
        </Tile>

        <Tile span="s6" edge="careers" title="When councils next vote" delay={0.05} note="The date each council's next election falls on. Some councils elect all their councillors at once, others a third or a half at a time.">
          {s.nextDates.map((d) => (
            <div key={d.date} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, padding: "8px 0", borderTop: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{longDate(d.date)}</span>
              <span style={{ fontSize: 13, color: COLORS.inkSoft }}>
                <strong style={{ ...numeric, color: COLORS.ink }}>{d.councils}</strong> {d.councils === 1 ? "council" : "councils"} · <strong style={{ ...numeric, color: COLORS.ink }}>{d.seats.toLocaleString("en-GB")}</strong> seats
              </span>
            </div>
          ))}
        </Tile>

        <Tile span="s12" edge="people" title="Every council" note="Tap one to see its councillors, ward by ward.">
          <input value={list} onChange={(e) => setList(e.target.value)} placeholder="Filter by name or by who runs it, e.g. Reform" aria-label="Filter the list of councils" style={{ ...input, maxWidth: 420, marginBottom: 12 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
            {shown.map((c) => {
              const top = c.seats[0];
              const colour = top ? partyDisplay(parties, top[0]).colour : COLORS.inkSoft;
              return (
                <button key={c.id} type="button" className="nclick" onClick={() => goCouncil(c.id)} style={{ textAlign: "left", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${colour}`, borderRadius: 10, padding: "9px 12px", cursor: "pointer", color: "inherit" }}>
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{c.name}</span>
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{c.control} · {c.total} seats</span>
                </button>
              );
            })}
          </div>
          {!all && !list && index.length > 24 && (
            <button type="button" onClick={() => setAll(true)} style={{ ...linkButton, marginTop: 12 }}>Show all {index.length} councils</button>
          )}
          {shown.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No council matches that.</div>}
        </Tile>
      </div>
    </div>
  );
}

// ---- One council --------------------------------------------------------------
function Composition({ seats, total }) {
  const major = majorityOf(total);
  return (
    <div>
      <div style={{ position: "relative", display: "flex", height: 34, borderRadius: 8, overflow: "hidden", background: COLORS.paper }}>
        {seats.map((s) => (
          <div key={s.idx} title={`${s.short}: ${s.count} seats`} style={{ width: `${(s.count / total) * 100}%`, background: s.colour, borderRight: `2px solid ${COLORS.paperCard}`, minWidth: 2 }} />
        ))}
        <span aria-hidden="true" style={{ position: "absolute", left: `${(major / total) * 100}%`, top: 0, bottom: 0, borderLeft: `2px dashed ${COLORS.ink}`, opacity: 0.85 }} />
      </div>
      <div style={{ position: "relative", height: 20 }}>
        <span style={{ position: "absolute", left: `${(major / total) * 100}%`, transform: "translateX(-50%)", fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.ink, whiteSpace: "nowrap", top: 4 }}>{major} = majority</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 14 }}>
        {seats.map((s) => (
          <span key={s.idx} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.colour }} />
            {s.short} <strong style={{ ...numeric, color: COLORS.ink }}>{s.count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function History({ rows }) {
  if (rows.length < 2) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`, gap: 6, alignItems: "end" }}>
        {rows.map((r) => (
          <div key={r.year} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <div title={KEYS.filter((k) => r[k]).map((k) => `${HISTORY_LABELS[k]} ${r[k]}`).join(", ")} style={{ display: "flex", flexDirection: "column-reverse", width: "100%", height: 150, borderRadius: 6, overflow: "hidden", background: COLORS.paper }}>
              {KEYS.filter((k) => r[k] > 0).map((k) => (
                <div key={k} style={{ height: `${(r[k] / (r.total || 1)) * 100}%`, background: HISTORY_COLOURS[k], borderTop: `1px solid ${COLORS.paperCard}` }} />
              ))}
            </div>
            <span style={{ ...numeric, fontSize: 11, color: COLORS.inkSoft, marginTop: 5 }}>{String(r.year).slice(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 12 }}>
        {KEYS.filter((k) => rows.some((r) => r[k] > 0)).map((k) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: HISTORY_COLOURS[k] }} />
            {HISTORY_LABELS[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

function CouncilView({ council, parties, wardName, countyId, index, detail, columns, failed }) {
  const [filter, setFilter] = useState("");
  const [party, setParty] = useState(null);
  const seats = useMemo(() => seatsByParty(council, parties), [council, parties]);
  const wards = useMemo(() => detail?.wards ?? [], [detail]);
  const history = useMemo(() => historyRows(detail, columns), [detail, columns]);
  const yourWard = useMemo(() => (wardName && wards.length ? findWard(wards, wardName) : null), [wards, wardName]);
  const county = countyId ? index.find((c) => c.id === countyId) : null;
  const q = normCouncil(filter);

  const visible = useMemo(() => {
    return wards
      .map(([ward, list]) => [ward, list.filter(([name, p]) => (!party || p === party) && (!q || normCouncil(name).includes(q) || normCouncil(ward).includes(q)))])
      .filter(([, list]) => list.length > 0);
  }, [wards, party, q]);

  const meaning = councilMeaning({ seats, total: council.total, control: council.control });
  const change = councilChangeMeaning({ rows: history, parties: seats });

  return (
    <div style={{ marginTop: 22 }}>
      <button type="button" onClick={() => goHash("#/councils")} style={{ ...linkButton, color: COLORS.inkSoft, fontWeight: 400, marginBottom: 14 }}>← All councils</button>

      <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${seats[0]?.colour ?? COLORS.accent}`, borderRadius: 18, padding: "20px 22px" }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(26px, 5vw, 38px)", color: COLORS.ink, margin: 0, lineHeight: 1.1 }}>{council.name}</h2>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, marginTop: 6 }}>
          Run by: <strong style={{ color: COLORS.ink }}>{council.control}</strong> · {council.total} councillors
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, marginTop: 10 }}>
          <strong>Next election:</strong> {nextElectionText(council)}
        </div>
        {county && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 10 }}>
            Your area also has a county council, which looks after other services such as roads and social care:{" "}
            <button type="button" onClick={() => goCouncil(county.id)} style={linkButton}>{county.name} →</button>
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <ShareButton filename={`${council.name}-council`} getSpec={() => councilShareSpec({ council, seats, link: window.location.href })} />
        </div>
      </div>

      <div className="bento" style={{ marginTop: 18 }}>
        <div className="bento-grid">
          <Tile span="s12" edge="seats" title="Who holds the seats" note="Each colour is a party's share of the council. The dashed line is a majority: enough seats to win any vote on the council.">
            <Composition seats={seats} total={council.total} />
            <WhatThisMeans result={meaning} />
          </Tile>

          {history.length > 1 && (
            <Tile span="s12" edge="change" title="How it has changed" delay={0.05} note="The council's make-up each year since 2016, as a share of its seats. A big shift between years usually follows an election.">
              <History rows={history} />
              <WhatThisMeans result={change} />
            </Tile>
          )}

          <Tile span="s12" edge="people" title="Your councillors, ward by ward" delay={0.05} note="Each ward elects one to three councillors. Find the one for your street with the postcode box at the top of this page.">
            {wardName && !yourWard && wards.length > 0 && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 12 }}>
                We couldn't match your ward, “{wardName}”, to this council's list. Ward boundaries were redrawn in some areas, so browse or search below.
              </div>
            )}
            {yourWard && (
              <div style={{ background: `${COLORS.accent}12`, border: `1px solid ${COLORS.accent}55`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.accent }}>Your ward</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, margin: "2px 0 8px" }}>{yourWard[0]}</div>
                {yourWard[1].map(([name, p]) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, padding: "3px 0" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: partyDisplay(parties, p).colour, flexShrink: 0 }} />
                    <strong>{name}</strong> <span style={{ color: COLORS.inkSoft }}>{partyDisplay(parties, p).short}</span>
                  </div>
                ))}
              </div>
            )}
            {failed && <LoadFailedNote item="this council's councillors" />}
            {!failed && !detail && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading the councillors…</div>}
            {detail && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
                  <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search a councillor or ward" aria-label="Search councillors and wards" style={{ ...input, maxWidth: 320, padding: "10px 14px", fontSize: 14 }} />
                  {seats.slice(0, 6).map((s) => (
                    <button key={s.idx} type="button" aria-pressed={party === s.idx} onClick={() => setParty(party === s.idx ? null : s.idx)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${party === s.idx ? s.colour : COLORS.hairline}`, background: party === s.idx ? `${s.colour}22` : "transparent", color: COLORS.ink }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.colour }} />
                      {s.short}
                    </button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                  {visible.map(([ward, list]) => (
                    <div key={ward} style={{ background: COLORS.paper, border: `1px solid ${yourWard && yourWard[0] === ward ? COLORS.accent : COLORS.hairline}`, borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>{ward}</div>
                      {list.map(([name, p]) => (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, padding: "2px 0" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: partyDisplay(parties, p).colour, flexShrink: 0 }} />
                          <span style={{ minWidth: 0 }}>{name} <span style={{ color: COLORS.inkSoft, fontSize: 12 }}>· {partyDisplay(parties, p).short}</span></span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {visible.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Nobody matches that.</div>}
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.6, margin: "14px 0 0" }}>
                  To contact a councillor, use your council's own website, or{" "}
                  <a href="https://www.gov.uk/find-local-council" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>find your council on GOV.UK ↗</a>.
                </p>
              </>
            )}
          </Tile>
        </div>
      </div>
    </div>
  );
}

export default function Councils({ param }) {
  const [data, setData] = useState(null);
  const [loadedDetail, setLoadedDetail] = useState({ id: null, detail: null });
  const [failed, setFailed] = useState(false);
  const [detailFailed, setDetailFailed] = useState(false);

  // The address is #/councils/<id>/<ward>/<county id>; the last two are optional.
  const [id, wardName, countyId] = String(param ?? "").split("/");
  const council = data && id ? data.index.find((c) => c.id === id) ?? null : null;

  useEffect(() => {
    import("../data/councilsIndex.json").then((m) => setData(m.default)).catch(() => setFailed(true));
  }, []);

  // Wards and councillors are loaded for the one council that is open.
  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    loadCouncilDetail(id)
      .then((detail) => {
        if (!cancelled) {
          setLoadedDetail({ id, detail });
          setDetailFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setDetailFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCouncil}
        kicker="Get Involved · Your Council"
        title="Your council and your councillors"
        subtitle="Councils run bin collections, planning, housing, roads and care. See who runs yours, who your councillors are, and when they next face the voters."
      />
      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the council data" /></div>}
      {!failed && !data && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}
      {data && (
        <>
          <Finder index={data.index} />
          {id && !council && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: "#9C3B3B", marginTop: 18 }}>We couldn't find that council. Try searching for it by name.</div>}
          {council ? (
            <CouncilView
              key={council.id}
              council={council}
              parties={data.parties}
              wardName={wardName || null}
              countyId={countyId || null}
              index={data.index}
              detail={loadedDetail.id === council.id ? loadedDetail.detail : null}
              columns={data.historyColumns}
              failed={detailFailed}
            />
          ) : (
            <Overview index={data.index} parties={data.parties} />
          )}
          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 24, maxWidth: 780 }}>
            Councillors, parties and election dates come from{" "}
            <a href="https://opencouncildata.co.uk" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>Open Council Data UK</a>{" "}
            (CC BY-SA 4.0), updated after each round of elections. Parish and town councils, and ward-by-ward election results, aren't included. By-elections can change a council between updates.
          </p>
        </>
      )}
    </div>
  );
}
