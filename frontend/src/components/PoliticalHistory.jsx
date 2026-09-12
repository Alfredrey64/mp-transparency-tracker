import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconHistory } from "./icons";
import { LANDMARK_VOTES, OUTCOME_COLOR } from "../lib/politicalHistoryData";
import { BillIcon } from "./billIcons";
import { supabase } from "../supabaseClient";
import { withScrollPreserved } from "../lib/preserveScroll";

const VOTE_THEMES = ["General", ...new Set(LANDMARK_VOTES.map((v) => v.theme))];

const PARTY_HISTORY = [
  {
    party: "Labour Party",
    color: "#C8102E",
    founded: 1900,
    ideology: "Centre-left · Social democracy",
    dbMatch: ["labour"],
    text: "Founded in 1900 as the Labour Representation Committee — a coalition of trade unions and socialist societies aiming to get working-class representatives into Parliament. Renamed the Labour Party in 1906.",
    lineage: [
      { label: "Labour Representation Committee", year: "1900" },
      { label: "Labour Party", year: "1906" },
    ],
    timeline: [
      { year: 1900, event: "Founded as the Labour Representation Committee" },
      { year: 1924, event: "Forms its first (minority) government, under Ramsay MacDonald" },
      { year: 1945, event: "First majority government, under Clement Attlee — creates the NHS and the modern welfare state" },
      { year: 1997, event: "Landslide win under Tony Blair ends 18 years of Conservative government" },
      { year: 2024, event: "Returns to power in a landslide, under Keir Starmer" },
    ],
    leaders: ["Ramsay MacDonald", "Clement Attlee", "Harold Wilson", "Tony Blair", "Keir Starmer"],
  },
  {
    party: "Conservative Party",
    color: "#0087DC",
    founded: 1834,
    ideology: "Centre-right · Conservatism",
    dbMatch: ["conservative"],
    text: "Traces its roots to the Tory party of the 18th century, formally reorganised as the Conservative Party under Robert Peel in the 1830s — the oldest political party in the UK still in continuous existence.",
    lineage: [
      { label: "Tory Party", year: "18th c." },
      { label: "Conservative Party", year: "1834" },
    ],
    timeline: [
      { year: 1834, event: "Reorganised as the Conservative Party under Robert Peel" },
      { year: 1979, event: "Margaret Thatcher becomes the UK's first woman Prime Minister" },
      { year: 2010, event: "Forms a coalition government with the Liberal Democrats after 13 years in opposition" },
      { year: 2024, event: "Loses power to Labour in a landslide defeat" },
    ],
    leaders: ["Robert Peel", "Winston Churchill", "Margaret Thatcher", "David Cameron"],
  },
  {
    party: "Liberal Democrats",
    color: "#FAA61A",
    founded: 1988,
    ideology: "Centre · Liberalism",
    dbMatch: ["liberal democrat"],
    text: "Formed in 1988 through the merger of the Liberal Party — descended from the Whigs, historically one of Britain's two dominant parties before Labour's rise — and the Social Democratic Party (SDP), which had broken away from Labour's right wing in 1981.",
    lineage: [
      { label: "Whigs", year: "18th c." },
      { label: "Liberal Party", year: "1859" },
      { label: "+ SDP", year: "1981" },
      { label: "Liberal Democrats", year: "1988" },
    ],
    timeline: [
      { year: 1988, event: "Formed from the merger of the Liberal Party and the SDP" },
      { year: 2010, event: "Enters coalition government with the Conservatives" },
      { year: 2015, event: "Loses the large majority of its seats after the coalition" },
      { year: 2024, event: "Wins its largest number of seats since the party's formation" },
    ],
    leaders: ["Paddy Ashdown", "Charles Kennedy", "Nick Clegg", "Ed Davey"],
  },
  {
    party: "Scottish National Party",
    color: "#B8960C",
    founded: 1934,
    ideology: "Centre-left · Scottish independence",
    dbMatch: ["scottish national"],
    text: "Founded in 1934 through the merger of two earlier Scottish nationalist groups, campaigning for Scottish independence. Became a major electoral force from the 1970s onward, and has been the dominant party in the Scottish Parliament (established 1999) for most of its history.",
    lineage: [
      { label: "National Party of Scotland", year: "1928" },
      { label: "+ Scottish Party", year: "1932" },
      { label: "Scottish National Party", year: "1934" },
    ],
    timeline: [
      { year: 1934, event: "Founded from the merger of two Scottish nationalist groups" },
      { year: 1999, event: "The Scottish Parliament is established" },
      { year: 2007, event: "Forms its first Scottish government, under Alex Salmond" },
      { year: 2014, event: "Scottish independence referendum — 55% vote to remain in the UK" },
    ],
    leaders: ["Alex Salmond", "Nicola Sturgeon", "John Swinney"],
  },
  {
    party: "Green Party",
    color: "#6AB023",
    founded: 1973,
    ideology: "Left-wing · Green politics",
    dbMatch: ["green"],
    text: "Traces back to the PEOPLE party, founded in 1973, which became the Ecology Party in 1975 and the Green Party in 1985. The Green Party of England and Wales and the Scottish Green Party have run separately since 1990.",
    lineage: [
      { label: "PEOPLE", year: "1973" },
      { label: "Ecology Party", year: "1975" },
      { label: "Green Party", year: "1985" },
    ],
    timeline: [
      { year: 1973, event: "Founded as the PEOPLE party" },
      { year: 1985, event: "Renamed the Green Party" },
      { year: 2010, event: "Wins its first Westminster seat, Brighton Pavilion" },
    ],
    leaders: ["Caroline Lucas"],
  },
  {
    party: "Reform UK",
    color: "#12B6CF",
    founded: 2019,
    ideology: "Right-wing · National conservatism",
    dbMatch: ["reform uk"],
    text: "Founded as the Brexit Party in 2019 by Nigel Farage, following his earlier leadership of UKIP (founded 1993), which campaigned for decades for the UK to leave the EU. Renamed Reform UK in 2021.",
    lineage: [
      { label: "UKIP", year: "1993" },
      { label: "Brexit Party", year: "2019" },
      { label: "Reform UK", year: "2021" },
    ],
    timeline: [
      { year: 1993, event: "Nigel Farage co-founds UKIP" },
      { year: 2019, event: "Founded as the Brexit Party" },
      { year: 2021, event: "Renamed Reform UK" },
    ],
    leaders: ["Nigel Farage", "Richard Tice"],
  },
  {
    party: "Plaid Cymru",
    color: "#005B54",
    founded: 1925,
    ideology: "Centre-left · Welsh independence",
    dbMatch: ["plaid cymru"],
    text: "Founded in 1925 as a Welsh nationalist party, campaigning for Welsh self-government and the protection of the Welsh language.",
    lineage: [{ label: "Plaid Cymru", year: "1925" }],
    timeline: [
      { year: 1925, event: "Founded to campaign for Welsh self-government" },
      { year: 1999, event: "The Senedd (then the National Assembly for Wales) is established" },
    ],
    leaders: ["Gwynfor Evans"],
  },
  {
    party: "Democratic Unionist Party",
    color: "#D46A4C",
    founded: 1971,
    ideology: "Right-wing · Unionism",
    dbMatch: ["democratic unionist"],
    text: "Founded in 1971 by Ian Paisley, a unionist party campaigning for Northern Ireland to remain part of the United Kingdom.",
    lineage: [{ label: "Democratic Unionist Party", year: "1971" }],
    timeline: [
      { year: 1971, event: "Founded by Ian Paisley" },
      { year: 1998, event: "Opposes the Good Friday Agreement" },
      { year: 2017, event: "Backs a minority Conservative government via a confidence-and-supply deal" },
    ],
    leaders: ["Ian Paisley", "Arlene Foster"],
  },
  {
    party: "Sinn Féin",
    color: "#326760",
    founded: 1905,
    ideology: "Left-wing · Irish republicanism",
    dbMatch: ["sinn"],
    text: "One of the oldest active parties in Ireland, tracing back to 1905 and historically associated with Irish republicanism. The modern party is closely linked to the peace process following the 1998 Good Friday Agreement; its MPs follow a long-standing policy of not taking their seats at Westminster.",
    lineage: [{ label: "Sinn Féin", year: "1905" }],
    timeline: [
      { year: 1905, event: "Founded" },
      { year: 1998, event: "The Good Friday Agreement ends the Troubles" },
      { year: 2022, event: "Becomes the largest party in the NI Assembly for the first time" },
    ],
    leaders: ["Gerry Adams", "Mary Lou McDonald"],
  },
  {
    party: "Social Democratic & Labour Party",
    color: "#4E9A2A",
    founded: 1970,
    ideology: "Centre-left · Irish nationalism",
    dbMatch: ["social democratic", "sdlp"],
    text: "Founded in 1970, a nationalist party in Northern Ireland supporting Irish unity achieved by consent and peaceful, democratic means.",
    lineage: [{ label: "Social Democratic & Labour Party", year: "1970" }],
    timeline: [
      { year: 1970, event: "Founded" },
      { year: 1998, event: "Plays a leading role in negotiating the Good Friday Agreement" },
    ],
    leaders: ["John Hume"],
  },
  {
    party: "Alliance",
    color: "#F6CB2F",
    founded: 1970,
    ideology: "Centre · Cross-community",
    dbMatch: ["alliance"],
    text: "Founded in 1970, a cross-community party in Northern Ireland that doesn't identify as either unionist or nationalist.",
    lineage: [{ label: "Alliance Party", year: "1970" }],
    timeline: [{ year: 1970, event: "Founded as a cross-community, non-aligned party" }],
    leaders: ["Naomi Long"],
  },
  {
    party: "Ulster Unionist Party",
    color: "#48A5EE",
    founded: 1905,
    ideology: "Centre-right · Unionism",
    dbMatch: ["ulster unionist"],
    text: "The oldest political party in Northern Ireland, tracing back to the Irish Unionist movement of the late 19th and early 20th centuries — historically the dominant unionist party before the rise of the DUP.",
    lineage: [
      { label: "Irish Unionist Alliance", year: "1891" },
      { label: "Ulster Unionist Party", year: "1905" },
    ],
    timeline: [{ year: 1905, event: "Roots in the Irish Unionist movement" }, { year: 1998, event: "Leads support for the Good Friday Agreement, under David Trimble" }],
    leaders: ["James Craig", "David Trimble"],
  },
];


