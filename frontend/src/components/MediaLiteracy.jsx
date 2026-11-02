import { readable } from "../theme";
import { IconBook, IconScales, IconSearch, IconBroadcast, IconShield, IconBallot, IconBolt, IconFeed, IconCompass, IconVote } from "./icons";
import { Hero } from "./story/Vivid";
import ExplainerPage from "./story/ExplainerPage";
import { TwoLanes, Rules, Quiz, Outlets, Cases, LinkList } from "./story/NewsArt";

// How the news is regulated: the words are here, the pictures and cards are in story/NewsArt.jsx.

const OUTLETS = [
  {
    name: "BBC",
    tag: "Licence fee · Public corporation",
    color: readable("#5A7FA6"),
    funding: "The TV licence fee: a statutory charge on households, set by government but collected independently.",
    ownership: "A public corporation operating under a Royal Charter, not owned by shareholders or the state directly.",
    regulator: "Regulated by Ofcom for due impartiality since 2017 (previously self-regulated under its own Charter).",
  },
  {
    name: "ITV",
    tag: "Adverts · Listed company",
    color: readable("#9C6B30"),
    funding: "Commercial advertising revenue.",
    ownership: "A publicly listed company (ITV plc) on the London Stock Exchange, owned by its shareholders.",
    regulator: "Regulated by Ofcom for due impartiality, like every UK broadcast news service.",
  },
  {
    name: "Channel 4",
    tag: "Adverts · Publicly owned",
    color: readable("#B5533C"),
    funding: "Commercial advertising revenue, despite public ownership.",
    ownership: "Publicly owned (a state-owned corporation): the government considered privatising it in 2022 but reversed that decision in January 2023.",
    regulator: "Regulated by Ofcom for due impartiality.",
  },
  {
    name: "Sky News",
    tag: "Subscriptions and adverts · Owned by Comcast",
    color: readable("#3F7D5C"),
    funding: "Subscription and advertising revenue, cross-funded within the wider Sky/Comcast group.",
    ownership: "Owned by Sky Group, itself owned by Comcast, a US media conglomerate, since 2018.",
    regulator: "Regulated by Ofcom for due impartiality.",
  },
  {
    name: "GB News",
    tag: "Adverts and investors · Private company",
    color: readable("#6E4B6E"),
    funding: "Commercial advertising and direct shareholder investment (it has reported significant losses since launch).",
    ownership: "Privately owned through the holding company All Perspectives Ltd, whose main backers are the investment firm Legatum Ventures and the financier Sir Paul Marshall. The exact shareholdings are in its Companies House filings.",
    regulator: "Regulated by Ofcom for due impartiality. Ofcom has found it in breach of the Broadcasting Code on several occasions, for example over a campaign it ran on cash and over an interview a sitting MP did with a minister from their own party. Some of its findings were later overturned in court.",
  },
];

const QUIZ_ITEMS = [
  { name: "BBC News", answer: "broadcast" },
  { name: "The Guardian", answer: "print" },
  { name: "Sky News", answer: "broadcast" },
  { name: "The Daily Telegraph", answer: "print" },
  { name: "GB News", answer: "broadcast" },
  { name: "The Sun", answer: "print" },
  { name: "ITV News", answer: "broadcast" },
  { name: "The Daily Mail", answer: "print" },
];

const CODE_REQUIREMENTS = [
  {
    title: "Due impartiality",
    icon: IconScales,
    short: "Give the different sides of a big political argument a fair share of airtime.",
    color: "#2F6FE0",
    rule: "Broadcasting Code, Section 5",
    body: "An \"appropriately wide range of significant views\" must be included and given \"due weight\" on any matter of political or industrial controversy, or current public policy, and the programme itself, not just the channel's output over time, has to achieve this on major matters. A broadcaster can't simply balance things out across a whole week; a single one-sided programme on a big issue can breach the rule on its own.",
  },
  {
    title: "Due accuracy",
    icon: IconSearch,
    short: "Check the facts, and correct big mistakes.",
    color: "#12A07A",
    rule: "Broadcasting Code, Section 5",
    body: "Facts must be checked and significant errors corrected. \"Due\" means accuracy appropriate to the subject and nature of the programme, so a throwaway aside is judged more lightly than a claim central to a news report. Material factual mistakes that could mislead audiences on matters of public importance have to be corrected, and correction has to be proportionate to how prominent the original error was.",
  },
  {
    title: "No politicians as newsreaders or interviewers",
    icon: IconBroadcast,
    short: "A sitting MP can't read the news or interview people on a news show.",
    color: "#E8801F",
    rule: "Broadcasting Code, Section 5.3",
    body: "A sitting politician cannot present, interview, or report in a news programme, and can only appear in other programming (chat shows, current affairs) if there's a clear editorial justification and, critically, their political allegiance is made clear to the audience. The rule is about news programmes: in February 2025 the High Court ruled that it does not cover current affairs programmes, and Ofcom then consulted on widening it.",
  },
  {
    title: "Fairness",
    icon: IconShield,
    short: "If a programme criticises you, you should get the chance to reply.",
    color: "#D6455F",
    rule: "Broadcasting Code, Section 7",
    body: "Anyone who could be significantly criticised in a programme should normally be given a chance to respond before broadcast, and contributors shouldn't be treated unjustly through misleading editing or a lack of information about what they were contributing to. This protects the people and organisations covered, not just the audience.",
  },
  {
    title: "Extra care at elections and referendums",
    icon: IconBallot,
    short: "During a campaign the rules get stricter.",
    color: "#8A4FD6",
    rule: "Broadcasting Code, Section 6",
    body: "During an election or referendum period the impartiality duty tightens further, broadcasters must give due weight to all major parties and campaigns, and news coverage of constituency and electoral area campaigns comes with additional rules on candidate participation and airtime.",
  },
];

