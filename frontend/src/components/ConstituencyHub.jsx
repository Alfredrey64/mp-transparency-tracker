import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import WhatThisMeans from "./WhatThisMeans";
import { describeAgainst } from "../lib/interpret";
import { supabase } from "../supabaseClient";
import { fetchAllRows } from "../lib/supabasePagination";
import { COLORS, FONT_BODY, PAGE_PADDING, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { seatKey, ordinal } from "../lib/constituency";
import { buildCells, boundsOf, MODES, REGIONS, regionName, partyKey, summariseRegion, neighbours, seatRanks, normSeat } from "../lib/seatMap";
import { rebelRates } from "../lib/rebels";
import { mapShareSpec } from "../lib/shareSpecs";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconHexMap } from "./icons";
import { SeatDetail, SeatSearch, Panel } from "./Constituency";
import HexMap from "./HexMap";
import ShareButton from "./ShareButton";

// Your Constituency and the seat map, as one page. The map is the way in:
// every one of the 650 seats is a hexagon, coloured by whichever view is
// chosen. Tap a seat and everything about it opens beside the map (result,
// petitions, history, its MP) with how it compares to its region and the
// country, and its neighbours. The address follows the seat (#/constituency/
// Chorley), so any seat can be linked to.

const goSeat = (name) => {
  window.location.hash = name ? `#/constituency/${encodeURIComponent(name)}` : "#/constituency";
};

// One decimal place, two for a lead under 1% so a 15-vote majority doesn't read as 0.0%.
const pct1 = (n) => (n == null ? "–" : n > 0 && n < 1 ? `${n.toFixed(2)}%` : `${(Math.round(n * 10) / 10).toFixed(1)}%`);

// A thin bar with a marker for where this seat falls against the region and the UK.
function Compare({ label, mine, region, uk, max }) {
  const w = (v) => `${Math.max(0, Math.min(100, ((v ?? 0) / max) * 100))}%`;
  const row = (name, v, colour, bold) => (
    <div style={{ display: "grid", gridTemplateColumns: "70px minmax(0, 1fr) 52px", gap: 8, alignItems: "center", marginTop: 4 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: bold ? COLORS.ink : COLORS.inkSoft, fontWeight: bold ? 700 : 400 }}>{name}</span>
      <span style={{ height: 8, borderRadius: 4, background: COLORS.paper, overflow: "hidden" }}>
        <span style={{ display: "block", width: w(v), height: "100%", background: colour, borderRadius: 4, transition: "width 0.4s" }} />
      </span>
      <span style={{ ...numeric, fontSize: 12.5, textAlign: "right", color: COLORS.ink, fontWeight: bold ? 700 : 500 }}>{pct1(v)}</span>
    </div>
  );
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink }}>{label}</div>
      {row("This seat", mine, COLORS.accent, true)}
      {row("Region", region, "#8A8FA8")}
      {row("UK", uk, "#5b6075")}
    </div>
  );
}

