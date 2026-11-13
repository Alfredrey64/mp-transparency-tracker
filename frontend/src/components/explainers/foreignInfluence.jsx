/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import InfluenceDesk from "../story/InfluenceDesk";
import { Diverge } from "../story/StateArt";
import RegisterSnapshot from "../story/RegisterSnapshot";
import RegisterEntry from "../story/RegisterEntry";
import { IconGlobe, IconGroup, IconRegister, IconSearch, IconMail, IconFeed, IconCoin, IconInfluence } from "../icons";
import { IconForeignAgent } from "../newIcons";
import REG from "../../data/firsRegister.json";

// Every rule on this page is from the Home Office's own GOV.UK pages, read in full on 12 November 2026: the launch and "fully into effect" announcements, the collection page and the
// "registration and public register" guidance (chapters 2 to 8). The count of entries on the public register is from the register's own search page on the same day
// (frontend/src/data/firsRegister.json, copied by hand because the register cannot be read by a script). No office-holder or registrant is named.

const asOf = new Date(`${REG.checked}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const PAGE = {
  look: "vivid",
  icon: IconForeignAgent,
  kicker: "Money & influence",
  title: "The register of foreign influence",
  subtitle: "Since 1 July 2025, anyone acting in the UK on the instructions of a foreign government has to tell the Home Office. This page explains what has to be registered, what the public can see on the register, what can be held back, and what it means for MPs.",
  lead: <InfluenceDesk
    why="Lobbying by another country's government is legal, but until this scheme the public had no general way to know it was happening. Registration is meant to make it visible, not to ban it."
    stops={[
      { icon: IconGlobe, title: "A foreign power gives a direction", text: "To lobby, to publish, or to hand over money, goods or services", colour: "#8DB7E8" },
      { icon: IconGroup, title: "Someone in the UK carries it out", text: "A lobbyist, a company, a campaigner: anyone it is arranged with", colour: "#E2BE7A" },
      { icon: IconRegister, title: "They register with the Home Office", text: "Within 28 days, or 10 for the enhanced tier", colour: "#9ED4B6" },
      { icon: IconSearch, title: "The public can search it", text: "Most political influence entries are published", colour: "#F2A5B0" },
    ]}
    figures={[
      { value: String(REG.total), label: "Entries on the public register", sub: `On ${asOf}; the first appeared in August 2025` },
      { value: "28 days", label: "To register: political tier", sub: "10 days, and before any activity, for the enhanced tier" },
      { value: "5 years", label: "Most prison for not registering", sub: "2 years for the political tier" },
    ]}
  />,
  chapters: [
    {
      title: "What has to be registered",
      lede: "The scheme is part of the National Security Act 2023. It is about being directed by a foreign power, not about talking to one.",
      colour: "#3E6E9E",
      blocks: [
        { text: ["The test is an arrangement: any agreement, formal or informal, with a foreign power, such as a contract, a memorandum of understanding or an informal understanding. If that arrangement is for carrying out political influence activities in the UK, it has to be registered. Those activities come in three kinds."] },
        { node: <Diverge
          root={{ icon: IconInfluence, title: "Political influence activity", text: "Something done to influence a political matter, at a foreign power's direction", colour: "#3E6E9E" }}
          items={[
            { icon: IconMail, title: "Communication", text: "Contacting MPs, ministers, officials or candidates directly, for example by email or in meetings.", colour: "#3E6E9E" },
            { icon: IconFeed, title: "Public communication", text: "Speaking to an audience, for example through a newspaper article, with the aim of shifting a political decision.", colour: "#7B5BD6" },
            { icon: IconCoin, title: "Money, goods or services", text: "Giving money, goods or services, for example advice or consultancy, to try to influence a political matter.", colour: "#C9792B" },
          ]}
        /> },
        { note: "The Home Office's guidance says a registrant does not have to list every email or meeting. It does say vague statements such as \"I communicate with the Government to influence policy\" are not enough." },
      ],
    },
    {
      title: "Two tiers, two sets of rules",
      lede: "The tier depends on who the foreign power is.",
      colour: "#5A7FA6",
      blocks: [
        { compare: [
          { title: "Political tier", colour: "#5A7FA6", items: [
            "Applies to any foreign power.",
            "Covers arrangements to carry out political influence activities in the UK for that power, including political communications and lobbying senior decision-makers such as MPs and election candidates.",
            "Must be registered within 28 days of the arrangement being made.",
            "Failing to register can mean up to 2 years in prison.",
          ] },
          { title: "Enhanced tier", colour: "#9C3B3B", items: [
            "Applies to foreign powers the government considers a particular risk to UK safety or interests. Parliament approved placing Russia and Iran here, including their intelligence services and armed forces.",
            "Can require registration of all activities carried out in the UK at that power's direction.",
            "Must be registered within 10 days, and before any activity starts.",
            "Failing to register can mean up to 5 years in prison.",
          ] },
        ] },
        { text: ["An arrangement that falls under both tiers only has to be registered under the enhanced tier."] },
        { note: "Exemptions cover recognised news publishers, lawyers acting in legal proceedings or giving legal advice, diplomats and their families, and arrangements involving the UK government." },
      ],
    },
    {
      title: "From a direction to a public record",
      lede: "Four steps, from the day an arrangement is made to the day it comes off the register.",
      colour: "#2F7D6B",
      blocks: [
        { pipeline: [
          { label: "An arrangement is made", value: "Formal or not", note: "A contract, or an understanding that was never written down", colour: "#3E6E9E" },
          { label: "The person registers", value: "28 or 10 days", note: "28 for the political tier; 10, and before starting, for the enhanced tier", colour: "#5A7FA6" },
          { label: "Checked, then published", value: "Live", note: "The Home Office's case team processes it and decides whether an exception applies. It is then published as soon as reasonably practicable, not on a timetable", colour: "#2F7D6B" },
          { label: "It stays up", value: "10 years", note: "After the stated end date. With no end date, it stays indefinitely", colour: "#9C6B30" },
        ] },
        { pull: "The Home Office says that registering does not mean an arrangement is illegitimate or that the activity is undesirable, and that a registrant does not need to stop or seek approval." },
        { text: ["Someone who registers can update the entry at any time to say an arrangement has ended, and the case team reviews what is published to see if it should stay."] },
      ],
    },
    {
      title: "The register today",
      lede: "The public register can be searched on GOV.UK. This is what was on it when this page was last checked.",
      colour: "#3E6E9E",
      blocks: [
        { node: <RegisterSnapshot colour="#3E6E9E" /> },
        { text: [
          "The register names a \"country or territory of influence\" for each entry. Russia and Iran, the two foreign powers in the enhanced tier, are not among them. That says little, because enhanced tier registrations are not published unless they concern political influence activities.",
          "The government has said it will publish an annual report with the total number of registrations under each tier. That is a count of registrations made, so it is not limited to the ones that are published.",
        ] },
      ],
    },
    {
      title: "What an entry shows, and what it hides",
      lede: "The register is built to show what was arranged and why, without exposing the people behind it.",
      colour: "#3F7D5C",
      blocks: [
        { node: <RegisterEntry colour="#3F7D5C" /> },
        { text: ["The Home Office says the register is meant to inform the public about the scale and extent of foreign influence in UK political affairs. Those who appear on it should be regarded as supporting the scheme's aim of transparency, and appearing on it does not mean someone has done anything illegitimate."] },
      ],
    },
    {
      title: "When an entry is held back",
      lede: "A registrant can ask for an exception. There are four, and the bar is high.",
      colour: "#9C3B3B",
      blocks: [
        { cards: [
          { title: "The safety or interests of the UK", text: "For example where publishing would reveal sensitive communications involving the UK Government, or help a foreign power in the enhanced tier act against the UK." },
          { title: "Crime", text: "Where publishing would prejudice preventing or detecting a crime, a criminal investigation or criminal proceedings." },
          { title: "Someone's safety", text: "Where there is a significant risk that publishing would put a person at risk of serious harm. The guidance says this may apply to people campaigning on human rights whose families could be at risk in their home country." },
          { title: "Commercially sensitive information", text: "Where the information is confidential and publishing it is highly likely to seriously harm someone's commercial interests, such as trade secrets or pending mergers." },
        ] },
        { pull: "Damage to someone's reputation is not enough. The guidance says an exception cannot be claimed where publication would cause reputational damage alone." },
        { text: ["An exception can cover a whole entry or only part of it, in which case the rest is published with the sensitive part blacked out. It can also be applied later, so an entry can be taken down after it has been published."] },
        { more: { title: "How an exception is decided", text: [
          "When someone registers, they say whether they think an exception applies and give evidence. The case team can ask for more evidence and tells them whether the exception has been granted.",
          "If the evidence is not good enough, the registrant is told the date the information will be published, and publication is delayed if they send more evidence before then. If an exception is refused they get one request for reconsideration. Activities do not have to stop while this is decided.",
          "Hypothetical risks without evidence do not meet the bar, and an exception lasts only as long as the reason for it does.",
        ] } },
      ],
    },
    {
      title: "What it means for MPs and peers",
      lede: "The scheme puts the duty on the person doing the influencing, not on the MP they approach.",
      colour: "#9C6B30",
      blocks: [
        { compare: [
          { title: "The foreign influence register", colour: "#3E6E9E", items: [
            "Run by the Home Office.",
            "Filled in by the person a foreign power directs, not by the MP or peer they contact.",
            "A live register: entries are published once a caseworker has processed them.",
            "MPs and peers have no duty to report anything under it.",
          ] },
          { title: "Parliament's registers of interests", colour: "#9C6B30", items: [
            "MPs and peers declare financial interests and benefits that might reasonably be thought to influence what they do, say or vote.",
            "The Commons register is updated about every fortnight, or monthly when Parliament is not sitting.",
            "The Lords register is updated daily when the House is sitting.",
            "Being named on the foreign influence register does not by itself mean an MP has to make an entry, unless, for example, they received a gift or hospitality they must declare.",
          ] },
        ] },
        { text: [<>The two registers overlap but are not the same, and something can be on one and not the other. To see what MPs have declared, see <a href="#/list">gifts, jobs and donations</a>.</>] },
      ],
    },
    {
      title: "Where it sits among the other rules",
      lede: "Several rules deal with foreign money and influence. Each covers a different thing.",
      colour: "#9C6B30",
      blocks: [
        { cards: [
          { title: "Donations to parties", text: "A party can only accept donations from a permissible donor: for example someone on the UK electoral register or a UK-registered company. See who funds the parties." },
          { title: "Lobbying", text: "The consultant lobbying register covers firms paid to lobby ministers for clients, whoever the client is." },
          { title: "This scheme", text: "Covers people acting in the UK on the direction of a foreign power, and asks them to register what they are doing and for whom." },
        ] },
        { text: [<>Related pages: <a href="#/lobbyingRegister">paid lobbyists</a>, <a href="#/partyFinances">who funds the parties</a>, <a href="#/howPartyFundingWorks">how party funding rules work</a> and <a href="#/darkMoney">hidden donations</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: UK launches Foreign Influence Registration Scheme (1 July 2025)", url: "https://www.gov.uk/government/news/uk-launches-foreign-influence-registration-scheme", note: "The two tiers, Russia and Iran, the 28-day and 10-day deadlines, the exemptions, and what registering does not mean." },
    { label: "GOV.UK: Foreign Influence Registration Scheme to come fully into effect (30 September 2025)", url: "https://www.gov.uk/government/news/foreign-influence-registration-scheme-to-come-fully-into-effect", note: "The end of the grace period, the 2-year and 5-year maximum sentences, what is published, and the annual report." },
    { label: "GOV.UK: Foreign Influence Registration Scheme: registration and public register", url: "https://www.gov.uk/government/publications/foreign-influence-registration-scheme-registration-and-public-register/foreign-influence-registration-scheme-registration-and-public-register", note: "What is published and kept private, how long entries stay, the four exceptions and how they are decided, and how the register relates to Parliament's." },
    { label: "FIRS public register (GOV.UK)", url: "https://foreign-influence-registration-scheme.service.gov.uk/public-register", note: `The number of entries, the countries and the months, counted from its search filters on ${asOf}.` },
    { label: "GOV.UK: Foreign Influence Registration Scheme collection", url: "https://www.gov.uk/government/collections/foreign-influence-registration-scheme", note: "Guidance, and the online registration service." },
    { label: "Political Parties, Elections and Referendums Act 2000, section 54: permissible donors", url: "https://www.legislation.gov.uk/ukpga/2000/41/section/54" },
  ],
  checked: "12 November 2026",
};

export default function ForeignInfluence() {
  return <ExplainerPage {...PAGE} />;
}