// A distinct colour per theme, independent of pass/fail outcome — lets a
// reader spot "this is an Economic bill" at a glance, separately from
// whether it succeeded.
const THEME_COLORS = {
  Constitutional: "#5A7FA6",
  "Democratic Reform": "#3F7D5C",
  "Social Reform": "#9C6B30",
  Confidence: "#7A4B4B",
  "Foreign Policy & War": "#4A5A6A",
  Europe: "#6E4B6E",
  Economic: "#B0473E",
};

function ResultPill({ outcome, children }) {
  const color = OUTCOME_COLOR[outcome];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: "#fff",
        background: color, padding: "4px 12px 4px 10px", borderRadius: 999,
      }}
    >
      <span style={{ fontSize: 10.5 }}>{outcome === "achieved" ? "✓" : "✗"}</span>
      {children}
    </span>
  );
}

function VoteRow({ vote, index }) {
  const outcomeColor = OUTCOME_COLOR[vote.outcome];
  const themeColor = THEME_COLORS[vote.theme] ?? COLORS.brass;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
      whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(20,30,32,0.12)", transition: { duration: 0.15, delay: 0 } }}
      style={{
        position: "relative", overflow: "hidden", background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`,
        borderLeft: `4px solid ${outcomeColor}`, borderRadius: 14, padding: "22px 24px", marginBottom: 16,
        boxShadow: "0 1px 4px rgba(20,30,32,0.05)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute", top: -14, right: 8, fontFamily: FONT_DISPLAY, fontSize: 68, fontWeight: 700,
          color: COLORS.ink, opacity: 0.05, lineHeight: 1, pointerEvents: "none", userSelect: "none",
        }}
      >
        {vote.year}
      </div>
      <div style={{ position: "relative", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <span
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 11, background: `${themeColor}16`,
            display: "flex", alignItems: "center", justifyContent: "center", color: themeColor,
          }}
        >
          <BillIcon title={vote.title} size={22} color={themeColor} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.inkSoft }}>{vote.date}</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: COLORS.inkSoft, opacity: 0.5 }} />
            <span
              style={{
                fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                color: themeColor, background: `${themeColor}18`, padding: "3px 10px", borderRadius: 999,
              }}
            >
              {vote.theme}
            </span>
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, lineHeight: 1.4, marginBottom: 12, maxWidth: 560 }}>{vote.title}</div>
          <ResultPill outcome={vote.outcome}>{vote.result}</ResultPill>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.7, marginTop: 13, maxWidth: 620 }}>
            {vote.detail}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LineageDiagram({ nodes, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, rowGap: 10 }}>
      {nodes.map((n, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2 }}
              style={{ color, fontSize: 16, fontWeight: 700 }}
            >
              →
            </motion.span>
          )}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.25, ease: "easeOut" }}
            style={{
              background: i === nodes.length - 1 ? color : `${color}14`,
              border: `1px solid ${color}45`, borderRadius: 10, padding: "8px 13px", textAlign: "center", minWidth: 90,
            }}
          >
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: i === nodes.length - 1 ? "#fff" : COLORS.ink, lineHeight: 1.3 }}>
              {n.label}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: i === nodes.length - 1 ? "rgba(255,255,255,0.85)" : color, marginTop: 2 }}>
              {n.year}
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

function PartyCard({ party, index, seatCount }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -2, boxShadow: "0 10px 24px rgba(20,30,32,0.10)", transition: { duration: 0.15, delay: 0 } }}
      transition={{ duration: 0.35, delay: Math.min(index ?? 0, 8) * 0.04, ease: "easeOut" }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${party.color}`, borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(20,30,32,0.05)" }}
    >
      <button onClick={() => setOpen((v) => !v)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, marginBottom: 5 }}>{party.party}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: party.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Founded {party.founded}
              </span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: COLORS.inkSoft, opacity: 0.5 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{party.ideology}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {seatCount != null && seatCount > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: party.color, lineHeight: 1 }}>{seatCount}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: COLORS.inkSoft }}>MPs now</div>
              </div>
            )}
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: COLORS.inkSoft, fontSize: 13 }}>▾</motion.span>
          </div>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.65, marginTop: 10 }}>{party.text}</div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", gap: 18 }}>
              {party.lineage && party.lineage.length > 1 && (
                <div>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    How it got here
                  </div>
                  <LineageDiagram nodes={party.lineage} color={party.color} />
                </div>
              )}
              <div>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  Timeline
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {party.timeline.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.25 }}
                      style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                    >
                      <span style={{ flexShrink: 0, width: 44, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: party.color }}>{t.year}</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.5 }}>{t.event}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Notable leaders
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {party.leaders.map((l, i) => (
                    <motion.span
                      key={l}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      style={{
                        fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: party.color,
                        background: `${party.color}16`, padding: "4px 10px", borderRadius: 999,
                      }}
                    >
                      {l}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function useSeatCounts() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("politicians").select("party");
      const map = new Map();
      for (const row of data ?? []) {
        if (!row.party) continue;
        const key = row.party.toLowerCase();
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      setCounts(map);
    }
    load();
  }, []);

  return counts;
}

