// A plain "which elections can I vote in?" check. It is deliberately cautious: it says yes only where the rules are clear, "check" where they
// depend on details (such as an EU citizen's country and when they arrived), and always sends people to gov.uk, because the rules change.
//
// age:         "adult" (18 or over), "teen" (16 or 17), "child" (under 16)
// nation:      "england" | "scotland" | "wales" | "ni"
// citizenship: "british-irish" | "commonwealth" | "eu" | "other"

const DEVOLVED = { scotland: "Scottish Parliament", wales: "Senedd (the Welsh Parliament)", ni: "Northern Ireland Assembly" };

// Scotland and Wales let 16 and 17 year olds vote in their own elections, and anyone legally living there, whatever their nationality.
const votesYoung = (nation) => nation === "scotland" || nation === "wales";

export function canIVote({ age, nation, citizenship }) {
  const adult = age === "adult";
  const teen = age === "teen";
  const rows = [];

  // The UK general election.
  let general;
  if (adult && (citizenship === "british-irish" || citizenship === "commonwealth")) {
    general = { result: "yes", note: citizenship === "commonwealth" ? "As a Commonwealth citizen you can vote if you have permission to live in the UK, or do not need it." : "You can vote in a UK general election." };
  } else if (teen) {
    general = { result: "no", note: "You have to be 18 for a UK general election. The government has said it plans to lower this to 16, so check gov.uk to see whether that has come into force." };
  } else if (!adult) {
    general = { result: "no", note: "You are too young to vote in elections yet." };
  } else {
    general = { result: "no", note: "Only British, Irish and qualifying Commonwealth citizens can vote in a UK general election." };
  }
  rows.push({ key: "general", label: "UK general election", ...general });

  // The devolved parliament, where there is one.
  if (DEVOLVED[nation]) {
    let devolved;
    if (votesYoung(nation)) {
      if (adult || teen) devolved = { result: "yes", note: `Anyone aged 16 or over who is legally living in ${nation === "scotland" ? "Scotland" : "Wales"} can vote, whatever their nationality.` };
      else devolved = { result: "no", note: "You have to be 16 to vote here." };
    } else if (adult && (citizenship === "british-irish" || citizenship === "commonwealth")) {
      devolved = { result: "yes", note: "You can vote in Northern Ireland Assembly elections." };
    } else if (adult) {
      devolved = { result: "no", note: "Only British, Irish and qualifying Commonwealth citizens can vote for the Northern Ireland Assembly." };
    } else {
      devolved = { result: "no", note: "You have to be 18 to vote for the Northern Ireland Assembly." };
    }
    rows.push({ key: "devolved", label: DEVOLVED[nation], ...devolved });
  }

  // Council elections.
  let local;
  if (votesYoung(nation)) {
    local = adult || teen
      ? { result: "yes", note: "Anyone aged 16 or over who is legally living here can vote in council elections." }
      : { result: "no", note: "You have to be 16 to vote here." };
  } else if (!adult) {
    local = { result: "no", note: "You have to be 18 to vote in council elections here." };
  } else if (citizenship === "british-irish" || citizenship === "commonwealth") {
    local = { result: "yes", note: "You can vote in council elections." };
  } else if (citizenship === "eu") {
    local = { result: "check", note: "Some EU citizens can vote in council elections, depending on their country and when they arrived. Check on gov.uk." };
  } else {
    local = { result: "no", note: "Citizens of other countries cannot usually vote in council elections here. Check on gov.uk if your situation is unusual." };
  }
  rows.push({ key: "local", label: "Council elections", ...local });
  return rows;
}
