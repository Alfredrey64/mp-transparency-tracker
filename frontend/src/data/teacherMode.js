// What Teacher mode says. It is written for children of roughly 8 to 14, to be read aloud and talked about in a class, and it follows the rules
// of the rest of the site: plain words, and no party is ever recommended. Where a story shows people choosing between ideas, the ideas are
// described, not scored.
//
// A story slide is a picture that builds up in steps ("beats"). Each beat has the words shown under the picture; the picture itself is drawn in
// components/teacher/Scenes.jsx, whose pieces are tagged with the beat they appear on.

export const CHECKED = "26 October 2026";

export const CHAPTERS = [
  {
    key: "why",
    words: ["tax: money people pay so the country can run schools, hospitals and roads", "election: a day when people vote to choose who will speak for them", "MP: a Member of Parliament, elected to speak for your area", "party: a group of people who share ideas about how to run the country"],
    title: "Why politics matters to you",
    short: "Why it matters",
    minutes: 15,
    colour: "#E0367A",
    blurb: "Four short stories about everyday things, a food shop, a hospital wait, a leaking school roof and a bus that stops, and who decides what happens.",
    aims: ["See that decisions made by elected people shape everyday life.", "Learn that different parties offer different ideas, and that voting is how people choose between them."],
    ask: ["Can you think of something in your own life that someone had to decide, such as a school rule, a new road or a park?", "Who do you think made that decision?"],
  },
  {
    key: "who",
    words: ["council: the local group of elected people who run local services", "devolved: decided in Scotland, Wales or Northern Ireland, not in London", "constituency: the area one MP is elected to speak for", "government: the people who run the country day to day"],
    title: "Who decides what?",
    short: "Who decides",
    minutes: 8,
    colour: "#7A5AF0",
    blurb: "Your council, the governments of Scotland, Wales and Northern Ireland, and the UK Parliament each look after different things.",
    aims: ["Name three levels of decision-making.", "Match an everyday example to the right level."],
    ask: ["Who is in charge of the bins in your street?", "Who decides how much tax people pay?"],
  },
  {
    key: "parliament",
    words: ["bill: an idea for a law, before it has been agreed", "Commons: the part of Parliament made up of elected MPs", "Lords: the part of Parliament that checks new laws", "Royal Assent: the King's signature that turns a bill into law"],
    title: "How Parliament works",
    short: "Parliament",
    minutes: 12,
    colour: "#1E4FB8",
    blurb: "The Commons, the Lords and the King, how an idea becomes a law, and who runs the country.",
    aims: ["Describe the three parts of Parliament.", "Put the steps of making a law in order."],
    ask: ["Why do you think a new law is checked by two groups of people?", "What is the difference between Parliament and the government?"],
  },
  {
    key: "parties",
    words: ["manifesto: a party's list of promises before an election", "leader: the person who heads a party", "opposition: the biggest party that is not in government", "coalition: two or more parties sharing the government"],
    title: "The parties and their leaders",
    short: "The parties",
    minutes: 15,
    colour: "#0E9AA7",
    blurb: "What each main party tends to believe, who leads it, and what it promised at the 2024 election. No party is recommended.",
    aims: ["Explain what a political party is.", "Tell the difference between the party that governs and the opposition."],
    ask: ["Why might two people who both want a fairer country disagree about how to get there?", "How could you check whether a promise has been kept?"],
  },
  {
    key: "voice",
    words: ["petition: a request that lots of people sign", "register to vote: put your name on the list of voters, once you are old enough", "fact: something that can be checked", "opinion: what someone thinks or feels"],
    title: "Your voice",
    short: "Your voice",
    minutes: 10,
    colour: "#2F9E6B",
    blurb: "How you can be heard now, when you can vote, and a short quiz to finish.",
    aims: ["List ways young people can be heard.", "Say when people can vote in different elections."],
    ask: ["What is one thing you would change in your school or town, and who would you tell?", "How do you tell a fact from an opinion?"],
  },
];

// ---- Chapter 1: four stories -------------------------------------------------------------------------------------------------------------------