const REAL_CASES = [
  {
    outlet: "GB News",
    color: readable("#6E4B6E"),
    date: "July 2023 (ruled December 2023)",
    programme: "The Live Desk",
    headline: "Promoted its own cash campaign on air.",
    verdict: "Breach",
    rule: "Due impartiality",
    summary: "An episode promoted a GB News campaign, \"Don't Kill Cash\", asking viewers to sign a petition to protect cash as legal tender until at least 2050, with an on-screen QR code. Ofcom said how far cash should be protected is a matter of political controversy and current public policy, that the channel clearly endorsed the campaign, and that the programme gave only limited reference to other views. It recorded a breach of the due impartiality rules (5.4 and 5.5). Ofcom was clear that broadcasters may run campaigns and cover the subject, provided they keep to the impartiality rules.",
  },
  {
    outlet: "GB News",
    color: readable("#6E4B6E"),
    date: "March 2023 (ruled September 2023)",
    programme: "Friday & Saturday Morning with Esther and Phil",
    headline: "Two Conservative MPs interviewed the Chancellor days before the Budget.",
    verdict: "Breach",
    rule: "Due impartiality",
    summary: "Conservative MPs Esther McVey and Philip Davies, who co-hosted a weekend programme, interviewed the Conservative Chancellor, Jeremy Hunt, days before the Spring Budget, in a pre-recorded segment that drew 45 complaints. Ofcom found a breach of due impartiality and said the channel should have taken additional steps to keep it. It did not find a breach of the rule on politicians as presenters, because the show counted as current affairs rather than news.",
  },
  {
    outlet: "GB News",
    color: readable("#6E4B6E"),
    date: "May and June 2023 (ruled March 2024)",
    programme: "State of the Nation",
    headline: "Ofcom's ruling on an MP presenting was overturned by the High Court.",
    verdict: "Overturned",
    rule: "Politicians as presenters",
    summary: "Ofcom ruled in March 2024 that Jacob Rees-Mogg, then a sitting Conservative MP, had acted as a newsreader on his show, by reading a \"breaking news\" item on a US civil case against Donald Trump and a live update from Nottingham. In February 2025 the High Court quashed both decisions, ruling that the rule applies to news programmes and these were current affairs programmes. Ofcom withdrew the findings. A useful reminder that Ofcom's own rulings go through a real appeals process, and don't always stand.",
  },
  {
    outlet: "BBC",
    color: readable("#5A7FA6"),
    date: "February 2021 (ruled July 2022)",
    programme: "The World at One (BBC Radio 4)",
    headline: "A guest's strong views were not balanced by others.",
    verdict: "Breach",
    rule: "Due impartiality",
    summary: "Coverage of the dispute between Alex Salmond and the Scottish Government over harassment complaints included an interview with Baroness Ruth Davidson giving strongly critical views, without due weight given to alternative perspectives on a matter of intense, live political controversy. Ofcom found this a breach: a reminder that the impartiality duty applies to the BBC exactly as it does to any commercial broadcaster.",
  },
  {
    outlet: "BBC",
    color: readable("#5A7FA6"),
    date: "December 2021 (ruled November 2022)",
    programme: "News coverage of an antisemitic attack on a bus in London",
    headline: "A disputed claim was not described as disputed quickly enough.",
    verdict: "Fell short",
    rule: "Due accuracy",
    summary: "The BBC reported a disputed interpretation of an audio recording without making clear, promptly enough, that its meaning was contested. Ofcom called it a \"serious editorial misjudgement\" not to say on air that the claim was disputed, and said the BBC failed to follow its own editorial guidelines online, but it did not find a breach of the Broadcasting Code in the television news. It's a more nuanced example: coverage can fall short of best practice without crossing the regulatory line.",
  },
];

const VERDICTS = {
  Breach: { label: "Ruled a breach", color: readable("#9C3B3B") },
  Overturned: { label: "Overturned on appeal", color: readable("#4C7A6B") },
  "Fell short": { label: "Fell short, not a breach", color: readable("#9C6B30") },
};

