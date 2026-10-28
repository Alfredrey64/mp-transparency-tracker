/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconCrown } from "../newIcons";

const PAGE = {
  icon: IconCrown,
  kicker: "Understand it",
  title: "The monarchy: role and money",
  subtitle: "The King is head of state but does not decide policy. The public money he receives for official duties is set by a formula in law, linked to the profits of the Crown Estate. This page sets out the formula, the amounts, and a cut that has been proposed.",
  tiles: [
    { label: "Sovereign Grant, 2026 to 2027", value: "£137.9m", colour: "#C9A6E8", sub: "to support the King's official duties" },
    { label: "Proposed from 2027 to 2028", value: "£99.9m", colour: "#6FB1FF", sub: "needs new legislation, so not yet law" },
    { label: "Crown Estate profit used in the sum, 2025 to 2026", value: "£487m", colour: "#FFB45E", sub: "the Royal Trustees' review figure" },
  ],
  why: { colour: "#6E4B6E", text: "The Sovereign Grant is public money, set by a rule that most people have never seen. Seeing the rule explains why the figure moved up sharply and why a cut is now proposed." },
  chapters: [
    {
      title: "What the King does",
      lede: "The monarch is the head of state, and acts on the advice of ministers.",
      colour: "#6E4B6E",
      blocks: [
        { text: [
          "By convention the King formally approves laws passed by Parliament (Royal Assent), appoints ministers on the Prime Minister's advice, and opens each session of Parliament. The decisions in those speeches and appointments are made by elected politicians.",
          "Because these are conventions, not written rules, the line between the role of the King and of ministers is drawn by practice rather than by a single document. See Courts and the constitution.",
        ] },
      ],
    },
    {
      title: "How the Sovereign Grant is worked out",
      lede: "A five-step formula in the Sovereign Grant Act 2011 decides the amount each year.",
      colour: "#3F7D5C",
      blocks: [
        { steps: [
          { title: "Take 12% of the Crown Estate's profit", text: "The figure is the net surplus on the Crown Estate's income account for the financial year two years earlier. The percentage was cut from 25% to 12% after the 2023 review, because the Crown Estate's profit was expected to rise sharply." },
          { title: "Round it up", text: "To the next £100,000." },
          { title: "It can never fall", text: "The grant is the larger of that sum and the previous year's grant." },
          { title: "A reserve can reduce it", text: "If the Household's reserve fund is worth more than 50% of the resources it used that year, the Royal Trustees may reduce the grant." },
        ] },
        { text: [<>The Crown Estate is a property business. The Grant itself is paid to the Royal Household out of money provided by Parliament, which is why it counts as public money. See <a href="#/funding">funding and independence</a> for how other bodies are funded.</>] },
      ],
    },
    {
      title: "Why a cut is proposed",
      lede: "The Royal Trustees' 2026 review explains the change.",
      colour: "#9C6B30",
      blocks: [
        { timeline: [
          { when: "2016", text: "The percentage is raised to pay for a ten-year reservicing programme at Buckingham Palace, with £369 million of funding agreed. The Trustees said the plumbing, wiring and heating had not been updated since shortly after the Second World War." },
          { when: "2026 to 2027", text: "The final tranche of that funding is paid, and the Grant is £137.9 million." },
          { when: "June 2026", text: "The Royal Trustees' review proposes that the reference percentage change to 20.5 per cent and that the Grant fall to £99.9 million from 2027 to 2028, then stay flat to 2031 to 2032." },
        ] },
        { text: [
          "The law now stops the Grant being set lower than the year before, so the government has said it will bring forward legislation to allow the cut. The Trustees also expect the Crown Estate's profit to fall from its 2025 to 2026 level, as temporary income from offshore wind leasing option fees ends.",
          "The next review is planned for 2031. The review says this means a further real-terms reduction in the Grant each year.",
        ] },
        { note: "The £99.9 million figure is a proposal that needs an Act of Parliament. It is not the amount in law today." },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Sovereign Grant Act 2011, report of the Royal Trustees on the Sovereign Grant 2026 to 2027", url: "https://www.gov.uk/government/publications/sovereign-grant-act-2011-report-of-the-royal-trustees-on-the-sovereign-grant-2026-27", note: "The £137.9 million, and the five-step calculation." },
    { label: "Report of the Royal Trustees: Sovereign Grant Review 2026 (PDF)", url: "https://assets.publishing.service.gov.uk/media/6a3cedc833bc5beefd3c49ae/Report_of_the_Royal_Trustees_Sovereign_Grant_Review_2026.pdf", note: "The 20.5 per cent, the £99.9 million, the £487 million, and the Buckingham Palace reservicing programme." },
    { label: "Sovereign Grant Act 2011, section 6", url: "https://www.legislation.gov.uk/ukpga/2011/15/section/6", note: "The five steps in the Act." },
  ],
  checked: "28 October 2026",
};

export default function Monarchy() {
  return <ExplainerPage {...PAGE} />;
}