export const STORIES = {
  shop: {
    title: "The weekly shop",
    kicker: "Story 1 of 4",
    beats: [
      { text: "This is Sam and her dad. Every Saturday they do the family shopping." },
      { text: "Sometimes prices go up, and the same money buys less. Dad's basket is getting smaller, but his money isn't getting bigger." },
      { text: "Dad wonders why. Many things change prices, like what it costs to grow and ship food. But some things are decided in Parliament: how much tax people pay, how much help families can get, and the lowest pay a worker can be given." },
      { text: "Before an election, every party says what it would do. They don't all agree. Each of these is an idea someone might promise.", chips: ["Lower taxes", "More help with bills", "A higher minimum wage"] },
      { text: "Dad reads what the parties promise and picks the one he thinks will work best for his family. Millions of other people pick too. The party that wins the most seats usually runs the country." },
      { text: "One day Sam will vote too. The more she understands now, the better she can choose.", fact: "At the moment you have to be 18 to vote in a UK general election, though a bill to lower it to 16 is going through Parliament. In Scotland and Wales you can already vote in some other elections at 16." },
    ],
    ask: ["What did Dad do that anybody can do?", "Why might two families choose different parties even if they both want to afford the shopping?"],
  },
  hospital: {
    title: "Waiting for the hospital",
    kicker: "Story 2 of 4",
    beats: [
      { text: "Maya's grandad has a sore hip. His doctor says he needs to see a specialist at the hospital." },
      { text: "He has to wait for an appointment. Sometimes the wait is short and sometimes it is long." },
      { text: "The NHS is paid for with taxes. In England, the government and Parliament decide how much money it gets. Scotland, Wales and Northern Ireland run their own health services." },
      { text: "Parties have different ideas about how to help people get seen sooner. Here are some of the ideas people put forward.", chips: ["More money for the NHS", "More doctors and nurses", "New ways of running services"] },
      { text: "When people vote, how well hospitals work is one of the things they think about. That is how ordinary people can change what happens in a hospital.", fact: "Nobody can see how you voted. A vote is private." },
    ],
    ask: ["Why can't a single person fix a long hospital wait on their own?", "What would you want to know before deciding which idea to back?"],
  },
  school: {
    title: "A new roof for Leo's school",
    kicker: "Story 3 of 4",
    beats: [
      { text: "Leo's school has a leaking roof and not enough books for everyone." },
      { text: "Schools are paid for with taxes. In England, the government decides how much money schools get, and the local council helps with some things." },
      { text: "Different parties have different ideas about schools. These are some of the things they might promise.", chips: ["More teachers", "Free school meals", "Fix old school buildings"] },
      { text: "Leo's mum writes to their MP, the person elected to speak for their area in Parliament. MPs read letters from the people who live where they were elected." },
      { text: "Change can be slow. But writing, asking questions and voting are how a community gets heard.", fact: "Anyone can write to their MP, whatever their age." },
    ],
    ask: ["Who did Leo's mum ask, and why that person?", "What would you put in a letter to an MP?"],
  },
  bus: {
    title: "The bus that stopped",
    kicker: "Story 4 of 4",
    beats: [
      { text: "Amira and her nan wait for the number 12 bus. It takes Nan to the shops every week." },
      { text: "One day the bus stops running. The route has been cut, and Nan can't get to the shops." },
      { text: "Local buses are often decided by the local council or a regional mayor, working with the bus companies. This is local politics." },
      { text: "The councillors have a limited amount of money. They have to weigh up many needs. Different councillors decide differently.", chips: ["Pay for a bus route", "Repair the roads", "Keep council tax low"] },
      { text: "Councillors are elected in local elections. If people don't like how decisions are made, they can vote for someone else.", fact: "In Scotland and Wales you can vote in council elections at 16. In England and Northern Ireland you have to be 18 at the moment, though a bill going through Parliament would lower it to 16." },
    ],
    ask: ["Why is a local decision sometimes more important to you than one made in London?", "Who could Amira and Nan talk to?"],
  },
};

// ---- Chapter 2: who decides what ---------------------------------------------------------------------------------------------------------------

export const LAYERS = [
  {
    key: "council",
    title: "Your local council",
    colour: "#C7871A",
    who: "Councillors, elected by people in your area",
    examples: ["Bins and recycling", "Parks and libraries", "Local roads and street lights", "Planning permission for new buildings", "Care for older people"],
  },
  {
    key: "devolved",
    title: "Scotland, Wales and Northern Ireland",
    colour: "#7A5AF0",
    who: "Each has its own parliament or assembly",
    examples: ["Health services in their own country", "Schools in their own country", "Some transport and housing", "Their own police and courts in some cases"],
  },
  {
    key: "uk",
    title: "The UK Parliament and government",
    colour: "#1E4FB8",
    who: "MPs, elected by every part of the UK",
    examples: ["Tax and the country's money", "Defence and the armed forces", "Immigration and borders", "Most benefits and pensions", "The NHS and schools in England"],
  },
];

// ---- Chapter 3: Parliament ---------------------------------------------------------------------------------------------------------------------

