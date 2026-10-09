import { useState, useEffect, useMemo } from "react";
import WhatThisMeans from "./WhatThisMeans";
import { lordsMeaning, womenMeaning } from "../lib/numbersMeaning";
import ShareButton from "./ShareButton";
import { chamberShareSpec } from "../lib/shareSpecs";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, numeric } from "../theme";
import { partyColour, formatDate } from "../lib/format";
import { computeLordsStats, PEER_FIELDS as F } from "../lib/lordsStats";
import { fmt, pct1, pct0, joinNames, byName, YEAR_MS } from "../lib/numbersFormat";
import { LoadFailedNote } from "./shared";
import { PartyHemicycle } from "./PartyHemicycle";
import BarRow from "./BarRow";
import CountUp from "./CountUp";
import MembersModal from "./MembersModal";
import DownloadCsvButton from "./DownloadCsvButton";
import { SEATS_COLUMNS } from "../lib/exportColumns";
import { Tile, Figure, SeatsChart, SeatsTable, WomenWaffle, CohortChart, Switches } from "./NumbersKit";

// The House of Lords half of Parliament in Numbers. Same layout and the same
// tap-to-see-who as the Commons half. The Lords has no election, so the
// stories here are about appointment: who gets in, when, and from where.

const PEERAGE_NOTES = {
  "Life peer": "Appointed for life by the King on the Prime Minister's advice.",
  "Life Peer (judicial)": "A senior judge given a life peerage.",
  Bishop: "A Church of England bishop who sits by right (the Lords Spiritual).",
};
const goPeer = (id) => {
  window.location.hash = `#/lords/${id}`;
};

