import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconGlossary, IconSearch } from "./icons";
import { withScrollPreserved } from "../lib/preserveScroll";

// Plain-English definitions of terms used throughout this site and in UK
// political reporting generally — written independently, not copied from any
// single source. Kept deliberately short; where a fuller picture matters
// (e.g. exactly how a bill becomes law) the "How Parliament Works" tab goes
// into more depth. A handful carry a worked example or a small diagram
// where a picture genuinely earns its place — not every term needs one.
const PROCEDURE_TERMS = [
  { term: "Act of Parliament", def: "A bill that has completed every stage in both Houses and received Royal Assent — it's now law.", example: "The National Insurance Contributions (Reduction in Rates) Act 2024." },
  { term: "Adjournment Debate", def: "A short debate at the end of the Commons day letting a backbench MP raise a local or specific issue and get a direct response from a minister." },
  { term: "All-Party Parliamentary Group (APPG)", def: "An informal, cross-party group of MPs and peers sharing an interest in a particular topic, country, or cause. Not an official arm of Parliament, and often supported by outside organisations.", example: "See the APPG Memberships tab for who belongs to which." },
  { term: "Amendment", def: "A proposed change to the wording of a bill or motion, debated and voted on before the underlying text itself." },
  { term: "Backbench Business Committee", def: "A cross-party Commons committee that decides what backbenchers — rather than the government or opposition — get to debate on the days set aside for them." },
  { term: "Backbencher", def: "An MP who doesn't hold a government or opposition frontbench role — named for where they sit, on the benches behind the frontbench." },
  { term: "Bicameral", def: "Having two chambers. The UK Parliament is bicameral: the House of Commons and the House of Lords." },
  {
    term: "Bill", def: "A draft law making its way through Parliament. It becomes an Act once it passes all stages and receives Royal Assent.",
    diagram: { type: "stages", items: ["1st Reading", "2nd Reading", "Committee", "Report", "3rd Reading", "Other House", "Royal Assent"] },
  },
  { term: "Black Rod", def: "The Lords official who summons MPs to hear the King's Speech — traditionally having the Commons' door shut in their face en route, symbolising the Commons' independence from the monarch." },
  { term: "Closure Motion", def: "A motion asking the House to stop debating and move straight to a vote — a way of ending a filibuster or an overly long debate." },
  { term: "Committee Stage", def: "Detailed, line-by-line examination of a bill — usually by a small committee of MPs — where amendments are proposed and debated." },
  { term: "Consolidated Fund", def: "The government's main account at the Bank of England, into which most tax revenue is paid and out of which most public spending is drawn." },
  { term: "Cross-bencher", def: "A member of the House of Lords who doesn't take a party whip, sitting on the benches that literally cross between government and opposition." },
  { term: "Dissolution", def: "The formal ending of a Parliament ahead of a general election, after which every MP ceases to hold the office until re-elected (or not)." },
  { term: "Division", def: "A formal vote in the Commons or Lords, where members physically walk through \"Aye\" or \"No\" lobbies to be counted." },
  { term: "Early Day Motion", def: "A formal motion tabled by an MP to put a statement on the record and gather other MPs' signatures — almost never actually debated, despite the name." },
  { term: "Estimates Day", def: "A day set aside for the Commons to debate a government department's spending plans (its \"Estimates\"), chosen by the Liaison Committee of select committee chairs." },
  { term: "Filibuster", def: "Deliberately talking at length to run down the clock and delay or block a bill or motion from being voted on.", example: "A 2015 bill to ban wild animals in travelling circuses was \"talked out\" this way and never became law." },
  { term: "First Reading", def: "The formal introduction of a bill to Parliament — usually just the title being read out, with no debate." },
  { term: "Frontbencher", def: "An MP who holds a government or opposition role (a minister, or their shadow counterpart) — named for sitting on the front bench." },
  { term: "Green Paper", def: "A government discussion document setting out policy ideas for public consultation, before any firm decisions are made.", example: "Often followed by a White Paper once the government settles on firm proposals." },
  { term: "Grand Committee", def: "A House of Lords committee stage held away from the main chamber and open to any peer, typically used for bills considered too uncontroversial to need full chamber time." },
  { term: "Guillotine (Programme Motion)", def: "A device that sets a fixed timetable for debating a bill, limiting how long each stage is allowed to take." },
  { term: "Hansard", def: "The official, word-for-word written record of everything said in Parliament." },
  { term: "Hereditary Peer", def: "A member of the House of Lords whose title is inherited rather than personally granted. The House of Lords Act 1999 capped the number allowed to sit at 92, pending their eventual full removal." },
  { term: "Humble Address", def: "A formal motion asking the King to act — largely ceremonial, but occasionally used by MPs to try to force the government to release official documents." },
  { term: "King's Consent", def: "A convention requiring the monarch's consent be sought before Parliament debates a bill touching the Crown's own interests or prerogative powers — distinct from Royal Assent, which comes only at the very end." },
  { term: "King's Speech", def: "The speech opening a new parliamentary session — written by the government but delivered by the monarch — setting out its legislative plans for the year ahead.", example: "King Charles III delivered one in July 2024, setting out the incoming government's agenda." },
  { term: "Leader of the House", def: "The Cabinet minister responsible for organising government business in the Commons and representing the government's interests on procedural matters." },
  { term: "Leader of the Opposition", def: "The leader of the largest party not in government — formally recognised with a salary and, by tradition, a prominent role at PMQs." },
  { term: "Life Peer", def: "A member of the House of Lords whose title is granted for their own lifetime only, and can't be passed on — the way almost every new peer is created today." },
  { term: "Lord Chancellor", def: "A Cabinet minister with historic responsibility for the courts and judiciary; before 2006 the role also doubled as Speaker of the House of Lords." },
  { term: "Lord Speaker", def: "The presiding officer of the House of Lords, chairing its sittings — the Lords' equivalent of the Commons Speaker." },
  { term: "Lords Spiritual", def: "The 26 Church of England bishops who sit in the House of Lords by virtue of their office, including the Archbishops of Canterbury and York." },
  { term: "Lords Temporal", def: "Every member of the House of Lords who isn't a Lords Spiritual bishop — that is, all life peers and the remaining hereditary peers." },
  { term: "Mace", def: "The ceremonial staff symbolising royal authority that must be present in the Commons chamber for the House to conduct business." },
  { term: "Maiden Speech", def: "The first speech a newly elected MP gives in the Commons, traditionally uncontroversial and often about their constituency." },
  { term: "Manifesto", def: "A party's published statement of the policies it would pursue if it forms a government." },
  { term: "Money Bill", def: "A bill dealing only with taxation or public spending. The House of Lords cannot block these — only delay them briefly.", example: "The annual Finance Bill, which enacts the Budget's tax changes, is a Money Bill." },
  { term: "Money Resolution", def: "A Commons motion authorising a bill to involve new public spending. Without one, a bill with a spending implication can't proceed to its later stages." },
  { term: "Opposition Day", def: "A day set aside for the opposition (not the government) to choose the topic debated in the Commons." },
  { term: "Order Paper", def: "The Commons' published agenda for the day, listing the questions, motions, and bills scheduled to come up." },
  { term: "Pairing", def: "An informal arrangement where an MP agrees not to vote, matched with an MP from an opposing party who also won't vote — so neither side's numbers are affected." },
  { term: "Parliamentary Privilege", def: "Legal protection letting MPs and peers speak freely during proceedings — including saying things that would otherwise risk a defamation claim." },
  { term: "Petition (Public Petition)", def: "A formal request submitted by members of the public — increasingly via Parliament's e-petitions website — which gets an official government response after 10,000 signatures, and can trigger a Commons debate after 100,000." },
  {
    term: "Ping-Pong", def: "The back-and-forth process where a bill bounces between the Commons and Lords until both Houses agree on its exact wording.",
    example: "The Illegal Migration Bill went through several rounds of this in 2023 before both Houses agreed its final text.",
    diagram: { type: "backforth", a: "Commons", b: "Lords" },
  },
  { term: "Point of Order", def: "An MP's interruption asking the Speaker to clarify or enforce a procedural rule — not a chance to make an argument on the actual issue." },
  { term: "Private Bill", def: "A bill that applies only to a particular organisation, locality, or individual, rather than the general public — historically used for major infrastructure projects.", example: "Used for projects such as the Channel Tunnel and HS2." },
  { term: "Private Member's Bill", def: "A bill introduced by an MP who isn't a government minister — much less likely to become law than a government bill, given how little time is set aside for them.", example: "The Terminally Ill Adults (End of Life) Bill, on assisted dying, began this way in 2024." },
  { term: "Prorogation", def: "The formal end of a parliamentary session, after which most unfinished business lapses." },
  { term: "PMQs (Prime Minister's Questions)", def: "A weekly session where the Prime Minister answers questions directly from MPs, including the Leader of the Opposition." },
  { term: "Public Bill Committee", def: "The committee that carries out a bill's committee stage in the Commons, examining its text clause by clause and considering amendments." },
  { term: "Quorum", def: "The minimum number of members who must be present for a sitting or vote to be formally valid." },
  { term: "Recess", def: "A scheduled break when Parliament isn't sitting, such as over the summer or Christmas. Unlike prorogation, MPs keep their office and can still work." },
  { term: "Report Stage", def: "The stage where the whole House considers further amendments to a bill, after Committee Stage." },
  { term: "Royal Assent", def: "The monarch's formal approval, which turns a bill into an Act of Parliament. By long-standing convention, this is never refused." },
  { term: "Royal Prerogative", def: "Powers formally held by the monarch but in practice exercised by the government of the day, such as declaring war or signing treaties, without a new Act of Parliament." },
  { term: "Second Reading", def: "The first real debate on a bill's general principles, followed by a vote on whether it should proceed at all." },
  { term: "Select Committee", def: "A cross-party group of MPs (or peers) that scrutinises a specific government department or policy area in detail, and publishes reports.", example: "The Treasury Select Committee questions the Chancellor and Bank of England on economic policy." },
  { term: "Speaker", def: "The MP elected to chair Commons proceedings and enforce its rules impartially — by convention giving up party campaigning on election to the role." },
  { term: "Standing Order", def: "A permanent, written rule governing how Parliament conducts its business." },
  { term: "Statutory Instrument", def: "A form of secondary legislation letting ministers make detailed law under powers an Act has already granted them, without needing a full new bill.", example: "Most Covid-19 lockdown regulations were introduced this way, under powers in the Public Health Act 1984." },
  { term: "Sub Judice Rule", def: "A convention that MPs and peers avoid discussing the details of cases currently active in the courts, so as not to prejudice them." },
  { term: "Tabling", def: "Formally submitting a motion, amendment, or written question so it enters the official record and can be considered." },
  { term: "Ten Minute Rule Bill", def: "A brief opportunity for a backbench MP to make the case for a new bill in a ten-minute speech. Rarely becomes law, but can raise an issue's profile." },
  { term: "The Usual Channels", def: "Informal shorthand for negotiations between government and opposition whips to agree how parliamentary business and time gets arranged." },
  { term: "Third Reading", def: "The final Commons debate on a bill, focused on its content as amended, before it moves on to the other House." },
  { term: "Urgent Question", def: "A question a minister can be required to answer in the Commons that same day, granted at the Speaker's discretion when an issue is too pressing to wait." },
  { term: "Vote of No Confidence", def: "A vote that, if the government loses it, can trigger its resignation or a general election.", example: "James Callaghan's government lost one by a single vote in March 1979, triggering that year's general election." },
  { term: "Wash-up Period", def: "The frantic final days of a Parliament, just before dissolution, when the government negotiates with the opposition to pass or drop outstanding bills before time runs out." },
  { term: "Ways and Means", def: "Resolutions authorising the government to raise or vary taxes, needed before a Finance Bill implementing Budget measures can be brought forward." },
  { term: "Whip", def: "Both an instruction from a party telling its MPs how to vote (a \"three-line whip\" is the strongest), and the party official who enforces it." },
  { term: "Whipless", def: "Describes an MP who has had the party whip withdrawn as discipline — they keep their seat but sit as an independent until (or unless) it's restored." },
  { term: "White Paper", def: "A government policy document setting out firm proposals — often the step after a Green Paper, shortly before a bill is drafted." },
  { term: "Woolsack", def: "The seat of the Lord Speaker in the House of Lords, traditionally stuffed with wool as a symbol of the wool trade's historic importance to England." },
  { term: "Written Ministerial Statement", def: "A statement a minister makes via the official record rather than out loud in the chamber — used for updates that don't need, or aren't given, a full oral debate." },
];

