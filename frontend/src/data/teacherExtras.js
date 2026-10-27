// Extra help for the teacher, kept apart from what the pupils see: likely questions and good answers for each chapter, a "go further" line for older
// classes, and where each chapter meets the curriculum. Everything here is plain fact checked against the official source named beside it, and nothing
// recommends a party. Where a figure can change, the answer says so rather than quoting a number.

export const NOTE_LINKS = {
  petitions: { label: "Petitions site", href: "https://petition.parliament.uk/" },
  vat: { label: "VAT rates on GOV.UK", href: "https://www.gov.uk/vat-rates" },
  register: { label: "Register to vote", href: "https://www.gov.uk/register-to-vote" },
  education: { label: "UK Parliament Education", href: "https://www.parliament.uk/education/" },
  write: { label: "WriteToThem", href: "https://www.writetothem.com/" },
};

// Likely questions from pupils, by chapter. `pause` is a good place to stop and talk; `qa` are questions children really ask, with an answer a teacher can give.
export const TEACHER_NOTES = {
  why: {
    pause: ["After each story, before the last step: ask the class what they think the people in the picture should do.", "After the school roof story: ask who they think decides how much money schools get."],
    qa: [
      { q: "Is this telling us who to vote for?", a: "No. The stories describe choices without saying which is right. Pupils are asked to weigh ideas, not pick a party." },
      { q: "Why does the price of food go up?", a: "Many things affect it: the weather, the cost of fuel and transport, and prices around the world. Governments decide some things, such as taxes. Most basic food has no VAT in the UK, though some items such as sweets and ready-to-eat takeaway food do.", link: NOTE_LINKS.vat },
      { q: "Who pays for the NHS?", a: "Mainly taxes. The money is raised by the UK government, and Scotland, Wales and Northern Ireland run their own health services.", page: { label: "The NHS, in numbers", href: "#/nhs" } },
      { q: "Who decides if a bus route stops?", a: "Bus companies run most services. Local councils or combined authorities plan and sometimes pay for routes that would not otherwise run, so a decision can involve both.", page: { label: "Transport, in numbers", href: "#/transport" } },
    ],
  },
  who: {
    pause: ["On the layers picture: ask pupils to name one thing each layer looks after before you reveal it.", "After the Scotland, Wales and Northern Ireland slide: ask where a pupil's own nation fits."],
    qa: [
      { q: "Who empties our bins?", a: "The local council (a district or unitary council, depending on where you live).", page: { label: "Your council", href: "#/councils" } },
      { q: "Do Scotland, Wales and Northern Ireland make their own laws?", a: "Yes, on matters that have been devolved to them, such as health and education. They have the Scottish Parliament, the Senedd in Wales and the Northern Ireland Assembly.", page: { label: "Devolved administrations", href: "#/devolved" } },
      { q: "What can they not decide?", a: "Matters kept for the UK Parliament, such as defence and foreign affairs. The exact list differs between the nations.", page: { label: "Devolution and the union", href: "#/union" } },
      { q: "Why not have one group decide everything?", a: "It keeps decisions close to the people they affect, and no single group has all the power. This is a good question to debate." },
    ],
  },
  parliament: {
    pause: ["Before the law steps: ask pupils to guess how many checks a bill goes through.", "At the end of 'Who runs the country?': ask the difference between Parliament and the government in their own words."],
    qa: [
      { q: "How many MPs and peers are there?", a: "There are 650 MPs. The House of Lords has roughly 800 members, a number that changes as peers join and leave.", page: { label: "Parliament in numbers", href: "#/numbers" } },
      { q: "Can the Lords stop a law?", a: "They can amend a bill and send it back, and delay most bills, but under the Parliament Acts the elected Commons can in the end have its way.", page: { label: "How Parliament works", href: "#/howitworks" } },
      { q: "Who chooses the Prime Minister?", a: "The King appoints the person who is most likely to command the support of the House of Commons, which is usually the leader of the largest party." },
      { q: "What does the King do?", a: "Gives Royal Assent, the final step that makes a bill an Act, and opens each new session of Parliament. By convention the King acts on the advice of ministers." },
    ],
  },
  parties: {
    pause: ["Before the party slides: ask pupils how they would decide whether a promise was kept.", "After the last party: ask which questions the class would put to any leader."],
    qa: [
      { q: "Why does the lesson not say which party is best?", a: "Teachers and sites like this one should be even-handed. Each party gets the same space, and the facts come from sources anyone can check." },
      { q: "What is a coalition?", a: "Two or more parties sharing the government. The most recent one in the UK ran from 2010 to 2015.", page: { label: "Every government since 1721", href: "#/timeline" } },
      { q: "How can we check if promises are kept?", a: "Independent fact-checkers follow them. This site shows Full Fact's verdicts on the government's pledges.", page: { label: "Promises tracker", href: "#/tracker" } },
      { q: "Why does Northern Ireland have different parties?", a: "Its politics is organised around different questions, so most of its main parties do not stand in the rest of the UK." },
    ],
  },
  voice: {
    pause: ["Before the vote activity: ask how a fair vote should be run (secret, one each, counted openly).", "Before the quiz: tell pupils it is practice, not a test."],
    qa: [
      { q: "Can children really change anything?", a: "Children cannot vote in general elections, but anyone living in the UK can sign a petition, and anyone can write to their MP. School councils and youth groups let pupils be heard sooner.", link: NOTE_LINKS.petitions },
      { q: "How many signatures does a petition need?", a: "At 10,000 the government must reply in writing. At 100,000 the Petitions Committee considers it for a debate. A debate is not guaranteed and a petition cannot change the law by itself.", link: NOTE_LINKS.petitions },
      { q: "When can I vote?", a: "At 18 in UK general elections at the moment. In Scotland and Wales some elections already allow 16 and 17 year olds. Rules can change, so check with the Electoral Commission before telling a class a firm age.", link: NOTE_LINKS.register },
      { q: "How do I tell a fact from an opinion?", a: "A fact can be checked, an opinion is what someone thinks. Ask who is saying it and how they know.", page: { label: "How news is regulated", href: "#/mediaLiteracy" } },
    ],
  },
};

