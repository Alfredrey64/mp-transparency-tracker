import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { GOVERNMENTS } from "../data/governments";
import { STATUS, manifestosFor } from "../data/manifestoPledges";
import { GROUPS } from "../lib/electionHistory";
import { METRICS, measure } from "../lib/governmentMetrics";
import { loadMetric } from "../lib/governmentSeries";
import MetricExplorer from "./MetricExplorer";
import { Reveal, CountUp } from "./Motion";
import pmPortraits from "../data/pmPortraits.json";

// The Governments tab: every government since 1945 with how it took office, what changed, how some national figures moved while it was in
// power, and (from 1997) what its party promised and what happened to those promises.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const longDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const PARTY_LABEL = { l: "Labour", c: "Conservative", lc: "Conservative and Liberal Democrat coalition" };
const partyColour = (p) => (p === "l" ? GROUPS.l.colour : GROUPS.c.colour);
const GLANCE = ["growth", "unemployment", "inflation", "bank"].map((id) => METRICS.find((m) => m.id === id));

const PORTRAIT = { attlee: "Clement Attlee", churchill: "Winston Churchill", eden: "Anthony Eden", macmillan: "Harold Macmillan", douglashome: "Sir Alec Douglas-Home", wilson1: "Harold Wilson", heath: "Edward Heath", wilson2: "Harold Wilson", callaghan: "James Callaghan", thatcher: "Margaret Thatcher", major: "John Major", blair: "Tony Blair", brown: "Gordon Brown", coalition: "David Cameron", cameron: "David Cameron", may: "Theresa May", johnson: "Boris Johnson", truss: "Liz Truss", sunak: "Rishi Sunak", starmer: "Keir Starmer", burnham: "Andy Burnham" };
const GLANCE_COLOURS = { growth: "#2F9E6B", unemployment: "#D9822B", inflation: "#D6455D", bank: "#4C6FA6" };
// The colour behind a government's name: its party, with the coalition's blue giving way to orange at the edge.
const bandBackground = (party) => {
  const c = partyColour(party);
  return party === "lc" ? `linear-gradient(110deg, ${c} 0%, ${c} 64%, ${GROUPS.d.colour} 100%)` : `linear-gradient(120deg, ${c} 0%, color-mix(in srgb, ${c} 62%, #000) 100%)`;
};

function Portrait({ gov, size = 92 }) {
  const [failed, setFailed] = useState(false);
  const url = pmPortraits[PORTRAIT[gov.id]]?.url;
  const initials = gov.pm.split(" and ")[0].split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "rgba(255,255,255,0.18)", border: "3px solid rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FONT_DISPLAY, fontSize: size * 0.34, fontWeight: 700 }}>
      {url && !failed ? <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} /> : initials}
    </span>
  );
}

function lengthOf(g, now) {
  const from = Date.parse(`${g.from}T00:00:00Z`);
  const to = g.to ? Date.parse(`${g.to}T00:00:00Z`) : now;
  const months = Math.max(1, Math.round((to - from) / (30.4375 * 86400000)));
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} ${y === 1 ? "year" : "years"}`);
  if (m) parts.push(`${m} ${m === 1 ? "month" : "months"}`);
  return `${parts.join(" and ")}${g.to ? "" : " so far"}`;
}

function Swatch({ party, size = 10 }) {
  return (
    <span aria-hidden="true" style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: partyColour(party), boxShadow: party === "lc" ? `inset -${size / 2}px 0 0 ${GROUPS.d.colour}` : "none", flexShrink: 0 }} />
  );
}

function Glance({ gov, now }) {
  const [tiles, setTiles] = useState(null);
  useEffect(() => {
    let alive = true;
    Promise.all(GLANCE.map((m) => loadMetric(m).then((p) => ({ m, r: measure(m, p, gov, now) })).catch(() => ({ m, r: null }))))
      .then((rows) => alive && setTiles(rows.filter((x) => x.r)));
    return () => { alive = false; };
  }, [gov, now]);
  if (!tiles || !tiles.length) return null;
  return (
    <div style={{ marginTop: 22 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, margin: 0, color: COLORS.ink }}>Some figures from the time</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 10 }}>
        {tiles.map(({ m, r }) => (
          <div key={m.id} style={{ padding: "12px 14px", borderRadius: 14, background: `color-mix(in srgb, ${GLANCE_COLOURS[m.id]} 9%, ${COLORS.paper})`, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${GLANCE_COLOURS[m.id]}` }}>
            <div style={{ ...numeric, fontSize: 26, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.02em" }}><CountUp value={r.average} decimals={m.decimals} suffix="%" /></div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{m.label}, average</div>
          </div>
        ))}
      </div>
      <p style={{ ...para, fontSize: 12.5, marginTop: 8 }}>Averages of the ONS figures published during this government's time in office. Many other figures, and the full series, are in "How the numbers moved" below.</p>
    </div>
  );
}

