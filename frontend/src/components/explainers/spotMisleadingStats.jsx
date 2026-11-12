/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconChartBars, IconScales, IconSearch, IconVote, IconGroup, IconRegister } from "../icons";
import { IconPoll } from "../newIcons";
import { Hero } from "../story/Vivid";
import VoteSeatGap from "../story/VoteSeatGap";
import SameData from "../story/SameData";
import { GE2024 } from "../../data/generalElection2024";
import INEQ from "../../data/inequalityData.json";
import PLACE from "../../data/inequalityPlace.json";

// Every example below is worked out from a data file this site already holds, so a reader can check it on the page it came from: the 2024 general election result (Parliament's results
// site), household wealth in Great Britain (ONS, April 2020 to March 2022) and the Gini coefficient of household disposable income (ONS). No example is about a claim made by a
// named person or party: the aim is to show how the same true numbers can be made to say different things, not to accuse anyone. The advice itself is general.

const one = (n) => Math.round(n * 10) / 10;
const gbp = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;

// 1. Share of what: votes against seats in 2024.
const share = (name) => { const row = GE2024.parties.find(([n]) => n === name); return { votes: one((row[1] / GE2024.validVotes) * 100), seats: one((row[2] / 650) * 100) }; };
const gap = (name, colour) => ({ name, colour, ...share(name) });

// 2. The average and the middle: wealth of households in Great Britain.
const gb = PLACE.wealth.gb;
const wealthRatio = one(gb.mean / gb.median);

// 3. Percent and percentage points: the share of all wealth held by the poorer half of households.
const bottom = INEQ.wealth.shares.bottom50;
const bFrom = bottom[bottom.length - 2];
const bTo = bottom[bottom.length - 1];
const bPoints = one(bTo - bFrom);
const bPct = Math.round(((bTo - bFrom) / bFrom) * 100);
const periods = INEQ.wealth.periods;
const periodNow = periods[periods.length - 1];
const periodBefore = periods[periods.length - 2];
const short = (p) => { const y = p.match(/(\d{4}).*?(\d{4})/); return y ? `${y[1]}–${y[2].slice(2)}` : p; };

// 4. Where the chart starts: the same Gini series drawn from three different years.
const G = INEQ.income.gini;
const gLast = G.years[G.years.length - 1];
const gAt = (year) => G.disposable[G.years.indexOf(year)];
const pctChange = (a, b) => Math.round(((b - a) / a) * 100);
const ch = (from) => pctChange(gAt(from), gAt(gLast));
const word = (n) => (n > 0 ? `up ${n}%` : `down ${Math.abs(n)}%`);
const win = (from) => ({ kind: "line", unit: "", from: String(from), to: String(gLast), values: G.years.map((y, i) => [y, G.disposable[i]]).filter(([y]) => y >= from).map(([, v]) => v) });
const firstYear = G.years[0];

