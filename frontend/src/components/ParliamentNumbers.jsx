import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, FONT_MONO, PAGE_PADDING } from "../theme";
import { partyColour } from "../lib/format";
import { computeParliamentStats } from "../lib/parliamentStats";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconChartBars } from "./icons";

const fmt = (n) => n.toLocaleString("en-GB");
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const joinNames = (n) => (n.length <= 2 ? n.join(" and ") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);
const years1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}`;

function Stat({ value, label, note }) {
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, lineHeight: 1.1, color: COLORS.ink }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 6 }}>{label}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}

function Section({ title, intro, children }) {
  return (
    <section style={{ marginTop: 34 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, margin: "0 0 4px" }}>{title}</h2>
      {intro && <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, margin: "0 0 16px", maxWidth: 680 }}>{intro}</p>}
      {children}
    </section>
  );
}

// One row of a horizontal bar chart: a label, a thin bar with a rounded
// data end, and the value written beside it. `tick` draws a dashed marker
// at that fraction of the track (the majority line on the seats chart).
function BarRow({ label, color, fraction, valueText, detail, tick }) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${valueText}${detail ? `, ${detail}` : ""}`}
      title={`${label}: ${valueText}${detail ? ` (${detail})` : ""}`}
      style={{ display: "grid", gridTemplateColumns: "minmax(110px, 170px) 1fr minmax(72px, auto)", alignItems: "center", gap: 12, padding: "5px 0" }}
    >
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ position: "relative", height: 10, background: COLORS.paperCard, borderRadius: 4 }}>
        <div style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, minWidth: fraction > 0 ? 3 : 0, height: "100%", background: color, borderRadius: "0 4px 4px 0" }} />
        {tick != null && <div style={{ position: "absolute", left: `${tick * 100}%`, top: -4, bottom: -4, borderLeft: `1.5px dashed ${COLORS.inkSoft}`, opacity: 0.7 }} />}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.ink, textAlign: "right", whiteSpace: "nowrap" }}>
        {valueText}
        {detail && <span style={{ color: COLORS.inkSoft }}> · {detail}</span>}
      </div>
    </div>
  );
}

function SeatsTable({ stats }) {
  const cell = { padding: "7px 10px", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, borderBottom: `1px solid ${COLORS.hairline}`, textAlign: "right" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
        <thead>
          <tr>
            {["Party", "MPs", "Share of seats", "Women", "Share women"].map((h, i) => (
              <th key={h} style={{ ...cell, textAlign: i === 0 ? "left" : "right", fontWeight: 700, color: COLORS.inkSoft, fontSize: 11.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.seatsByParty.map((r) => (
            <tr key={r.party}>
              <td style={{ ...cell, textAlign: "left" }}>{r.party}</td>
              <td style={cell}>{fmt(r.count)}</td>
              <td style={cell}>{pct1(r.pct)}</td>
              <td style={cell}>{fmt(r.women)}</td>
              <td style={cell}>{pct1(r.womenPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ParliamentNumbers({ onNavigate }) {
  const [rows, setRows] = useState(null);
  const [byElections, setByElections] = useState([]);
  const [failed, setFailed] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    supabase
      .from("politicians")
      .select("name, party, party_colour, gender, membership_start_date")
      .then(({ data, error }) => {
        setFailed(Boolean(error));
        setRows(data ?? []);
      });
    supabase.from("by_elections").select("status, result").then(({ data }) => setByElections(data ?? []));
  }, []);

  const stats = useMemo(() => (rows ? computeParliamentStats(rows, byElections) : null), [rows, byElections]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconChartBars}
        kicker="Public Record · Parliament in Numbers"
        title="The House of Commons, by the numbers"
        subtitle="Who sits in the Commons right now — seats by party, how many are women, how long MPs have served, and how many seats have changed hands since the 2024 general election. All worked out from the live list of current MPs."
      />

      {rows === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}
      {rows !== null && failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the list of MPs" /></div>}

      {stats && !failed && stats.total > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginTop: 24 }}>
            <Stat value={fmt(stats.total)} label="MPs" note={`${stats.majorityLine} are needed for a majority`} />
            <Stat value={pct1(stats.womenPct)} label="are women" note={`${fmt(stats.women)} of ${fmt(stats.total)}`} />
            <Stat value={fmt(stats.newMps)} label="new since the 2024 election" note="Including by-election winners" />
            <Stat value={`${years1(stats.medianTenure)} years`} label="median time as an MP" note={`Average ${years1(stats.averageTenure)} years`} />
          </div>

          <Section
            title="Seats by party"
            intro={`The dashed line marks ${stats.majorityLine} seats, a majority of the ${fmt(stats.total)}. A party past that line can win Commons votes without anyone else's support, as long as its MPs vote together.`}
          >
            <div>
              {stats.seatsByParty.map((r) => (
                <BarRow
                  key={r.party}
                  label={r.party}
                  color={partyColour(r.colour, COLORS.inkSoft)}
                  fraction={r.count / stats.total}
                  valueText={fmt(r.count)}
                  detail={r.coop ? `${pct1(r.pct)} (incl. ${fmt(r.coop)} Co-op)` : pct1(r.pct)}
                  tick={stats.majorityLine / stats.total}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              style={{ marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}
            >
              {showTable ? "Hide the table" : "View as a table"}
            </button>
            {showTable && <div style={{ marginTop: 10 }}><SeatsTable stats={stats} /></div>}
          </Section>

          <Section
            title="Women MPs, by party"
            intro="Share of each party's MPs who are women. Only parties with five or more MPs are shown, since a percentage of two or three people says very little."
          >
            {stats.womenByParty.map((r) => (
              <BarRow key={r.party} label={r.party} color={COLORS.accent} fraction={r.womenPct / 100} valueText={pct1(r.womenPct)} detail={`${fmt(r.women)} of ${fmt(r.count)}`} />
            ))}
          </Section>

          <Section
            title="How long MPs have served"
            intro={
              stats.longest
                ? `Time since each MP's current run in the Commons began. The longest-serving ${stats.longest.names.length > 1 ? "are" : "is"} ${joinNames(stats.longest.names)}${stats.longest.names.length > 1 ? ", first elected on the same day," : ""} at ${Math.floor(stats.longest.years)} years.`
                : "Time since each MP's current run in the Commons began."
            }
          >
            {stats.tenureBands.map((b) => (
              <BarRow key={b.key} label={b.label} color={COLORS.accent} fraction={b.count / Math.max(1, ...stats.tenureBands.map((x) => x.count))} valueText={fmt(b.count)} detail={pct1((b.count / stats.total) * 100)} />
            ))}
          </Section>

          <Section title="Seats that changed hands" intro="Elections held since the general election, to fill seats that fell vacant.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "stretch" }}>
              <div style={{ flex: "1 1 220px" }}>
                <Stat value={fmt(stats.byElections.total)} label={`by-election${stats.byElections.total === 1 ? "" : "s"} held`} />
              </div>
              <div style={{ flex: "1 1 220px" }}>
                <Stat value={fmt(stats.byElections.gains)} label="changed hands" note={`${fmt(stats.byElections.holds)} held by the same party`} />
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("byElections")}
                style={{ marginTop: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}
              >
                See each by-election →
              </button>
            )}
          </Section>

          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 30 }}>
            Source: Parliament's Members API (current Commons members) and the by-elections record on this site. The Speaker is
            counted as an MP but listed under their own heading rather than a party. Figures change whenever an MP is elected, resigns or changes party.
          </p>
        </>
      )}
    </div>
  );
}
