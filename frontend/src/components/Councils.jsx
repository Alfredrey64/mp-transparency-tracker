import { useState, useEffect, useMemo } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import {
  seatsByParty, majorityOf, nextElectionText, longDate, searchCouncils, councilsForCodes, nationalSummary, historyRows, findWard, normCouncil, partyDisplay,
  CONTROL_ORDER, controlLabelOf, controlColourOf, controlTrend, changesSummary, defectionSummary, seatChanges,
} from "../lib/councils";
import { loadCouncilDetail } from "../lib/councilDetail";
import { councilShareSpec } from "../lib/shareSpecs";
import { councilMeaning, councilChangeMeaning, changesMeaning, defectionMeaning, controlTrendMeaning } from "../lib/councilMeaning";
import { LoadFailedNote } from "./shared";
import { IconCouncil, IconGroup, IconSplit, IconCompare, IconChartBars, IconVote } from "./icons";
import { PartyHemicycle } from "./PartyHemicycle";
import PageGuide from "./PageGuide";
import CountUp from "./CountUp";
import Reveal from "./Reveal";
import WhatThisMeans from "./WhatThisMeans";
import ShareButton from "./ShareButton";

// Your Council: the whole country's councils at a glance, then any one
// council in detail. Data is Open Council Data UK's (CC BY-SA 4.0). A postcode
// finds your council and ward; the address (#/councils/<id>/<ward>) can be
// shared. Parish and town councils aren't covered.

const goHash = (hash) => {
  window.location.hash = hash;
};
const goCouncil = (id, ward, county) => {
  const parts = [encodeURIComponent(id)];
  if (ward || county) parts.push(encodeURIComponent(ward ?? ""));
  if (county) parts.push(encodeURIComponent(county));
  goHash(`#/councils/${parts.join("/")}`);
};
const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const signed = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;
const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const HISTORY_COLOURS = { con: "#0063ba", lab: "#d50000", ld: "#fc7d0b", green: "#78b82a", ukip: "#70147a", ref: "#12b6cf", pc: "#348837", snp: "#d9b900", other: "#909090" };
const HISTORY_LABELS = { con: "Conservative", lab: "Labour", ld: "Liberal Democrat", green: "Green", ukip: "UKIP", ref: "Reform UK", pc: "Plaid Cymru", snp: "SNP", other: "Others" };
const HKEYS = Object.keys(HISTORY_COLOURS);

const input = { width: "100%", boxSizing: "border-box", padding: "13px 16px", fontFamily: FONT_BODY, fontSize: 16, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, background: COLORS.paper, color: COLORS.ink };
const linkButton = { background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.accent };

// ---- Building blocks -----------------------------------------------------------
function Card({ children, style, id }) {
  return (
    <section id={id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 20, padding: "22px clamp(16px, 3vw, 26px)", boxShadow: "0 12px 30px -18px rgba(0,0,0,0.45)", scrollMarginTop: 14, ...style }}>
      {children}
    </section>
  );
}

function SectionHead({ kicker, title, blurb, accent = COLORS.accent }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: accent }}>
        <span style={{ width: 18, height: 3, borderRadius: 2, background: accent }} />
        {kicker}
      </div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px, 3.4vw, 28px)", color: COLORS.ink, margin: "6px 0 0", letterSpacing: "-0.015em", lineHeight: 1.15 }}>{title}</h2>
      {blurb && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, margin: "8px 0 0", maxWidth: 680 }}>{blurb}</p>}
    </div>
  );
}

