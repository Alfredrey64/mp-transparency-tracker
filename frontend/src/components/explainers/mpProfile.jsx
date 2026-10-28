/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconWhoMps } from "../newIcons";

const PAGE = {
  icon: IconWhoMps,
  kicker: "Understand it",
  title: "Who MPs are",
  subtitle: "Parliament makes laws for everyone, so it matters whether the people in it look and sound like the people they represent. This page compares the Commons with the country on gender, schooling, university and background, using official lists and independent studies.",
  tiles: [
    { label: "Women among the 650 MPs today", value: "41%", colour: "#FFB45E", sub: "267 women, 383 men, from the Parliament members list" },
    { label: "MPs educated at private school", value: "23%", colour: "#6FB1FF", sub: "a record low, according to the Sutton Trust's July 2024 study" },
    { label: "MPs elected in 2024 from an ethnic minority", value: "90", colour: "#FF7A8A", sub: "a record, in British Future's analysis of the 2024 result" },
  ],
  why: { colour: "#5A7FA6", text: "MPs decide on schools, benefits and the NHS. When their own backgrounds are very different from voters', some experiences may be easier for Parliament to miss." },
  chapters: [
    {
      title: "Gender",
      lede: "Women make up 41% of the House of Commons and 35% of the House of Lords.",
      colour: "#E8741A",
      blocks: [
        { bars: { items: [
          { label: "Labour (with Co-op)", value: 46.8, text: "189 of 404", colour: "#C13A4E" },
          { label: "Liberal Democrat", value: 45.1, text: "32 of 71", colour: "#E8741A" },
          { label: "Conservative", value: 23.7, text: "28 of 118", colour: "#1E4FB8" },
          { label: "House of Lords", value: 35.4, text: "289 of 816", colour: "#6E4B6E" },
        ], max: 100, note: "Women as a share of each group, in per cent, on 28 October 2026, from the Parliament members list. Bars show the percentage." } },
        { text: [<>The party counts here are for the three largest groups of MPs. Every MP is listed on <a href="#/list">the MPs page</a>, and the full party split is on <a href="#/numbers">Parliament in numbers</a>.</>] },
      ],
    },
    {
      title: "School and university",
      lede: "From the Sutton Trust's analysis of the 650 MPs elected on 4 July 2024.",
      colour: "#5A7FA6",
      blocks: [
        { bars: { items: [
          { label: "State comprehensive", value: 63, text: "63%", colour: "#3F7D5C" },
          { label: "Independent (private)", value: 23, text: "23%", colour: "#9C3B3B" },
          { label: "Selective (grammar)", value: 12, text: "12%", colour: "#E8741A" },
        ], max: 100, note: "School type of MPs elected in 2024." } },
        { compare: [
          { title: "By party", colour: "#5A7FA6", items: [
            "15% of Labour MPs went to private school.",
            "46% of Conservative MPs went to private school.",
            "The share for MPs of the three main parties peaked at 51% in 1983 and is now at a record low.",
          ] },
          { title: "University", colour: "#6E4B6E", items: [
            "20% of MPs went to Oxford or Cambridge as undergraduates.",
            "34% went to another Russell Group university.",
            "40% have a postgraduate qualification, and 10% did not attend university at all.",
          ] },
        ] },
        { note: "The Sutton Trust says MPs' backgrounds are still very different from the population's. Of the 350 newly elected MPs, 66% went to comprehensives, 22% to independent schools and 11% to grammar schools." },
      ],
    },
    {
      title: "Ethnic background",
      lede: "There is no official record of MPs' ethnicity, so the count comes from an independent analysis.",
      colour: "#9C3B3B",
      blocks: [
        { text: ["British Future counted 90 ethnic minority MPs elected on 4 July 2024, an increase of 24 on the previous Parliament and the most diverse House of Commons so far. That is about one in seven of 650 MPs."] },
        { note: "Early counts published in the days after the election were slightly lower, so the exact number depends on who counted and when." },
      ],
    },
    {
      title: "What this page does not show",
      lede: "A snapshot of background is not a measure of how well anyone does the job.",
      colour: "#9C6B30",
      blocks: [
        { text: ["It does not cover age, income before becoming an MP, or the work MPs did before entering politics, because there is no single official record. The figures on gender come from today's membership, which changes with by-elections and defections. The figures on schooling and ethnic background describe the Commons as elected in July 2024."] },
      ],
    },
  ],
  sources: [
    { label: "UK Parliament Members API: current members of the Commons and Lords", url: "https://members-api.parliament.uk/index.html", note: "Gender and party counts for 650 MPs and 816 peers, taken on 28 October 2026." },
    { label: "The Sutton Trust: Parliamentary Privilege 2024 (5 July 2024)", url: "https://www.suttontrust.com/our-research/parliamentary-privilege-2024/", note: "School, Oxbridge, Russell Group and postgraduate figures." },
    { label: "British Future: Landmark for representation as diversity of parliament nears that of electorate (5 July 2024)", url: "https://www.britishfuture.org/milestone-for-representation-as-diversity-of-parliament-matches-electorate/", note: "The count of 90 ethnic minority MPs." },
  ],
  checked: "28 October 2026",
};

export default function MpProfile() {
  return <ExplainerPage {...PAGE} />;
}