// How the chosen seat sits among the others, and who is next door.
function SeatExtras({ cell, cells, uk, region, onSelect }) {
  const ranks = useMemo(() => seatRanks(cells, cell), [cells, cell]);
  const next = useMemo(() => neighbours(cells, cell), [cells, cell]);
  const mp = cell.mp;
  // Ranks read from whichever end the seat is nearer: "3rd closest result" for
  // a marginal, "3rd safest seat" for a very safe one.
  const end = (r, nearLabel, farLabel) => {
    if (!r) return null;
    return r.rank <= r.of / 2 ? { value: ordinal(r.rank), label: nearLabel, of: r.of } : { value: ordinal(r.of - r.rank + 1), label: farLabel, of: r.of };
  };
  const facts = [
    end(ranks.closest, "closest result", "safest seat"),
    end(ranks.turnout, "highest turnout", "lowest turnout"),
    mp?.first != null ? end(ranks.serving, "longest-serving MP", "newest MP") : null,
  ].filter(Boolean);
  return (
    <Panel title="This seat in context" style={{ marginTop: 16 }}>
      {facts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 26px" }}>
          {facts.map((f) => (
            <div key={f.label}>
              <div style={{ ...numeric, fontSize: 26, fontWeight: 600, color: COLORS.ink, lineHeight: 1.05 }}>{f.value}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{f.label}, of {f.of.toLocaleString("en-GB")} seats</div>
            </div>
          ))}
        </div>
      )}
      {mp?.first != null && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 12 }}>
          {mp.name}: MP since {mp.first}
          {mp.elected ? ` · ${mp.elected} election${mp.elected === 1 ? "" : "s"} won` : ""}
          {mp.govPosts ? ` · ${mp.govPosts} government post${mp.govPosts === 1 ? "" : "s"}` : ""}
          {mp.rebelPct != null ? ` · ${pct1(mp.rebelPct)} of votes against their party` : ""}
        </div>
      )}
      <Compare label="The winner's lead in 2024" mine={cell.result?.majorityPct} region={region.avgLead} uk={uk.avgLead} max={Math.max(40, cell.result?.majorityPct ?? 0)} />
      <Compare label="Turnout" mine={cell.result?.turnoutPct} region={region.avgTurnout} uk={uk.avgTurnout} max={100} />
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 8 }}>
        Region averages are for {regionName(cell.region)}, {region.seats} seats.
      </div>
      <WhatThisMeans
        result={describeAgainst({ value: cell.result?.majorityPct, reference: uk.avgLead, format: pct1, what: "The winner's lead", yardstick: "the UK average across all seats" })}
        caveat={cell.result?.majorityPct != null && cell.result.majorityPct < 5 ? "A small lead means the seat could easily change hands." : cell.result?.majorityPct >= 30 ? "A lead this big means the seat almost never changes hands." : ""}
      />
      <WhatThisMeans
        result={describeAgainst({ value: cell.result?.turnoutPct, reference: uk.avgTurnout, format: pct1, what: "Turnout", yardstick: "the UK average" })}
        caveat="Turnout is the share of registered voters who voted."
        style={{ marginTop: 8 }}
      />

      {next.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>Seats next to this one on the map</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {next.map((n) => (
              <button
                key={n.code}
                type="button"
                className="nclick"
                onClick={() => onSelect(n.code)}
                style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: partyColour(n.mp?.colour, COLORS.inkSoft), flexShrink: 0 }} />
                {n.seatName}
              </button>
            ))}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6 }}>Neighbours on the hexagon map are placed by hand, so they are close, not exact.</div>
        </div>
      )}
    </Panel>
  );
}

// What the map shows when no seat is chosen: the whole UK, or the chosen region.
function AreaSummary({ summary, label, onSeat }) {
  const max = Math.max(1, ...summary.parties.map((p) => p.count));
  return (
    <Panel title={label}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 26px", marginBottom: 14 }}>
        {[
          [summary.seats, "seats"],
          [summary.marginal, "marginal (lead under 5%)"],
          [summary.gains, "changed hands in 2024"],
          [summary.women, "women MPs"],
        ].map(([v, l]) => (
          <div key={l}>
            <div style={{ ...numeric, fontSize: 26, fontWeight: 600, color: COLORS.ink, lineHeight: 1.05 }}>{v.toLocaleString("en-GB")}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{l}</div>
          </div>
        ))}
        {summary.avgTurnout != null && (
          <div>
            <div style={{ ...numeric, fontSize: 26, fontWeight: 600, color: COLORS.ink, lineHeight: 1.05 }}>{pct1(summary.avgTurnout)}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>average turnout</div>
          </div>
        )}
      </div>
      {summary.parties.slice(0, 7).map((p) => (
        <div key={p.party} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 160px) minmax(0, 1fr) 36px", gap: 10, alignItems: "center", padding: "3px 0" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.party}</span>
          <span style={{ height: 10, borderRadius: 5, background: COLORS.paper, overflow: "hidden" }}>
            <span style={{ display: "block", width: `${(p.count / max) * 100}%`, height: "100%", background: p.colour, borderRadius: 5, transition: "width 0.4s" }} />
          </span>
          <span style={{ ...numeric, fontSize: 13, fontWeight: 700, textAlign: "right", color: COLORS.ink }}>{p.count}</span>
        </div>
      ))}
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, margin: "14px 0 0" }}>
        Tap any hexagon, or search above, to see that seat's result, petitions, history and MP. {onSeat}
      </p>
    </Panel>
  );
}

