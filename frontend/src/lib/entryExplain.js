// A short plain-English account of one entry on the What changed, Today and Coming up pages: what kind of thing it is, and what it is for or proposes to do. Everything here is
// how Parliament's procedures work in general, or the entry's own wording; nothing claims to know what a particular debate, bill or committee will say or decide. Where a bill's
// own purpose is known, the page adds it from the bills table (see story/Entries.jsx). Pure, so it is tested without a page.
//
// An entry is { kind, title, house ("C" | "L" | "J"), where, about, stage, detail, ... }. The kinds are the calendar's (debate, statement, questions, hearing, billcommittee, regs,
// bill) and the feed's (bill, vote, money, petition, standards, election).

import { explainStage } from "./billExplain";
import { explainDivision } from "./divisionExplainer";

const HOUSE = { C: "the House of Commons", L: "the House of Lords", J: "both Houses" };
const MEMBERS = { C: "MPs", L: "peers", J: "MPs and peers" };
const who = (h) => MEMBERS[h] ?? "MPs";
const where = (h) => HOUSE[h] ?? "Parliament";

const DEBATE = [
  [/opposition day/i, () => ({
    label: "Opposition day debate",
    what: "One of the days set aside each year for the opposition parties, rather than the government, to choose what the Commons debates.",
    does: "The debate is on a motion put by the opposition. It usually ends in a vote. A motion like this states a view or asks the government to do something; it does not change the law by itself.",
  })],
  [/leave be given to bring in a bill/i, () => ({
    label: "Ten Minute Rule Bill",
    what: "A backbench MP asks the Commons for permission to introduce a bill, with a short speech of up to ten minutes. Someone may speak against it, then the House votes.",
    does: "If the House agrees, the bill is introduced and gets its first reading. Most such bills go no further, but they are a way of raising an issue and sometimes lead to change.",
  })],
  [/general debate/i, () => ({
    label: "General debate",
    what: "A debate on a subject rather than on a bill, usually without a vote on a proposal.",
    does: "It lets MPs put their views on the record and hear a minister respond. It does not change the law.",
  })],
  [/budget debate|autumn budget|spring statement/i, () => ({
    label: "Budget debate",
    what: "The days of debate that follow the Chancellor's Budget statement, when MPs and peers discuss the government's plans for tax and spending.",
    does: "The Budget's tax changes become law later, through a Finance Bill that is debated and voted on separately.",
  })],
  [/adjournment/i, () => ({
    label: "Adjournment debate",
    what: "A short debate at the end of the day, on a subject an MP has chosen, answered by a minister.",
    does: "It ends without a vote. It is a way for an MP to press the government on a local or national concern.",
  })],
];

function debate(e) {
  if (e.where === "Westminster Hall") return {
    label: "Westminster Hall debate",
    what: "A shorter debate held in Westminster Hall, a second debating room alongside the Commons chamber, on a subject an MP has asked to raise.",
    does: "A minister replies at the end. There is no vote, so it does not change the law, but it puts the issue on the record and in front of the government.",
  };
  if (e.where === "Grand Committee") return {
    label: "Lords Grand Committee",
    what: "A meeting of the Lords Grand Committee, held in a room off the chamber, which any peer can attend.",
    does: "It goes through a bill or a topic in detail, with a minister replying. It does not take votes, so decisions that need a vote are taken later in the main chamber.",
  };
  for (const [re, make] of DEBATE) if (re.test(e.title)) return make(e);
  return {
    label: e.h === "L" ? "Lords debate" : "Commons debate",
    what: `A debate in the ${e.h === "L" ? "House of Lords" : "House of Commons"} chamber. ${who(e.h)[0].toUpperCase()}${who(e.h).slice(1)} speak on the subject in the title, and a minister usually replies.`,
    does: "Whether there is a vote depends on what is being debated. A debate on a bill or a motion can end in one; a debate on a subject usually does not.",
  };
}

const QUESTIONS = (e) => {
  if (/prime minister/i.test(e.title)) return {
    label: "Prime Minister's Questions",
    what: "Every Wednesday the Prime Minister answers questions from MPs in the Commons, starting with a question from the Leader of the Opposition.",
    does: "Nothing is proposed or voted on. It is the main weekly moment when the government is questioned in public.",
  };
  if (/business questions/i.test(e.title)) return {
    label: "Business Questions",
    what: "The Leader of the House of Commons announces the business for the coming weeks and MPs ask about it, or ask for a debate or statement on a subject.",
    does: "It does not change the law. It is how MPs push for time to be given to the issues they care about.",
  };
  if (e.h === "L") return {
    label: "Lords oral question",
    what: "A peer asks the government a question in the Lords chamber and a minister answers. Other peers can then ask follow-up questions.",
    does: "Nothing is voted on. It is how peers hold the government to account and put an issue on the record.",
  };
  return {
    label: "Questions to ministers",
    what: `Ministers from ${/\(including topical/i.test(e.title) ? e.title.replace(/\s*\(including Topical Questions\)\s*/i, "") : e.title} answer MPs' questions in the Commons. Questions are handed in beforehand, and the last part, topical questions, can be on anything the department does.`,
    does: "Nothing is voted on. The point is to make ministers explain and defend what their department is doing.",
  };
};