function Pledges({ m }) {
  const [filter, setFilter] = useState(null);
  const counts = m.pledges.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }), {});
  const kinds = Object.keys(STATUS).filter((k) => counts[k]);
  const shown = filter ? m.pledges.filter((p) => p.status === filter) : m.pledges;
  const tone = (k) => `color-mix(in srgb, ${STATUS[k].colour} 60%, ${COLORS.ink})`;
  return (
    <section aria-label={`${m.party} ${m.election} promises`} style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${COLORS.hairline}` }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, margin: 0, color: COLORS.ink }}>{m.party === "Labour" || m.party === "Conservative" ? `What ${m.party} promised in ${m.election}` : `What the coalition agreed in ${m.election}`}</h3>
      <p style={{ ...para, fontSize: 14, marginTop: 4 }}>
        {m.title}
        {m.url && <> · <a href={m.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>Read it<span className="sr-only"> (opens in a new tab)</span></a></>}
        {m.note && <><br />{m.note}</>}
      </p>
      <div role="img" aria-label={`Outcomes: ${kinds.map((k) => `${counts[k]} ${STATUS[k].label.toLowerCase()}`).join(", ")}`} style={{ display: "flex", gap: 3, height: 12, borderRadius: 6, overflow: "hidden", marginTop: 12 }}>
        {kinds.map((k) => <span key={k} style={{ flex: `${counts[k]} 1 0`, background: STATUS[k].colour }} />)}
      </div>
      <div role="group" aria-label="Filter by outcome" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)} style={{ ...pillStyle(filter === null), fontSize: 13 }}>All {m.pledges.length}</button>
        {kinds.map((k) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(filter === k ? null : k)} style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 999, cursor: "pointer", border: `1.5px solid ${STATUS[k].colour}`, background: filter === k ? STATUS[k].colour : "transparent", color: filter === k ? "#fff" : tone(k), transition: "background 0.2s, color 0.2s" }}>
            <span aria-hidden="true">{STATUS[k].mark} </span>{counts[k]} {STATUS[k].label.toLowerCase()}
          </button>
        ))}
      </div>
      <p style={{ ...para, fontSize: 12.5, marginTop: 8 }}>A selection of the specific, checkable promises, not all of them.</p>
      <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
        {shown.map((p) => (
          <li key={p.text} className="ge-fade" style={{ padding: "14px 0", borderTop: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${STATUS[p.status].colour}`, paddingLeft: 14, marginTop: 8, borderRadius: 4 }}>
            <span style={{ display: "inline-block", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: tone(p.status), border: `1px solid ${STATUS[p.status].colour}`, borderRadius: 999, padding: "2px 9px", marginBottom: 6, whiteSpace: "nowrap" }}>
              <span aria-hidden="true">{STATUS[p.status].mark} </span>{STATUS[p.status].label}
            </span>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4 }}>{p.text}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 3, maxWidth: 720 }}>{p.note}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 3 }}>Source: {p.source}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function GovernmentsTab({ id, onSelect, onOpenElection }) {
  const [now] = useState(() => Date.now());
  const index = Math.max(0, GOVERNMENTS.findIndex((g) => g.id === id));
  const selectedIndex = id && GOVERNMENTS.some((g) => g.id === id) ? index : GOVERNMENTS.length - 1;
  const gov = GOVERNMENTS[selectedIndex];
  const manifestos = useMemo(() => manifestosFor(gov), [gov]);
  const prev = GOVERNMENTS[selectedIndex - 1];
  const next = GOVERNMENTS[selectedIndex + 1];

  return (
    <div>
      <Reveal as="section" aria-labelledby="h-gt-intro" style={{ ...card, marginTop: 8 }}>
        <h2 id="h-gt-intro" style={cardTitle}>Who governed, and what changed</h2>
        <p style={para}>
          {GOVERNMENTS.length} governments have held office since the war. Pick one to see how it came to power, the main things that changed under it, and some national figures from the time. For governments elected from 1997 on, the page sets what the winning party promised in its manifesto beside what happened. Earlier manifestos are left out: they are not a dependable record of what was promised, so those governments are described by what they did.
        </p>
        <div {...scrollRegion("Governments")} role="group" aria-label="Choose a government" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "16px 2px 8px" }}>
          {GOVERNMENTS.map((g) => {
            const on = g.id === gov.id;
            return (
              <button key={g.id} type="button" aria-pressed={on} onClick={() => onSelect(g.id)} className="ge-tab" style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "7px 14px", borderRadius: 999, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, border: `1.5px solid ${on ? partyColour(g.party) : COLORS.hairline}`, background: on ? bandBackground(g.party) : "transparent", color: on ? "#fff" : COLORS.inkSoft }}>
                {!on && <Swatch party={g.party} />}
                <span>{g.pm.split(" and ")[0].split(" ").slice(-1)[0]}<span style={{ fontWeight: 400 }}> {g.from.slice(0, 4)}</span></span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <section key={gov.id} className="ge-fade" aria-labelledby="h-gt-gov" style={{ ...card, marginTop: 18, overflow: "hidden" }}>
        <div style={{ margin: "calc(-1 * clamp(18px, 4.5vw, 26px))", marginBottom: 18, padding: "clamp(18px, 4.5vw, 26px)", background: bandBackground(gov.party), color: "#fff", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Portrait gov={gov} />
          <div style={{ minWidth: 0, flex: "1 1 220px" }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, margin: 0, opacity: 0.95 }}>
              {PARTY_LABEL[gov.party]} · {longDate(gov.from)} to {gov.to ? longDate(gov.to) : "now"}
            </p>
            <h2 id="h-gt-gov" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: "-0.01em", color: "#fff", margin: "4px 0 0", fontSize: "clamp(26px, 6vw, 40px)", lineHeight: 1.1 }}>{gov.pm}</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, margin: "6px 0 0", opacity: 0.95 }}>{lengthOf(gov, now)} in office</p>
          </div>
        </div>
        <p style={para}>{gov.took}</p>
        {gov.elections.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {gov.elections.map((e) => (
              <button key={e} type="button" onClick={() => onOpenElection(e)} style={{ ...pillStyle(false), fontSize: 13 }}>
                See the {e === "1974a" ? "February 1974" : e === "1974b" ? "October 1974" : e} result
              </button>
            ))}
          </div>
        )}

        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, margin: "22px 0 0", color: COLORS.ink }}>The main changes</h3>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 8, fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: COLORS.ink, maxWidth: 760 }}>
          {gov.changes.map((c, i) => <li key={c} className="ge-fade" style={{ animationDelay: `${120 + i * 70}ms`, "--bullet": partyColour(gov.party) }}>{c}</li>)}
        </ul>
        <p style={{ ...para, fontSize: 13, marginTop: 10 }}>A selection of the best-documented events, not everything, and not a verdict on any of it.</p>

        <Glance gov={gov} now={now} />

        {manifestos.map((m) => <Pledges key={m.id} m={m} />)}
        {manifestos.length === 0 && gov.from >= "1997-05-02" && (
          <p style={{ ...para, marginTop: 18 }}>No general election was won under {gov.pm}. The promises it governed on are those of the election before.</p>
        )}
        {gov.from < "1997-05-02" && (
          <p style={{ ...para, fontSize: 13.5, marginTop: 18 }}>Manifestos are only compared with results from 1997, so this entry describes what the government did.</p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          {prev ? <button type="button" onClick={() => onSelect(prev.id)} style={pillStyle(false)}>Earlier: {prev.pm.split(" and ")[0]}</button> : <span />}
          {next ? <button type="button" onClick={() => onSelect(next.id)} style={pillStyle(false)}>Next: {next.pm.split(" and ")[0]}</button> : <span />}
        </div>
      </section>

      <MetricExplorer selectedId={gov.id} onSelect={onSelect} />

      <p style={{ ...para, fontSize: 12.5, marginTop: 16 }}>
        Sources: Acts of Parliament and official statistics named beside each item; Channel 4 FactCheck, Full Fact and the National Audit Office where cited. Each pledge was checked against the text of the manifesto, or for 2010 the coalition programme. Last checked October 2026.
      </p>
    </div>
  );
}
