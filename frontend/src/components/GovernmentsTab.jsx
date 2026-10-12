import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { GOVERNMENTS } from "../data/governments";
import { MANIFESTOS, STATUS, manifestosFor } from "../data/manifestoPledges";
import { GROUPS } from "../lib/electionHistory";
import { METRICS, formatValue, measure } from "../lib/governmentMetrics";
import { loadMetric } from "../lib/governmentSeries";
import MetricExplorer from "./MetricExplorer";

// The Governments tab: every government since 1945 with how it took office, what changed, how some national figures moved while it was in
// power, and (from 1997) what its party promised and what happened to those promises.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const longDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const PARTY_LABEL = { l: "Labour", c: "Conservative", lc: "Conservative and Liberal Democrat coalition" };
const partyColour = (p) => (p === "l" ? GROUPS.l.colour : GROUPS.c.colour);
const GLANCE = ["growth", "unemployment", "inflation", "bank"].map((id) => METRICS.find((m) => m.id === id));

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
    <div style={{ marginTop: 20 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, margin: 0, color: COLORS.ink }}>Some figures from the time</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 10 }}>
        {tiles.map(({ m, r }) => (
          <div key={m.id} style={{ padding: "12px 14px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
            <div style={{ ...numeric, fontSize: 24, fontWeight: 600, color: COLORS.ink, letterSpacing: "-0.02em" }}>{formatValue(m, r.average)}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{m.label}, average</div>
          </div>
        ))}
      </div>
      <p style={{ ...para, fontSize: 12.5, marginTop: 8 }}>Averages of the ONS figures published during this government's time in office. Many other figures, and the full series, are in "How the numbers moved" below.</p>
    </div>
  );
}

function Pledges({ m }) {
  const counts = m.pledges.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }), {});
  return (
    <section aria-label={`${m.party} ${m.election} promises`} style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${COLORS.hairline}` }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, margin: 0, color: COLORS.ink }}>{m.party === "Labour" || m.party === "Conservative" ? `What ${m.party} promised in ${m.election}` : `What the coalition agreed in ${m.election}`}</h3>
      <p style={{ ...para, fontSize: 14, marginTop: 4 }}>
        {m.title}
        {m.url && <> · <a href={m.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>Read it<span className="sr-only"> (opens in a new tab)</span></a></>}
        {m.note && <><br />{m.note}</>}
      </p>
      <p style={{ ...para, fontSize: 13.5, marginTop: 6 }}>
        {Object.keys(STATUS).filter((k) => counts[k]).map((k) => `${counts[k]} ${STATUS[k].label.toLowerCase()}`).join(", ")}. A selection of the specific, checkable promises, not all of them.
      </p>
      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
        {m.pledges.map((p) => (
          <li key={p.text} style={{ padding: "14px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
            <span style={{ display: "inline-block", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: `color-mix(in srgb, ${STATUS[p.status].colour} 60%, ${COLORS.ink})`, border: `1px solid ${STATUS[p.status].colour}`, borderRadius: 999, padding: "2px 9px", marginBottom: 6, whiteSpace: "nowrap" }}>
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
      <section aria-labelledby="h-gt-intro" style={{ ...card, marginTop: 8 }}>
        <h2 id="h-gt-intro" style={cardTitle}>Who governed, and what changed</h2>
        <p style={para}>
          {GOVERNMENTS.length} governments have held office since the war. Pick one to see how it came to power, the main things that changed under it, and some national figures from the time. For governments elected from 1997 on, the page sets what the winning party promised in its manifesto beside what happened. Earlier manifestos are left out: they are not a dependable record of what was promised, so those governments are described by what they did.
        </p>
        <div {...scrollRegion("Governments")} role="group" aria-label="Choose a government" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "16px 2px 8px" }}>
          {GOVERNMENTS.map((g) => (
            <button key={g.id} type="button" aria-pressed={g.id === gov.id} onClick={() => onSelect(g.id)} style={{ ...pillStyle(g.id === gov.id), flexShrink: 0, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Swatch party={g.party} />
              <span>{g.pm.split(" and ")[0].split(" ").slice(-1)[0]}<span style={{ fontWeight: 400 }}> {g.from.slice(0, 4)}</span></span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="h-gt-gov" style={{ ...card, marginTop: 18, borderTop: `4px solid ${partyColour(gov.party)}` }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Swatch party={gov.party} />
          {PARTY_LABEL[gov.party]} · {longDate(gov.from)} to {gov.to ? longDate(gov.to) : "now"} · {lengthOf(gov, now)}
        </p>
        <h2 id="h-gt-gov" style={{ ...cardTitle, fontSize: "clamp(24px, 5vw, 34px)", lineHeight: 1.15, marginTop: 6 }}>{gov.pm}</h2>
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
          {gov.changes.map((c) => <li key={c}>{c}</li>)}
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
        Sources: Acts of Parliament and official statistics named beside each item; the House of Commons Library; Channel 4 FactCheck, Full Fact and the National Audit Office where cited. {MANIFESTOS.length} manifestos checked against their full text. Last checked October 2026.
      </p>
    </div>
  );
}
