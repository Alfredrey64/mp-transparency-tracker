/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconAid } from "../newIcons";

const PAGE = {
  look: "field",
  icon: IconAid,
  kicker: "Britain in numbers",
  title: "The UK abroad: aid and treaties",
  subtitle: "Two parts of foreign policy leave a paper trail anyone can read: the overseas aid budget, which is falling on purpose, and the treaties the UK signs, which Parliament gets a chance to block. This page covers both.",
  tiles: [
    { label: "UK aid spending in 2025", value: "£13.1bn", colour: "#6FB1FF", sub: "7.0% less than in 2024" },
    { label: "Aid as a share of national income, 2025", value: "0.44%", colour: "#FFB45E", sub: "0.50% in 2024. The plan is 0.3% by 2027" },
    { label: "Sitting days Parliament has to object to a treaty", value: "21", colour: "#3F7D5C", sub: "before it can be ratified" },
  ],
  why: { colour: "#5A7FA6", text: "Most foreign policy is decided by ministers without a vote. Aid and treaties are the two places where the numbers and the deadlines are on the public record." },
  chapters: [
    {
      title: "The aid budget",
      lede: "Official development assistance (ODA) is the money the UK spends to help poorer countries and refugees. The government is cutting it to pay for more defence.",
      colour: "#5A7FA6",
      blocks: [
        { timeline: [
          { when: "1970", text: "The UN General Assembly agrees a target for rich countries to spend 0.7% of national income on aid." },
          { when: "2013 to 2020", text: "The UK spends 0.7%. The International Development (Official Development Assistance Target) Act 2015 puts the commitment into law." },
          { when: "2021", text: "A temporary cut to 0.5%, announced in 2020, takes effect. The government cited the effect of Covid on the public finances." },
          { when: "February 2025", text: "The government decides to cut aid to 0.3% of national income by 2027, to fund more defence. It says it will return to 0.7% as soon as the public finances allow." },
          { when: "2025", text: "Aid is £13,095 million, or 0.44% of national income, according to the final figures published in September 2026." },
        ] },
        { facts: [
          { label: "Spent on refugees in the UK", value: "£2,403m", note: "18.4% of all UK aid in 2025, the largest single use, though £424 million less than in 2024." },
          { label: "Spent by the Foreign Office", value: "69.1%", note: "The rest is spent by other departments, such as the Home Office, and by other providers." },
          { label: "Share going to Africa", value: "51.5%", note: "Of aid that is assigned to a region." },
        ] },
        { text: [
          "The largest bilateral recipients by country in 2025 were Ukraine (£271 million), Yemen (£149 million) and Afghanistan (£145 million).",
        ] },
        { note: "Counting the cost of supporting refugees in the UK as aid follows international rules, but it means money counted as aid is spent at home." },
      ],
    },
    {
      title: "How a treaty is approved",
      lede: "Ministers sign treaties for the UK. Under the Constitutional Reform and Governance Act 2010, Parliament gets a window to object.",
      colour: "#3F7D5C",
      blocks: [
        { steps: [
          { title: "The treaty is laid before Parliament", text: "A minister must lay a copy before Parliament and publish it." },
          { title: "21 sitting days pass", text: "A treaty cannot be ratified until 21 sitting days have passed without either House resolving that it should not be." },
          { title: "If the Commons objects", text: "A minister can lay a statement explaining why it should be ratified anyway. A further 21 sitting days then run, and the treaty cannot go ahead if the Commons objects again." },
          { title: "If only the Lords object", text: "The Lords cannot stop a treaty: a minister can ratify it after laying a statement explaining why." },
        ] },
        { note: "A minister can set the process aside if, exceptionally, they think a treaty should be ratified without it. They must then lay the treaty and a statement before Parliament, and cannot do so after either House has resolved against it." },
      ],
    },
    {
      title: "Where this meets the rest of the site",
      lede: "Defence and trade are the other main parts of the UK's dealings with other countries.",
      colour: "#9C6B30",
      blocks: [
        { text: [<>See <a href="#/defence">defence</a> for spending and the armed forces, <a href="#/trade">trade</a> for what the UK sells and buys abroad, and <a href="#/immigration">immigration</a> for people coming to the UK.</>] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Statistics on International Development: final UK ODA spend 2025 (17 September 2026)", url: "https://www.gov.uk/government/statistics/statistics-on-international-development-final-uk-oda-spend-2025", note: "Every aid figure, the history of the target and the decision to cut it to 0.3% by 2027. Corrected on 28 October 2026." },
    { label: "Constitutional Reform and Governance Act 2010, section 20: treaties", url: "https://www.legislation.gov.uk/ukpga/2010/25/section/20", note: "The 21-sitting-day period and what happens if either House objects." },
    { label: "Constitutional Reform and Governance Act 2010, section 22: exceptional cases", url: "https://www.legislation.gov.uk/ukpga/2010/25/section/22" },
  ],
  checked: "28 October 2026",
};

export default function ForeignPolicy() {
  return <ExplainerPage {...PAGE} />;
}