// Broader political concepts and recurring issues you'll see referenced
// across this site and in general UK political coverage — distinct from the
// procedural terms above, which are specifically about how Parliament itself
// operates.
const POLITICS_TERMS = [
  { term: "Austerity", def: "A government policy of cutting public spending and/or raising taxes to reduce a budget deficit — most associated in the UK with the 2010s coalition and Conservative governments.", example: "Chancellor George Osborne's spending cuts from 2010 onward." },
  { term: "Blue Wall", def: "Traditionally safe Conservative-voting seats, largely in southern England, a number of which fell to the Liberal Democrats and Labour in the 2024 general election." },
  { term: "Boundary Review", def: "A periodic redrawing of constituency boundaries by an independent commission, intended to keep the number of voters in each seat roughly equal as populations shift." },
  { term: "Brexit", def: "Shorthand for \"British exit\" — the UK's withdrawal from the European Union, following a 2016 referendum and completed in 2020.", example: "\"Hard Brexit\" and \"soft Brexit\" describe how loosely or closely the UK chose to stay aligned with EU rules afterwards." },
  { term: "By-election", def: "A one-off election held to fill a single seat that's fallen vacant between general elections, usually through a resignation or death.", example: "See the Elections tab for recent ones, such as Runcorn and Helsby in 2025." },
  { term: "Cabinet Collective Responsibility", def: "The convention that every Cabinet minister publicly backs decisions made in Cabinet, whatever they argued in private — or resigns if they can't." },
  { term: "Cabinet Reshuffle", def: "A prime minister reassigning, promoting, or sacking ministers within their own government, without a general election taking place." },
  { term: "Civil Service", def: "The permanent, politically neutral officials who run government departments and implement policy, regardless of which party is in power." },
  { term: "Coalition Government", def: "A government formed by two or more parties agreeing to govern together, typically because no single party won a majority of seats.", example: "The Conservative–Liberal Democrat coalition governed from 2010 to 2015." },
  {
    term: "Confidence and Supply", def: "A looser arrangement than a full coalition, where a smaller party agrees to support a minority government on confidence votes and budget bills, in exchange for concessions — without taking up ministerial jobs.",
    example: "The DUP backed Theresa May's minority government this way from 2017 to 2019.",
    diagram: { type: "backforth", a: "Minority government", b: "Supporting party" },
  },
  { term: "Cost of Living Crisis", def: "The period from around 2021 onward in which prices — especially energy, food, and housing — rose faster than wages, squeezing household budgets." },
  { term: "Devolution", def: "The transfer of certain powers from the UK Parliament to the Scottish Parliament, Senedd Cymru, and Northern Ireland Assembly, which then legislate on those matters themselves.", example: "The Scottish Parliament sets its own NHS and education policy for Scotland." },
  { term: "Dog-Whistle Politics", def: "Political messaging phrased to carry an extra, often coded meaning for a specific audience, beyond its more innocuous surface meaning to everyone else." },
  { term: "Electoral Register", def: "The official list of everyone eligible to vote in a given area — you must be on it to vote." },
  {
    term: "First-Past-the-Post", def: "The UK's electoral system for general elections: whoever gets the most votes in a constituency wins that seat outright, even without a majority of votes cast.",
    example: "A party can win a majority of seats nationally with well under half the popular vote.",
    diagram: { type: "seats", segments: [
      { label: "Seats won", pct: 62, color: "#0087DC" },
      { label: "Vote share", pct: 38, color: COLORS.inkSoft },
    ] },
  },
  { term: "Focus Group", def: "A small group of voters brought together to discuss their views on policies or politicians — used by parties and pollsters to test messaging." },
  { term: "General Election", def: "A UK-wide election for every seat in the House of Commons, usually held every 4-5 years, which decides which party (or parties) forms the government." },
  { term: "Gerrymandering", def: "Deliberately drawing electoral boundaries to favour a particular party or group — one of the risks the UK's independent boundary commissions exist to guard against." },
  { term: "Grassroots", def: "The ordinary members and activists of a party or campaign, as distinct from its leadership or elected representatives." },
  { term: "Green Belt", def: "Protected countryside around towns and cities where new building is tightly restricted, intended to stop urban sprawl and keep settlements separate." },
  { term: "Honeymoon Period", def: "The stretch after an election win when a new government or leader typically enjoys higher approval, before the difficulty of governing catches up with them." },
  {
    term: "Hung Parliament", def: "The result when no single party wins an outright majority of Commons seats — leading to a coalition, a looser confidence-and-supply deal, or a minority government.",
    example: "Both the 2010 and 2017 general elections produced a hung parliament.",
    diagram: { type: "seats", segments: [
      { label: "Largest party", pct: 42, color: "#0087DC" },
      { label: "Other parties", pct: 46, color: "#C8102E" },
      { label: "Needed for majority", pct: 12, color: `${COLORS.inkSoft}` },
    ] },
  },
  { term: "Identity Politics", def: "A political approach organised around the interests and perspectives of groups defined by a shared identity, such as race, gender, or sexuality." },
  { term: "Incumbency", def: "The advantage a sitting MP or governing party typically has when seeking re-election, from greater name recognition, media coverage, and constituency profile." },
  {
    term: "Left-Wing / Right-Wing", def: "A rough shorthand for political position: the left traditionally favours more state intervention, redistribution, and public services; the right favours smaller government, lower taxes, and free markets. Most real positions sit somewhere between the two.",
    diagram: { type: "spectrum", left: "Left", right: "Right" },
  },
  { term: "Levelling Up", def: "A policy goal, prominent under the 2019-2024 Conservative governments, of reducing economic and infrastructure gaps between different regions of the UK.", example: "Government funding aimed at regenerating town centres and transport in the North and Midlands." },
  { term: "Lobbying", def: "The act of trying to influence politicians or government policy on behalf of a cause, industry, or organisation — done by everyone from charities to professional lobbying firms." },
  { term: "Mandate", def: "The authority a government claims to govern and implement its policies, generally understood to come from winning a general election on a given manifesto." },
  { term: "Marginal Seat", def: "A constituency won by a small margin at the last election, and therefore considered winnable by more than one party next time — the main battlegrounds of any campaign." },
  { term: "Minority Government", def: "A government formed by a party that doesn't have a Commons majority, relying on ad hoc support from other parties to pass legislation and survive confidence votes.", example: "Theresa May's 2017–2019 government relied on a confidence-and-supply deal with the DUP." },
  { term: "Nanny State", def: "A critical term for government seen as excessively paternalistic, regulating individual lifestyle choices — diet, smoking, drinking — more than critics think it should." },
  { term: "Negative Campaigning", def: "A campaign strategy focused on attacking an opponent's record or character, rather than promoting one's own policies." },
  { term: "Night of the Long Knives", def: "Informal name for a particularly dramatic and wide-ranging Cabinet reshuffle, after Harold Macmillan's sweeping sacking of a third of his Cabinet in one day in 1962." },
  { term: "NIMBY", def: "\"Not In My Back Yard\" — someone who objects to new development, such as housing or infrastructure, specifically near them, without necessarily opposing it elsewhere." },
  { term: "Opinion Poll", def: "A survey of a sample of voters used to estimate wider public opinion or how people would vote if an election were held now." },
  { term: "Overton Window", def: "The range of policy ideas considered politically acceptable or mainstream at a given time. Campaigners and commentators often talk about trying to \"shift\" it." },
  { term: "Party Conference", def: "A political party's annual gathering of members and officials to debate policy, hear leadership speeches, and rally activists — usually widely covered by the media." },
  { term: "Political Capital", def: "A leader's accumulated public support and authority, which can be \"spent\" pushing through a difficult or unpopular policy." },
  { term: "Populism", def: "A political approach that presents \"ordinary people\" as being at odds with a distrusted elite or establishment — a style found across the political spectrum, not tied to one party." },
  { term: "Pressure Group", def: "An organisation that campaigns to influence government policy on a specific issue or cause, without itself standing candidates for election." },
  {
    term: "Proportional Representation", def: "Any electoral system, unlike First-Past-the-Post, designed so a party's number of seats more closely reflects its share of the total vote. Used for the Scottish Parliament, Senedd, and European elections when the UK took part; not used for Westminster.",
    example: "Used to elect the Scottish Parliament and Senedd Cymru.",
  },
  { term: "Psephology", def: "The statistical study of elections and voting patterns — the discipline behind swing calculations, poll analysis, and seat projections." },
  { term: "Purdah", def: "The pre-election period when civil servants avoid announcements or decisions that could be seen as influencing the outcome, to keep government machinery politically neutral." },
  { term: "Quango", def: "A quasi-autonomous non-governmental organisation — a body that carries out public functions and is funded by government, but operates at arm's length from ministers day-to-day.", example: "The Environment Agency and the Electoral Commission are both quangos." },
  { term: "Red Wall", def: "Traditionally Labour-voting constituencies, mostly across the Midlands and northern England, a swathe of which switched to the Conservatives in the 2019 general election." },
  { term: "Referendum", def: "A direct vote in which the electorate decides a single question of public policy, rather than electing representatives to decide it for them.", example: "The 2016 EU membership referendum, and the 2014 Scottish independence referendum." },
  { term: "Safe Seat", def: "A constituency one party wins by such a large margin that it's very unlikely to change hands — the opposite of a marginal seat." },
  { term: "Shadow Cabinet", def: "The Opposition's own team of senior MPs, each \"shadowing\" a government minister and setting out how their party would do things differently." },
  { term: "Sleaze", def: "Shorthand for allegations of corruption, financial impropriety, or ethical misconduct among politicians, often used of a run of such stories rather than one incident." },
  { term: "Snap Election", def: "A general election called earlier than legally required or widely expected, usually because the calling party believes the political timing favours it." },
  { term: "Sofa Government", def: "A critical term for governing through small, informal meetings between a Prime Minister and close allies rather than full, formally minuted Cabinet discussion — most associated with Tony Blair's premiership." },
  { term: "Special Adviser (SpAd)", def: "A politically appointed aide to a minister, distinct from politically neutral civil servants — providing political and strategic advice a civil servant isn't allowed to give." },
  { term: "Special Relationship", def: "The particularly close diplomatic, military, and economic ties traditionally described between the UK and the United States." },
  { term: "Spin", def: "Presenting information, especially bad news, in a way designed to shape public perception favourably — usually used critically, of a government or party accused of it." },
  { term: "Stealth Tax", def: "A tax rise or other revenue-raising change designed to be less visible or politically noticeable than a straightforward headline rate increase.", example: "Freezing the income tax personal allowance while wages rise, so more people are pulled into paying tax or a higher rate, without any rate itself changing." },
  { term: "Swing", def: "The estimated percentage shift in support from one party to another between two elections, used to judge how close a marginal seat is." },
  { term: "Swing Voter", def: "A voter who doesn't reliably back the same party each election, and whose choice — unlike a committed partisan's — genuinely could go either way." },
  { term: "Swingometer", def: "A graphic device, popular in election-night broadcasts, that shows how many seats would change hands for a given swing in support between two parties." },
  { term: "Tactical Voting", def: "Voting for a candidate who isn't a voter's first choice, in order to help defeat a candidate they like even less." },
  { term: "Think Tank", def: "An organisation that researches and promotes policy ideas, often — though not always openly — associated with a particular political outlook." },
  { term: "Third Way", def: "A political positioning, associated with New Labour in the 1990s, aiming to blend traditional left-wing social goals with more market-friendly economic policy.", example: "Associated with Tony Blair's New Labour government from 1997." },
  { term: "Triple Lock", def: "The guarantee that the State Pension rises each year by whichever is highest of inflation, average earnings growth, or 2.5% — a frequent subject of political debate over its cost." },
  { term: "U-Turn", def: "A government reversing a policy it had previously announced, usually in response to political pressure or a backlash." },
  { term: "Vote Share vs. Seat Share", def: "The percentage of the national vote a party wins, versus the percentage of Commons seats it ends up with — under First-Past-the-Post these two numbers can differ dramatically." },
  { term: "Vox Pop", def: "Brief, informal interviews with members of the public, used by broadcasters and newspapers to gauge a snapshot of popular reaction to a political event." },
  { term: "War Chest", def: "The funds a party has built up and set aside, ready to spend on fighting an election campaign." },
  { term: "Wedge Issue", def: "A divisive issue raised deliberately to split an opponent's own base of supporters, rather than to win over the wider public." },
  { term: "Westminster Bubble", def: "A dismissive term for the insular preoccupations of politicians, advisers, and journalists based in and around Parliament, seen as detached from the concerns of ordinary voters." },
  { term: "Youthquake", def: "A significant political or cultural shift attributed to the actions or turnout of young people.", example: "Widely used to describe youth turnout in the 2017 general election, though the scale of that effect was later disputed by researchers." },
];

