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
    notShown: "Anything an MP hasn't declared, and why they do what they do. A declaration is what the rules require, not a sign anything is wrong.",
  },
  mp: {
    what: "One MP's declared interests, voting record, questions, committees, career and what they have said, gathered from official sources.",
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
    what: "A map of all 650 seats, one equal hexagon each, with the result, MP, petitions and history of any seat you pick.",
    why: "Your constituency is the way you are represented. This shows how close the last result was, who held it before and what people there care about.",
    notShown: "Council or local-election results, or anything below constituency level. The map is a rough outline and distances are not to scale.",
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
  indicators: {
    what: "A tool for picking up to four measures from the Britain in numbers pages and watching how they moved over time, with who was in government shaded behind.",
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
    what: "Two ways of counting crime in England and Wales: the Crime Survey, which asks people what happened to them, and crimes recorded by the police.",
    why: "The two often disagree, and knowing why helps you judge any crime headline.",
    notShown: "Scotland and Northern Ireland, which count crime separately, or crime in your own area.",
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
    what: "Where each main party stands on the big issues, taken from its published manifesto.",
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
    what: "How Scotland, Wales and Northern Ireland run some of their own affairs through their own parliaments, and what is left to Westminster.",
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
    what: "Plain-English definitions of the jargon used across this site and in political news.",
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
    what: "Search any company, union or person to see every MP and party they have given declared money to.",
    why: "It reverses the usual view: instead of looking at an MP's donors, you start from the donor.",
    notShown: "Money that wasn't declared. Names can be spelled differently across registers, so matches aren't always complete.",
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
