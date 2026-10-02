import { useState, useEffect, useMemo } from "react";
import { useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { partyColour } from "../lib/format";
import { computeParliamentStats } from "../lib/parliamentStats";
import { PageHeader, LoadFailedNote } from "./shared";
import { PartyHemicycle } from "./PartyHemicycle";
import { IconChartBars } from "./icons";
import BarRow from "./BarRow";
import CountUp from "./CountUp";
import DownloadCsvButton from "./DownloadCsvButton";
import { SEATS_COLUMNS } from "../lib/exportColumns";

const fmt = (n) => n.toLocaleString("en-GB");
const pct1 = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const joinNames = (n) => (n.length <= 2 ? n.join(" and ") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);

const goSeat = (name) => {
  window.location.hash = `#/constituency/${encodeURIComponent(name)}`;
};

// Fades a section up the first time it scrolls into view.
function Reveal({ children, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Section({ title, intro, children, delay }) {
  return (
    <Reveal delay={delay}>
      <section style={{ marginTop: 56 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: COLORS.ink, margin: "0 0 6px", letterSpacing: "-0.01em" }}>{title}</h2>
        {intro && <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.65, margin: "0 0 22px", maxWidth: 640 }}>{intro}</p>}
        {children}
      </section>
    </Reveal>
  );
}

// A headline figure: the number is the design, so it's set large in the
// numeric typeface with only a short label under it.
function Figure({ value, format, label, note }) {
  return (
    <div style={{ flex: "1 1 170px", minWidth: 150, padding: "4px 0" }}>
      <div style={{ ...numeric, fontSize: "clamp(38px, 6vw, 54px)", fontWeight: 600, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.02em" }}>
        <CountUp value={value} format={format} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, marginTop: 8 }}>{label}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}

// 650 dots, one per MP: women first, in the accent colour, then everyone
// else. A waffle chart makes a proportion something you can count with your
// eyes, which a bare percentage isn't.
function WomenWaffle({ women, total }) {
  const columns = 26;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const dots = Array.from({ length: total }, (_, i) => i);
  return (
    <div ref={ref} role="img" aria-label={`${women} of ${total} MPs are women`} style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 4, maxWidth: 430 }}>
      {dots.map((i) => (
        <span
          key={i}
          className={inView ? "waffle-dot" : undefined}
          style={{ aspectRatio: "1", borderRadius: "50%", background: i < women ? COLORS.accent : COLORS.hairline, opacity: inView ? undefined : 0, animationDelay: `${Math.floor(i / columns) * 22}ms` }}
        />
      ))}
    </div>
  );
}

// Columns that rise into place; the tallest sets the scale.
function TenureColumns({ bands, total }) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...bands.map((b) => b.count));
  const HEIGHT = 150;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${bands.length}, minmax(0, 1fr))`, gap: "0 14px", alignItems: "end" }}>
      {bands.map((b, i) => (
        <div key={b.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", minWidth: 0 }}>
          <div style={{ ...numeric, fontSize: 20, fontWeight: 600, color: COLORS.ink }}>{fmt(b.count)}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 6 }}>{pct1((b.count / total) * 100)}</div>
          <div style={{ height: HEIGHT, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <motion.div
              initial={reduce ? false : { height: 0 }}
              whileInView={{ height: `${(b.count / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", minHeight: b.count ? 3 : 0, background: COLORS.accent, opacity: 0.45 + i * 0.14, borderRadius: "6px 6px 0 0" }}
            />
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.ink, marginTop: 8, textAlign: "center", lineHeight: 1.3 }}>{b.label}</div>
        </div>
      ))}
    </div>
  );
}

