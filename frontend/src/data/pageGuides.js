// The "What you're looking at" box at the top of each page: three plain lines
// saying what the page is, why it matters, and what it does not show. Keyed
// by the page's view name (see App.jsx). Loaded on demand, not with the app.
//
// Written to be read in under twenty seconds by someone who knows nothing
// about Parliament, and to be honest about limits.

export const PAGE_GUIDES = {
  list: {
    what: "Every current MP, with the gifts, donations, jobs and other interests they have declared in the official public register.",
    why: "MPs are paid by the public and make laws that affect everyone. Knowing what outside money and roles they have lets you judge for yourself whether it could influence them.",
    notShown: "Anything an MP hasn't declared, and why they do what they do. Declaring something is what the rules require, and does not mean anything is wrong.",
  },
  mp: {
    what: "One MP's declared interests, where the money came from, voting record, questions, committees, career and what they have said, gathered from official sources.",
    why: "It's the quickest way to see what your representative does and who they might owe favours to, without reading dozens of separate government sites.",
    notShown: "Their reasons, conversations, or anything outside the public record. How they vote is not the same as how hard they work for their area.",
  },
  peer: {
    what: "One member of the House of Lords: how they got their seat, their party or group, any government role, and what they have said and asked recently.",
    why: "The Lords can delay and change laws but nobody votes for its members, so who sits there and how they arrived is worth knowing.",
    notShown: "Declared interests and voting records in a form we can show. For interests, the page links to the official Register of Lords' Interests.",
  },
  numbers: {
    what: "The House of Commons in numbers: who sits there, how long they have served, how safe their seats are and what their careers look like.",
    why: "It turns 650 names into a picture of who really runs the country, and how different from the public that group is.",
    notShown: "Anything not in Parliament's records. They hold no ethnicity, age or education for MPs, so those are missing, and we don't guess.",
  },
  numbersLords: {
    what: "The House of Lords in numbers: its party balance, how peers got their seats, when they arrived and where they came from.",
    why: "The Lords is the least understood part of Parliament. These figures show who is in it, and that no one party is in control.",
    notShown: "Ethnicity, age and education (not published), and peers' votes and declared interests in a structured form.",
  },
  constituency: {
    what: "A map of all 650 seats, one equal hexagon each. Pick any seat for its result, MP, petitions, history and local numbers such as deprivation, house prices, pay and jobs.",
    why: "Your constituency is the way you are represented. This shows how close the last result was, who held it before, what people there care about and how the area is doing.",
    notShown: "Council or local-election results. House prices, pay and jobs are for the whole region, not the seat. The map is a rough outline and distances are not to scale.",
  },
  rebels: {
    what: "How often MPs vote against the majority of their own party, which parties split most and which votes caused the biggest rebellions.",
    why: "Parties usually vote as blocs. Seeing who breaks ranks shows where MPs think for themselves and which issues divide a party.",
    notShown: "Whether an MP was told to vote a certain way, because instructions (the whip) are secret. Free votes also show up here.",
  },
  offices: {
    what: "Search any government or shadow post, such as Home Secretary, and see everyone in Parliament today who has held it, with dates.",
    why: "Who has held a job tells you who had power over a subject, and when.",
    notShown: "Anyone who has since left Parliament, so older holders are missing. It shows today's MPs and peers, not everyone who ever held the job.",
  },
  trade: {
    what: "How much the UK sells to the rest of the world and buys from it, the gap between the two, and the wider current account balance.",
    why: "Trade shapes jobs, prices and the value of the pound, and trade deals are a standing political topic.",
    notShown: "Which countries we trade with or which goods. The ONS publishes those separately.",
  },
  environment: {
    what: "How much greenhouse gas the UK produces, how much energy it uses, and how much of that energy comes from non-fossil sources, since 1990.",
    why: "The UK has a legal target of net zero emissions by 2050, so these show how far it has come.",
    notShown: "Emissions from goods made abroad and bought here. Figures run about two years behind.",
  },
  business: {
    what: "How each part of the economy is doing compared with a year ago: factories, building, shops, hotels and pubs, finance, technology and health, plus how much shopping is online.",
    why: "The economy is not one thing. Which industries grow and which shrink decides where jobs and tax revenue come from.",
    notShown: "Individual companies, or profits. Monthly figures are early estimates and are revised.",
  },
  answers: {
    what: "Plain-English answers to common questions such as why housing is so expensive, with the latest figures, the arguments from different sides and what each party said it would do.",
    why: "News and politics often assume you know the background. These answers give it to you, and show where the numbers come from.",
    notShown: "An answer to every question: they are written by hand, so only the questions listed. Party positions come from the 2024 manifestos and may have changed.",
  },
  regions: {
    what: "An interactive map of the 12 regions and nations of the UK, coloured by house prices, pay, unemployment, jobs and inactivity, with a label on every place, which you can play through time.",
    why: "Averages for the UK hide big gaps between places, and those gaps are what 'levelling up' arguments are about.",
    notShown: "Anything smaller than a region. Your own town or council can differ a lot from its region's average.",
  },
  deprivation: {
    what: "How deprived each part of England, Wales, Scotland and Northern Ireland is on each nation's official index: a map of every constituency, every council, and England's regions.",
    why: "It shows where the biggest needs are, and what 'levelling up' and 'left behind' arguments mean in practice.",
    notShown: "How well off any one person is. Each nation's index is built differently, so the four cannot be compared with each other.",
  },
  immigration: {
    what: "How many people come to live in the UK and leave, small boat crossings, asylum claims and the backlog, hotels, returns, and the visas granted.",
    why: "Immigration is a top political issue and the figures are often muddled. Seeing legal migration, asylum and small boats apart helps you judge claims.",
    notShown: "Where migrants live, or how they affect pay and services. Figures lag by months and are revised.",
  },
  rates: {
    what: "The Bank of England's interest rate, what mortgage and savings rates people are offered, the pound's value and how many mortgages are being approved.",
    why: "Interest rates set the cost of borrowing for homes and businesses, and they are the Bank's main tool against inflation.",
    notShown: "Rates on any one deal you could get today. These are averages across lenders.",
  },
  indicators: {
    what: "Pick a topic, then up to four measures from it, or start from a ready-made question, and watch how they moved over time with who was in government shaded behind.",
    why: "Comparing measures over the same years shows how they moved together or apart. Shading by government shows when things changed.",
    notShown: "What caused any change. Most of these figures are shaped by world events, not just one government.",
  },
  economy: {
    what: "Official figures on how fast the UK economy is growing, how much it produces and how much each hour of work yields, from the Office for National Statistics.",
    why: "Growth, or the lack of it, shapes tax, spending, jobs and pay. These are the numbers politicians argue about.",
    notShown: "Forecasts, and what caused any change. The figures are revised as more data arrives.",
  },
  prices: {
    what: "How fast prices are rising overall and for food, energy, rents, transport and eating out, using the ONS's official inflation figures.",
    why: "It shows what the cost of living is doing to household budgets, which is central to many election debates.",
    notShown: "Your own spending. A typical basket can differ a lot from what you buy.",
  },
  jobs: {
    what: "Unemployment, employment, vacancies and pay, including pay after inflation, from the ONS labour market statistics.",
    why: "It shows whether people can find work and whether wages are keeping up with prices.",
    notShown: "Pay for particular jobs, regions or ages. These are whole-economy averages.",
  },
  publicFinances: {
    what: "Monthly government borrowing, the size of the national debt compared with the economy, and public sector employment.",
    why: "Borrowing and debt limit what any government can spend or promise.",
    notShown: "Where each pound goes. See Where taxes go for that.",
  },
  population: {
    what: "How many people live in the UK and in each of England, Scotland, Wales and Northern Ireland, going back over fifty years.",
    why: "Population drives demand for homes, schools, hospitals and transport.",
    notShown: "Age, ethnicity or local areas, and the reasons behind the changes.",
  },
  health: {
    what: "A few official measures of health: how many people work for the NHS, how many are kept out of work by long-term sickness, and weekly deaths.",
    why: "It gives a sense of the pressure on the health system and the nation's wellbeing.",
    notShown: "Waiting lists, hospital performance or local health, which come from NHS bodies, not the ONS.",
  },
  housing: {
    what: "Average house prices across the UK, its nations and regions since 1968, plus rents and the cost of heating a home.",
    why: "Housing is the biggest bill for most households and a major political issue.",
    notShown: "Mortgage rates or home building. House prices come from HM Land Registry with the ONS.",
  },
  crime: {
    what: "Two ways of counting crime in England and Wales, the Crime Survey and police records, plus official figures on who is arrested, who is a victim and who is in prison.",
    why: "The two often disagree, and knowing why helps you judge any crime headline.",
    notShown: "Scotland and Northern Ireland, which count crime separately, your own area, or the income of people who offend, which no one publishes.",
  },
  howitworks: {
    what: "A plain walk-through of the tiers of government, how a bill becomes law, and who does what along the way.",
    why: "You can't judge what your MP does without knowing what MPs actually have the power to do.",
    notShown: "Every exception and procedure. It's a guide to the main route, not the full rulebook.",
  },
  voting: {
    what: "Every recorded Commons vote and bill, with a plain note on what each vote meant and how each MP voted.",
    why: "How an MP votes is the clearest record of what they actually did with their power, whatever they said at election time.",
    notShown: "Votes settled without a counted division, how hard an MP argued behind the scenes, or what a vote was really about beyond its title.",
  },
  donors: {
    what: "Who gives money to MPs, grouped by company, industry and union, with the biggest givers listed.",
    why: "Money can buy goodwill. Seeing which industries and people fund politicians lets you spot patterns for yourself.",
    notShown: "Donations that aren't declared, or why anyone gave. A donation isn't evidence of wrongdoing, and most are routine and lawful.",
  },
  partyFinances: {
    what: "Donations to political parties over the last 12 months, from the Electoral Commission, with who gave and how much.",
    why: "Parties write the policies and choose the people who run the country, and their funding shows who is backing them.",
    notShown: "Money below the reporting limits, donations to individual MPs (see Donors), and spending. It's donations only.",
  },
  parties: {
    what: "Who promised what at the 2024 election, issue by issue, taken from each party's published manifesto. Parties that made no clear promise are named too.",
    why: "A manifesto is the promise a party made to win your vote, so it's the fairest basis for comparing them.",
    notShown: "What a party does once in power, or policies not in the manifesto. Parties can and do change their minds.",
  },
  history: {
    what: "A curated look at landmark votes and how today's parties came to be.",
    why: "Today's arguments make more sense with the moments that shaped them.",
    notShown: "A full history. It is a selection of turning points, not an exhaustive archive.",
  },
  timeline: {
    what: "Every government since 1721 alongside the major laws passed under each.",
    why: "It shows how power has moved between parties over three centuries and what each government did with it.",
    notShown: "Everything that happened outside Parliament. Only governments and landmark bills are included.",
  },
  devolved: {
    what: "How Scotland, Wales and Northern Ireland run some of their own affairs through their own parliaments, who leads each and what is left to Westminster.",
    why: "Who decides your health, schools or police depends on where you live, so knowing who holds which power matters.",
    notShown: "Detailed policy in each nation, or the work of local councils.",
  },
  tracker: {
    what: "The government's major promises and whether each has been achieved, is on track, is off track or has not been kept.",
    why: "Promises win elections. Tracking them shows whether those in power do what they said.",
    notShown: "Whether a promise was a good idea, or the reasons it was kept or dropped. Some promises are hard to measure.",
  },
  budget: {
    what: "Where the government's money goes, by area of spending, such as health, welfare and defence.",
    why: "It's your money. These are the choices made on how to spend it.",
    notShown: "Where the money comes from, or whether it is spent well. It's a picture of planned spending.",
  },
  cabinet: {
    what: "The senior ministers who run each part of government, with what their job involves.",
    why: "These few people take the biggest decisions in the country, so it helps to know who they are.",
    notShown: "Junior ministers, civil servants who do much of the work, or what is said in Cabinet meetings (they are secret).",
  },
  lords: {
    what: "Every current member of the House of Lords, the second chamber that reviews and can delay laws.",
    why: "Peers help shape every law but nobody votes for them, so who they are and how they got there matters.",
    notShown: "Peers' votes and declared interests in a structured form. Each peer's page links to the official register.",
  },
  formerMps: {
    what: "The MPs who have most recently left the Commons, and why: resignation, an election, or death.",
    why: "It shows how often seats change hands between elections and who has left.",
    notShown: "What they did next, or older departures. It covers recent leavers only.",
  },
  byElections: {
    what: "Elections held between general elections to fill an MP's seat when it falls vacant, and their results.",
    why: "By-elections are a rare chance to see how voters feel in between general elections.",
    notShown: "Local council elections, or national opinion. Turnout is often low and results reflect local circumstances.",
  },
  petitions: {
    what: "The most-signed public petitions to Parliament, and those the government has answered or MPs have debated.",
    why: "A petition is a direct way for the public to ask Parliament to act, and 100,000 signatures triggers a possible debate.",
    notShown: "Whether Parliament will act. A debate is not a decision, and many petitions get no change.",
  },
  partymatch: {
    what: "A short quiz that compares your views with each party's published manifesto.",
    why: "It helps you find out which party's stated plans fit what you actually think, whatever you assumed.",
    notShown: "How a party will behave in power. It's a guide for thinking, not advice on how to vote.",
  },
  committees: {
    what: "The groups of MPs that check on what each part of government is doing, and who sits on them.",
    why: "Select committees are one of the main ways Parliament holds ministers to account between votes.",
    notShown: "What they find behind closed doors. Only members and published reports are shown.",
  },
  howtovote: {
    what: "Who can vote in which elections, how to register, the ways to vote, what photo ID you need and what happens on polling day, in four plain steps.",
    why: "You can't vote unless you are registered, and the rules on ID and deadlines trip up people every election. Knowing them in advance makes your vote count.",
    notShown: "Your registration status, or the exact deadline for the next election. Those come from gov.uk, which this page links to. Rules can change, so check there.",
  },
  inequality: {
    what: "How unevenly income and wealth are shared in the UK, who is in poverty, where in the country the differences fall, how the UK compares with other rich countries, and the main arguments about it.",
    why: "Who has what shapes pay, prices, housing and public services, and is at the centre of many arguments about tax and benefits.",
    notShown: "Whether any gap is fair, or how far people move up and down over their lives.",
  },
  defence: {
    what: "How much the UK spends on defence, since 1950 and against other countries, what has been promised, the size of the armed forces, and the arguments.",
    why: "Defence is one of the biggest calls on public money, and what is spent decides what the armed forces can do.",
    notShown: "What the money buys in detail, how capable the forces are, or the cost of particular equipment.",
  },
  education: {
    what: "How schools in England are doing, the gap between richer and poorer pupils, special needs support, university fees and loans, and the arguments about each.",
    why: "Schools and universities shape pay and opportunity, and take a large share of public spending and household debt.",
    notShown: "School funding per pupil, the early years, how England compares abroad, or what graduates go on to do. Scotland, Wales and Northern Ireland are not included.",
  },
  ageing: {
    what: "What the State Pension pays and costs, how it goes up, when you can claim it, how the population is ageing, and the arguments about the triple lock, the pension age and who pays.",
    why: "The State Pension is one of the biggest items the government pays for, and a smaller share of people of working age will be paying for it.",
    notShown: "Workplace and private pensions, benefits for older people other than the State Pension, or social care costs.",
  },
  transport: {
    what: "How much we drive and what new cars run on, the state of local roads, road deaths, how rail and buses are used, paid for and run, and where it differs across the country, with the arguments.",
    why: "Transport takes a large part of the household budget and the public purse, and it is the biggest source of the UK's greenhouse gases.",
    notShown: "Walking and cycling in detail, freight, aviation and shipping, the cost of new roads and rail lines, or the price of fuel and owning a car.",
  },
  care: {
    what: "What councils spend on adult social care, who pays and who gets help, the care workers and carers who provide it, and funded childcare for young children, with the arguments.",
    why: "Almost everyone will need care or childcare at some point, and how they are paid for is one of the biggest questions facing councils and the government.",
    notShown: "Children's social care and children in care, the quality of care homes and nurseries, what people pay for their own care, or Scotland, Wales and Northern Ireland, which run their own systems.",
  },
  trust: {
    what: "How much people in the UK trust government, parliament and other institutions against other countries, how many vote and what the votes turn into, where to follow the money, and the arguments.",
    why: "Trust is what lets people accept decisions they disagree with, and surveys show it has fallen.",
    notShown: "Why any one person distrusts politicians, trust in the media or the police, local elections, or how trust differs between groups.",
  },
  energy: {
    what: "How much the UK releases and whether it is on course for its targets, where its electricity comes from, what households pay for gas and electricity and what the price cap is made of, where it is dearest, and the arguments.",
    why: "Energy bills hit every household, and the targets for cutting emissions shape what the country spends and builds for decades.",
    notShown: "The cost of Great Britain's grid in detail, heating and transport technology, North Sea oil and gas, industrial energy prices, or the effect of climate change itself.",
  },
  nhs: {
    what: "How long people wait for hospital treatment, A&E, ambulances and cancer care in England, where waits are longest, who works in the NHS, what is spent, how the UK compares, and the arguments.",
    why: "The NHS is the largest single public service, and waits are one of the things people notice most about it.",
    notShown: "The quality and safety of care, social care, GP appointments, dentistry, or waits in Scotland, Wales and Northern Ireland, which count them differently.",
  },
  brexit: {
    what: "What experts say Brexit has done to the economy, trade, people and politics, where they disagree, and the case for and against, topic by topic.",
    why: "It is one of the biggest political decisions of recent times, and people still argue about what it has cost and gained.",
    notShown: "Whether leaving was right, which depends on values as well as figures, or the effect on each industry and region.",
  },
  taxRates: {
    what: "The main tax rates today, what the government collects and where it spends it, and how each rate has changed since 1945, with who was in government. Use the buttons to switch.",
    why: "Tax decides what is left in your pay and what things cost, and the biggest changes were made by particular governments at particular Budgets.",
    notShown: "Whether a change was wise, who pays each tax, spending by department, tax reliefs, taxes set only in Scotland or Wales, and years before an official table begins.",
  },
  generalElection: {
    what: "The 2024 result, every general election since 1945 with maps and a seat lookup, each government since, devolved elections, and a plain-English guide to how votes turn into seats.",
    why: "The party with the most seats forms the government, which is not always the party most people voted for. Results, promises and outcomes together show how the system works.",
    notShown: "Seat maps before 2010 only cover seats that kept their name. Results before 1945, local elections and manifestos before 1997 are left out. Seven 2024 seats have since had by-elections.",
  },
  localElections: {
    what: "When each council in the UK next holds an election, how many seats are up, and what is at stake in yours, with a countdown to the next big election day.",
    why: "Council elections decide who runs local services such as bins, roads, planning and social care, yet many people don't know when theirs is.",
    notShown: "General or devolved elections, or who is standing. Dates can be moved, for example when councils merge, so check with your council for the final date.",
  },
  marginals: {
    what: "Which seats are closest, how far the vote would have to move to change each, and a tool to see what a shift between two parties would do.",
    why: "Elections are decided in a few close seats, and swing is how analysts say how much a result would have to change.",
    notShown: "A forecast. The swing tool is simple: every seat moves equally and only two parties count.",
  },
  compareSeats: {
    what: "Two constituencies side by side: who holds them, how close the result was, past elections, turnout and how deprived each area is.",
    why: "Putting two places next to each other shows how different, or alike, the seats behind the headlines are.",
    notShown: "Anything below seat level. Boundaries changed in 2024, so older results are for the old seat of that name.",
  },
  compare: {
    what: "Up to three MPs side by side: their careers, declared money, expenses and how they voted on the same issues.",
    why: "Seeing MPs next to each other makes differences clear that a single profile can hide.",
    notShown: "Anything not in the public record. Different MPs have different jobs, so a difference isn't automatically a fault.",
  },
  ministerialMeetings: {
    what: "Meetings ministers have declared with companies, charities, unions and other groups, from each department's own list.",
    why: "Access to a minister is a form of influence, and these lists show who gets it.",
    notShown: "Meetings that weren't declared or informal contacts. It's a sample of what departments publish.",
  },
  writtenQuestions: {
    what: "Written questions MPs and peers have recently put to ministers, with the answers once they are given.",
    why: "What an MP asks about shows what they are pressing the government on, whether or not it makes the news.",
    notShown: "Questions asked out loud in debate, and the quality of an answer. Anyone can table a question about anything.",
  },
  standards: {
    what: "Reports by the Commons standards committee about named MPs who broke the rules, and what happened as a result.",
    why: "It's how Parliament polices itself, and shows what kinds of conduct are punished.",
    notShown: "Every complaint. Most are settled informally and never published. A report is a matter of record, not an accusation from this site.",
  },
  rankings: {
    what: "MPs ranked head to head on expenses, outside earnings, how often they vote against their party and how often they vote.",
    why: "A single number is hard to judge alone. Ranking MPs gives each one a context.",
    notShown: "Why an MP's figure is high or low. A big constituency, a bigger staff or a government job can all change a number.",
  },
  myMP: {
    what: "Your MP's records in one place: declared interests, votes, rebellion rate and recent activity, found from your postcode.",
    why: "It answers the question most people actually have: what is my representative doing?",
    notShown: "Anything beyond the public record. Your postcode is looked up once and stored only on this device.",
  },
  mediaLiteracy: {
    what: "How broadcast impartiality rules work in the UK, who owns the main news outlets and real cases the regulator has judged.",
    why: "Knowing how news is regulated helps you read it critically, and tell opinion from fact.",
    notShown: "Any rating of whether a broadcaster is biased. That's a judgement, not a public record, so this site doesn't make it.",
  },
  methodology: {
    what: "Every source this site uses, how often each is updated, how they are combined and where the automatic matching can go wrong.",
    why: "You shouldn't have to take our word for it. This is how to check where a figure came from.",
    notShown: "Anything not in the sources listed. It also says plainly which matches are less certain.",
  },
  glossary: {
    what: "Plain-English definitions of the jargon used across this site and in political news, with a word of the day and a quiz to test yourself.",
    why: "Politics is full of words that sound like they mean one thing and mean another. Knowing them makes the news understandable.",
    notShown: "Every term ever used. It covers the words you'll meet most often.",
  },
  darkMoney: {
    what: "How some political money can legally move without a named donor, and a documented example of how much it can be.",
    why: "Every other page here follows money to a named giver. This one covers where the trail legally goes cold.",
    notShown: "How common it is today. A rule that allows something doesn't mean it is widely used.",
  },
  revolvingDoor: {
    what: "How ministers and senior officials move into industry jobs after leaving government, the rules on it and real cases.",
    why: "What they know and who they know can be valuable to a company, which is why people worry about it.",
    notShown: "Every move or any wrongdoing. The cases are examples, and taking a job after office is usually allowed.",
  },
  thinkTanks: {
    what: "Who pays for the think tanks that are quoted in the news, as far as it is public.",
    why: "A think tank's conclusions can look like neutral expertise. Funding helps you see who might be behind them.",
    notShown: "Whether funders influence the findings. Many think tanks publish only some of their funders.",
  },
  lobbyingRegister: {
    what: "The official list of firms paid to lobby ministers for others, and who they act for.",
    why: "Lobbying shapes laws. This is the one public list of who is being paid to try.",
    notShown: "Most lobbying. Lobbyists employed directly by a company, and contact with ordinary MPs, aren't covered.",
  },
  followTheMoney: {
    what: "Search any company, union or person to see every MP and party they have given declared money to, how each gift was declared and how the MPs they funded voted.",
    why: "It reverses the usual view: instead of looking at an MP's donors, you start from the donor.",
    notShown: "Money that wasn't declared, or what a gift was meant to achieve. Names can be spelled differently across registers, so matches aren't always complete.",
  },
  watchlist: {
    what: "What's new for the MPs you follow since you last looked: new declarations, votes against their party and news.",
    why: "It saves you checking each MP's page again.",
    notShown: "Anything before your last visit. Your list is stored only on this device, and there is no account.",
  },
  topics: {
    what: "Type a topic and see which MPs and peers have asked ministers about it in the last 30 days.",
    why: "It shows who is pressing government on an issue you care about.",
    notShown: "Questions asked out loud, or older than 30 days. Asking isn't the same as acting.",
  },
  councils: {
    what: "Every council in the UK: who runs it, who your councillors are, which councils changed hands and which councillors changed party, and when each next votes.",
    why: "Councils decide bin collections, planning, housing, roads and care, the services you meet most often, and you can vote for them.",
    notShown: "Parish and town councils, ward-by-ward results, or contact details. Defections come from comparing yearly lists, so a switch and a switch back is missed.",
  },
  appg: {
    what: "The cross-party groups MPs and peers join around a topic, and who belongs to which.",
    why: "These groups are an early, low-profile way outside organisations get access to Parliament. Often an industry or charity pays for their running.",
    notShown: "What they discuss or whether they change anything. Many are routine and harmless.",
  },
};

// Pages that share a guide with another view.
export const GUIDE_ALIASES = { seatmap: "constituency" };
