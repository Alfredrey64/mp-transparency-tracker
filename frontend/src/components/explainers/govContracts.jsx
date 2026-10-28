/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconContract } from "../newIcons";

const PAGE = {
  icon: IconContract,
  kicker: "Money & influence",
  title: "Who wins government contracts?",
  subtitle: "Departments, councils and the NHS buy goods and services from private companies. This page explains the rules for doing it fairly and openly, and what the official audit found when the pandemic made speed matter more than process.",
  tiles: [
    { label: "Pandemic contracts, March to July 2020", value: "£18.0bn", colour: "#6FB1FF", sub: "more than 8,600 contracts, according to the National Audit Office" },
    { label: "Awarded with no competition", value: "£10.5bn", colour: "#FF7A8A", sub: "direct awards, with no tender" },
    { label: "Suppliers that won through the high-priority lane", value: "1 in 10", colour: "#FFB45E", sub: "47 of 493. In the ordinary lane it was 104 of 14,892" },
  ],
  why: { colour: "#5A7FA6", text: "Contracts are where public money becomes private income. The rules on notices, conflicts of interest and exclusion exist so that anyone can check who got a contract, and why." },
  chapters: [
    {
      title: "How the rules are meant to work",
      lede: "The Procurement Act 2023 took effect on 24 February 2025. It is the main rulebook for public buyers in England, Wales and Northern Ireland, and Scotland has its own rules for the bodies its Parliament runs.",
      colour: "#5A7FA6",
      blocks: [
        { steps: [
          { title: "A notice says what is being bought", text: "Public bodies advertise through Find a Tender, the government's central notice service, so any company can bid." },
          { title: "A conflict of interest has to be managed", text: "The Act says a buyer must take all reasonable steps to make sure a conflict of interest does not give any supplier an unfair advantage or disadvantage." },
          { title: "The contract is announced within 30 days", text: "A contract details notice must be published within 30 days of signing (120 days for the \u201clight touch\u201d services the Act lists separately)." },
          { title: "Large contracts go further", text: "For contracts worth more than £5 million, the buyer must set at least three key performance indicators and publish a copy of the contract within 90 days." },
          { title: "Some suppliers can be shut out", text: "A central debarment list names suppliers that must or may be excluded from public contracts. A Minister decides who goes on it, after an investigation by the Debarment Review Service." },
        ] },
        { note: "The 30-day, 90-day and £5 million figures come from sections 52 and 53 of the Act." },
      ],
    },
    {
      title: "When speed came first: the pandemic",
      lede: "In an emergency the rules allow a buyer to award a contract directly, with no competition. In 2020 that happened on a very large scale.",
      colour: "#9C3B3B",
      blocks: [
        { bars: { items: [
          { label: "Direct award, no competition", value: 10.5, text: "£10.5bn", colour: "#9C3B3B" },
          { label: "Direct from an existing framework", value: 6.7, text: "£6.7bn", colour: "#9C6B30" },
          { label: "Extensions to existing contracts", value: 0.7, text: "£0.7bn", colour: "#6E4B6E" },
          { label: "Competitive tender", value: 0.2, text: "about £0.2bn", colour: "#3F7D5C" },
        ], note: "How the contracts the National Audit Office counted by 31 July 2020 were awarded. Rounded figures, so they do not sum exactly to £18.0bn." } },
        { text: [
          "Personal protective equipment (PPE) made up 80% of the contracts by number (over 6,900) and 68% of the value (£12.3 billion). The Department of Health and Social Care and its bodies awarded £16.2 billion of the total, against 174 contracts worth £1.1 billion in the whole of 2019 to 2020.",
          "The audit office said the circumstances were exceptional, but that decisions still have to be documented and open if the public is to trust that money is spent fairly. It found that in the first phase of the pandemic they were not consistently.",
        ] },
        { facts: [
          { label: "Awarded after the work began", value: "£3.2m", note: "A contract to Deloitte was signed on 21 July 2020 but took effect from 14 March 2020." },
          { label: "Not published on time", value: "55%", note: "Of 1,644 contracts over £25,000 awarded to the end of July 2020, 55% had no details on Contracts Finder by 10 November 2020." },
          { label: "Published within 90 days", value: "25%", note: "Official guidance recommends publishing basic details within 90 days of the award." },
        ], },
      ],
    },
    {
      title: "The high-priority lane",
      lede: "Offers of PPE could come in through two routes. One of them was faster, and who you knew decided which one you were in.",
      colour: "#E8741A",
      blocks: [
        { compare: [
          { title: "High-priority lane", colour: "#E8741A", items: [
            "Offers referred by government officials, ministers' offices, MPs and Lords, senior NHS staff and other health professionals.",
            "The team treated these leads as more credible, or more urgent.",
            "47 of 493 suppliers got a contract: about one in ten.",
          ] },
          { title: "Ordinary lane", colour: "#5A7FA6", items: [
            "Offers sent in by everyone else.",
            "104 of 14,892 suppliers got a contract: fewer than one in a hundred.",
          ] },
        ] },
        { text: [
          "The audit office also found that the source of a referral was not always recorded, and that one supplier, PestFix, was put in the high-priority lane by mistake.",
          "On 12 January 2022 the High Court ruled that the lane breached the legal duty of equal treatment, finding that some offers were treated as high priority even where there were no objectively justifiable grounds. The case was brought by the Good Law Project and EveryDoctor over £592 million of contracts for two suppliers, PestFix and Ayanda Capital.",
        ] },
        { pull: "A ruling that a process was unfair is not a finding that anyone acted corruptly, and the court did not say so. What it showed is why the rules on equal treatment and recorded decisions exist." },
      ],
    },
    {
      title: "How to look at contracts yourself",
      lede: "Every notice is public. These are the places to start.",
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "Find a Tender", text: "The central service for notices under the new rules. Search by buyer, supplier or keyword." },
          { title: "Contracts Finder", text: "The service used for contract notices under the previous rules, including the contracts counted in the National Audit Office's 2020 findings above." },
          { title: "The debarment list", text: "Published by the Debarment Review Service: suppliers currently excluded or excludable from public contracts." },
        ] },
        { text: ["This site does not connect contracts to donations or jobs. A supplier that has given money to a party, or employs a former minister, has not necessarily done anything wrong, and a contract notice cannot show why a buyer chose a supplier. The notices only let you ask the question."] },
      ],
    },
  ],
  sources: [
    { label: "National Audit Office: Investigation into government procurement during the COVID-19 pandemic (November 2020)", url: "https://www.nao.org.uk/reports/investigation-into-government-procurement-during-the-covid-19-pandemic/", note: "The £18.0 billion, the awards, the high-priority lane and the publication figures." },
    { label: "Procurement Act 2023, section 53: contract details notices and publication of contracts", url: "https://www.legislation.gov.uk/ukpga/2023/54/section/53", note: "The 30-day and 90-day deadlines, and the £5 million line." },
    { label: "Procurement Act 2023, section 52: key performance indicators", url: "https://www.legislation.gov.uk/ukpga/2023/54/section/52" },
    { label: "Procurement Act 2023, section 82: conflicts of interest", url: "https://www.legislation.gov.uk/ukpga/2023/54/section/82" },
    { label: "GOV.UK: Debarment Review Service", url: "https://www.gov.uk/guidance/debarment-review-service-drs", note: "How the debarment list works and who decides." },
    { label: "Civil Service World: High Court rules VIP lane for PPE procurement unlawful (January 2022)", url: "https://www.civilserviceworld.com/professions/article/high-court-rules-vip-lane-for-ppe-procurement-unlawful", note: "Reports the ruling and the £592 million of contracts challenged." },
    { label: "Find a Tender", url: "https://www.find-tender.service.gov.uk/" },
    { label: "Contracts Finder", url: "https://www.contractsfinder.service.gov.uk/" },
  ],
  checked: "28 October 2026",
};

export default function GovContracts() {
  return <ExplainerPage {...PAGE} />;
}
