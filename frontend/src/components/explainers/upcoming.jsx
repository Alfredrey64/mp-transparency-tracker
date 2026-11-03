/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import SittingStrip from "../story/SittingStrip";
import Loading from "../Loading";
import { LoadFailedNote } from "../MpCards";
import { IconCalendar, IconBills, IconCommittee, IconQuestion } from "../icons";
import { Hero } from "../story/Vivid";
import { useDataFile } from "../../lib/useDataFile";
import { parliamentCalendar } from "../../lib/dataFiles";
import { dayShort, dayLong, dateLong, clock, houseName, billStages, billCommittees, hearings, commonsQuestions, debates, totals, nextRecess, thinWeeks } from "../../lib/upcoming";

// What is coming up in Parliament over the next four weeks, from Parliament's own What's On calendar (data/parliamentCalendar.json, refreshed daily by
// fetch-parliament-calendar.js). The page is built from the file, so it says only what the calendar lists.

const HEAD = {
  kicker: "How Parliament works",
  title: "Coming up in Parliament",
  subtitle: "What the House of Commons and the House of Lords have listed for the next four weeks: the days they sit, the bills due to be debated, the committees taking evidence and the questions ministers will answer.",
  icon: IconCalendar,
  look: "vivid",
  narrow: true,
};

const plural = (n, one, many = `${one}s`) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;

// A day's items as a short list, each tagged with the house it is in.
function Items({ items }) {
  return (
    <div className="up-items">
      {items.map((it, i) => (
        <div key={i} className="up-item">
          <em data-house={houseName(it.h)}>{houseName(it.h)}</em>
          <div>{it.t}{(it.time || it.where) && <small>{[it.time && clock(it.time), it.where].filter(Boolean).join(", ")}</small>}</div>
        </div>
      ))}
    </div>
  );
}

const STAGES = [
  "First reading is the formal start: the bill is introduced and its title read out.",
  "Second reading is the main debate on what the bill is for, followed by a vote.",
  "Committee stage goes through the bill line by line and votes on changes.",
  "Report stage lets the whole house vote on further changes, and third reading is the last debate.",
  "Then the other house does the same, and both must agree the final wording before the bill can become law.",
];

function sentenceForBreaks(data) {
  const out = [];
  for (const house of ["Commons", "Lords"]) {
    const r = nextRecess({ away: data.away.filter((a) => a.house === house) }, data.generated);
    if (r) out.push(`The ${house} is in recess ${r.from === r.to ? `on ${dayLong(r.from)}` : `from ${dayLong(r.from)} to ${dayLong(r.to)}`}.`);
  }
  return out.join(" ");
}