// How big was the winner's lead, seat by seat? One bar per five-point step,
// shaded darker the safer the seats in it. Reading left to right is
// reading from "could have gone either way" to "never in doubt".
function SafetyHistogram({ summary }) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...summary.histogram.map((h) => h.count));
  const HEIGHT = 170;
  const band = (from) => (from < 5 ? 0 : from < 20 ? 1 : 2);
  const counts = [0, 0, 0];
  summary.histogram.forEach((h) => {
    counts[band(h.from)] += h.count;
  });
  const labels = ["Marginal", "Fairly safe", "Safe"];
  const shade = [0.4, 0.7, 1];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: HEIGHT }}>
        {summary.histogram.map((h, i) => (
          <div
            key={h.from}
            style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", alignItems: "center" }}
            title={`${h.to == null ? `${h.from}% or more` : `${h.from}–${h.to}%`}: ${h.count} seats`}
          >
            <div style={{ ...numeric, fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 3 }}>{h.count}</div>
            <motion.div
              initial={reduce ? false : { height: 0 }}
              whileInView={{ height: `${(h.count / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", minHeight: h.count ? 3 : 0, background: COLORS.accent, opacity: shade[band(h.from)], borderRadius: "5px 5px 0 0" }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {summary.histogram.map((h) => (
          <div key={h.from} style={{ flex: 1, textAlign: "center", fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.inkSoft }}>
            {h.from}
            {h.to == null ? "+" : ""}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>Winner's majority, as a % of votes cast</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px", marginTop: 18 }}>
        {labels.map((l, i) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS.accent, opacity: shade[i] }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>
              {l} <strong style={{ ...numeric, fontWeight: 700 }}>{fmt(counts[i])}</strong> <span style={{ color: COLORS.inkSoft }}>seats</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeatList({ title, seats }) {
  return (
    <div style={{ flex: "1 1 300px", minWidth: 0 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 6 }}>{title}</div>
      {seats.map((s, i) => (
        <button
          key={s.name}
          type="button"
          onClick={() => goSeat(s.name)}
          style={{ display: "grid", gridTemplateColumns: "22px minmax(0, 1fr) auto", gap: 10, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, padding: "9px 0", cursor: "pointer" }}
        >
          <span style={{ ...numeric, fontSize: 13, color: COLORS.inkSoft }}>{i + 1}</span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: partyColour(s.colour, COLORS.inkSoft), flexShrink: 0 }} />
              {s.mp}
            </span>
          </span>
          <span style={{ textAlign: "right" }}>
            <span style={{ ...numeric, display: "block", fontSize: 17, fontWeight: 700, color: COLORS.ink }}>{fmt(s.majority)}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{s.majorityPct < 0.1 ? "<0.1" : (Math.round(s.majorityPct * 10) / 10).toFixed(1)}% lead</span>
          </span>
        </button>
      ))}
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
              <th key={h} style={{ ...cell, textAlign: i === 0 ? "left" : "right", fontWeight: 700, color: COLORS.inkSoft, fontSize: 11.5 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.seatsByParty.map((r) => (
            <tr key={r.party}>
              <td style={{ ...cell, textAlign: "left" }}>{r.party}</td>
              <td style={{ ...cell, ...numeric }}>{fmt(r.count)}</td>
              <td style={{ ...cell, ...numeric }}>{pct1(r.pct)}</td>
              <td style={{ ...cell, ...numeric }}>{fmt(r.women)}</td>
              <td style={{ ...cell, ...numeric }}>{pct1(r.womenPct)}</td>
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
  const [summary, setSummary] = useState(null);
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
    import("../data/constituencySummary.json").then((m) => setSummary(m.default)).catch(() => setSummary(null));
  }, []);

  const stats = useMemo(() => (rows ? computeParliamentStats(rows, byElections) : null), [rows, byElections]);
  const labour = stats?.seatsByParty.find((r) => r.party === "Labour");

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconChartBars}
        kicker="Public Record · Parliament in Numbers"
        title="The House of Commons, by the numbers"
        subtitle="Who sits in the Commons right now, how long they've been there, and how safe their seats are. All worked out from live parliamentary records."
      />

      {rows === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>}
      {rows !== null && failed && (
        <div style={{ marginTop: 24 }}>
          <LoadFailedNote item="the list of MPs" />
        </div>
      )}

      {stats && !failed && stats.total > 0 && (
        <>
          {/* Hero: the chamber itself. */}
          <div
            style={{
              marginTop: 28, padding: "clamp(18px, 4vw, 34px)", borderRadius: 24, border: `1px solid ${COLORS.hairline}`,
              background: `radial-gradient(120% 90% at 0% 0%, ${COLORS.accent}1f, transparent 60%), ${COLORS.paperCard}`,
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "26px 36px", alignItems: "center",
            }}
          >
            <div>
              <div style={{ ...numeric, fontSize: "clamp(72px, 15vw, 128px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.04em", color: COLORS.ink }}>
                <CountUp value={stats.total} duration={1.4} />
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginTop: 10 }}>Members of Parliament</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "10px 0 0", maxWidth: 380 }}>
                One for each constituency. {labour ? `Labour holds ${fmt(labour.count)} of them (${pct1(labour.pct)}); ` : ""}
                {stats.majorityLine} are enough to win any vote outright.
              </p>
            </div>
            <div>
              <PartyHemicycle politicians={rows} legendCount={6} />
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "22px 30px", marginTop: 34, paddingTop: 26, borderTop: `1px solid ${COLORS.hairline}` }}>
            <Figure value={stats.womenPct} format={(n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`} label="are women" note={`${fmt(stats.women)} of ${fmt(stats.total)} MPs`} />
            <Figure value={stats.newMps} format={(n) => fmt(Math.round(n))} label="new since July 2024" note="Including by-election winners" />
            <Figure value={stats.medianTenure} format={(n) => `${(Math.round(n * 10) / 10).toFixed(1)} yrs`} label="median time as an MP" note={`Average ${(Math.round(stats.averageTenure * 10) / 10).toFixed(1)} years`} />
            {summary && <Figure value={summary.turnout.median} format={(n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`} label="median turnout" note="At the last election, across all seats" />}
          </div>

          <Section
            title="Seats by party"
            intro={`The dashed line marks ${stats.majorityLine} seats, a majority of the ${fmt(stats.total)}. A party past that line can win Commons votes without anyone else's support, as long as its MPs vote together.`}
          >
            <div>
              {stats.seatsByParty.map((r, i) => (
                <BarRow
                  key={r.party}
                  label={r.party}
                  color={partyColour(r.colour, COLORS.inkSoft)}
                  fraction={r.count / stats.total}
                  valueText={fmt(r.count)}
                  detail={r.coop ? `${pct1(r.pct)} (incl. ${fmt(r.coop)} Co-op)` : pct1(r.pct)}
                  tick={stats.majorityLine / stats.total}
                  delay={Math.min(i, 8) * 0.04}
                />
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", marginTop: 10 }}>
              <button type="button" onClick={() => setShowTable((v) => !v)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                {showTable ? "Hide the table" : "View as a table"}
              </button>
              <DownloadCsvButton label="Download seats by party (CSV)" slug="seats-by-party" columns={SEATS_COLUMNS} rows={stats.seatsByParty} />
            </div>
            {showTable && (
              <div style={{ marginTop: 10 }}>
                <SeatsTable stats={stats} />
              </div>
            )}
          </Section>

          <Section title="Women in the Commons" intro="Each dot is one MP. The coloured ones are women.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px 44px", alignItems: "start" }}>
              <div>
                <WomenWaffle women={stats.women} total={stats.total} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginTop: 14, fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>
                  <span>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: COLORS.accent, marginRight: 7 }} />
                    <strong style={{ ...numeric, color: COLORS.ink }}>{fmt(stats.women)}</strong> women
                  </span>
                  <span>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: COLORS.hairline, marginRight: 7 }} />
                    <strong style={{ ...numeric, color: COLORS.ink }}>{fmt(stats.total - stats.women)}</strong> men
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 4 }}>Share of each party who are women</div>
                {stats.womenByParty.map((r, i) => (
                  <BarRow key={r.party} label={r.party} color={COLORS.accent} fraction={r.womenPct / 100} valueText={pct1(r.womenPct)} detail={`${fmt(r.women)} of ${fmt(r.count)}`} labelWidth={150} delay={Math.min(i, 8) * 0.04} />
                ))}
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
                  Only parties with five or more MPs, since a percentage of two or three people says very little.
                </div>
              </div>
            </div>
          </Section>

          <Section
            title="How long MPs have served"
            intro={
              stats.longest
                ? `Time since each MP's current run in the Commons began. The longest-serving ${stats.longest.names.length > 1 ? "are" : "is"} ${joinNames(stats.longest.names)}${stats.longest.names.length > 1 ? ", first elected on the same day," : ""} at ${Math.floor(stats.longest.years)} years.`
                : "Time since each MP's current run in the Commons began."
            }
          >
            <TenureColumns bands={stats.tenureBands} total={stats.total} />
          </Section>

          {summary && (
            <Section
              title="How safe are the seats?"
              intro={`The winner's lead in each of ${fmt(summary.total)} seats at the last election, as a share of votes cast. A seat with a small lead could change hands at the next election; a safe one almost never does.`}
            >
              <SafetyHistogram summary={summary} />

              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 30px", marginTop: 30, paddingTop: 22, borderTop: `1px solid ${COLORS.hairline}` }}>
                <Figure value={summary.wonWithUnderHalf} format={(n) => fmt(Math.round(n))} label="MPs won with under half the vote" note={`Of ${fmt(summary.ofWhichWithShare)} seats. Most MPs are elected by a minority of those who voted.`} />
                <Figure value={summary.changedHandsAtGeneralElection} format={(n) => fmt(Math.round(n))} label="seats changed party in 2024" note="Compared with the result on the new boundaries at the previous election" />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "26px 40px", marginTop: 30 }}>
                <SeatList title="Closest results" seats={summary.narrowest} />
                <SeatList title="Biggest majorities" seats={summary.biggest} />
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 10 }}>Tap any seat to see its full result.</div>
            </Section>
          )}

          <Section title="Seats that changed hands" intro="Elections held since the general election, to fill seats that fell vacant.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 40px" }}>
              <Figure value={stats.byElections.total} format={(n) => fmt(Math.round(n))} label={`by-election${stats.byElections.total === 1 ? "" : "s"} held`} />
              <Figure value={stats.byElections.gains} format={(n) => fmt(Math.round(n))} label="changed hands" note={`${fmt(stats.byElections.holds)} held by the same party`} />
            </div>
            {onNavigate && (
              <button type="button" onClick={() => onNavigate("byElections")} style={{ marginTop: 12, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                See each by-election →
              </button>
            )}
          </Section>

          <Reveal>
            <div style={{ marginTop: 56, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "18px 22px" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, marginBottom: 6 }}>What isn't here, and why</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: 0, maxWidth: 680 }}>
                Parliament's official records for MPs include name, party, gender and constituency, but not ethnicity, age or occupation, so this page can't show them
                without guessing, and guessing about people's identities isn't something a transparency site should do. The House of Commons Library publishes research
                on the make-up of the Commons, drawing on its own surveys:{" "}
                <a href="https://commonslibrary.parliament.uk/" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, fontWeight: 600 }}>
                  commonslibrary.parliament.uk ↗
                </a>
              </p>
            </div>
          </Reveal>

          <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, lineHeight: 1.55, marginTop: 24 }}>
            Sources: Parliament's Members API (current Commons members and 2024 election results) and the by-elections record on this site. The Speaker is counted as an
            MP but listed under their own heading rather than a party. Figures change whenever an MP is elected, resigns or changes party.
          </p>
        </>
      )}
    </div>
  );
}
