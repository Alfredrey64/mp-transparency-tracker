import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconHistory } from "./icons";

// Curated by hand, written independently — a selection, not an exhaustive
// archive. Chosen for being both historically significant and well-enough
// documented that we're confident in the detail given. Where an exact vote
// count is stated, it's a well-established, widely reported figure.
const LANDMARK_VOTES = [
  {
    date: "28 March 1979",
    title: "Vote of No Confidence in the Callaghan Government",
    result: "Lost, 311 to 310",
    outcome: "not_kept",
    detail: "The government lost by a single vote — the only UK government brought down by a Commons confidence vote since 1924. It triggered the general election that brought Margaret Thatcher to power.",
  },
  {
    date: "5 February 1972",
    title: "European Communities Bill, Second Reading",
    result: "Passed",
    outcome: "achieved",
    detail: "Approved the principle of the UK joining the European Economic Community (the forerunner of the EU), which it did the following year, in 1973.",
  },
  {
    date: "18 March 2003",
    title: "Iraq War — authorisation of military action",
    result: "Passed",
    outcome: "achieved",
    detail: "MPs voted to authorise military action in Iraq, after one of the largest backbench rebellions in Labour Party history against Tony Blair's own government.",
  },
  {
    date: "29 August 2013",
    title: "Possible military action in Syria",
    result: "Government motion defeated",
    outcome: "not_kept",
    detail: "A rare government defeat on a matter of war and peace, widely seen as a significant moment for Parliament's role in decisions about military intervention.",
  },
  {
    date: "5 February 2013",
    title: "Marriage (Same Sex Couples) Bill, Second Reading",
    result: "Passed by a large majority",
    outcome: "achieved",
    detail: "Legalised same-sex marriage in England and Wales, though the vote split the Conservative Party — more of its MPs voted against or abstained than voted in favour.",
  },
  {
    date: "29 March 2017",
    title: "Article 50 (Notification of Withdrawal) Bill",
    result: "Passed",
    outcome: "achieved",
    detail: "Authorised the government to formally notify the EU of the UK's intention to leave, starting the two-year countdown to Brexit following the 2016 referendum.",
  },
  {
    date: "15 January 2019",
    title: "\"Meaningful Vote\" on Theresa May's Brexit Withdrawal Agreement",
    result: "Defeated, 432 to 202",
    outcome: "not_kept",
    detail: "A margin of 230 votes — the largest government defeat in the history of the House of Commons.",
  },
  {
    date: "18 November 2004",
    title: "Hunting Act — final Commons stages",
    result: "Passed",
    outcome: "achieved",
    detail: "Banned hunting foxes, deer, and hares with dogs in England and Wales, after years of deadlock with the Lords — eventually forced through using the rarely-invoked Parliament Act.",
  },
];

const PARTY_HISTORY = [
  {
    party: "Labour Party",
    color: "#C8102E",
    text: "Founded in 1900 as the Labour Representation Committee — a coalition of trade unions and socialist societies aiming to get working-class representatives into Parliament. Renamed the Labour Party in 1906. Formed its first (minority) government in 1924 under Ramsay MacDonald, and its first majority government in 1945 under Clement Attlee, which created the NHS and the modern welfare state.",
  },
  {
    party: "Conservative Party",
    color: "#0087DC",
    text: "Traces its roots to the Tory party of the 18th century, formally reorganised as the Conservative Party under Robert Peel in the 1830s — the oldest political party in the UK still in continuous existence.",
  },
  {
    party: "Liberal Democrats",
    color: "#FAA61A",
    text: "Formed in 1988 through the merger of the Liberal Party — descended from the Whigs, historically one of Britain's two dominant parties before Labour's rise — and the Social Democratic Party (SDP), which had broken away from Labour's right wing in 1981.",
  },
  {
    party: "Scottish National Party",
    color: "#FDF38E",
    text: "Founded in 1934 through the merger of two earlier Scottish nationalist groups, campaigning for Scottish independence. Became a major electoral force from the 1970s onward, and has been the dominant party in the Scottish Parliament (established 1999) for most of its history.",
  },
  {
    party: "Green Party",
    color: "#6AB023",
    text: "Traces back to the PEOPLE party, founded in 1973, which became the Ecology Party in 1975 and the Green Party in 1985. The Green Party of England and Wales and the Scottish Green Party have run separately since 1990.",
  },
  {
    party: "Reform UK",
    color: "#12B6CF",
    text: "Founded as the Brexit Party in 2019 by Nigel Farage, following his earlier leadership of UKIP (founded 1993), which campaigned for decades for the UK to leave the EU. Renamed Reform UK in 2021.",
  },
  {
    party: "Plaid Cymru",
    color: "#005B54",
    text: "Founded in 1925 as a Welsh nationalist party, campaigning for Welsh self-government and the protection of the Welsh language.",
  },
  {
    party: "Democratic Unionist Party",
    color: "#D46A4C",
    text: "Founded in 1971 by Ian Paisley, a unionist party campaigning for Northern Ireland to remain part of the United Kingdom.",
  },
  {
    party: "Sinn Féin",
    color: "#326760",
    text: "One of the oldest active parties in Ireland, tracing back to 1905 and historically associated with Irish republicanism. The modern party is closely linked to the peace process following the 1998 Good Friday Agreement; its MPs follow a long-standing policy of not taking their seats at Westminster.",
  },
  {
    party: "Social Democratic & Labour Party",
    color: "#4E9A2A",
    text: "Founded in 1970, a nationalist party in Northern Ireland supporting Irish unity achieved by consent and peaceful, democratic means.",
  },
  {
    party: "Alliance",
    color: "#F6CB2F",
    text: "Founded in 1970, a cross-community party in Northern Ireland that doesn't identify as either unionist or nationalist.",
  },
  {
    party: "Ulster Unionist Party",
    color: "#48A5EE",
    text: "The oldest political party in Northern Ireland, tracing back to the Irish Unionist movement of the late 19th and early 20th centuries — historically the dominant unionist party before the rise of the DUP.",
  },
];

const OUTCOME_COLOR = { achieved: "#2F6F4E", not_kept: "#9C3B3B" };

function VoteRow({ vote }) {
  const [open, setOpen] = useState(false);
  const color = OUTCOME_COLOR[vote.outcome];
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${color}`, borderRadius: 12, padding: 16 }}>
      <button onClick={() => setOpen((v) => !v)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft, marginBottom: 4 }}>{vote.date}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4 }}>{vote.title}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color, marginTop: 4 }}>{vote.result}</div>
          </div>
          <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 12, color: COLORS.inkSoft }}>{open ? "▾" : "▸"}</span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.hairline}` }}>
              {vote.detail}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PoliticalHistory() {
  const [tab, setTab] = useState("votes");

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconHistory}
        kicker="Public Record · Political History"
        title="Landmark votes & party history"
        subtitle="Moments and lineages that give today's Parliament and parties their context — a curated selection, not an exhaustive archive."
      />

      <div style={{ display: "flex", gap: 4, marginTop: 24, marginBottom: 24, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: 4, width: "fit-content" }}>
        {[{ key: "votes", label: "Landmark Votes" }, { key: "parties", label: "Party History & Lineage" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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

      {tab === "votes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LANDMARK_VOTES.map((v) => (
            <VoteRow key={v.title} vote={v} />
          ))}
        </div>
      )}

      {tab === "parties" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {PARTY_HISTORY.map((p) => (
            <div key={p.party} style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: `1px solid ${COLORS.hairline}` }}>
              <span style={{ width: 4, borderRadius: 999, background: p.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, marginBottom: 5 }}>{p.party}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.65 }}>{p.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
