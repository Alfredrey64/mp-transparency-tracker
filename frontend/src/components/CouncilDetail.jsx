// One council in detail: who runs it, its seats, its history and its wards.
import { useState, useMemo } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { seatsByParty, majorityOf, nextElectionText, longDate, historyRows, findWard, normCouncil, partyDisplay, controlLabelOf, controlColourOf } from "../lib/councils";
import { councilShareSpec } from "../lib/shareSpecs";
import { councilMeaning, councilChangeMeaning } from "../lib/councilMeaning";
import { LoadFailedNote } from "./MpCards";
import { IconGroup, IconSplit, IconCompare, IconChartBars, IconVote } from "./icons";
import { PartyHemicycle } from "./PartyHemicycle";
import WhatThisMeans from "./WhatThisMeans";
import ShareButton from "./ShareButton";
import { goHash, goCouncil, HISTORY_COLOURS, HISTORY_LABELS, HKEYS, input, linkButton } from "./councilsUi";
import { Card, SectionHead, StatCard, Chip, Arrow, Bar } from "./CouncilsParts";

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

export function CouncilView({ council, data, wardName, countyId, detail, failed }) {
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
            <button type="button" onClick={() => goCouncil(county.id)} style={linkButton}>{county.name}</button>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <ShareButton filename={`${council.name}-council`} getSpec={() => councilShareSpec({ council, seats, link: window.location.href })} />
        </div>
      </div>

      <div className="box-row" style={{ "--n": next ? 5 : 4, "--min": "150px" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 10 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))", gap: 10 }}>
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