const TABS = [
  { key: "procedure", label: "Parliamentary Terms", accent: COLORS.brass },
  { key: "politics", label: "Political Terms & Issues", accent: "#6E4B6E" },
];

function groupByLetter(terms) {
  const groups = [];
  let current = null;
  for (const t of terms) {
    const letter = t.term[0].toUpperCase();
    if (!current || current.letter !== letter) {
      current = { letter, items: [] };
      groups.push(current);
    }
    current.items.push(t);
  }
  return groups;
}

function StageFlowDiagram({ items, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, rowGap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {i > 0 && <span style={{ color: accent, fontSize: 12, fontWeight: 700 }}>→</span>}
          <div style={{ background: `${accent}14`, border: `1px solid ${accent}45`, borderRadius: 7, padding: "5px 9px", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11.5, color: COLORS.ink, whiteSpace: "nowrap" }}>
            {s}
          </div>
        </div>
      ))}
    </div>
  );
}

function BackForthDiagram({ a, b, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ background: `${accent}14`, border: `1px solid ${accent}45`, borderRadius: 8, padding: "8px 16px", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.ink }}>{a}</div>
      <span style={{ color: accent, fontSize: 18, fontWeight: 700 }}>⇄</span>
      <div style={{ background: `${accent}14`, border: `1px solid ${accent}45`, borderRadius: 8, padding: "8px 16px", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLORS.ink }}>{b}</div>
    </div>
  );
}

