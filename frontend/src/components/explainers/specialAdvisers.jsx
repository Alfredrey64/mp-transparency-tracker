/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import AdviserList from "../story/AdviserList";
import { IconGroup } from "../icons";
import { useDataFile } from "../../lib/useDataFile";
import { specialAdvisers } from "../../lib/dataFiles";
import { dateLong } from "../../lib/upcoming";

// Special advisers are people appointed by ministers to give political advice and help, paid from public money. The Cabinet Office must publish their number and cost every year
// (Constitutional Reform and Governance Act 2010, section 16), and does so with the list of who works for which minister and at what pay band. This page shows that report
// (data/specialAdvisers.json, fetch-special-advisers.js, read from GOV.UK each day). It states what the report says and nothing more: it does not say what any adviser does.

const HEAD = {
  kicker: "Who's in charge",
  title: "Special advisers",
  subtitle: "Ministers can appoint people to give them political advice, paid for by the public. The Cabinet Office publishes how many there are, what they cost and who works for whom. This page shows that report.",
  icon: IconGroup,
  look: "ledger",
  narrow: true, // the same width as the other pages in its menu group (Cabinet, Who held which job, Promises tracker)
};

const n = (v) => Number(v ?? 0).toLocaleString("en-GB");
const gbp = (v) => `£${n(v)}m`;
const pounds = (v) => `£${n(v)}`;
// "Secretary of State for Health and Social Care" -> "Health and Social Care": the bars are narrow, and every one of these is a Secretary of State.
const barLabel = (role) => { const t = role.replace(/^Secretary of State for (the )?/, ""); return t.length > 42 ? `${t.slice(0, 40)}…` : t; };
const short = (s) => String(s).replace(/ - /g, " to ").replace(/^(\d+ \w+) (\d{4}) to /, "$1 $2 to ");