function Legend({ mode, cells, focusParty, onFocusParty }) {
  if (mode.key === "party") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 14 }}>
        {partyKey(cells, 9).map((p) => {
          const on = focusParty === p.party;
          return (
            <button
              key={p.party}
              type="button"
              aria-pressed={on}
              onClick={() => onFocusParty(on ? null : p.party)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: 0, cursor: "pointer", opacity: focusParty && !on ? 0.45 : 1, transition: "opacity 0.15s" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: p.colour, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, fontWeight: on ? 700 : 400 }}>{p.party}</span>
              <span style={{ ...numeric, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft }}>{p.count}</span>
            </button>
          );
        })}
      </div>
    );
  }
  const l = mode.legend;
  if (!l) return null;
  if (l.type === "ramp") {
    return (
      <div style={{ marginTop: 14, maxWidth: 380 }}>
        <div style={{ height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${l.from}, ${l.to})` }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
          <span>{l.left}</span>
          <span>{l.right}</span>
        </div>
      </div>
    );
  }
  return <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 14 }}>{l.text}</div>;
}

const chip = (on) => ({
  fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 999, cursor: "pointer",
  border: `1px solid ${on ? COLORS.accent : COLORS.hairline}`, background: on ? COLORS.accent : "transparent", color: on ? "#fff" : COLORS.inkSoft,
  transition: "background-color 0.15s, color 0.15s, border-color 0.15s",
});

export default function ConstituencyHub({ seat, onSelectPolitician }) {
  const [hexes, setHexes] = useState(null);
  const [data, setData] = useState(null);
  const [mps, setMps] = useState(null);
  const [careers, setCareers] = useState(null);
  const [rebels, setRebels] = useState(null);
  const [failed, setFailed] = useState(false);
  const [modeKey, setModeKey] = useState("party");
  const [focusParty, setFocusParty] = useState(null);
  const [focusRegion, setFocusRegion] = useState(null);
  const [hover, setHover] = useState(null);
  const [zoom, setZoom] = useState(() => (typeof window !== "undefined" && window.innerWidth < 640 ? 2 : 0));
  const detailRef = useRef(null);
  const firstSeat = useRef(true);

  useEffect(() => {
    Promise.all([
      import("../data/seatHexes.json").then((m) => m.default.hexes),
      import("../data/constituencies.json").then((m) => m.default),
      fetchAllRows(() => supabase.from("politicians").select("id, name, party, party_colour, constituency, gender, thumbnail_url, parliament_member_id")),
    ])
      .then(([h, d, p]) => {
        setHexes(h);
        setData(d);
        setMps(p);
      })
      .catch(() => setFailed(true));
    import("../data/mpCareers.json").then((m) => setCareers(m.default.mps)).catch(() => setCareers(null));
  }, []);

  const mode = MODES.find((m) => m.key === modeKey) ?? MODES[0];

  // Votes are a big fetch, so they load only when the "Rebel rate" view is first chosen.
  useEffect(() => {
    if (!mode.needsVotes || rebels || !mps) return;
    fetchAllRows(() => supabase.from("voting_records").select("politician_id, voted_with_party_majority"))
      .then((votes) => setRebels(rebelRates(votes, mps)))
      .catch(() => setRebels(new Map()));
  }, [mode, rebels, mps]);

  const cells = useMemo(() => (hexes && data && mps ? buildCells(hexes, data.constituencies, mps, 1, { careers, rebels }) : []), [hexes, data, mps, careers, rebels]);
  const bounds = useMemo(() => boundsOf(cells, 1), [cells]);
  const byCode = useMemo(() => new Map(cells.map((c) => [c.code, c])), [cells]);
  const uk = useMemo(() => summariseRegion(cells, null), [cells]);
  const regionSummary = useMemo(() => summariseRegion(cells, focusRegion), [cells, focusRegion]);

  const record = data && seat ? data.constituencies[seatKey(seat)] ?? null : null;
  const selected = useMemo(() => (record ? cells.find((c) => normSeat(c.seatName) === normSeat(record.name)) ?? null : null), [cells, record]);
  const hoverCell = hover ? byCode.get(hover) ?? null : null;
  const selectedRegion = selected ? summariseRegion(cells, selected.region) : null;

  const dimmed = useCallback(
    (c) => Boolean((focusParty && mode.key === "party" && (c.mp?.party ?? "Unknown") !== focusParty) || (focusRegion && c.region !== focusRegion)),
    [focusParty, focusRegion, mode.key]
  );

  // On a narrow screen the detail sits below the map, so bring it into view
  // when a seat is chosen (but not when the page first opens on a seat).
  useEffect(() => {
    if (firstSeat.current) {
      firstSeat.current = false;
      return;
    }
    if (seat && window.innerWidth < 1100) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [seat]);

  const chooseCode = (code) => {
    const c = byCode.get(code);
    if (c) goSeat(c.seatName);
  };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconHexMap}
        kicker="Your area & your say"
        title="Find your constituency"
        subtitle="Every one of the 650 seats is a hexagon on this map, all the same size so each counts equally. Tap yours, or search for it, to see how it voted, who represents it, how it compares and what people there are petitioning for."
      />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the constituency data" /></div>}
      {!failed && cells.length === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading the map…</div>}

      {cells.length > 0 && (
        <>
          <div style={{ marginTop: 22 }}>
            <SeatSearch seats={data.constituencies} autoFocus={false} />
          </div>

          <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, margin: "20px 0 8px" }}>Colour the map by</div>
          <div role="group" aria-label="Choose a view" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={m.key === modeKey}
                onClick={() => {
                  setModeKey(m.key);
                  setFocusParty(null);
                }}
                style={chip(m.key === modeKey)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, margin: "10px 0 0", maxWidth: 720 }}>
            {mode.blurb}
            {mode.needsVotes && !rebels ? " Loading the votes…" : ""}
          </p>

          <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, margin: "16px 0 8px" }}>Focus on a region</div>
          <div role="group" aria-label="Focus on a region" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button type="button" aria-pressed={focusRegion === null} onClick={() => setFocusRegion(null)} style={{ ...chip(focusRegion === null), padding: "5px 12px", fontSize: 12.5 }}>
              All UK
            </button>
            {Object.entries(REGIONS).map(([code, name]) => (
              <button key={code} type="button" aria-pressed={focusRegion === code} onClick={() => setFocusRegion(focusRegion === code ? null : code)} style={{ ...chip(focusRegion === code), padding: "5px 12px", fontSize: 12.5 }}>
                {name}
              </button>
            ))}
          </div>

          <div className="hub-layout" style={{ marginTop: 18 }}>
            <div className="hub-map">
              <HexMap cells={cells} bounds={bounds} mode={mode} dimmed={dimmed} selected={selected} hoverCell={hoverCell} byCode={byCode} onSelect={chooseCode} onHover={setHover} zoom={zoom} setZoom={setZoom} />
              <Legend mode={mode} cells={cells} focusParty={focusParty} onFocusParty={setFocusParty} />
              <div style={{ marginTop: 14 }}>
                <ShareButton filename={`seat-map-${mode.key}`} label="Share this map as an image" getSpec={() => mapShareSpec({ cells, mode, key: partyKey(cells, 6), link: window.location.href })} />
              </div>
            </div>

            <div ref={detailRef} style={{ minWidth: 0, scrollMarginTop: 12 }}>
              {record ? (
                <>
                  <button
                    type="button"
                    onClick={() => goSeat(null)}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 14 }}
                  >
                    ← Back to the whole UK
                  </button>
                  <SeatDetail
                    key={seatKey(record.name)}
                    record={record}
                    seats={data.constituencies}
                    generatedAt={data.generatedAt}
                    onSelectPolitician={onSelectPolitician}
                    extras={selected && selectedRegion ? <SeatExtras cell={selected} cells={cells} uk={uk} region={selectedRegion} onSelect={chooseCode} /> : null}
                  />
                </>
              ) : (
                <>
                  {seat && (
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: "#9C3B3B", marginBottom: 14 }}>
                      We couldn't find a constituency called “{seat}”. It may be vacant, or spelled differently. Try searching, or tap the map.
                    </div>
                  )}
                  <AreaSummary summary={regionSummary} label={focusRegion ? regionName(focusRegion) : "The whole UK"} onSeat="Hover over the map for a quick look." />
                </>
              )}
            </div>
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 22, maxWidth: 760 }}>
            Seats are placed by hand to stay close to where they really are, so the shape is a rough outline of the UK, not a true map, and distances aren't to scale. Layout from Open
            Innovations' hexagon maps (MIT licence). Results are the 2024 general election; MPs and parties are today's.
          </p>
        </>
      )}
    </div>
  );
}