// One extra sentence for older classes, shown on the last step of a slide when the level is "Older". They add detail without changing the story.
export const GO_FURTHER = {
  chapter: "Politics is argued over because resources are limited. Ask who gains and who pays for each choice, not only what is decided.",
  story: "Look for the three things in each story: a need, a decision-maker, and the money. Where the money comes from is usually the hard part.",
  layers: "Some powers are shared between layers. Planning, for example, is decided by councils within rules set nationally, so more than one layer can matter for the same question.",
  houses: "The Commons can have its way in the end, but the Lords' power to ask the Commons to think again is a real check, and governments often accept changes.",
  law: "Most bills the government introduces become law, because the government usually has a majority in the Commons. The checking happens in the detail: amendments.",
  run: "The Prime Minister stays in post while they command the confidence of the Commons. If they lose it, a general election or a new Prime Minister follows.",
  partyIntro: "Parties are not the only way to take part: independents and smaller groups also win seats, particularly in local councils.",
  party: "Seat numbers describe the House of Commons after the last general election and change when MPs change party or a by-election is held.",
  ni: "Northern Ireland's Assembly shares power between the largest unionist and nationalist parties, under rules agreed in 1998.",
  voice: "Rights and responsibilities go together: the right to be heard comes with the duty to check what you say and to listen to others.",
};