function build(d) {
  const total = d.costs.rows.find((r) => /^total/i.test(r.label));
  const parts = d.costs.rows.filter((r) => !/^total/i.test(r.label));
  const [now, before] = d.costs.periods;
  const biggest = d.perMinister.slice(0, 10);
  const asAt = dateLong(d.asAt);

  const chapters = [
    {
      title: "What special advisers are",
      lede: "The Cabinet Office describes them as part of the team supporting ministers. This is what its report says about the job and the rules around it.",
      colour: "#B7791F",
      blocks: [
        { cards: [
          { title: "Why they exist", text: "They add a political dimension to the help ministers get, and by making the source of political advice clear they reinforce the political impartiality of the permanent Civil Service.", colour: "#B7791F" },
          { title: "Who they serve", text: "They are appointed to serve the Prime Minister and the Government as a whole, not only the minister who appointed them.", colour: "#2C7DA0" },
          { title: "How long they stay", text: "An adviser's appointment ends when their minister leaves that office, or immediately after a general election. They are then entitled to a severance payment, which they must repay if they are reappointed.", colour: "#7B5BD6" },
        ] },
        { note: "This page lists what the Cabinet Office publishes. It does not describe what any adviser does day to day, which the report does not say." },
      ],
    },
    {
      title: "How many, and what they cost",
      lede: `${n(d.count)} special advisers (${n(d.fte)} full-time equivalent) were in post on ${asAt}. Their pay bill for ${short(d.paybill.period)} was ${gbp(d.paybill.millions)}.`,
      colour: "#2C7DA0",
      blocks: [
        { facts: [
          { label: "Special advisers", value: n(d.count), note: `${n(d.fte)} full-time equivalent, as at ${asAt}.` },
          { label: "Pay bill for the year", value: gbp(d.paybill.millions), note: `${short(d.paybill.period)}.${total ? ` It was ${gbp(total.previous)} the year before.` : ""}` },
          ...(d.civilService ? [{ label: "Share of the Civil Service", value: `${d.civilService.sharePercent}%`, note: `The Cabinet Office's figure, set against ${n(d.civilService.fte)} full-time equivalent civil servants (ONS, March 2026).` }] : []),
        ] },
        { duo: { beforeName: short(before), afterName: short(now), items: parts.map((r) => ({ label: r.label, before: r.previous, after: r.current, beforeText: gbp(r.previous), afterText: gbp(r.current) })), note: `What the pay bill was made of, in £ million, for the last two years.${total ? ` Together: ${gbp(total.previous)}, then ${gbp(total.current)}.` : ""} The report says the latest year includes a ${d.costs.rows.some((r) => /salary/i.test(r.label)) ? "3.25% pay award for eligible advisers, in line with the headline award for the Senior Civil Service" : "pay award"}.` } },
        { note: "The report's own explanation of severance is that an adviser is entitled to it when their appointment ends because their minister leaves office or a general election is held. It does not say why the amount differs from year to year." },
      ],
    },
    {
      title: "The four pay bands",
      lede: "Each role is assessed individually and put in one of four bands. Starting salaries are set within the band for the skills the person brings.",
      colour: "#3F7D5C",
      blocks: [
        { cards: d.bands.map((b, i) => ({ title: `Band ${b.band}: ${b.title}`, text: `${pounds(b.from)} to ${pounds(b.to)}. ${n(d.perBand.find((x) => x.band === b.band)?.count ?? 0)} advisers on the list are in this band.`, colour: ["#7B5BD6", "#2C7DA0", "#3F7D5C", "#B7791F"][i] })) },
        { note: "The bands overlap, so a band alone does not fix a salary. The report gives each adviser's actual salary only as a band of £5,000, and only where it is £81,000 or more, which is the level of a senior civil servant." },
      ],
    },
    {
      title: "Who works for whom",
      lede: `The Prime Minister's team is ${n(d.perMinister[0].count)} of the ${n(d.advisers.length)} entries on the list. The rest are spread across ${n(d.perMinister.length - 1)} other ministers' offices.`,
      colour: "#7B5BD6",
      blocks: [
        { bars: { items: biggest.map((m) => ({ label: barLabel(m.role), value: m.count, text: n(m.count), colour: m === d.perMinister[0] ? "#B7791F" : "#7B5BD6" })), max: d.perMinister[0].count, note: `Advisers by the minister who appoints them, ${biggest.length} largest teams.` } },
        { node: <AdviserList advisers={d.advisers} bands={d.bands} ministers={d.perMinister} /> },
        { note: `The list has ${n(d.advisers.length)} entries for ${n(d.count)} advisers because the report lists an adviser under both ministers when they split their time between two. A minister's name is blank where the report does not give one.` },
      ],
    },
    {
      title: "Where this meets the rest of the site",
      lede: "Special advisers work alongside the ministers and departments shown elsewhere.",
      colour: "#9C6B30",
      blocks: [
        { text: [<>See <a href="#/cabinet">the Cabinet</a> for who the ministers are, <a href="#/offices">who held which job</a> for past ministers, and <a href="#/revolvingDoor">later jobs</a> for where former ministers went next.</>] },
      ],
    },
  ];
  return { chapters };
}

export default function SpecialAdvisers() {
  const { data, failed } = useDataFile(specialAdvisers);
  if (!data) return <ExplainerPage {...HEAD} chapters={[]} lead={failed ? <LoadFailedNote item="the special advisers report" /> : <Loading />} />;
  return (
    <ExplainerPage
      {...HEAD}
      tiles={[
        { label: "Special advisers", value: n(data.count), colour: "#E3B04B", sub: `As at ${dateLong(data.asAt)}` },
        { label: "Pay bill for the year", value: gbp(data.paybill.millions), colour: "#6FB1FF", sub: short(data.paybill.period) },
        { label: "Pay bands", value: "4", colour: "#8FD1A8", sub: "From junior adviser to leadership" },
      ]}
      why={{ colour: "#B7791F", text: "Special advisers are paid from public money and work beside ministers, but are not elected and are not in the permanent Civil Service. The report is the public record of how many there are, what they cost and who they work for." }}
      {...build(data)}
      sources={[
        { label: data.edition.title, url: data.edition.url, note: `The Cabinet Office's annual report under section 16 of the Constitutional Reform and Governance Act 2010, published ${dateLong(data.edition.published)}. The site reads the Cabinet Office's page each day, so a new edition appears here without anyone editing the page.` },
        { label: "Constitutional Reform and Governance Act 2010, section 16", url: "https://www.legislation.gov.uk/ukpga/2010/25/section/16", note: "The duty to publish the number and cost of special advisers each year." },
      ]}
    />
  );
}
