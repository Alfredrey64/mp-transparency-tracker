// Plain-English notes on what each government or shadow post does and why it matters, for the "Who has held this office?" page.
// There are nearly a thousand post names (every department words them a little differently), so the notes are written once for
// each kind of post and filled in with the department where the name gives one. The first rule that matches wins.

const dept = (post) => {
  const m = /^(?:shadow\s+)?(?:minister of state|parliamentary under[- ]secretary(?: of state)?|parliamentary secretary|secretary of state|minister)\s+(?:for|at|in)\s+(?:the\s+)?(.+?)(?:\s*\(.*\))?$/i.exec(post.trim());
  return m ? m[1] : null;
};
const inBrackets = (post) => /\(([^)]+)\)/.exec(post)?.[1] ?? null;

// Each rule: [pattern, what it does, why it matters]. A function can build the text from the post name.
const RULES = [
  [/spokesperson|spokesman/i, (p) => [`${/lords/i.test(p) ? "Speaks in the House of Lords" : "Speaks"} for their party on a subject${/liberal democrat/i.test(p) ? " (here the Liberal Democrats)" : /snp/i.test(p) ? " (here the SNP)" : /dut|dup/i.test(p) ? " (here the DUP)" : /\bpc\b|plaid/i.test(p) ? " (here Plaid Cymru)" : /green/i.test(p) ? " (here the Greens)" : ""}, setting out its position and questioning ministers.`, "Smaller parties have fewer MPs, so each spokesperson covers a lot of ground and is the party's voice on it."]],
  [/^prime minister/i, "Leads the government, chooses the ministers and sets its direction. Chairs the Cabinet.", "Almost every big decision goes through them, and they must keep the support of a majority of MPs to stay in the job."],
  [/^deputy prime minister/i, "Stands in for the Prime Minister and usually leads on a major part of the government's agenda.", "It signals who is second in command, and it often goes to the leader of a coalition partner."],
  [/^chancellor of the exchequer/i, "Runs the government's finances: sets taxes and spending, delivers the Budget and chooses how much the government borrows.", "Money touches everything the government does, so the Chancellor has more say than anyone except the Prime Minister."],
  [/^chief secretary to the treasury/i, "Controls how much each government department is allowed to spend, and negotiates with ministers who want more.", "They are the person who says no, which makes them the gatekeeper of public spending."],
  [/^(financial|economic|exchequer) secretary/i, "A Treasury minister who handles part of the government's money, such as tax policy, banks and financial services, or the day-to-day running of the Treasury.", "Tax rules and financial regulation are decided in these jobs, long before they reach the Budget headlines."],
  [/^commercial secretary/i, "A Treasury minister who looks after the government's dealings with business, including government-owned companies and big infrastructure projects.", "It links the Treasury's money to the firms that build and run the country's roads, rail and energy."],
  [/^paymaster general/i, "A Treasury post that is often combined with a Cabinet Office job, handling money matters and supporting the Cabinet Office's work.", "It is the job that lets a minister sit in two departments at once."],
  [/^home secretary/i, "Runs the Home Office: police, immigration and borders, counter-terrorism and national security.", "It deals with the questions that top the news most often, from small boats to knife crime."],
  [/^foreign secretary|secretary of state for foreign/i, "Leads the UK's relations with other countries and its diplomats, and speaks for the UK at the UN, NATO and in trade and security talks.", "It decides how the UK uses its influence abroad and who it stands alongside."],
  [/^lord chancellor/i, "Runs the Ministry of Justice (courts, prisons and probation) and is responsible for protecting the independence of judges.", "It is one of the few jobs that guards the independence of the courts from the government."],
  [/^attorney general|^shadow attorney general/i, "The government's chief legal adviser, who advises on whether its plans are lawful and can bring some cases to court.", "Ministers rely on this advice, and it is meant to be given independently of politics."],
  [/^solicitor general|^shadow solicitor general/i, "The deputy to the Attorney General, who supports on legal advice and steps in on some prosecutions.", "It helps make sure the law officers can cover the whole of the government's legal work."],
  [/^advocate[- ]general for scotland|^shadow advocate[- ]general/i, "The UK government's adviser on Scots law.", "Scotland has its own legal system, so UK laws affecting it need advice from someone who knows it."],
  [/^chancellor of the duchy of lancaster/i, "An old title now used for a senior minister, often running the Cabinet Office and coordinating work across departments.", "It puts a heavyweight at the centre of government to make departments deliver."],
  [/^lord president of the council|^leader of the house of commons|^shadow leader of the house of commons|^liberal democrat shadow leader of the house of commons|^shadow snp leader of the house/i, "Organises what the House of Commons debates and when, and speaks for the Commons in government (or, in opposition, challenges how business is run).", "Whoever controls the timetable decides which laws and debates get time, and which do not."],
  [/^leader of the house of lords|^deputy leader of the house of lords|^shadow (deputy )?leader of the house of lords/i, "Organises business in the House of Lords and speaks for the government (or, in opposition, for the opposition) there.", "The Lords can delay and change laws, so someone has to steer government business through it."],
  [/^lord privy seal/i, "An ancient title held by the Leader of one of the two Houses of Parliament.", "It is one of the traditional offices that carry a minister's day job."],
  [/^secretary of state for (scotland|wales|northern ireland)/i, (p) => [`Speaks for ${/scotland/i.test(p) ? "Scotland" : /wales/i.test(p) ? "Wales" : "Northern Ireland"} in the UK government and for the UK government there, and looks after the powers the UK government keeps.`, "Much is devolved, so this post is the main link between the UK government and the devolved government."]],
  [/^secretary of state for (defence)/i, "Runs the armed forces and the Ministry of Defence, including equipment, bases and overseas operations.", "It spends tens of billions a year and decides how the UK fights, trains and supplies its forces."],
  [/^secretary of state for (health|health and social care)/i, "Runs the NHS in England and adult social care, including how it is funded and how patients are treated.", "The NHS is the biggest public service and one of voters' top concerns."],
  [/^secretary of state for (education|education and science)/i, "Runs schools, colleges and children's services in England, and helps set what is taught.", "It shapes the education of every child in England."],
  [/^secretary of state for (work and pensions|employment)/i, "Runs benefits, the State Pension and help for people to find work.", "It pays money to millions of people and decides who gets support."],
  [/^secretary of state for (transport)/i, "Runs roads, railways, aviation and shipping policy in England and parts of the UK.", "Fares, delays and big projects such as HS2 are decided here."],
  [/^secretary of state for (environment|environment, food and rural affairs|agriculture)/i, "Looks after farming, food, fishing, the countryside, water and the environment.", "It covers food supply, flood defences and the UK's targets on nature."],
  [/^secretary of state for (housing|communities|levelling up)/i, "Responsible for housing, planning, local councils and regeneration in England.", "It decides how many homes get built and how councils are funded."],
  [/^secretary of state for (culture|digital|digital, culture)/i, "Covers culture, media, sport, the arts and digital and online policy.", "It sets the rules for broadcasters, sport, museums and parts of the internet."],
  [/^secretary of state for (business|trade|energy|science|international trade|exiting)/i, (p) => [`Leads the department for ${dept(p) ?? "business, trade or energy"}: the policies that affect firms, jobs and the economy.`, "It sets the rules that decide how business and energy run, and shapes the UK's trading relationships."]],
  [/^secretary of state for international development/i, "Led the department that gave UK aid to poorer countries.", "Aid shapes the UK's influence and reputation abroad."],
  [/^secretary of state/i, (p) => [`A member of the Cabinet who runs a whole government department${dept(p) ? `: ${dept(p)}` : ""}, decides its policy and answers to Parliament for it.`, "It is the top job in the department: they take the big decisions and take the blame when things go wrong."]],
  [/^minister of state/i, (p) => [`A middle-ranking minister who leads on a major part of a department's work${dept(p) ? `, here ${dept(p)}` : ""}, working under the Secretary of State.`, "Much of the day-to-day policy and decision-making is done at this level."]],
  [/^parliamentary under[- ]secretary/i, (p) => [`A junior minister who handles a specific area of a department's work${dept(p) ? `, here ${dept(p)}` : ""}, and often speaks for it in the Commons or Lords.`, "It is the first rung of government and where many future ministers learn the job."]],
  [/^parliamentary secretary to the treasury and chief whip|^chief whip|^government chief whip/i, "The government's chief whip: keeps MPs in line and makes sure there are enough votes for its plans.", "Without a majority in key votes the government cannot pass laws, so the Chief Whip's job is vital."],
  [/^parliamentary secretary to the treasury/i, "The government's chief whip, formally given this Treasury title.", "It is the title of the person who counts the votes."],
  [/^parliamentary secretary/i, (p) => ["A junior minister who supports a department or the Cabinet Office with specific responsibilities.", `${dept(p) ? `It covers ${dept(p)}, a part of government that needs a minister to answer for it.` : "It gives the department a minister who can answer in Parliament for a particular area."}`]],
  [/^minister without portfolio/i, "A minister who does not run a department, usually brought in to help with a political or special task.", "It lets a Prime Minister bring someone into government without a department."],
  [/^minister (on leave)/i, "A minister who is temporarily away from their post, for example on maternity leave.", "It keeps the post held for them until they return."],
  [/^minister for (women|equalities)/i, "Leads on the government's work on equality and women's issues.", "It decides how the government tackles pay gaps, discrimination and safety."],
  [/^minister for the cabinet office|^minister for intergovernmental/i, "Helps the centre of government run, and works with the devolved governments in Scotland, Wales and Northern Ireland.", "The UK only works if the four governments work with each other."],
  [/^minister/i, (p) => [`A government minister${dept(p) ? ` responsible for ${dept(p)}` : " with a specific policy area"}, answering in Parliament for what the government does there.`, "Ministers turn the government's promises into policy and answer when it goes wrong."]],
  [/^deputy chief whip|^treasurer of hm household|^government deputy chief whip/i, "The deputy to the Chief Whip, helping to manage members and count votes. The 'Treasurer of the Household' part is an old Royal Household title used to pay the post.", "A whip's team keep the government's majority together for each vote."],
  [/^comptroller|^vice[- ]chamberlain|^captain of the (honourable corps|queen|king)/i, (p) => [`${/captain/i.test(p) ? "A whip in the House of Lords, with a ceremonial Royal Household title." : "A government whip in the Commons, with a ceremonial Royal Household title."} Whips make sure members vote as the party wants and report back on the mood of MPs.`, "These old titles are how the government pays its whips; the real job is to keep votes on track."]],
  [/^(government whip|lord commissioner|assistant whip|government assistant whip|lords? (commissioner|in waiting)|baroness in waiting)/i, (p) => [/waiting/i.test(p) ? "A government whip in the House of Lords who also speaks for departments in debates there." : "A government whip: makes sure members of the governing party turn up to vote and vote as the party wants, and passes on what they are thinking.", "The whips are why a government with a majority wins votes."]],
  [/^opposition (chief|deputy chief|senior|assistant|pairing)? ?whip|^shadow chief whip|^opposition whip|^liberal democrat (deputy )?chief whip|^liberal democrat lords chief whip|^snp chief whip/i, (p) => [/pairing/i.test(p) ? "The opposition whip who arranges pairing, where an MP from each side agrees to skip a vote together." : /chief/i.test(p) ? "The opposition's chief whip: manages the party's members, agrees timetables with the government and organises votes against it." : "An opposition whip: makes sure the party's members vote together and tells the leadership what they are thinking.", "Parties that vote together have much more influence, and the opposition needs discipline to hold the government to account."]],
  [/^parliamentary private secretary/i, "An MP who acts as a minister's eyes and ears in Parliament. It is an unpaid first step on the ministerial ladder.", "It gives backbenchers a way into government and gives ministers a link to what MPs think."],
  [/trade envoy|envoy/i, "Promotes UK trade and investment in a particular country on behalf of the Prime Minister.", "They open doors for UK businesses overseas."],
  [/^leader of hm official opposition|^leader of the opposition|^shadow prime minister/i, "Leads the largest party not in government. Questions the Prime Minister every week and sets out an alternative programme.", "Holding the government to account is the opposition's job, and the Leader is the face of it."],
  [/campaign|national coordinator|co-ordinator|chair/i, "A senior party role running campaigns, elections or the party's organisation, rather than a role in government.", "Winning elections is how parties get power, and these jobs run the machine."],
];