// Where each chapter meets the curriculum. England's wording is quoted from the programmes of study for citizenship, key stages 3 and 4
// (GOV.UK, Open Government Licence). The other nations are named by curriculum area only, with a link: check the detailed outcomes on their own sites.
export const ENGLAND = {
  source: { label: "National curriculum in England: citizenship programmes of study for key stages 3 and 4", href: "https://www.gov.uk/government/publications/national-curriculum-in-england-citizenship-programmes-of-study/national-curriculum-in-england-citizenship-programmes-of-study-for-key-stages-3-and-4" },
  note: "Citizenship has a statutory programme of study from key stage 3 (ages 11 to 14). Teacher mode is written for ages 8 to 14, so for younger pupils it supports citizenship and PSHE work rather than a statutory programme.",
  rows: [
    { chapter: "why", ks: "KS3", text: "the development of the political system of democratic government in the United Kingdom, including the roles of citizens, Parliament and the monarch" },
    { chapter: "who", ks: "KS3", text: "the roles played by public institutions and voluntary groups in society" },
    { chapter: "who", ks: "KS4", text: "local, regional and international governance" },
    { chapter: "parliament", ks: "KS3", text: "the operation of Parliament, including voting and elections, and the role of political parties" },
    { chapter: "parliament", ks: "KS4", text: "the different roles of the executive, legislature and judiciary" },
    { chapter: "parties", ks: "KS3", text: "the role of political parties" },
    { chapter: "voice", ks: "KS3", text: "the ways in which citizens work together to improve their communities" },
    { chapter: "voice", ks: "KS4", text: "actions citizens can take in democratic and electoral processes to influence decisions locally, nationally and beyond" },
    { chapter: "classroom", ks: "KS3", text: "the functions and uses of money, the importance and practice of budgeting, and managing risk (the budget game)" },
    { chapter: "classroom", ks: "KS4", text: "the different electoral systems used in and beyond the United Kingdom (the mock election)" },
  ],
};

export const OTHER_NATIONS = [
  { nation: "Scotland", area: "Curriculum for Excellence: Social studies", href: "https://www.education.gov.scot/curriculum-for-excellence/curriculum-areas/social-studies/" },
  { nation: "Wales", area: "Curriculum for Wales: the Humanities area of learning and experience", href: "https://hwb.gov.wales/curriculum-for-wales/humanities" },
  { nation: "Northern Ireland", area: "Learning for Life and Work: Local and Global Citizenship (CCEA)", href: "https://ccea.org.uk/key-stage-3/curriculum/learning-life-and-work" },
];

// The roles in the law role-play: what each person does at each step, so a class can act out how a bill becomes law.
export const ROLE_CARDS = [
  { who: "The Minister", steps: "1, 2, 3, 5", does: "Introduces the bill and explains its main idea. Answers questions from other MPs.", line: "\"This bill will help ... and here is how.\"" },
  { who: "The Speaker", steps: "2, 3, 5", does: "Keeps order in the Commons and calls each MP to speak in turn.", line: "\"Order! I call ...\"" },
  { who: "An MP on the government side", steps: "2, 4, 5", does: "Speaks in favour of the bill and votes for it.", line: "\"I support this bill because ...\"" },
  { who: "An MP on the opposition side", steps: "2, 4, 5", does: "Asks hard questions, proposes a change and votes as they think best.", line: "\"I would change this part, because ...\"" },
  { who: "The committee chair", steps: "3", does: "Leads a small group that goes through the bill line by line.", line: "\"The committee will now look at clause one.\"" },
  { who: "A peer in the Lords", steps: "6, 7", does: "Checks the bill again and suggests changes. Cannot be voted out by the public.", line: "\"My Lords, I would ask the House to think again about ...\"" },
  { who: "The Lord Speaker", steps: "6, 7", does: "Chairs the House of Lords, where peers speak without being called.", line: "\"The question is that this bill be read a second time.\"" },
  { who: "The King", steps: "8", does: "Gives Royal Assent, the signature that turns the bill into an Act of Parliament.", line: "\"Royal Assent is given.\"" },
  { who: "A reporter", steps: "all", does: "Writes down what happens at each step and reports it to the class. Parliament is public, so people can find out.", line: "\"Today in Parliament ...\"" },
];

export const PETITION_STEPS = [
  { at: 5, title: "Five supporters", text: "A petition needs five supporters before the Petitions Committee checks it.", colour: "#7A5AF0" },
  { at: 10000, title: "10,000 signatures", text: "The government must give a written response.", colour: "#1FA97C" },
  { at: 100000, title: "100,000 signatures", text: "The Petitions Committee considers it for a debate in Parliament. A debate is not guaranteed.", colour: "#E0367A" },
];