const LINKS = [
  { label: "Ofcom's due impartiality rules, explained", url: "https://www.ofcom.org.uk/tv-radio-and-on-demand/broadcast-standards/section-five-due-impartiality-accuracy" },
  { label: "Ofcom's published broadcast standards decisions", url: "https://www.ofcom.org.uk/tv-radio-and-on-demand/broadcast-standards/broadcast-and-on-demand-bulletin-decisions" },
  { label: "Loughborough University's Centre for Research in Communication and Culture", url: "https://www.lboro.ac.uk/research/crcc/", note: "Independent academics who quantitatively track UK election TV and press coverage, rather than assert a verdict." },
];

const PAGE = {
  look: "vivid",
  icon: IconBook,
  kicker: "Understand it",
  title: "How broadcast impartiality works",
  subtitle: "This site doesn't rate broadcasters for bias, because that is a judgement call rather than a matter of public record. Instead, this page explains how UK broadcast regulation works, what it requires, who owns what, and cases where it has been tested.",
  lead: <Hero
    label="Why the news matters"
    colours={["#5A1247", "#D9482B", "#2D5BD0"]}
    why="Most of us never sit in a vote, a hearing or a Budget speech. We see the news report of it. Editors and producers decide which stories get covered and how they are told, so the news helps set what the public talks about, what seems normal or urgent, and who gets trusted. That is why the law holds broadcast news to a standard of impartiality, and why it matters which outlets are held to it. Knowing the difference is the first step to reading any story with the right amount of trust."
    stops={[
      { icon: IconBolt, title: "Something happens", text: "A vote, a report, a speech", colour: "#FFB347" },
      { icon: IconFeed, title: "Newsrooms choose", text: "What to cover, and how much space it gets", colour: "#5BA8FF" },
      { icon: IconBroadcast, title: "They tell the story", text: "The words, the pictures, who is asked", colour: "#FF7A8A" },
      { icon: IconCompass, title: "We form a view", text: "Of what is normal, urgent or true", colour: "#4FD6A0" },
      { icon: IconVote, title: "We act on it", text: "Who we trust, and how we vote", colour: "#C79BFF" },
    ]}
  />,
  chapters: [
    {
      title: "The big difference",
      colour: "#2F7BD6",
      blocks: [{ node: <TwoLanes /> }],
    },
    {
      title: "What the Broadcasting Code actually requires",
      lede: "\"Due impartiality\" isn't just a slogan. It's a specific set of rules Ofcom enforces, with real cases testing where the line falls. Here's what it breaks down into.",
      colour: "#E8801F",
      blocks: [{ node: <Rules rules={CODE_REQUIREMENTS} /> }],
    },
    {
      title: "Quick check: broadcast or print?",
      lede: "Every one of these has a clear, factual regulatory status: no opinion required. Sort all eight to see if the broadcast/print divide is as intuitive as it sounds.",
      colour: "#D6457F",
      blocks: [{ node: <Quiz items={QUIZ_ITEMS} /> }],
    },
    {
      title: "Who owns and funds each broadcaster",
      lede: "Ownership and funding model are matters of public record, not opinion, worth knowing before you judge a broadcaster's coverage of anything, including its own owners' interests. Tap a card for the detail.",
      colour: "#12A07A",
      blocks: [{ node: <Outlets outlets={OUTLETS} /> }],
    },
    {
      title: "When broadcasters have fallen short, and when they haven't",
      lede: "Five published Ofcom cases, chosen to show what a breach looks like, what falls just short of one, and that Ofcom's own rulings can be successfully challenged.",
      colour: "#D6455F",
      blocks: [{ node: <Cases cases={REAL_CASES} verdicts={VERDICTS} /> }],
    },
    {
      title: "Where to find the official rulings",
      lede: "Ofcom publishes every impartiality ruling it upholds, with its reasoning, in a weekly bulletin. Read the ruling itself, not anyone's scorecard.",
      colour: "#4F6BD0",
      blocks: [{ node: <LinkList links={LINKS} /> }],
    },
    {
      title: "Four habits for reading any news",
      colour: "#E2574C",
      blocks: [{ cards: [
        { title: "News or opinion?", text: "Check which one you are reading. The impartiality rules bite far harder on news than on comment.", colour: "#2F7BD6" },
        { title: "Who is speaking?", text: "A guest's job tells you where they start from: a think tank, a trade body or a party.", colour: "#E8801F" },
        { title: "Check a second source", text: "A different outlet is the cheapest way to spot what was left out.", colour: "#12A07A" },
        { title: "Go to the source", text: "Every figure on this site links to the official document. You never need to trust anyone's framing.", colour: "#E2574C" },
      ] }],
    },
  ],
  sources: [],
};

export default function MediaLiteracy() {
  return <ExplainerPage {...PAGE} />;
}
