// Commons division titles are written for people who already know the
// procedure — "Health Bill: Report Stage: New Clause 142" — so this turns
// each one into what the vote actually was, and what saying Aye or No
// meant. It only classifies the *kind* of vote from the title's own wording;
// it never claims to know what a particular clause or amendment contained,
// because the title doesn't say. Anything it doesn't recognise gets a
// generic, honest explanation rather than a guess.

const clean = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const lower = (s) => s.toLowerCase();

function result(kind, plain, ayeMeans, noMeans, extra = {}) {
  return { kind, plain, ayeMeans, noMeans, ...extra };
}

// "Taxation (Energy and Vehicles) Bill Committee" -> stage "committee";
// "Public Office (Accountability) Bill Report Stage" -> "report".
function stageFrom(billPart, rest) {
  const s = lower(`${billPart} ${rest}`);
  if (/report stage/.test(s)) return "report";
  if (/\bcommittee\b/.test(s)) return "committee";
  return null;
}

const STAGE_TEXT = {
  report: "at Report Stage, when the whole House can still change the bill",
  committee: "at Committee Stage, the line-by-line examination of the bill",
};

function billVote(billName, billPart, rest) {
  const r = lower(rest);
  const stage = stageFrom(billPart, rest);
  const where = stage ? ` ${STAGE_TEXT[stage]}` : "";
  const fromLords = /\[lords\]/i.test(billName);
  const name = billName.replace(/\s*\[Lords\]/i, "");
  const subject = { billName: name, fromLords };

  if (/reasoned amendment/.test(r)) {
    return result(
      "reasoned-amendment",
      `An amendment proposed that the Commons should decline to give the ${name} a Second Reading, setting out reasons. If this had passed, the bill would effectively have been stopped there.`,
      "Supported stopping the bill at this stage.",
      "Rejected that, so the bill could carry on.",
      subject
    );
  }
  if (/^second reading/.test(r)) {
    return result(
      "second-reading",
      `The ${name}'s Second Reading: the first main debate, where MPs vote on whether the bill's overall idea should go any further.`,
      "In favour of the bill moving on to the next stage.",
      "Against — to stop it going any further.",
      subject
    );
  }
  if (/^third reading/.test(r)) {
    return result(
      "third-reading",
      `The ${name}'s Third Reading: the final Commons vote on the bill as it now stands, after all the changes.`,
      "In favour of the bill, as amended, passing this House.",
      "Against it passing.",
      subject
    );
  }
  if (/lords amendment/.test(r) || /consideration of lords/.test(r)) {
    const n = r.match(/lords amendment\s*(\d+\w*)/)?.[1];
    return result(
      "lords-amendment",
      `The House of Lords changed the ${name}, and the Commons voted on whether to accept ${n ? `Lords Amendment ${n}` : "that change"}. If the two Houses disagree, the bill goes back and forth between them.`,
      "Accepted the Lords' change.",
      "Rejected the Lords' change and sent it back.",
      subject
    );
  }
  const clause = r.match(/new clause\s*(\d+\w*)/);
  if (clause) {
    return result(
      "new-clause",
      `A vote on adding a new section (New Clause ${clause[1]}) to the ${name}${where}. The title doesn't say what the clause does — the bill's own page on bills.parliament.uk does.`,
      "In favour of adding it.",
      "Against adding it.",
      subject
    );
  }
  const schedule = r.match(/new schedule\s*(\d+\w*)/);
  if (schedule) {
    return result(
      "new-schedule",
      `A vote on adding a new schedule (a detailed annex, New Schedule ${schedule[1]}) to the ${name}${where}.`,
      "In favour of adding it.",
      "Against adding it.",
      subject
    );
  }
  const amendment = r.match(/amendment\s*(\d+\w*)/);
  if (amendment) {
    return result(
      "amendment",
      `A vote on a proposed change (Amendment ${amendment[1]}) to the ${name}${where}. The title doesn't say what the change is — the bill's own page does.`,
      "In favour of making the change.",
      "Against making the change.",
      subject
    );
  }
  if (/programme motion/.test(r)) {
    return result(
      "programme",
      `A vote on the timetable for debating the ${name}, setting how long each stage may take.`,
      "In favour of that timetable.",
      "Against that timetable.",
      subject
    );
  }
  if (/money resolution|ways and means/.test(r)) {
    return result(
      "money-resolution",
      `A vote authorising the spending or tax changes the ${name} involves. Without it, those parts of the bill can't go ahead.`,
      "In favour of authorising it.",
      "Against authorising it.",
      subject
    );
  }
  return result(
    "bill-other",
    `A recorded vote on the ${name}${where}. The title doesn't say which part of the bill this concerned.`,
    "In favour of the motion put to the House.",
    "Against the motion put to the House.",
    subject
  );
}