// One headline figure: an icon, a big number that counts up, what it is, and
// a line of context. Tapping it jumps to the part of the page that explains it.
function StatCard({ icon: Icon, colour, value, format = fmt, label, caption, chip, target }) {
  const body = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
        <span style={{ width: 38, height: 38, borderRadius: 12, background: `${colour}1f`, color: colour, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={19} />
        </span>
        {chip && <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: colour, background: `${colour}1a`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{chip}</span>}
      </div>
      <div style={{ ...numeric, fontSize: "clamp(34px, 4.4vw, 46px)", fontWeight: 600, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.02em" }}>
        <CountUp value={value} format={format} duration={1.2} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, marginTop: 9 }}>{label}</div>
      {caption && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{caption}</div>}
    </>
  );
  const style = { textAlign: "left", display: "block", width: "100%", boxSizing: "border-box", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${colour}`, borderRadius: 18, padding: "18px 18px 20px", color: "inherit", font: "inherit" };
  if (!target) return <div style={style}>{body}</div>;
  return (
    <button type="button" className="nclick" onClick={() => scrollToId(target)} style={{ ...style, cursor: "pointer" }}>
      {body}
    </button>
  );
}

function Chip({ colour, children, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.ink, background: `${colour}1c`, border: `1px solid ${colour}55`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap", ...style }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colour }} />
      {children}
    </span>
  );
}

const Arrow = () => <span aria-hidden="true" style={{ color: COLORS.inkSoft, fontSize: 14 }}>→</span>;

// A horizontal bar with a value and an optional change. In a narrow column
// (compact) the label and value share a line and the bar sits under them, so
// the bar always has room.
function Bar({ label, colour, fraction, value, delta, labelWidth = 170, compact = false }) {
  const change = delta != null && delta !== 0 && <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, marginLeft: 8, color: delta > 0 ? "#2F8F6A" : "#B5533C" }}>{signed(delta)}</span>;
  const track = (
    <span style={{ display: "block", height: 11, borderRadius: 6, background: COLORS.paper, overflow: "hidden" }}>
      <span style={{ display: "block", width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, minWidth: fraction > 0 ? 3 : 0, height: "100%", background: colour, borderRadius: 6 }} />
    </span>
  );
  if (compact) {
    return (
      <div style={{ padding: "6px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>{label}</span>
          <span style={{ ...numeric, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, whiteSpace: "nowrap" }}>{value}{change}</span>
        </div>
        {track}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `minmax(90px, ${labelWidth}px) minmax(0, 1fr) auto`, gap: 12, alignItems: "center", padding: "5px 0" }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {track}
      <span style={{ ...numeric, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, textAlign: "right", whiteSpace: "nowrap", minWidth: 96 }}>{value}{change}</span>
    </div>
  );
}

// A count, then the move it counts: "31  Labour → No overall control".
function MoveRow({ count, from, to, fromColour, toColour, bar }) {
  return (
    <div style={{ padding: "8px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", gap: 8, alignItems: "center" }}>
        <span style={{ ...numeric, fontSize: 20, fontWeight: 700, color: COLORS.ink, lineHeight: 1 }}>{fmt(count)}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <Chip colour={fromColour}>{from}</Chip>
          <Arrow />
          <Chip colour={toColour}>{to}</Chip>
        </span>
      </div>
      {bar != null && (
        <div style={{ height: 5, borderRadius: 3, background: COLORS.paper, margin: "8px 0 0 52px", overflow: "hidden" }}>
          <div style={{ width: `${bar * 100}%`, height: "100%", background: toColour, borderRadius: 3 }} />
        </div>
      )}
    </div>
  );
}

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
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 18, padding: "18px clamp(14px, 2.4vw, 22px) 20px", boxShadow: "0 18px 40px -22px rgba(0,0,0,0.6)" }}>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))" }}>
        <form onSubmit={lookup}>
          <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 7 }}>Find your council by postcode</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g. E8 1DY" aria-label="Your postcode" style={input} autoComplete="postal-code" />
            <button type="submit" disabled={state.busy} style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: "#fff", background: COLORS.accent, border: "none", borderRadius: 12, padding: "0 22px", cursor: "pointer", opacity: state.busy ? 0.7 : 1 }}>
              {state.busy ? "…" : "Find"}
            </button>
          </div>
          {state.error && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#C0504D", marginTop: 8 }}>{state.error}</div>}
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 7 }}>Looked up once with postcodes.io. Your postcode isn't stored.</div>
        </form>
        <div>
          <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 7 }}>Or search by council name</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Hackney, Kent, Edinburgh" aria-label="Search for a council" style={input} />
          {matches.length > 0 && (
            <div style={{ marginTop: 6, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, overflow: "hidden", background: COLORS.paperCard }}>
              {matches.map((c) => (
                <button key={c.id} type="button" className="nclick" onClick={() => goCouncil(c.id)} style={{ display: "flex", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "9px 12px", cursor: "pointer", color: "inherit" }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{c.name}</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{controlLabelOf(c.control_by_seats)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Hero({ index, subtitle, title, kicker }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 26, border: `1px solid ${COLORS.hairline}`, padding: "clamp(22px, 4vw, 40px)", background: `radial-gradient(900px 340px at 92% -10%, ${COLORS.accent}33, transparent 60%), radial-gradient(520px 260px at 0% 110%, #1FA97C22, transparent 65%), ${COLORS.paperCard}` }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${COLORS.hairline} 1px, transparent 1px)`, backgroundSize: "22px 22px", opacity: 0.55, maskImage: "linear-gradient(180deg, #000, transparent 75%)", WebkitMaskImage: "linear-gradient(180deg, #000, transparent 75%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 500, color: COLORS.accent }}>
          <span style={{ width: 16, height: 2, background: COLORS.accent }} />
          {kicker}
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(30px, 5.6vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.025em", color: COLORS.ink, margin: "12px 0 0", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: COLORS.accent, display: "inline-flex" }}><IconCouncil size={38} /></span>
          {title}
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: "clamp(15px, 1.8vw, 17px)", color: COLORS.inkSoft, lineHeight: 1.6, margin: "14px 0 24px", maxWidth: 680 }}>{subtitle}</p>
        <Finder index={index} />
      </div>
    </div>
  );
}

// ---- The whole country -------------------------------------------------------
function Overview({ data }) {
  const { index, parties, trend: rawTrend, changes: rawChanges, changesByYear, defections: rawDef, latestYear } = data;
  const s = useMemo(() => nationalSummary(index, parties), [index, parties]);
  const trend = useMemo(() => controlTrend(rawTrend), [rawTrend]);
  const changes = useMemo(() => changesSummary(rawChanges), [rawChanges]);
  const def = useMemo(() => defectionSummary(rawDef, parties), [rawDef, parties]);
  const seatDelta = useMemo(() => seatChanges(s.byParty, rawDef?.previousSeats), [s.byParty, rawDef]);
  const nowCounts = trend[trend.length - 1]?.counts ?? {};
  const prevCounts = trend[trend.length - 2]?.counts ?? {};
  const nextDate = s.nextDates[0];
  const changedIds = useMemo(() => new Set(rawChanges.map((c) => c.id)), [rawChanges]);

  const [controlFilter, setControlFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [showAllCouncils, setShowAllCouncils] = useState(false);
  const [showAllChanges, setShowAllChanges] = useState(false);

  const hemicycleItems = useMemo(
    () => [...index].sort((a, b) => CONTROL_ORDER.indexOf(a.control_by_seats) - CONTROL_ORDER.indexOf(b.control_by_seats)).map((c) => ({ party: controlLabelOf(c.control_by_seats), party_colour: controlColourOf(c.control_by_seats) })),
    [index]
  );
  const listed = useMemo(() => {
    const q = normCouncil(search);
    const rows = index.filter((c) => (!controlFilter || c.control_by_seats === controlFilter) && (!q || normCouncil(c.name).includes(q)));
    return showAllCouncils || q || controlFilter ? rows : rows.slice(0, 24);
  }, [index, controlFilter, search, showAllCouncils]);

  const maxFlow = Math.max(1, ...(def?.flows.slice(0, 8).map((f) => f.count) ?? [1]));
  const maxNet = Math.max(1, ...changes.net.map((r) => Math.max(r.gained, r.lost)));
  const topParty = s.byParty[0];
  const maxSeats = Math.max(1, ...seatDelta.slice(0, 8).map((p) => p.count));
  const topFlow = def?.flows[0];
  const lead = changes.net.find((r) => r.key !== "noc" && r.net > 0) ?? null;
  const defNetTop = def ? def.net.slice(0, 5) : [];
  const defNetBottom = def ? def.net.slice(-3).filter((p) => !defNetTop.includes(p)) : [];
  const defNetMax = def ? Math.max(1, ...def.net.map((p) => Math.abs(p.net))) : 1;

  const pickFromLegend = (label) => {
    const key = CONTROL_ORDER.find((k) => controlLabelOf(k) === label);
    setControlFilter((cur) => (cur === key ? null : key ?? null));
    scrollToId("all-councils");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 26 }}>
      {/* Key numbers */}
      <div>
        <SectionHead kicker={`${latestYear} at a glance`} title="The key numbers" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(205px, 1fr))", gap: 14 }}>
          <StatCard icon={IconGroup} colour="#4F46E5" value={s.councillors} label="councillors" caption={`on ${s.councils} councils across the UK. ${topParty ? `${topParty.short} is the largest party with ${fmt(topParty.count)}.` : ""}`} />
          <StatCard
            icon={IconCompare}
            colour="#E0367A"
            value={changes.total}
            label="councils changed hands"
            chip={`since ${latestYear - 1}`}
            caption={lead ? `${controlLabelOf(lead.key)} made the biggest net gain (${signed(lead.net)}).` : "Control moved from one party, or to no one."}
            target="changes"
          />
          <StatCard
            icon={IconSplit}
            colour="#E8A33D"
            value={def?.total ?? 0}
            label="councillors changed party"
            chip={def ? `since ${def.since}` : undefined}
            caption={topFlow ? `Most common: ${topFlow.fromParty.short} to ${topFlow.toParty.short} (${fmt(topFlow.count)}).` : "Compared with last year's list."}
            target="defections"
          />
          <StatCard
            icon={IconChartBars}
            colour="#2F8FBF"
            value={nowCounts.noc ?? 0}
            label="councils with no overall control"
            chip={prevCounts.noc != null ? `${signed((nowCounts.noc ?? 0) - prevCounts.noc)} on ${latestYear - 1}` : undefined}
            caption={`${Math.round(((nowCounts.noc ?? 0) / s.councils) * 100)}% of councils: no party holds more than half the seats.`}
            target="control"
          />
          {nextDate && (
            <StatCard icon={IconVote} colour="#1FA97C" value={nextDate.seats} label={`seats up on ${longDate(nextDate.date)}`} caption={`${nextDate.councils} councils vote next, the first chance to change who runs them.`} target="elections" />
          )}
        </div>
      </div>

      {/* Who controls the councils */}
      <Reveal>
        <Card id="control">
          <SectionHead kicker="Control" title="Who runs Britain's councils" blurb="Every dot is one council, coloured by the party that holds more than half its seats. Grey dots are councils where no party does. Tap a party to list its councils." />
          <div className="council-split">
            <div>
              <PartyHemicycle
                politicians={hemicycleItems}
                legendCount={10}
                onSelectParty={(name) => pickFromLegend(name)}
                rows={7}
                centre={
                  <div>
                    <div style={{ ...numeric, fontSize: "clamp(22px, 4.6cqw, 40px)", fontWeight: 700, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.03em" }}>{s.councils}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>councils</div>
                  </div>
                }
              />
            </div>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>Councils controlled, and the change on {latestYear - 1}</div>
              {CONTROL_ORDER.filter((k) => (nowCounts[k] ?? 0) > 0 || (prevCounts[k] ?? 0) > 0).map((k) => (
                <Bar key={k} label={controlLabelOf(k)} colour={controlColourOf(k)} fraction={(nowCounts[k] ?? 0) / Math.max(1, ...Object.values(nowCounts))} value={fmt(nowCounts[k] ?? 0)} delta={(nowCounts[k] ?? 0) - (prevCounts[k] ?? 0)} compact />
              ))}
            </div>
          </div>
        </Card>
      </Reveal>

      {/* Changed hands */}
      <Reveal>
        <Card id="changes">
          <SectionHead kicker="Changes of control" accent="#E0367A" title={`${changes.total} councils changed hands since ${latestYear - 1}`} blurb="A council changes hands when the party that holds a majority of its seats changes, or when a party loses its majority and no one replaces it." />
          <div className="council-split">
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>Gains and losses, in councils</div>
              {changes.net.map((r) => (
                <Bar key={r.key} label={controlLabelOf(r.key)} colour={controlColourOf(r.key)} fraction={Math.max(r.gained, r.lost) / maxNet} value={`${r.gained} gained · ${r.lost} lost`} compact />
              ))}
            </div>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>The most common moves</div>
              {changes.flows.slice(0, 7).map((f) => (
                <MoveRow key={`${f.from}-${f.to}`} count={f.count} from={controlLabelOf(f.from)} to={controlLabelOf(f.to)} fromColour={controlColourOf(f.from)} toColour={controlColourOf(f.to)} />
              ))}
            </div>
          </div>
          <WhatThisMeans result={changesMeaning({ changesByYear, summary: changes })} style={{ marginTop: 18 }} />
          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setShowAllChanges((v) => !v)} style={linkButton}>{showAllChanges ? "Hide the list" : `See all ${changes.total} councils that changed hands →`}</button>
            {showAllChanges && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, marginTop: 12 }}>
                {rawChanges.map((c) => (
                  <button key={c.id} type="button" className="nclick" onClick={() => goCouncil(c.id)} style={{ textAlign: "left", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer", color: "inherit" }}>
                    <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>{c.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Chip colour={controlColourOf(c.from)} style={{ fontSize: 11.5 }}>{controlLabelOf(c.from)}</Chip>
                      <Arrow />
                      <Chip colour={controlColourOf(c.to)} style={{ fontSize: 11.5 }}>{controlLabelOf(c.to)}</Chip>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Reveal>

      {/* Defections */}
      {def && (
        <Reveal>
          <Card id="defections">
            <SectionHead kicker="Defections" accent="#E8A33D" title={`${fmt(def.total)} councillors changed party since ${def.since}`} blurb={`Found by comparing the ${def.since} and ${latestYear} lists of councillors: the same person, in the same ward, under a different party. Many councillors who leave a party become independents.`} />
            <div className="council-split">
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>The biggest switches</div>
                {def.flows.slice(0, 8).map((f) => (
                  <MoveRow key={`${f.from}-${f.to}`} count={f.count} from={f.fromParty.short} to={f.toParty.short} fromColour={f.fromParty.colour} toColour={f.toParty.colour} bar={f.count / maxFlow} />
                ))}
              </div>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 8 }}>Net gain or loss, in councillors</div>
                {[...defNetTop, ...defNetBottom].map((p) => (
                  <Bar key={p.idx} label={p.short} colour={p.colour} fraction={Math.abs(p.net) / defNetMax} value={signed(p.net)} compact />
                ))}
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, margin: "16px 0 6px" }}>Councils with the most switches</div>
                {def.byCouncil.slice(0, 5).map((c) => {
                  const council = index.find((x) => x.name === c.name);
                  return (
                    <button key={c.name} type="button" className="nclick" disabled={!council} onClick={() => council && goCouncil(council.id)} style={{ display: "flex", justifyContent: "space-between", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "7px 2px", cursor: "pointer", color: "inherit" }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink }}>{c.name}</span>
                      <span style={{ ...numeric, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>{c.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <WhatThisMeans result={defectionMeaning({ summary: def, councillors: s.councillors })} style={{ marginTop: 18 }} caveat="The lists are snapshots, so someone who switched and switched back isn't counted." />
          </Card>
        </Reveal>
      )}

      {/* Trend */}
      <Reveal>
        <Card>
          <SectionHead kicker="Since 2016" accent="#2F8FBF" title="How control has shifted" blurb="For each year, how many of today's councils were controlled by each party, or by no one. A council is controlled when one party holds more than half its seats." />
          <ControlTrend trend={trend} />
          <WhatThisMeans result={controlTrendMeaning({ trend })} style={{ marginTop: 16 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
            <strong style={{ color: COLORS.ink }}>Councils changing hands each year:</strong>
            {changesByYear.map((c) => (
              <span key={c.year}>{c.year} <strong style={{ ...numeric, color: COLORS.ink }}>{c.count}</strong></span>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* Councillors by party */}
      <Reveal>
        <Card>
          <SectionHead kicker="Councillors" accent="#4F46E5" title="Councillors by party" blurb={`Every elected councillor, and how each party's number has changed since the ${rawDef?.since ?? latestYear - 1} list. Independents and small local parties are grouped as “Independent or other”.`} />
          {seatDelta.slice(0, 9).map((p) => (
            <Bar key={p.idx} label={p.short} colour={p.colour} fraction={p.count / maxSeats} value={fmt(p.count)} delta={rawDef ? p.change : null} labelWidth={190} />
          ))}
        </Card>
      </Reveal>

      {/* Elections */}
      <Reveal>
        <Card id="elections">
          <SectionHead kicker="Elections" accent="#1FA97C" title="When councils next vote" blurb="The date each council's next election falls on. Some councils elect everyone at once; others elect a third or a half at a time." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
            {s.nextDates.map((d, i) => (
              <div key={d.date} style={{ background: COLORS.paper, border: `1px solid ${i === 0 ? "#1FA97C" : COLORS.hairline}`, borderRadius: 16, padding: "14px 16px" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: i === 0 ? "#1FA97C" : COLORS.inkSoft }}>{i === 0 ? "Next up" : "Later"}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, margin: "3px 0 8px" }}>{longDate(d.date)}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
                  <strong style={{ ...numeric, fontSize: 18, color: COLORS.ink }}>{fmt(d.seats)}</strong> seats · {d.councils} {d.councils === 1 ? "council" : "councils"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* Every council */}
      <Card id="all-councils">
        <SectionHead kicker="Browse" accent="#4F46E5" title="Every council" blurb="Tap one to see its councillors, ward by ward, and its recent changes." />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by name" aria-label="Filter the list of councils" style={{ ...input, maxWidth: 260, padding: "9px 14px", fontSize: 14 }} />
          {CONTROL_ORDER.filter((k) => (nowCounts[k] ?? 0) > 0).map((k) => (
            <button key={k} type="button" aria-pressed={controlFilter === k} onClick={() => setControlFilter(controlFilter === k ? null : k)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${controlFilter === k ? controlColourOf(k) : COLORS.hairline}`, background: controlFilter === k ? `${controlColourOf(k)}26` : "transparent", color: COLORS.ink }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: controlColourOf(k) }} />
              {controlLabelOf(k)} <span style={{ ...numeric, color: COLORS.inkSoft }}>{nowCounts[k]}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 10 }}>
          {listed.map((c) => {
            const colour = controlColourOf(c.control_by_seats);
            return (
              <button key={c.id} type="button" className="nclick" onClick={() => goCouncil(c.id)} style={{ textAlign: "left", background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${colour}`, borderRadius: 12, padding: "10px 13px", cursor: "pointer", color: "inherit" }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: COLORS.ink }}>{c.name}</span>
                  {changedIds.has(c.id) && <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: "#E0367A", background: "#E0367A1a", borderRadius: 999, padding: "1px 8px", whiteSpace: "nowrap" }}>Changed hands</span>}
                </span>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{c.control} · {c.total} seats</span>
              </button>
            );
          })}
        </div>
        {listed.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No council matches that.</div>}
        {!showAllCouncils && !search && !controlFilter && index.length > 24 && <button type="button" onClick={() => setShowAllCouncils(true)} style={{ ...linkButton, marginTop: 14 }}>Show all {index.length} councils</button>}
      </Card>
    </div>
  );
}

function ControlTrend({ trend }) {
  const keys = CONTROL_ORDER.filter((k) => trend.some((r) => r.counts[k] > 0));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${trend.length}, minmax(0, 1fr))`, gap: 8, alignItems: "end" }}>
        {trend.map((r) => (
          <div key={r.year} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <div title={keys.filter((k) => r.counts[k]).map((k) => `${controlLabelOf(k)} ${r.counts[k]}`).join(", ")} style={{ display: "flex", flexDirection: "column-reverse", width: "100%", height: 190, borderRadius: 8, overflow: "hidden", background: COLORS.paper }}>
              {keys.filter((k) => r.counts[k] > 0).map((k) => (
                <div key={k} style={{ height: `${(r.counts[k] / (r.total || 1)) * 100}%`, background: controlColourOf(k), borderTop: `1px solid ${COLORS.paperCard}` }} />
              ))}
            </div>
            <span style={{ ...numeric, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6 }}>{String(r.year).slice(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 14 }}>
        {keys.map((k) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: controlColourOf(k) }} />
            {controlLabelOf(k)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- One council --------------------------------------------------------------
function HistoryChart({ rows }) {
  if (rows.length < 2) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`, gap: 6, alignItems: "end" }}>
        {rows.map((r) => (
          <div key={r.year} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <div title={HKEYS.filter((k) => r[k]).map((k) => `${HISTORY_LABELS[k]} ${r[k]}`).join(", ")} style={{ display: "flex", flexDirection: "column-reverse", width: "100%", height: 150, borderRadius: 6, overflow: "hidden", background: COLORS.paper }}>
              {HKEYS.filter((k) => r[k] > 0).map((k) => (
                <div key={k} style={{ height: `${(r[k] / (r.total || 1)) * 100}%`, background: HISTORY_COLOURS[k], borderTop: `1px solid ${COLORS.paperCard}` }} />
              ))}
            </div>
            <span style={{ ...numeric, fontSize: 11, color: COLORS.inkSoft, marginTop: 5 }}>{String(r.year).slice(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 12 }}>
        {HKEYS.filter((k) => rows.some((r) => r[k] > 0)).map((k) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: HISTORY_COLOURS[k] }} />
            {HISTORY_LABELS[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

function CouncilView({ council, data, wardName, countyId, detail, failed }) {
  const { parties, index, historyColumns: columns, changes: rawChanges, latestYear } = data;
  const [filter, setFilter] = useState("");
  const [party, setParty] = useState(null);
  const seats = useMemo(() => seatsByParty(council, parties), [council, parties]);
  const wards = useMemo(() => detail?.wards ?? [], [detail]);
  const moved = useMemo(() => detail?.moved ?? [], [detail]);
  const history = useMemo(() => historyRows(detail, columns), [detail, columns]);
  const yourWard = useMemo(() => (wardName && wards.length ? findWard(wards, wardName) : null), [wards, wardName]);
  const county = countyId ? index.find((c) => c.id === countyId) : null;
  const change = rawChanges.find((c) => c.id === council.id) ?? null;
  const q = normCouncil(filter);
  const major = majorityOf(council.total);
  const next = council.next?.[0];
  const rows = Math.max(3, Math.min(8, Math.round(Math.sqrt(council.total) / 1.6)));
  const items = useMemo(() => seats.flatMap((p) => Array.from({ length: p.count }, () => ({ party: p.short, party_colour: p.colour }))), [seats]);
  const accent = seats[0]?.colour ?? COLORS.accent;

  const visible = useMemo(
    () =>
      wards
        .map(([ward, list]) => [ward, list.filter(([name, p]) => (!party || p === party) && (!q || normCouncil(name).includes(q) || normCouncil(ward).includes(q)))])
        .filter(([, list]) => list.length > 0),
    [wards, party, q]
  );

  return (
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 22 }}>
      <button type="button" onClick={() => goHash("#/councils")} style={{ ...linkButton, color: COLORS.inkSoft, fontWeight: 400, alignSelf: "flex-start" }}>← All councils</button>

      <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, border: `1px solid ${COLORS.hairline}`, padding: "clamp(20px, 3.6vw, 34px)", background: `radial-gradient(700px 260px at 95% -20%, ${accent}40, transparent 62%), ${COLORS.paperCard}` }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: accent }} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft }}>Local council</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(30px, 5.6vw, 52px)", color: COLORS.ink, margin: "6px 0 0", lineHeight: 1.04, letterSpacing: "-0.025em" }}>{council.name}</h2>
        <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft, marginTop: 10 }}>
          Run by: <strong style={{ color: COLORS.ink }}>{council.control}</strong>
        </div>
        {county && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 10 }}>
            Your area also has a county council, which looks after other services such as roads and social care:{" "}
            <button type="button" onClick={() => goCouncil(county.id)} style={linkButton}>{county.name} →</button>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <ShareButton filename={`${council.name}-council`} getSpec={() => councilShareSpec({ council, seats, link: window.location.href })} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))", gap: 14 }}>
        <StatCard icon={IconGroup} colour="#4F46E5" value={council.total} label="councillors" caption={`${major} seats are needed for a majority.`} />
        <StatCard icon={IconChartBars} colour={controlColourOf(council.control_by_seats)} value={seats[0]?.count ?? 0} label={`seats for ${seats[0]?.short ?? "the largest party"}`} caption={council.control_by_seats === "noc" ? "No party holds a majority of the seats." : `${controlLabelOf(council.control_by_seats)} holds a majority of the seats.`} />
        <StatCard icon={IconCompare} colour="#E0367A" value={change ? 1 : 0} format={(n) => (n ? "Yes" : "No")} label={`changed hands in ${latestYear}`} caption={change ? `From ${controlLabelOf(change.from)} to ${controlLabelOf(change.to)}.` : `Same kind of control as in ${latestYear - 1}.`} />
        <StatCard icon={IconSplit} colour="#E8A33D" value={moved.length} label="councillors changed party" caption={data.defections ? `Since the ${data.defections.since} list.` : undefined} />
        {next && <StatCard icon={IconVote} colour="#1FA97C" value={next[1]} label={`seats up on ${longDate(next[0])}`} caption={nextElectionText(council)} />}
      </div>

      <Card>
        <SectionHead kicker="The chamber" title="Who holds the seats" blurb="Each dot is one councillor, coloured by party. A party needs more than half of them to control the council on its own." />
        <div className="council-split">
          <div>
            <PartyHemicycle
              politicians={items}
              rows={rows}
              legendCount={8}
              centre={
                <div>
                  <div style={{ ...numeric, fontSize: "clamp(22px, 5cqw, 38px)", fontWeight: 700, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.03em" }}>{council.total}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>councillors</div>
                </div>
              }
            />
          </div>
          <div>
            {seats.map((p) => (
              <Bar key={p.idx} label={p.short} colour={p.colour} fraction={p.count / (seats[0]?.count || 1)} value={`${p.count} · ${Math.round(p.pct)}%`} compact />
            ))}
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 8 }}>{major} seats make a majority.</div>
          </div>
        </div>
        <WhatThisMeans result={councilMeaning({ seats, total: council.total, control: council.control })} style={{ marginTop: 16 }} />
      </Card>

      {history.length > 1 && (
        <Card>
          <SectionHead kicker="Since 2016" accent="#2F8FBF" title="How the make-up has changed" blurb="The council's seats each year, as a share of the total. A big shift between years usually follows an election." />
          <HistoryChart rows={history} />
          <WhatThisMeans result={councilChangeMeaning({ rows: history, parties: seats })} style={{ marginTop: 16 }} />
        </Card>
      )}

      {moved.length > 0 && (
        <Card>
          <SectionHead kicker="Defections" accent="#E8A33D" title={`${moved.length} ${moved.length === 1 ? "councillor has" : "councillors have"} changed party`} blurb={`In a different party from the one listed in ${data.defections?.since ?? "last year"}.`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {moved.map(([ward, name, from, to]) => (
              <div key={`${ward}-${name}`} style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, margin: "1px 0 7px" }}>{ward}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Chip colour={partyDisplay(parties, from).colour} style={{ fontSize: 11.5 }}>{partyDisplay(parties, from).short}</Chip>
                  <Arrow />
                  <Chip colour={partyDisplay(parties, to).colour} style={{ fontSize: 11.5 }}>{partyDisplay(parties, to).short}</Chip>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <SectionHead kicker="Your councillors" accent="#4F46E5" title="Ward by ward" blurb="Each ward elects one to three councillors. Use the postcode box at the top of the page to find yours." />
        {wardName && !yourWard && wards.length > 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 12 }}>
            We couldn't match your ward, “{wardName}”, to this council's list. Ward boundaries were redrawn in some areas, so browse or search below.
          </div>
        )}
        {yourWard && (
          <div style={{ background: `${COLORS.accent}14`, border: `1px solid ${COLORS.accent}66`, borderRadius: 16, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.accent }}>Your ward</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, margin: "2px 0 8px" }}>{yourWard[0]}</div>
            {yourWard[1].map(([name, p]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink, padding: "3px 0" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: partyDisplay(parties, p).colour, flexShrink: 0 }} />
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
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search a councillor or ward" aria-label="Search councillors and wards" style={{ ...input, maxWidth: 300, padding: "9px 14px", fontSize: 14 }} />
              {seats.slice(0, 6).map((s) => (
                <button key={s.idx} type="button" aria-pressed={party === s.idx} onClick={() => setParty(party === s.idx ? null : s.idx)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${party === s.idx ? s.colour : COLORS.hairline}`, background: party === s.idx ? `${s.colour}22` : "transparent", color: COLORS.ink }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.colour }} />
                  {s.short}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
              {visible.map(([ward, list]) => (
                <div key={ward} style={{ background: COLORS.paper, border: `1px solid ${yourWard && yourWard[0] === ward ? COLORS.accent : COLORS.hairline}`, borderRadius: 14, padding: "11px 13px" }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, marginBottom: 5 }}>{ward}</div>
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
      </Card>
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
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: PAGE_PADDING }}>
      {data ? (
        <Hero
          index={data.index}
          kicker="Get Involved · Your Council"
          title="Your council and your councillors"
          subtitle="Councils run bin collections, planning, housing, roads and care. See who runs yours, who your councillors are, who is changing sides, and when you next get a vote."
        />
      ) : (
        <div style={{ height: 60 }} />
      )}
      <PageGuide viewKey="councils" style={{ marginTop: 18 }} />
      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the council data" /></div>}
      {!failed && !data && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}
      {data && (
        <>
          {id && !council && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: "#C0504D", marginTop: 18 }}>We couldn't find that council. Try searching for it by name.</div>}
          {council ? (
            <CouncilView
              key={council.id}
              council={council}
              data={data}
              wardName={wardName || null}
              countyId={countyId || null}
              detail={loadedDetail.id === council.id ? loadedDetail.detail : null}
              failed={detailFailed}
            />
          ) : (
            <Overview data={data} />
          )}
          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 28, maxWidth: 800 }}>
            Councillors, parties and election dates come from{" "}
            <a href="https://opencouncildata.co.uk" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>Open Council Data UK</a>{" "}
            (CC BY-SA 4.0), updated after each round of elections. Council control and changes of hands are worked out from each council's seats. Parish and town councils, and ward-by-ward election results, aren't included. By-elections can change a council between updates.
          </p>
        </>
      )}
    </div>
  );
}