const ENTRY = {
  statement: (e) => ({
    label: "Ministerial statement",
    what: `A minister tells ${where(e.h)} about a decision or event, then ${who(e.h)} can question them on it.`,
    does: "A statement does not change the law, but it is how the government announces something to Parliament before the public hears the details elsewhere.",
  }),
  debate,
  questions: QUESTIONS,
  hearing: (e) => ({
    label: "Committee evidence session",
    what: `A select committee of ${who(e.h)} questions witnesses in public.${e.about ? ` Subject: ${e.about}.` : ""} Witnesses can be ministers, officials, experts or people affected by the issue.`,
    does: "The committee uses what it hears to write a report with recommendations, and the government is expected to reply to it in writing. It is also public, so you can watch it live or read the transcript.",
  }),
  billcommittee: (e) => ({
    label: "Bill committee",
    what: `A small committee of MPs is going through the ${e.title} line by line. Each part of the bill is discussed, and MPs can propose and vote on changes.`,
    does: "Whatever the committee agrees is sent back to the whole Commons for report stage, where further changes can be made.",
  }),
  regs: (e) => ({
    label: e.where === "Grand Committee" ? "Lords Grand Committee on rules" : "Delegated legislation committee",
    what: e.h === "L"
      ? "A debate on a statutory instrument: a rule or regulation that a minister has made under powers an Act of Parliament gave them, rather than a new Act."
      : "A committee of MPs debates a statutory instrument: a rule or regulation that a minister has made under powers an Act of Parliament gave them. The calendar names the committee, not the instrument; the committee's page on Parliament's site lists what it is considering.",
    does: "Parliament can approve or reject a statutory instrument but cannot usually change its wording. If it is approved it takes effect as law.",
  }),
};

const BILL_MORE = "A bill is a proposed law. To become an Act it has to pass through several stages in both Houses, and the stage named here is where this one is.";

const FEED = {
  bill: (e) => {
    const s = explainStage(e.stage ?? e.detail, { isAct: /became law/i.test(e.detail ?? ""), isDefeated: /^defeated/i.test(e.detail ?? "") });
    return {
      label: "Bill",
      doesTitle: "What happens next",
      what: `${BILL_MORE}${s ? ` ${s.means}` : ""}`,
      does: s?.next ? `Next: ${s.next}` : "Parliament's page for the bill has the full text and its history.",
    };
  },
  vote: (e) => {
    const x = explainDivision(e.title);
    return {
      label: "Vote in the Commons",
      doesTitle: "What Aye and No meant",
      what: x ? `${x.plain}` : "A recorded vote in the House of Commons, called a division. MPs walk through one of two lobbies, Aye or No, and are counted.",
      does: x ? `Aye: ${x.ayeMeans} No: ${x.noMeans}` : "If more MPs vote Aye than No, the question is agreed. The title does not say more than that, so the page for the vote on Parliament's site has the detail.",
    };
  },
  money: () => ({
    label: "Declared interest",
    what: "MPs must declare in the public Register of Members' Financial Interests certain money and gifts they receive, such as donations, outside earnings, gifts and trips, so that anyone can see who may be influencing them.",
    does: "Nothing is proposed. A declaration does not mean anything improper happened; it means the money is out in the open and can be checked.",
  }),
  petition: (e) => ({
    label: "Petition",
    what: "Anyone in the UK can start a petition on Parliament's petitions site. At 10,000 signatures the government must respond in writing, and at 100,000 the Petitions Committee considers it for a debate.",
    does: /debate/i.test(e.title) ? "A debate in Parliament lets MPs discuss the issue, and a minister replies. It does not by itself change the law." : "The response says whether the government agrees, what it is already doing, and why it will or will not act.",
  }),
  standards: () => ({
    label: "Conduct report",
    what: "The Committee on Standards, backed by the Parliamentary Commissioner for Standards, looks into complaints that an MP broke the rules on conduct and publishes what it found.",
    does: "A report can recommend a sanction, such as an apology or a suspension from the House. The House then decides whether to agree it.",
  }),
  election: () => ({
    label: "By-election",
    what: "An election held in one constituency when its MP leaves the Commons between general elections, for example because they have died or resigned.",
    does: "Voters in that area choose a new MP. The result can change the number of seats a party holds.",
  }),
};

// { label, what, does } for an entry. Falls back to a plain line, so every entry opens with something true.
export function explainEntry(e) {
  const make = e.past ? FEED[e.kind] : (ENTRY[e.kind] ?? FEED[e.kind]);
  if (make) return { doesTitle: "What it is for", ...make(e) };
  return { label: "Entry", doesTitle: "What it is for", what: "An item in Parliament's calendar.", does: "Parliament's own page has more detail." };
}
