import { useState, useMemo } from "react";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconGlossary } from "./icons";

// Plain-English definitions of terms used throughout this site and in UK
// political reporting generally — written independently, not copied from any
// single source. Kept deliberately short; where a fuller picture matters
// (e.g. exactly how a bill becomes law) the "How Parliament Works" tab goes
// into more depth.
const TERMS = [
  { term: "Act of Parliament", def: "A bill that has completed every stage in both Houses and received Royal Assent — it's now law." },
  { term: "Backbencher", def: "An MP who doesn't hold a government or opposition frontbench role — named for where they sit, on the benches behind the frontbench." },
  { term: "Bill", def: "A draft law making its way through Parliament. It becomes an Act once it passes all stages and receives Royal Assent." },
  { term: "Committee Stage", def: "Detailed, line-by-line examination of a bill — usually by a small committee of MPs — where amendments are proposed and debated." },
  { term: "Division", def: "A formal vote in the Commons or Lords, where members physically walk through \"Aye\" or \"No\" lobbies to be counted." },
  { term: "Filibuster", def: "Deliberately talking at length to run down the clock and delay or block a bill or motion from being voted on." },
  { term: "First Reading", def: "The formal introduction of a bill to Parliament — usually just the title being read out, with no debate." },
  { term: "Frontbencher", def: "An MP who holds a government or opposition role (a minister, or their shadow counterpart) — named for sitting on the front bench." },
  { term: "Green Paper", def: "A government discussion document setting out policy ideas for public consultation, before any firm decisions are made." },
  { term: "Guillotine (Programme Motion)", def: "A device that sets a fixed timetable for debating a bill, limiting how long each stage is allowed to take." },
  { term: "Hansard", def: "The official, word-for-word written record of everything said in Parliament." },
  { term: "King's Speech", def: "The speech opening a new parliamentary session — written by the government but delivered by the monarch — setting out its legislative plans for the year ahead." },
  { term: "Maiden Speech", def: "The first speech a newly elected MP gives in the Commons, traditionally uncontroversial and often about their constituency." },
  { term: "Manifesto", def: "A party's published statement of the policies it would pursue if it forms a government." },
  { term: "Money Bill", def: "A bill dealing only with taxation or public spending. The House of Lords cannot block these — only delay them briefly." },
  { term: "Opposition Day", def: "A day set aside for the opposition (not the government) to choose the topic debated in the Commons." },
  { term: "Pairing", def: "An informal arrangement where an MP agrees not to vote, matched with an MP from an opposing party who also won't vote — so neither side's numbers are affected." },
  { term: "Ping-Pong", def: "The back-and-forth process where a bill bounces between the Commons and Lords until both Houses agree on its exact wording." },
  { term: "Private Member's Bill", def: "A bill introduced by an MP who isn't a government minister — much less likely to become law than a government bill, given how little time is set aside for them." },
  { term: "Prorogation", def: "The formal end of a parliamentary session, after which most unfinished business lapses." },
  { term: "PMQs (Prime Minister's Questions)", def: "A weekly session where the Prime Minister answers questions directly from MPs, including the Leader of the Opposition." },
  { term: "Report Stage", def: "The stage where the whole House considers further amendments to a bill, after Committee Stage." },
  { term: "Royal Assent", def: "The monarch's formal approval, which turns a bill into an Act of Parliament. By long-standing convention, this is never refused." },
  { term: "Second Reading", def: "The first real debate on a bill's general principles, followed by a vote on whether it should proceed at all." },
  { term: "Select Committee", def: "A cross-party group of MPs (or peers) that scrutinises a specific government department or policy area in detail, and publishes reports." },
  { term: "Standing Order", def: "A permanent, written rule governing how Parliament conducts its business." },
  { term: "Statutory Instrument", def: "A form of secondary legislation letting ministers make detailed law under powers an Act has already granted them, without needing a full new bill." },
  { term: "Ten Minute Rule Bill", def: "A brief opportunity for a backbench MP to make the case for a new bill in a ten-minute speech. Rarely becomes law, but can raise an issue's profile." },
  { term: "Third Reading", def: "The final Commons debate on a bill, focused on its content as amended, before it moves on to the other House." },
  { term: "Vote of No Confidence", def: "A vote that, if the government loses it, can trigger its resignation or a general election." },
  { term: "Whip", def: "Both an instruction from a party telling its MPs how to vote (a \"three-line whip\" is the strongest), and the party official who enforces it." },
  { term: "White Paper", def: "A government policy document setting out firm proposals — often the step after a Green Paper, shortly before a bill is drafted." },
];

export default function Glossary() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TERMS;
    return TERMS.filter((t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q));
  }, [query]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconGlossary}
        kicker="Public Record · Glossary"
        title="Parliamentary jargon, in plain English"
        subtitle="Every term you'll run into on this site, and in most UK political reporting, explained simply — search or just scroll."
      />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a term…"
        style={{
          width: "100%", maxWidth: 420, boxSizing: "border-box", marginTop: 24, marginBottom: 24, padding: "12px 16px",
          fontFamily: FONT_BODY, fontSize: 15, border: `1px solid ${COLORS.hairline}`, borderRadius: 10,
          background: COLORS.paperCard, color: COLORS.ink,
        }}
      />

      {filtered.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No terms match "{query}".</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((t) => (
            <div key={t.term} style={{ padding: "16px 0", borderBottom: `1px solid ${COLORS.hairline}` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink, marginBottom: 4 }}>{t.term}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6 }}>{t.def}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
