// The questions and answers behind the "Who do I contact?" guide on the How to get something done page (components/story/GuideFinder.jsx). Every route, time limit and rule in
// the answers is taken from that page's own chapters, so the guide and the page cannot disagree. Pure data and two small functions, so it can be tested.
//
// A question is { q, hint, options: [{ label, hint, icon, to, here?, flag? }] }. `to` names the next question or an answer. In an answer's route, `here` is the step the reader has
// reached (0 is the first), so the steps before it show as done and that one says "You are here".

export const COLOURS = { council: "#B45A3C", nhs: "#2C7DA0", dept: "#2C7DA0", police: "#5A4FCF", foi: "#C88A1E", unsure: "#1F6F5C" };

export const QUESTIONS = {
  start: {
    q: "What do you need help with?",
    hint: "Pick the closest one. You can go back at any point.",
    options: [
      { label: "A council service", hint: "Bins, planning, housing, roads, care", icon: "council", to: "councilWhere" },
      { label: "The NHS", hint: "A hospital or GP practice in England", icon: "nhs", to: "nhsStage" },
      { label: "A government department", hint: "A UK department or its agencies", icon: "dept", to: "deptStage" },
      { label: "The police", hint: "How an officer or force behaved", icon: "police", to: "policeSerious" },
      { label: "I want information from a public body", hint: "Records, figures, decisions", icon: "foi", to: "foiStage" },
      { label: "I'm not sure who is responsible", hint: "Start from who runs the service", icon: "unsure", to: "unsure" },
    ],
  },
  councilWhere: {
    q: "Where do you live?",
    hint: "Different parts of the UK have different ombudsmen.",
    options: [
      { label: "England", hint: "", icon: "pin", to: "councilKind" },
      { label: "Scotland, Wales or Northern Ireland", hint: "", icon: "pin", to: "otherNation" },
    ],
  },
  councilKind: {
    q: "What is the complaint about?",
    hint: "Council housing has its own ombudsman.",
    options: [
      { label: "Council housing", hint: "A home you rent from the council", icon: "house", to: "councilHousing" },
      { label: "Anything else the council does", hint: "Bins, planning, roads, schools, care and the rest", icon: "council", to: "councilStage" },
    ],
  },
  councilStage: {
    q: "How far have you got?",
    hint: "This shows where you are on the route.",
    options: [
      { label: "I have not complained yet", hint: "", icon: "start", to: "council", here: 0 },
      { label: "I complained to the service and I am not happy", hint: "", icon: "step", to: "council", here: 1 },
      { label: "The complaints officer replied and I am still unhappy", hint: "", icon: "step", to: "council", here: 2 },
      { label: "I complained and the council has not replied", hint: "", icon: "wait", to: "council", here: 2, flag: "slow" },
    ],
  },
  nhsStage: {
    q: "How far have you got?",
    hint: "The Ombudsman expects you to go to the organisation first.",
    options: [
      { label: "I have not complained yet", hint: "", icon: "start", to: "nhs", here: 0 },
      { label: "I complained to the hospital or practice and I am not happy", hint: "", icon: "step", to: "nhs", here: 1 },
    ],
  },
  deptStage: {
    q: "How far have you got?",
    hint: "The Ombudsman expects you to go to the department first.",
    options: [
      { label: "I have not complained yet", hint: "", icon: "start", to: "dept", here: 0 },
      { label: "I complained to the department and I am not happy", hint: "", icon: "step", to: "dept", here: 1 },
    ],
  },
  policeSerious: {
    q: "Did it involve a death or a serious injury?",
    hint: "That decides who looks at it.",
    options: [
      { label: "No", hint: "", icon: "step", to: "police", flag: "force" },
      { label: "Yes", hint: "", icon: "alert", to: "police", flag: "serious" },
    ],
  },
  foiStage: {
    q: "Where are you with your request?",
    hint: "Each step has its own deadline.",
    options: [
      { label: "I have not asked yet", hint: "", icon: "start", to: "foi", here: 0 },
      { label: "I am ready to write the request", hint: "", icon: "step", to: "foi", here: 1 },
      { label: "I have asked and I am waiting", hint: "", icon: "wait", to: "foi", here: 2 },
      { label: "They refused or I disagree with the answer", hint: "", icon: "step", to: "foi", here: 3 },
      { label: "The internal review did not settle it", hint: "", icon: "step", to: "foi", here: 4 },
      { label: "The Information Commissioner has decided and I still disagree", hint: "", icon: "step", to: "foi", here: 5 },
    ],
  },
};