function SpectrumDiagram({ left, right, accent }) {
  return (
    <div style={{ maxWidth: 260 }}>
      <div style={{ height: 6, borderRadius: 999, background: `linear-gradient(90deg, #C8102E, ${accent}, #0087DC)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11, color: COLORS.inkSoft }}>
        <span>{left}</span>
        <span>Centre</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function SeatBarDiagram({ segments }) {
  return (
    <div style={{ maxWidth: 320 }}>
      <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden" }}>
        {segments.map((s, i) => (
          <div key={i} style={{ width: `${s.pct}%`, background: s.color }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        {segments.map((s, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TermDiagram({ diagram, accent }) {
  if (diagram.type === "stages") return <StageFlowDiagram items={diagram.items} accent={accent} />;
  if (diagram.type === "backforth") return <BackForthDiagram a={diagram.a} b={diagram.b} accent={accent} />;
  if (diagram.type === "spectrum") return <SpectrumDiagram left={diagram.left} right={diagram.right} accent={accent} />;
  if (diagram.type === "seats") return <SeatBarDiagram segments={diagram.segments} />;
  return null;
}

function TermRow({ t, isOpen, onToggle, accent }) {
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
      <button
        onClick={onToggle}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "13px 2px", cursor: "pointer", textAlign: "left", gap: 10 }}
      >
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16.5, color: COLORS.ink }}>{t.term}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: accent, fontSize: 13, flexShrink: 0 }}>▾</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 2px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.65 }}>{t.def}</div>
              {t.example && (
                <div style={{ background: `${accent}0c`, borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: "9px 13px" }}>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: COLORS.ink }}>Example: </span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{t.example}</span>
                </div>
              )}
              {t.diagram && <TermDiagram diagram={t.diagram} accent={accent} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Glossary() {
  const [tab, setTab] = useState("procedure");
  const [query, setQuery] = useState("");
  const [openTerm, setOpenTerm] = useState(null);

  const activeTab = TABS.find((t) => t.key === tab);
  const activeTerms = tab === "procedure" ? PROCEDURE_TERMS : POLITICS_TERMS;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeTerms;
    return activeTerms.filter((t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q));
  }, [activeTerms, query]);

  const groups = useMemo(() => groupByLetter(filtered), [filtered]);

  function selectTab(key) {
    withScrollPreserved(() => {
      setTab(key);
      setOpenTerm(null);
    });
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconGlossary}
        kicker="Public Record · Glossary"
        title="Parliamentary jargon, in plain English"
        subtitle="Every term you'll run into on this site, and in most UK political reporting, explained simply — search, or tap a term to expand it."
      />

      <div style={{ display: "flex", gap: 2, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: 3, marginTop: 24, marginBottom: 20, width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => selectTab(t.key)}
            style={{
              position: "relative",
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: tab === t.key ? "#fff" : COLORS.inkSoft,
              transition: "color 0.15s",
            }}
          >
            {tab === t.key && (
              <motion.span
                layoutId="glossary-tab-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                style={{ position: "absolute", inset: 0, background: COLORS.ink, borderRadius: 999, zIndex: 0 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a term…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "12px 16px 12px 40px",
            fontFamily: FONT_BODY, fontSize: 15, border: `1px solid ${COLORS.hairline}`, borderRadius: 10,
            background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 20 }}>
        {filtered.length} term{filtered.length === 1 ? "" : "s"}{query.trim() ? ` matching "${query}"` : ""}
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>No terms match "{query}".</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {groups.map((group) => (
            <div key={group.letter}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
                <span
                  style={{
                    flexShrink: 0, width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: activeTab.accent, background: `${activeTab.accent}1a`,
                  }}
                >
                  {group.letter}
                </span>
                <span style={{ flex: 1, height: 1, background: COLORS.hairline }} />
              </div>
              <div>
                {group.items.map((t) => (
                  <TermRow
                    key={t.term}
                    t={t}
                    accent={activeTab.accent}
                    isOpen={openTerm === t.term}
                    onToggle={() => withScrollPreserved(() => setOpenTerm(openTerm === t.term ? null : t.term))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