const PARTY_PREFIX = /^(liberal democrat|snp|dup|pc|plaid cymru|green)\s+/i;
const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);

export function explainOffice(post, kind) {
  const p = String(post ?? "").replace(/\s+/g, " ").trim();
  if (!/spokes/i.test(p)) {
    // "Liberal Democrat Shadow Attorney General": the post, for that party.
    const party = PARTY_PREFIX.exec(p);
    if (party && p.length > party[0].length) {
      const inner = explainOffice(p.slice(party[0].length), kind);
      return { what: `For the ${party[1].replace(/\b\w/g, (c) => c.toUpperCase()).replace(/^Snp$|^Dup$|^Pc$/i, (x) => x.toUpperCase())}: ${lowerFirst(inner.what)}`, why: inner.why };
    }
    // "Shadow X": the opposition's counterpart to X.
    if (/^shadow\s+/i.test(p) && !/^shadow\s+(snp|dup|pc)\b/i.test(p)) {
      const inner = explainOffice(p.replace(/^shadow\s+/i, ""), "gov");
      return { what: `The opposition's counterpart to this job: they question the minister who holds it and set out what their party would do instead. The job itself: ${lowerFirst(inner.what)}`, why: `Opposition front-benchers are how ministers are challenged on the detail. ${inner.why}` };
    }
  }
  for (const [re, what, why] of RULES) {
    if (!re.test(p)) continue;
    if (typeof what === "function") {
      const [w, y] = what(p);
      return { what: w, why: y };
    }
    return { what, why };
  }
  const bracket = inBrackets(p);
  return kind === "opp"
    ? { what: "A post on a party's front bench or in its organisation, speaking for the party on one subject and challenging the government.", why: "It is how an opposition party shows what it would do differently." }
    : { what: `A government post${bracket ? ` linked to ${bracket}` : ""}, helping a department or the government run its business in Parliament.`, why: "Ministers and whips are how the government gets its decisions made and its laws passed." };
}