// `chapter` is the number of the chapter further down the page with the whole story.
export const ANSWERS = {
  council: ({ flag }) => ({
    title: "Complain to the council, then the Ombudsman",
    lead: "The Local Government and Social Care Ombudsman looks at complaints about councils in England once the council has had its chance to put things right.",
    colour: COLOURS.council, chapter: 2,
    steps: [
      { title: "Complain to the council service", text: "Tell the service that did the thing. Say what happened and what you want." },
      { title: "Then the complaints officer", text: "If you are still unhappy, go to the council's complaints officer." },
      { title: "Then the Ombudsman", text: "You can ask the Local Government and Social Care Ombudsman to look at it. It is free." },
    ],
    callout: flag === "slow" ? "The Ombudsman also takes a complaint if the council has not replied in a reasonable time, which in most cases it thinks should be up to 16 weeks. Some complaints, such as in children's services, take longer." : null,
    facts: [{ label: "Time limit", value: "12 months", note: "The Ombudsman cannot normally look at a complaint if more than 12 months have passed since you first knew about the problem." }],
    links: [{ href: "#/councillors", label: "Your councillors" }, { href: "#/councils", label: "Your council" }],
  }),
  councilHousing: () => ({
    title: "Council housing complaints go to the Housing Ombudsman",
    lead: "Council housing complaints go to the Housing Ombudsman instead of the Local Government and Social Care Ombudsman.",
    colour: COLOURS.council, chapter: 2,
    steps: [{ title: "Start with the body that runs the service", text: "A rule of thumb: the body that runs the service is the first place to complain." }],
    links: [{ href: "#/councillors", label: "Your councillors" }],
  }),
  otherNation: () => ({
    title: "A different ombudsman applies where you live",
    lead: "If you live in Scotland, Wales or Northern Ireland, a different ombudsman applies. The routes in this guide are for England.",
    colour: COLOURS.council, chapter: 2,
    steps: [{ title: "Start with the body that runs the service", text: "A rule of thumb: the body that runs the service is the first place to complain." }],
    links: [{ href: "#/devolved", label: "Devolved governments" }],
  }),
  nhs: () => ({
    title: "Complain to the NHS organisation, then the Ombudsman or your MP",
    lead: "The Parliamentary and Health Service Ombudsman looks at complaints about the NHS in England. It expects you to go to the organisation first.",
    colour: COLOURS.nhs, chapter: 3,
    steps: [
      { title: "Complain to the organisation", text: "The hospital, GP practice or department should get the chance to look into your concerns first." },
      { title: "Go to the Ombudsman or your MP", text: "You can complain to the Ombudsman directly, or ask your MP to pass the complaint on." },
    ],
    facts: [{ label: "Time limit", value: "A year", note: "The Ombudsman generally looks at cases brought within a year of when you first knew you wanted to complain. Its site lists current waiting times, which can be several months." }],
    links: [{ href: "#/myMP", label: "Find your MP" }],
  }),
  dept: () => ({
    title: "Complain to the department, then ask your MP",
    lead: "The Parliamentary and Health Service Ombudsman looks at complaints about UK government departments. It expects you to go to the department first.",
    colour: COLOURS.dept, chapter: 3,
    steps: [
      { title: "Complain to the organisation", text: "The department should get the chance to look into your concerns first." },
      { title: "Ask your MP", text: "An MP has to refer the complaint. You can fill in the Ombudsman's form and ask your MP or their office to sign it." },
    ],
    facts: [{ label: "Time limit", value: "A year", note: "The Ombudsman generally looks at cases brought within a year of when you first knew you wanted to complain. Its site lists current waiting times, which can be several months." }],
    links: [{ href: "#/myMP", label: "Find your MP" }],
  }),
  police: ({ flag }) => ({
    title: flag === "serious" ? "Contact the force, or the Independent Office for Police Conduct" : "Complain to the police force",
    lead: flag === "serious"
      ? "The Independent Office for Police Conduct only independently investigates the most serious and sensitive matters, such as deaths and serious injuries."
      : "A complaint about the police usually starts with the force itself.",
    colour: COLOURS.police, chapter: 4,
    steps: [
      { title: "Where to complain", text: "To the force directly, by phone on 101, at a police station, or through the Independent Office for Police Conduct, which passes it to the force." },
      { title: "Ask for it to be recorded", text: "You can ask for your complaint to be formally recorded, which gives it formal status under the Police Reform Act 2002." },
      { title: "Reviews and appeals", text: "The force should tell you in writing whether you have the right to ask for a review and by when. Check the deadline it gives you." },
    ],
    note: "The police complaints body does not deal with compensation. For that you contact the force concerned directly.",
    links: [{ href: "#/watchdogs", label: "Watchdogs" }],
  }),
  foi: () => ({
    title: "Ask for information, step by step",
    lead: "You have the right to ask a public body for recorded information it holds, under the Freedom of Information Act. You do not have to say which law you are using.",
    colour: COLOURS.foi, chapter: 5,
    steps: [
      { title: "Check it is not already public", text: "Look at the body's website, its disclosure log and WhatDoTheyKnow first." },
      { title: "Write a clear, simple request", text: "Ask for specific recorded information. Numbered points help. If the body asks you to clarify, the clock does not start until you do." },
      { title: "Wait up to 20 working days", text: "Public bodies usually need to reply within 20 working days. They can extend to weigh the public interest, but must tell you within the first 20 days." },
      { title: "If you are unhappy, ask for an internal review", text: "Write to the body and explain why you disagree. It should usually reply within another 20 working days. Act promptly: it could refuse if you wait more than 40 working days." },
      { title: "Then complain to the Information Commissioner", text: "Within six weeks of the review outcome or your last substantive contact. The ICO assesses independently, does not act as your representative and does not award compensation." },
      { title: "Last, a tribunal", text: "If you still disagree after the ICO's decision, you can appeal to the First-tier Tribunal (Information Rights)." },
    ],
    facts: [
      { label: "Reply due in", value: "20 days", note: "Working days, usually." },
      { label: "Cost limit, central government", value: "£600", note: "A body can refuse a request that would cost more than this to answer. For other public authorities the limit is £450." },
    ],
    links: [{ href: "https://www.whatdotheyknow.com/", label: "WhatDoTheyKnow", external: true }],
  }),
  unsure: () => ({
    title: "Start with the body that runs the service",
    lead: "Who can help depends on who is responsible. A rule of thumb: the body that runs the service is the first place to complain.",
    colour: COLOURS.unsure, chapter: 1,
    points: [
      "County councils run education, transport, planning, social care, libraries, waste management and trading standards.",
      "District, borough and city councils handle rubbish collection, recycling, Council Tax, housing and planning applications.",
      "Unitary authorities, London boroughs and metropolitan boroughs provide all of these in one council.",
      "Parish, community and town councils look after allotments, bus shelters, community centres and play areas.",
    ],
    links: [{ href: "#/councils", label: "Find your council" }, { href: "#/myMP", label: "Find your MP" }],
  }),
};

// The answer reached by following `picks` (the index chosen at each question, from the first). Returns { node, answer, trail } where `node` is the question to ask next
// (or null once an answer is reached) and `trail` lists the questions answered so far with the option chosen.
export function walk(picks) {
  let id = "start";
  const trail = [];
  for (const pick of picks) {
    const question = QUESTIONS[id];
    const option = question?.options[pick];
    if (!option) break;
    trail.push({ id, q: question.q, option });
    if (ANSWERS[option.to]) return { node: null, answer: ANSWERS[option.to]({ flag: option.flag }), here: option.here ?? null, trail };
    id = option.to;
  }
  return { node: id, answer: null, here: null, trail };
}