function build(data) {
  const t = totals(data);
  const bills = billStages(data);
  const committees = hearings(data);
  const rota = commonsQuestions(data);
  const business = debates(data).slice(0, 10);
  const examined = billCommittees(data);
  const thin = thinWeeks(data);

  const chapters = [
    {
      title: "When MPs and peers are sitting",
      lede: `The next four weeks, from ${dateLong(data.from)}. ${sentenceForBreaks(data)}`.trim(),
      colour: "#1F7A4D",
      blocks: [
        { node: <SittingStrip data={data} /> },
        { note: "Parliament's calendar lists the days each house is not sitting. Any other weekday is shown as a sitting day, and days further ahead can still change." },
      ],
    },
  ];

  if (bills.length) {
    chapters.push({
      title: "Bills due to be debated",
      lede: `${plural(bills.length, "bill")} ${bills.length === 1 ? "has" : "have"} a stage listed in the next four weeks. A stage is a point where one house debates a bill or votes on changes to it.`,
      colour: "#7B5BD6",
      blocks: [
        { timeline: bills.map((b) => ({
          when: dayShort(b.stages[0].d),
          text: (
            <>
              {b.url ? <a href={b.url} target="_blank" rel="noreferrer">{b.bill}</a> : b.bill}
              <small className="up-stage">{b.stages.map((s) => `${houseName(s.h)}${s.stage ? `, ${s.stage}` : ""}, ${dayShort(s.d)}`).join(". ")}</small>
            </>
          ),
        })) },
        ...(examined.length ? [{ text: [`Committees of MPs are going through ${examined.length === 1 ? "this bill" : "these bills"} line by line: ${examined.map((e) => e.bill).join("; ")}.`] }] : []),
        { more: { title: "What the stages mean", text: STAGES } },
      ],
    });
  }

  if (committees.length) {
    const shown = committees.slice(0, 12);
    const rest = committees.slice(12);
    const line = (c) => `${c.about ? `${c.about}. ` : ""}${c.dates.slice(0, 4).map((d) => `${dayShort(d.d)}${d.time ? `, ${clock(d.time)}` : ""}`).join("; ")}${c.dates.length > 4 ? ` and ${c.dates.length - 4} more` : ""}.`;
    chapters.push({
      title: "Committees taking evidence",
      lede: `${plural(t.hearings, "public session")} from ${plural(t.committees, "committee")} are listed. Committees question ministers, officials and experts, and publish what they hear.`,
      colour: "#2C7DA0",
      blocks: [
        { cards: shown.map((c) => ({ title: c.committee, text: line(c) })) },
        ...(rest.length ? [{ more: { title: `${rest.length} more committees`, text: rest.map((c) => `${c.committee}. ${line(c)}`) } }] : []),
      ],
    });
  }

  if (rota.length) {
    chapters.push({
      title: "Questions to ministers",
      lede: "Ministers answer MPs' questions in the Commons on a rota, one department at a time. The times below are the ones Parliament has listed.",
      colour: "#B45A3C",
      blocks: [{ timeline: rota.map((r) => ({ when: dayShort(r.d), text: <Items items={r.items.map((i) => ({ ...i, h: "C" }))} /> })) }],
    });
  }

  if (business.length) {
    chapters.push({
      title: "Debates and statements",
      lede: "The first days of business the two houses have listed. Westminster Hall debates are shorter debates on a subject an MP has chosen. Later weeks fill in as the business is announced.",
      colour: "#5A4FCF",
      blocks: [{ timeline: business.map((b) => ({ when: dayShort(b.d), text: <Items items={b.items} /> })) }],
    });
  }

  return {
    lead: <Hero
      colours={["#0F3B33", "#1F7A4D", "#2C7DA0"]}
      why="Most of what Parliament does is listed in advance. Seeing it early lets you follow a bill you care about, watch a committee question a minister, or find out when your MP is away from Westminster."
      stops={[
        { icon: IconCalendar, title: "The days they sit", text: "Weekdays, apart from recesses", colour: "#8FD1A8" },
        { icon: IconBills, title: "Bills", text: "Debated one stage at a time", colour: "#B9A5F0" },
        { icon: IconCommittee, title: "Committees", text: "Taking evidence in public", colour: "#8DB7E8" },
        { icon: IconQuestion, title: "Questions", text: "Ministers answer MPs on a rota", colour: "#F0C77A" },
      ]}
      figures={[
        { value: String(t.bills), label: "Bills with a stage due", sub: `${plural(t.stages, "stage")} across both houses` },
        { value: String(t.hearings), label: "Public committee sessions", sub: `from ${plural(t.committees, "committee")}` },
        { value: String(t.sittingDays), label: "Days the Commons sits", sub: "weekdays in the next four weeks" },
      ]}
    />,
    chapters,
    thin,
  };
}

export default function Upcoming() {
  const { data, failed } = useDataFile(parliamentCalendar);
  if (!data) {
    return (
      <ExplainerPage {...HEAD} chapters={[]} lead={failed ? <LoadFailedNote item="Parliament's calendar" /> : <Loading />} />
    );
  }
  const { thin, ...view } = build(data);
  return (
    <ExplainerPage
      {...HEAD}
      {...view}
      sources={[
        { label: "UK Parliament: What's On calendar", url: "https://whatson.parliament.uk/", note: "Sitting days, recesses and the business listed for each house. Refreshed each day." },
        { label: "UK Parliament: Bills", url: "https://bills.parliament.uk/", note: "The page for each bill named above, with its full history." },
        { label: "UK Parliament: Committees", url: "https://committees.parliament.uk/", note: "The sessions, inquiries and reports of each committee." },
        { label: "UK Parliament: Watch live", url: "https://parliamentlive.tv/", note: "Video of both chambers and of public committee sessions." },
      ]}
      checked={`${dateLong(data.generated)}${thin ? " (some weeks have little listed yet)" : ""}`}
    />
  );
}