// Matches a curated party entry to its live seat count — DB party names
// (e.g. "Labour (Co-op)") don't exactly match our fuller display names
// (e.g. "Labour Party"), so this sums every DB party whose name contains
// one of the party's known short forms.
function seatCountFor(counts, party) {
  if (!counts || !party.dbMatch) return null;
  let total = 0;
  for (const [dbParty, count] of counts.entries()) {
    if (party.dbMatch.some((m) => dbParty.includes(m))) total += count;
  }
  return total;
}

export default function PoliticalHistory() {
  const [tab, setTab] = useState("votes");
  const [voteFilter, setVoteFilter] = useState("General");
  const seatCounts = useSeatCounts();
  const sortedVotes = [...LANDMARK_VOTES]
    .filter((v) => voteFilter === "General" || v.theme === voteFilter)
    .sort((a, b) => (a.year - b.year) || a.date.localeCompare(b.date));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconHistory}
        kicker="Public Record · Political History"
        title="Landmark votes & party history"
        subtitle="Moments and lineages that give today's Parliament and parties their context — a curated selection, not an exhaustive archive. See the Timeline tab for the full chronological sweep of governments and bills together."
      />

      <div style={{ display: "flex", gap: 4, marginTop: 24, marginBottom: 28, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: 4, width: "fit-content" }}>
        {[{ key: "votes", label: "Landmark Votes" }, { key: "parties", label: "Party History & Lineage" }].map((t) => (
          <button
            key={t.key}
            onClick={() => withScrollPreserved(() => setTab(t.key))}
            style={{
              position: "relative", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "9px 18px",
              borderRadius: 999, border: "none", cursor: "pointer", background: "transparent",
              color: tab === t.key ? "#fff" : COLORS.inkSoft, zIndex: 1,
            }}
          >
            {tab === t.key && (
              <motion.span layoutId="history-tab-pill" transition={{ type: "spring", stiffness: 500, damping: 35 }} style={{ position: "absolute", inset: 0, background: COLORS.ink, borderRadius: 999, zIndex: -1 }} />
            )}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "votes" && (
          <motion.div key="votes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
              {VOTE_THEMES.map((theme) => {
                const active = voteFilter === theme;
                return (
                  <button
                    key={theme}
                    onClick={() => withScrollPreserved(() => setVoteFilter(theme))}
                    style={{
                      fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: 999,
                      border: `1px solid ${active ? COLORS.ink : COLORS.hairline}`, background: active ? COLORS.ink : "transparent",
                      color: active ? "#fff" : COLORS.inkSoft, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {theme}
                  </button>
                );
              })}
            </div>

            {sortedVotes.length === 0 ? (
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: "20px 0" }}>
                No landmark votes tagged under "{voteFilter}" yet.
              </div>
            ) : (
              <div>
                {sortedVotes.map((v, i) => (
                  <VoteRow key={v.title} vote={v} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "parties" && (
          <motion.div key="parties" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {PARTY_HISTORY.map((p, i) => (
              <PartyCard key={p.party} party={p} index={i} seatCount={seatCountFor(seatCounts, p)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