export function explainDivision(rawTitle) {
  const title = clean(rawTitle);
  if (!title) return null;
  const t = lower(title);

  if (/^closure motion/.test(t)) {
    return result(
      "closure",
      "A vote to end the current debate and go straight to the decision. It's used to stop a debate running on, and is a normal part of getting business through.",
      "In favour of ending the debate now.",
      "Against — wanted the debate to continue."
    );
  }

  const opp = title.match(/^Opposition Day\s*[:\-–]?\s*(.*)$/i);
  if (opp) {
    const topic = opp[1].trim();
    return result(
      "opposition-day",
      `An Opposition Day debate${topic ? ` on “${topic}”` : ""}: on these days the opposition parties choose the topic. The vote was on their motion. It usually isn't legally binding, but it shows where MPs stand.`,
      "Supported the opposition's motion.",
      "Opposed the opposition's motion.",
      { topic }
    );
  }

  if (/\b(regulations|order|rules|scheme)\s+20\d\d\b/.test(t) || (/^draft /.test(t) && !/code of practice|^draft .*guidance/.test(t))) {
    const subject = title.replace(/^draft\s+/i, "").replace(/\s+20\d\d$/, "").trim();
    return result(
      "statutory-instrument",
      `A vote on whether to approve ${subject ? `the ${subject}` : "draft secondary legislation"} — detailed rules ministers made using powers an earlier Act gave them. This kind only takes effect if Parliament approves it.`,
      "Approved it.",
      "Voted against approving it.",
      { subject }
    );
  }

  if (/^draft .*code of practice/.test(t) || /^draft .*(guidance|code)\b/.test(t)) {
    return result(
      "draft-code",
      "A vote on whether to approve a draft official code of practice — formal guidance that ministers have laid before Parliament and that needs MPs' approval.",
      "Approved it.",
      "Voted against approving it."
    );
  }

  if (/^motion to sit in private|^sitting in private|^(motion for )?strangers/.test(t)) {
    return result(
      "private-sitting",
      "A vote on whether the Commons should sit in private, with the public and press excluded. It is rare, and used for sensitive matters.",
      "In favour of sitting in private.",
      "Against sitting in private."
    );
  }

  if (/^(motion for )?(the )?adjournment|^motion to adjourn/.test(t)) {
    return result(
      "adjournment",
      "A vote on whether to end the day's sitting, or to break for a recess. An adjournment debate is also how backbench MPs raise issues.",
      "In favour of adjourning.",
      "Against adjourning."
    );
  }

  if (/^humble address|^motion for an humble address/.test(t)) {
    return result(
      "humble-address",
      "A formal request to the King, which MPs sometimes use to try to make the government release official documents.",
      "In favour of making the request.",
      "Against making the request."
    );
  }

  if (/^business of the house|^business motion|^programme motion/.test(t)) {
    return result(
      "business",
      "A vote on how the House organises its time and business — for example when bills will be debated.",
      "In favour of the arrangements proposed.",
      "Against the arrangements proposed."
    );
  }

  if (/^(main |supplementary )?estimates?\b|^supply\b/.test(t)) {
    return result(
      "estimates",
      "A vote on a government department's spending plans for the year.",
      "In favour of those spending plans.",
      "Against those spending plans."
    );
  }

  const bill = title.match(/^(.*?\bBill(?:\s*\[Lords\])?)(?:\s*:\s*|\s+)?(.*)$/i);
  if (bill) return billVote(bill[1].trim(), bill[1].trim(), bill[2].trim());

  return result(
    "other",
    "A recorded vote (a “division”) in the House of Commons, where MPs walk through the Aye or No lobby to be counted. The title doesn't say what sort of motion it was.",
    "In favour of the motion put to the House.",
    "Against the motion put to the House."
  );
}

// "They voted Aye — in favour of…" for a specific MP's vote.
export function describeVote(explanation, votedAye) {
  if (!explanation || votedAye == null) return null;
  return votedAye ? explanation.ayeMeans : explanation.noMeans;
}