const PAGE = {
  look: "vivid",
  icon: IconChartBars,
  kicker: "Reading numbers",
  title: "How to spot a misleading statistic",
  subtitle: "Most misleading statistics are not false. They are true numbers, chosen or drawn in a way that points one way. This page takes four ways that happens and shows each one using figures that are already on this site, so you can check them yourself.",
  lead: <Hero
    colours={["#1B2A3A", "#8A5A1F", "#9A3F55"]}
    why="A number on its own never says how it was chosen. The same figures can be turned into very different headlines by changing what you compare, which average you use, or where a chart begins. Knowing the few common choices makes most of them easy to spot."
    stops={[
      { icon: IconSearch, title: "Share of what?", text: "A percentage depends on what it is a percentage of", colour: "#E2BE7A" },
      { icon: IconScales, title: "Which average?", text: "The mean and the middle can be a long way apart", colour: "#8DB7E8" },
      { icon: IconChartBars, title: "Starting where?", text: "Change the start date or the axis and the story changes", colour: "#E59AA6" },
    ]}
    figures={[
      { value: `${wealthRatio}×`, label: "Average household wealth against the middle household", sub: `${gbp(gb.mean)} against ${gbp(gb.median)}, Great Britain` },
      { value: `${bPoints} points`, label: `Or a rise of ${bPct}%: the same change`, sub: `Share of wealth held by the poorer half, ${bFrom}% to ${bTo}%` },
      { value: word(ch(2007)), label: `Inequality of income since 2007, or ${word(ch(firstYear))} since ${firstYear}`, sub: "The same official series, different start years" },
    ]}
  />,
  chapters: [
    {
      title: "Share of what?",
      lede: "A percentage is always a share of something. Change what it is a share of and it can look very different.",
      colour: "#9A3F55",
      blocks: [
        { node: <VoteSeatGap
          rows={[gap("Labour", "#D6224A"), gap("Reform UK", "#0E97B0")]}
          title="The same election, two ways of counting"
          note="The 4 July 2024 general election for the UK, from the Parliament results site. Shares of votes are of valid votes cast; shares of seats are of 650."
        /> },
        { text: [`Labour won ${share("Labour").seats}% of the seats on ${share("Labour").votes}% of the votes. Reform UK won ${share("Reform UK").seats}% of the seats on ${share("Reform UK").votes}% of the votes. Both statements are true. Which one a headline uses depends on whether it wants to talk about seats or votes, and neither is wrong: they answer different questions.`] },
        { text: [<>The reason is explained on <a href="#/howElectionsWork">how elections work</a>. The habit to take away is to ask, every time a percentage appears, what the whole is that it is a percentage of.</>] },
      ],
    },
    {
      title: "The average and the middle",
      lede: "There is more than one kind of average, and when a few people have a lot, they pull apart.",
      colour: "#1F7A6E",
      blocks: [
        { facts: [
          { label: "Average (mean) household wealth", value: gbp(gb.mean), note: `Total wealth divided by the number of households, Great Britain, ${PLACE.wealth.period}. This is this site's own calculation from the ONS totals.` },
          { label: "Middle (median) household wealth", value: gbp(gb.median), note: "Line every household up from poorest to richest and take the one in the middle. Half have less, half have more." },
        ] },
        { text: [`The mean is ${wealthRatio} times the median. A small number of very wealthy households push the mean up, so it describes almost nobody. Either number could appear in a headline: "the average household has ${gbp(gb.mean)}" and "the typical household has ${gbp(gb.median)}" are both accurate.`] },
        { text: ["The mean adds everything up and divides. The median is the middle value. When the numbers are fairly even they are close. When a few are much bigger than the rest, the median is the better guide to what is typical."] },
        { text: [<>More on the spread of wealth and income is on the <a href="#/inequality">inequality</a> pages.</>] },
      ],
    },
    {
      title: "Percent, or percentage points?",
      lede: "A change in a percentage can be described in two ways, and one of them sounds much bigger.",
      colour: "#5E4B8B",
      blocks: [
        { facts: [
          { label: `Share of all wealth held by the poorer half, ${periodBefore}`, value: `${bFrom}%`, note: "Of all household wealth in Great Britain." },
          { label: `The same share, ${periodNow}`, value: `${bTo}%`, note: `A rise of ${bPoints} percentage points, or ${bPct}% more than before.` },
        ] },
        { text: [`Both descriptions are correct. "Up ${bPoints} percentage points" is the plain difference between the two figures. "Up ${bPct}%" says the new share is ${bPct}% bigger than the old one. The second sounds more dramatic because the starting share was small.`] },
        { text: ["When you see a percentage rise, check whether it is a change in a percentage (points) or a change in an amount (per cent), and what the starting figure was. A big per cent rise from a small start can be a small change in real terms."] },
      ],
    },
    {
      title: "Where does the chart start?",
      lede: "The same figures can be drawn to look flat or steep. Two choices do most of the work: where the axis starts and which years are shown.",
      colour: "#A9701F",
      blocks: [
        { node: <SameData
          panels={[
            { kind: "bars", title: "Axis starting at zero", bars: [{ label: short(periodBefore), value: bFrom }, { label: short(periodNow), value: bTo }], axisMin: 0, axisMax: 12, colour: "#1F7A6E", caption: `The second bar is ${bPct}% taller than the first, and looks it.` },
            { kind: "bars", title: "Axis starting at 8", bars: [{ label: short(periodBefore), value: bFrom }, { label: short(periodNow), value: bTo }], axisMin: 8, axisMax: 10, colour: "#9A3F55", caption: `Same figures. Cutting the axis makes the second bar look ${one((bTo - 8) / (bFrom - 8))} times as tall as the first.` },
          ]}
          note="Share of household wealth held by the poorer half of households in Great Britain, ONS. Both pictures use exactly the same two numbers."
        /> },
        { text: ["A bar chart that does not start at zero cuts the bottom off every bar, so the differences look bigger than they are. It is sometimes done for good reasons, but it should be marked clearly."] },
        { node: <SameData
          panels={[
            { ...win(firstYear), title: `Starting in ${firstYear}`, colour: "#9A3F55", caption: `Income inequality is ${word(ch(firstYear))}.` },
            { ...win(1990), title: "Starting in 1990", colour: "#A9701F", caption: `Income inequality is ${word(ch(1990))}.` },
            { ...win(2007), title: "Starting in 2007", colour: "#1F7A6E", caption: `Income inequality is ${word(ch(2007))}.` },
          ]}
          note={`The Gini coefficient of household income after tax and benefits (higher means less equal), ONS. One official series, ${firstYear} to ${gLast}, shown three ways. Each picture is scaled to its own highest and lowest points.`}
        /> },
        { text: [`The 2007 start leaves out the earlier rise, and the ${firstYear} start includes a very different period. None of the three lines is invented, but the choice of year decides whether inequality looks like it is rising or falling. When a claim says things are better or worse "since" a date, ask why that date.`] },
      ],
    },
    {
      title: "Questions to ask of any number",
      lede: "A short checklist covers most of what can go wrong.",
      colour: "#1B2A3A",
      blocks: [
        { cards: [
          { title: "Share of what, and of whom?", icon: IconVote, colour: "#9A3F55", text: "What is the whole? Votes or seats, adults or households, this year or all years?" },
          { title: "Which average?", icon: IconScales, colour: "#1F7A6E", text: "The mean or the median? If a few have a lot, the mean will be much higher than the middle." },
          { title: "Percent or points?", icon: IconRegister, colour: "#5E4B8B", text: "Is it a change in a percentage or a change in an amount, and what was the starting figure?" },
          { title: "Compared with when?", icon: IconChartBars, colour: "#A9701F", text: "Would a different start date, or a longer run of years, tell a different story?" },
          { title: "Does the axis start at zero?", icon: IconSearch, colour: "#2C5F9E", text: "If the bars do not start at zero, the differences are exaggerated." },
          { title: "Real terms or cash?", icon: IconGroup, colour: "#1B2A3A", text: "Money figures from different years are only comparable once price rises are taken out. The Jargon buster explains real and nominal terms." },
          { title: "Per head or in total?", icon: IconGroup, colour: "#5E4B8B", text: "A bigger total can still be less per person if the population has grown more." },
          { title: "How many were asked?", icon: IconPoll, colour: "#9A3F55", text: "A survey or a poll is a sample, so it has a margin of error. The opinion polls page explains how big that is." },
        ] },
        { text: [<>Words like these are explained in the <a href="#/glossary">Jargon buster</a>, and how a poll can be right and still miss is on <a href="#/polling">opinion polls explained</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "UK Parliament election results: 4 July 2024", url: "https://electionresults.parliament.uk/general-elections/6", note: "Votes and seats by party, as copied into this site's data." },
    { label: "ONS: Household total wealth in Great Britain, April 2020 to March 2022", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/totalwealthwealthingreatbritain", note: "Median household wealth, the poorer half's share, and the totals the average is worked out from." },
    { label: "ONS: The effects of taxes and benefits on household income", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/householddisposableincomeandinequality", note: "The Gini coefficient of household income after tax and benefits." },
  ],
  checked: "12 November 2026",
};

export default function SpotMisleadingStats() {
  return <ExplainerPage {...PAGE} />;
}