export const HOUSES = [
  { key: "commons", title: "The House of Commons", colour: "#16A34A", who: "650 MPs", text: "Each MP is elected by the people of one area of the UK. The Commons has the final say on most laws." },
  { key: "lords", title: "The House of Lords", colour: "#C0392B", who: "About 800 peers", text: "Peers are not elected. Most are chosen for their experience. They look closely at new laws and can ask the Commons to think again." },
  { key: "king", title: "The King", colour: "#C7871A", who: "The head of state", text: "The King signs a new law to finish it. This is called Royal Assent. By long tradition it is never refused." },
];

export const LAW_STEPS = [
  { key: "idea", label: "An idea", text: "A new law starts as an idea, usually from the government. It is written down as a bill." },
  { key: "commons", label: "The Commons", text: "MPs debate the bill, change it if they want to, and vote on it." },
  { key: "lords", label: "The Lords", text: "The Lords go through it carefully. If the two Houses disagree, it can go back and forth until they agree." },
  { key: "king", label: "The King", text: "The King signs it. This is called Royal Assent." },
  { key: "law", label: "It's a law", text: "The bill is now an Act of Parliament. Everyone has to follow it." },
];

export const WHO_RUNS = [
  { title: "The government", text: "The Prime Minister and the ministers they pick. They decide how to run the country day to day and suggest new laws." },
  { title: "The opposition", text: "The biggest party that is not in government. Its job is to question the government and offer another way." },
  { title: "General elections", text: "At least every five years, each area of the UK elects one MP. The party that can win the support of most MPs forms the government." },
];

// ---- Chapter 4: the parties --------------------------------------------------------------------------------------------------------------------
// Leaders checked on CHECKED against Wikipedia's list of party leaders and a second site; they change, so the slide says so. The two Northern
// Ireland posts are those already shown on the Scotland, Wales and Northern Ireland page of this site.

export const PARTIES = [
  { key: "labour", name: "Labour", colour: "#DC241F", manifesto: "labour", leader: "Andy Burnham", role: "Leader and Prime Minister", status: "Won the 2024 election, so it runs the government.", idea: "A centre-left party. It tends to believe the government should play a big part in running services like the NHS and schools, and in protecting workers." },
  { key: "conservative", name: "Conservative", colour: "#0087DC", manifesto: "conservative", leader: "Kemi Badenoch", role: "Leader and Leader of the Opposition", status: "The biggest party that is not in government.", idea: "A centre-right party. It tends to believe in lower taxes, in helping businesses to grow, and in strong police and armed forces." },
  { key: "liberal-democrat", name: "Liberal Democrats", colour: "#E08A00", manifesto: "liberal-democrat", leader: "Ed Davey", role: "Leader", status: "The third biggest party in the Commons.", idea: "A centrist party. It tends to believe in fairer voting, in protecting people's freedoms, in good health and care services, and in a closer relationship with Europe." },
  { key: "reform-uk", name: "Reform UK", colour: "#12B6CF", manifesto: "reform-uk", leader: "Nigel Farage", role: "Leader", status: "A newer party that won its first MPs in 2024.", idea: "A right-wing party. It wants much lower immigration and lower taxes, and big changes to how some public services and institutions work." },
  { key: "green", name: "Green Party", colour: "#6AB023", manifesto: "green", leader: "Zack Polanski", role: "Leader of the Green Party of England and Wales", status: "A smaller party with a few MPs.", idea: "A party that puts protecting nature and fighting climate change at the centre of its ideas, and that wants more spending on public services." },
  { key: "snp", name: "SNP", colour: "#E3B400", manifesto: "snp", leader: "John Swinney", role: "Leader and First Minister of Scotland", status: "Runs the Scottish Government and has MPs at Westminster.", idea: "The Scottish National Party wants Scotland to become an independent country, separate from the rest of the UK." },
  { key: "plaid-cymru", name: "Plaid Cymru", colour: "#005B54", manifesto: "plaid-cymru", leader: "Rhun ap Iorwerth", role: "Leader and First Minister of Wales", status: "Leads the Welsh Government and has MPs at Westminster.", idea: "A party that wants Wales to have much more control over its own affairs and, in the long run, to become independent." },
];

export const NI_PARTIES = {
  title: "Northern Ireland has its own parties",
  text: "Most of Northern Ireland's MPs belong to parties that only stand there. The big question that divides them is whether Northern Ireland should stay in the UK or one day join with the rest of Ireland.",
  groups: [
    { label: "Unionist parties", text: "Want Northern Ireland to stay in the UK. The DUP and the UUP are the main ones.", colour: "#D46A4C" },
    { label: "Nationalist parties", text: "Want Northern Ireland to join with the rest of Ireland one day. Sinn Féin and the SDLP are the main ones.", colour: "#326760" },
    { label: "Neither", text: "The Alliance Party does not take a side on that question.", colour: "#C7871A" },
  ],
  posts: "Michelle O'Neill (Sinn Féin) is First Minister of Northern Ireland and Emma Little-Pengelly (DUP) is Deputy First Minister.",
};

