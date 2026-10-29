/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconForeignAgent } from "../newIcons";

const PAGE = {
  look: "poster",
  icon: IconForeignAgent,
  kicker: "Money & influence",
  title: "The register of foreign influence",
  subtitle: "Since 1 July 2025, anyone acting in the UK on the instructions of a foreign government has to tell the Home Office. This page explains what has to be registered, what happens if it is not, and what the public can and cannot see.",
  tiles: [
    { label: "The scheme began", value: "1 July 2025", colour: "#6FB1FF", sub: "criminal penalties applied from 1 October 2025" },
    { label: "Prison for not registering: enhanced tier", value: "5 years", colour: "#FF7A8A", sub: "currently Russia and Iran" },
    { label: "Prison for not registering: political tier", value: "2 years", colour: "#FFB45E", sub: "any foreign power" },
  ],
  why: { colour: "#5A7FA6", text: "Lobbying by another country's government is legal, but until this scheme the public had no general way to know it was happening. Registration is meant to make it visible, not to ban it." },
  chapters: [
    {
      title: "How the scheme works",
      lede: "It is part of the National Security Act 2023 and has two tiers.",
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
        { note: "Exemptions cover recognised news publishers, lawyers acting in legal proceedings or giving legal advice, diplomats and their families, and arrangements involving the UK government." },
      ],
    },
    {
      title: "What registering does and does not mean",
      lede: "A registration is a disclosure. It is not a finding.",
      colour: "#3F7D5C",
      blocks: [
        { pull: "The Home Office says that registering does not mean an arrangement is illegitimate or that the activity is undesirable, and that a registrant does not need to stop or seek approval." },
        { cards: [
          { title: "A public register", text: "Political tier registrations appear on a public register once they have been processed and reviewed." },
          { title: "Some entries stay private", text: "Arrangements are not published where publication could prejudice commercial interests or put someone at risk. Enhanced tier registrations are not published, except those that concern political influence activities." },
          { title: "An annual report", text: "The government will publish a report each year with the total number of registrations under each tier." },
        ] },
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
        { text: [<>Related pages: <a href="#/lobbyingRegister">paid lobbyists</a>, <a href="#/partyFinances">who funds the parties</a> and <a href="#/darkMoney">hidden donations</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: UK launches Foreign Influence Registration Scheme (1 July 2025)", url: "https://www.gov.uk/government/news/uk-launches-foreign-influence-registration-scheme", note: "The two tiers, the 28-day and 10-day deadlines, the exemptions, and what registering does not mean." },
    { label: "GOV.UK: Foreign Influence Registration Scheme to come fully into effect (30 September 2025)", url: "https://www.gov.uk/government/news/foreign-influence-registration-scheme-to-come-fully-into-effect", note: "The end of the grace period, the 2-year and 5-year maximum sentences, and what is published." },
    { label: "GOV.UK: Foreign Influence Registration Scheme collection", url: "https://www.gov.uk/government/collections/foreign-influence-registration-scheme", note: "Guidance, and the online registration service." },
    { label: "Political Parties, Elections and Referendums Act 2000, section 54: permissible donors", url: "https://www.legislation.gov.uk/ukpga/2000/41/section/54" },
  ],
  checked: "28 October 2026",
};

export default function ForeignInfluence() {
  return <ExplainerPage {...PAGE} />;
}