export default function LordsNumbers({ onNavigate }) {
  const [rows, setRows] = useState(null);
  const [careers, setCareers] = useState(null);
  const [failed, setFailed] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    supabase
      .from("peers")
      .select("id, name, party, party_colour, gender, membership_start_date, peerage_type, government_role, thumbnail_url")
      .then(({ data, error }) => {
        setFailed(Boolean(error));
        setRows(data ?? []);
      });
    import("../data/lordsCareers.json").then((m) => setCareers(m.default)).catch(() => setCareers(null));
  }, []);

  const stats = useMemo(() => (rows ? computeLordsStats(rows, careers?.peers ?? null) : null), [rows, careers]);
  const career = stats?.career ?? null;

  const members = useMemo(
    () =>
      (rows ?? []).map((p) => ({
        id: p.id,
        mid: p.id,
        name: p.name,
        party: p.party ?? "Unknown",
        colour: p.party_colour,
        constituency: p.peerage_type ?? null,
        thumbnail: p.thumbnail_url,
        gender: p.gender,
        start: p.membership_start_date,
        type: p.peerage_type,
        role: p.government_role,
        c: careers?.peers?.[p.id] ?? null,
      })),
    [rows, careers]
  );

  function see(e, title, note, pick, { sort = byName, badge } = {}) {
    setPanel({ title, note, list: members.filter(pick).sort(sort), badge, opener: e?.currentTarget ?? null });
  }
  const goMember = (id) => goPeer(id);
  const ids = (list) => new Set(list);
  const yearsSince = (m) => Math.floor((Date.now() - new Date(m.start).getTime()) / YEAR_MS);
  const byPost = (a, b) => b.c[F.gov] - a.c[F.gov] || byName(a, b);

  const longest = useMemo(() => [...members].filter((m) => m.start).sort((a, b) => String(a.start).localeCompare(String(b.start))).slice(0, 5), [members]);

  if (rows === null) return <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading…</div>;
  if (failed) return <div style={{ marginTop: 24 }}><LoadFailedNote item="the list of peers" /></div>;
  if (!stats || stats.total === 0) return null;

  const biggest = stats.largest;
  const crossbench = stats.seatsByParty.find((r) => r.party === "Crossbench");

  return (
    <div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: 0 }}>
        <strong style={{ color: COLORS.accent }}>Tap any bar, party or figure marked “See who”</strong> to list the peers behind it. Each name opens that peer's page.
      </p>
      <div style={{ marginTop: 12 }}>
        <ShareButton filename="house-of-lords-by-the-numbers" label="Share the chamber as an image" getSpec={() => chamberShareSpec({ house: "lords", stats, link: window.location.href })} />
      </div>

      <div className="bento" style={{ marginTop: 26 }}>
        <div className="bento-grid">
          <Tile
            span="s8"
            edge="people"
            title="The chamber"
            note={`No party has a majority here. The largest, ${biggest.party}, holds ${fmt(biggest.count)} of ${fmt(stats.total)} seats (${pct1(biggest.pct)}). A majority would be ${fmt(stats.majorityLine)}.${crossbench ? ` ${fmt(crossbench.count)} crossbench peers belong to no party.` : ""}`}
          >
            <PartyHemicycle
              politicians={rows}
              legendCount={6}
              noPartyLabel="Crossbench"
              onSelectParty={(name, e) => see(e, name, "Every peer currently sitting with this group.", (m) => (m.party === "Unknown" ? "Crossbench" : m.party) === name)}
              centre={
                <div>
                  <div style={{ ...numeric, fontSize: "clamp(17px, 4cqw, 34px)", fontWeight: 700, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.03em" }}>
                    <CountUp value={stats.total} duration={1.3} />
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2 }}>peers</div>
                </div>
              }
            />
            <WhatThisMeans result={lordsMeaning({ top: biggest, total: stats.total, majorityLine: stats.majorityLine, crossbench: crossbench?.count })} />
          </Tile>

          <Tile span="s4" edge="people" title="At a glance" delay={0.05}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Figure value={stats.womenPct} format={(n) => pct1(n)} label="are women" note={`${fmt(stats.women)} of ${fmt(stats.total)}`} onOpen={(e) => see(e, "Women in the Lords", "Every woman currently sitting as a peer.", (m) => m.gender === "F")} />
              <Figure
                value={stats.newSinceElection}
                format={(n) => fmt(Math.round(n))}
                label="joined since July 2024"
                note="Appointed since the last general election"
                onOpen={(e) => see(e, "Peers who joined since July 2024", "Appointed after the 2024 general election.", (m) => m.start && m.start >= "2024-07-04", { sort: (a, b) => String(b.start).localeCompare(String(a.start)), badge: (m) => formatDate(m.start) })}
              />
              <Figure
                value={stats.medianTenure}
                format={(n) => `${(Math.round(n * 10) / 10).toFixed(1)} yrs`}
                label="typical time as a peer"
                note={`The median: half have sat less. The average is ${(Math.round(stats.averageTenure * 10) / 10).toFixed(1)} years.`}
                onOpen={(e) => see(e, "Every peer, longest-serving first", "Time since joining the House of Lords.", (m) => m.start, { sort: (a, b) => String(a.start).localeCompare(String(b.start)), badge: (m) => `${yearsSince(m)} yrs` })}
              />
            </div>
          </Tile>

          <Tile span="s7" edge="seats" title="Seats by group" note="Every bar is on the same scale. Peers sit by party, as crossbenchers, as non-affiliated or as bishops.">
            <SeatsChart
              stats={stats}
              onOpen={(r, e) => see(e, r.key === "others" ? "The smaller groups" : r.label, r.key === "others" ? "Groups with only one or two peers." : "Every peer currently sitting with this group.", (m) => r.parties.includes(m.party))}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", marginTop: 12 }}>
              <button type="button" onClick={() => setShowTable((v) => !v)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                {showTable ? "Hide the table" : "View every group as a table"}
              </button>
              <DownloadCsvButton label="Download (CSV)" slug="lords-seats-by-group" columns={SEATS_COLUMNS} rows={stats.seatsByParty} />
            </div>
            {showTable && <div style={{ marginTop: 10 }}><SeatsTable stats={stats} /></div>}
          </Tile>

          <Tile span="s5" edge="people" title="How they got their seat" delay={0.05} note="Nobody is elected to the Lords. Almost every peer is appointed, and bishops sit by right.">
            {stats.types.map((t, i) => (
              <div key={t.type}>
                <BarRow
                  label={t.type}
                  color={COLORS.accent}
                  fraction={t.count / stats.total}
                  valueText={fmt(t.count)}
                  detail={pct0((t.count / stats.total) * 100)}
                  labelWidth={140}
                  valueWidth={90}
                  delay={i * 0.05}
                  onClick={(e) => see(e, t.type === "Bishop" ? "Bishops" : `${t.type}s`, PEERAGE_NOTES[t.type] ?? "", (m) => (m.type ?? "Other") === t.type)}
                />
                {PEERAGE_NOTES[t.type] && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, margin: "0 0 6px" }}>{PEERAGE_NOTES[t.type]}</div>}
              </div>
            ))}
          </Tile>

          <Tile span="s5" edge="people" title="Women in the Lords" note="Each dot is one peer. The coloured ones are women.">
            <WomenWaffle women={stats.women} total={stats.total} />
            <WhatThisMeans result={womenMeaning({ womenPct: stats.womenPct, noun: "peers" })} style={{ marginTop: 14 }} />
            <div style={{ marginTop: 16 }}>
              {stats.womenByParty.slice(0, 5).map((r, i) => (
                <BarRow
                  key={r.party}
                  label={r.party}
                  color={COLORS.accent}
                  fraction={r.womenPct / 100}
                  valueText={pct0(r.womenPct)}
                  detail={`${r.women}/${r.count}`}
                  labelWidth={130}
                  valueWidth={96}
                  delay={i * 0.04}
                  onClick={(e) => see(e, `Women peers: ${r.party}`, "The women currently sitting with this group.", (m) => m.gender === "F" && m.party === r.party)}
                />
              ))}
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Share of each group who are women (groups of ten or more peers).</div>
            </div>
          </Tile>

          <Tile span="s7" edge="careers" title="When peers arrived" delay={0.05} note="Peers are appointed whenever a prime minister or party leader nominates them, so arrivals bunch around changes of government. Tap a year to see who joined.">
            <CohortChart
              cohorts={stats.arrivals}
              note="Coloured by the group each peer sits with today, not the one they joined for."
              onOpen={(c, e) => see(e, c.key === "before" ? `Joined ${c.label.toLowerCase()}` : `Joined in ${c.key}`, "By the year they joined the House of Lords.", (m) => {
                const y = m.start ? Number(m.start.slice(0, 4)) : null;
                if (!y) return false;
                return c.key === "before" ? y < Number(c.label.replace("Before ", "")) : y === c.key;
              }, { sort: (a, b) => String(a.start).localeCompare(String(b.start)), badge: (m) => formatDate(m.start) })}
            />
          </Tile>

          {career && (
            <>
              <Tile span="s5" edge="careers" title="Came from the Commons">
                <Figure
                  value={career.formerMps.pct}
                  format={(n) => pct0(n)}
                  label="used to be MPs"
                  note={`${fmt(career.formerMps.count)} of ${fmt(career.total)} peers`}
                  size={42}
                  onOpen={(e) => see(e, "Peers who used to be MPs", "Sat in the House of Commons before the Lords.", (m) => m.c && m.c[F.mpFrom] != null, { badge: (m) => `MP ${m.c[F.mpFrom]}–${m.c[F.mpTo] ?? "now"}` })}
                />
                <div style={{ marginTop: 14 }}>
                  {career.formerMps.byParty.slice(0, 5).map((r, i) => (
                    <BarRow
                      key={r.party}
                      label={r.party}
                      color={partyColour(r.colour, COLORS.inkSoft)}
                      fraction={r.pct / 100}
                      valueText={pct0(r.pct)}
                      detail={`${r.count}/${r.total}`}
                      labelWidth={130}
                      valueWidth={96}
                      delay={i * 0.04}
                      onClick={(e) => see(e, `${r.party} peers who were MPs`, "Sat in the House of Commons before the Lords.", (m) => m.party === r.party && m.c && m.c[F.mpFrom] != null, { badge: (m) => `MP ${m.c[F.mpFrom]}–${m.c[F.mpTo] ?? "now"}` })}
                    />
                  ))}
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Share of each group's peers who were MPs first.</div>
                </div>
              </Tile>

              <Tile span="s7" edge="careers" title="Who has held office" delay={0.05} note="Several ministers sit in the Lords, not the Commons. Counts include any past Parliament.">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 30px" }}>
                  <Figure value={career.formerMinisters.count} format={(n) => fmt(Math.round(n))} label="have been ministers" note={`${pct0(career.formerMinisters.pct)} of peers`} size={32} onOpen={(e) => see(e, "Peers who have been ministers", "Have held a government post, now or before.", (m) => m.c && m.c[F.gov] > 0, { sort: byPost, badge: (m) => `${m.c[F.gov]} post${m.c[F.gov] === 1 ? "" : "s"}` })} />
                  <Figure value={career.inGovernmentNow} format={(n) => fmt(Math.round(n))} label="are in government now" size={32} onOpen={(e) => see(e, "Peers in government now", "Currently holding a government post.", (m) => m.c && m.c[F.govNow] === 1, { badge: (m) => m.role ?? "" })} />
                  <Figure value={career.shadowEver} format={(n) => fmt(Math.round(n))} label="have been shadow ministers" size={32} onOpen={(e) => see(e, "Peers who have been shadow ministers", "Have held an opposition front-bench post.", (m) => m.c && m.c[F.opp] > 0)} />
                  <Figure value={career.onCommitteeNow} format={(n) => fmt(Math.round(n))} label="sit on a committee now" size={32} onOpen={(e) => see(e, "Peers on a Lords committee", "Currently serving on at least one Lords committee.", (m) => m.c && m.c[F.commNow] > 0)} />
                </div>
              </Tile>

              <Tile span="s7" edge="change" title="Changing sides" note={`${career.switchers.switched} peers now sit with a different party or group from the one they belonged to before, and ${career.switchers.nowIndependent} sit as independents having left a party. Moves out of the non-affiliated group aren't counted: new peers sit there until they choose a group.`}>
                <Switches
                  switchers={career.switchers}
                  onOpen={(t, e) => {
                    const set = ids(t.memberIds);
                    see(e, `${t.from} → ${t.to}`, "Current peers who left one party and now sit with another group.", (m) => set.has(m.id));
                  }}
                />
              </Tile>
            </>
          )}

          <Tile span="s5" edge="people" title="Longest-serving" delay={0.05} note="Time since each peer joined the House of Lords.">
            {longest.map((m, i) => (
              <button key={m.id} type="button" className="nclick" onClick={() => goMember(m.id)} style={{ display: "grid", gridTemplateColumns: "20px minmax(0, 1fr) auto", gap: 8, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, borderRadius: 0, padding: "7px 4px", color: "inherit" }}>
                <span style={{ ...numeric, fontSize: 12, color: COLORS.inkSoft }}>{i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: partyColour(m.colour, COLORS.inkSoft), flexShrink: 0 }} />
                    {m.party}
                  </span>
                </span>
                <span style={{ ...numeric, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{yearsSince(m)} yrs</span>
              </button>
            ))}
            {onNavigate && (
              <button type="button" onClick={() => onNavigate("lords")} style={{ marginTop: 14, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                Browse every peer
              </button>
            )}
          </Tile>

          <Tile span="s12" edge="people" title="What isn't here, and why" delay={0.05}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.7, color: COLORS.inkSoft, margin: 0 }}>
              Parliament publishes no ethnicity, age or education for peers, and the Lords has no recorded votes or declared interests in the structured form the Commons has, so none of
              that is shown. Each peer's page links to their entry in the official Register of Lords' Interests. Every figure here counts peers who sit today; {stats.longest ? `the longest-serving ${stats.longest.names.length > 1 ? "are" : "is"} ${joinNames(stats.longest.names)}, at ${Math.floor(stats.longest.years)} years.` : ""}
            </p>
          </Tile>
        </div>
      </div>

      {panel && <MembersModal title={panel.title} note={panel.note} members={panel.list} badge={panel.badge} returnFocusTo={panel.opener} onClose={() => setPanel(null)} onSelect={(m) => goPeer(m.id)} noun="peer" />}
    </div>
  );
}