// ---- Chapter 5: your voice ---------------------------------------------------------------------------------------------------------------------

export const VOICES = [
  { title: "Speak up at school", text: "School councils let pupils put their ideas to the people who run the school.", colour: "#2F9E6B" },
  { title: "Write to your MP", text: "Anyone can write to their MP, at any age. MPs want to know what people in their area think.", colour: "#1E4FB8" },
  { title: "Sign a petition", text: "Anyone who lives in the UK can sign a petition on the Parliament website. At 10,000 signatures the government has to reply. At 100,000 MPs consider a debate.", colour: "#E0367A" },
  { title: "Join a youth group", text: "There are youth councils and youth parliaments, and groups that train young people to speak to decision-makers.", colour: "#7A5AF0" },
  { title: "Vote when you can", text: "UK general elections are for people aged 18 and over at the moment, though a bill to lower it to 16 is going through Parliament. Scotland and Wales already let 16 and 17 year olds vote in their own elections and in council elections.", colour: "#C7871A" },
  { title: "Check what you read", text: "A fact can be checked. An opinion is what someone thinks. Ask who is saying it, and how they know.", colour: "#0E9AA7" },
];

// The class vote: a made-up choice that shows why decisions are hard. Both options are good ideas and neither is a party's policy.
export const VOTE = {
  kicker: "Try it: a class vote",
  title: "One town, one pot of money",
  text: "One town, one pot of money. It can pay for a new playground or a longer bus route, not both. Raise a hand for the one you would pick.",
  options: ["A new playground", "A longer bus route"],
  colours: ["#2F9E6B", "#1E4FB8"],
  after: "Someone always misses out. Councillors and MPs face that choice every day.",
  tie: "A tie. How would you break it?",
  ask: ["Was it easy to choose? What would you want to know first?", "If you lost the vote, what could you do next?"],
};

export const QUIZ = [
  { q: "Who decides when your bins are collected?", options: ["The local council", "The King", "The Prime Minister"], answer: 0, why: "Councils look after local services such as bins, parks and libraries." },
  { q: "How many MPs are there in the House of Commons?", options: ["100", "650", "5,000"], answer: 1, why: "There are 650 MPs, one for each of 650 areas called constituencies." },
  { q: "Which House has members who are not elected?", options: ["The House of Commons", "The House of Lords", "Both of them"], answer: 1, why: "Peers in the Lords are not elected. MPs in the Commons are." },
  { q: "What is a political party?", options: ["A group of people who share ideas about how the country should be run", "A birthday celebration", "A kind of government office"], answer: 0, why: "Parties offer voters a set of ideas, and try to win seats so they can put those ideas into action." },
  { q: "Which of these can anyone, of any age, do?", options: ["Vote in a general election", "Write to their MP", "Become Prime Minister"], answer: 1, why: "Anyone can write to their MP. At the moment you have to be 18 to vote in a UK general election." },
];

// ---- Teacher's notes on the whole mode ---------------------------------------------------------------------------------------------------------

export const GUIDE = [
  "Press the right arrow, the space bar or Next to go on, and the left arrow or Back to go back. Escape closes the presenter.",
  "Each picture builds up one step at a time, so you can stop and ask a question before the next step appears.",
  "Press N or the Notes button for a question to ask the class on the slide you are on.",
  "The Your voice chapter has a class vote. Tap once for each hand that goes up and the columns grow.",
  "Nothing here tells pupils who to vote for. When a story shows people choosing, the choices are described, not ranked.",
  "Party leaders and seat numbers change. They were last checked on " + CHECKED + ".",
];

// ---- Print and take away ---------------------------------------------------------------------------------------------------------------------

// The steps of a bill, written as cards to cut out and put in order, with the right order for the teacher.
export const BILL_STEPS = [
  "The bill is introduced in the first House. This is the first reading. Nothing is debated yet.",
  "MPs or peers debate the main idea of the bill. This is the second reading.",
  "A small group goes through the bill line by line and suggests changes. This is the committee stage.",
  "The changes are looked at again by the whole House. This is the report stage.",
  "A final vote on the bill in that House. This is the third reading.",
  "The bill goes to the other House, which goes through the same stages.",
  "If the Houses disagree on changes, the bill goes back and forth until both agree.",
  "The King gives Royal Assent and the bill becomes a law, called an Act of Parliament.",
];
export const STEP_ORDER_SHUFFLE = [4, 7, 1, 6, 3, 0, 5, 2];
