import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { PageHeader } from "./shared";
import { IconBallot } from "./icons";
import { BarRows, Caution, PageToggles, PairBars, Panel, StackBars, Stats, Takeaways, TrendExplorer } from "./insight";
import { BSA, BSA_TRUST, CHECKED, SOURCES } from "../data/trust";
import { AVG, ELECTIONS, GE2024, INSTITUTIONS, INSTITUTION_KEYS, T, UK, dateText, electionLabel, electorate, labourOfElectorate, lowerTurnouts, mainRows, notVoted, ranking, spreadOf, trustOf, turnoutLow, turnoutNow, turnoutPeak, ukRank } from "../lib/trust";
import { para, strong } from "../lib/insightStyle";
import { ordinal } from "../lib/regionData";

// Trust in politics: how much people trust government, parliament and other institutions here and in other countries, how many vote and what their votes
// turn into, and the arguments about it. One page with a row of toggles; the address carries the toggle (/trust/voting).

const ACCENT = "#7A5AF0";
const li = { margin: "0 0 8px", paddingLeft: 2 };
const n = (v) => Math.round(v).toLocaleString("en-GB");
const million = (v) => `${(v / 1e6).toFixed(1)} million`;
const jump = { marginTop: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink, background: "transparent", border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" };

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures on trust and on voting, and how they have changed.", colour: "#7A5AF0" },
  { key: "trust", label: "Trust", blurb: "How much people in the UK trust government, parliament and other institutions, against other countries.", colour: "#C0561F" },
  { key: "voting", label: "Voting", blurb: "How many people vote, how that has changed since 1945, and what the votes turn into.", colour: "#1D4ED8" },
  { key: "money", label: "Money and influence", blurb: "Where to look on this site for who pays the parties, lobbying, and who moves between government and business.", colour: "#0F766E" },
  { key: "arguments", label: "The arguments", blurb: "Whether trust has really fallen, why, and whether the voting system should change, set out fairly.", colour: "#C7871A" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };

const OECD = (key, year = "2023") => trustOf(AVG, year, key);
const UKV = (key, year = "2023") => trustOf(UK, year, key);

function Overview({ onPick }) {
  const gov = UKV("government");
  const gov21 = UKV("government", "2021");
  const spread = spreadOf(UK, "2023");
  const par = UKV("parliament");
  const par21 = UKV("parliament", "2021");
  const now = turnoutNow();
  const peak = turnoutPeak();
  const lowerOnes = lowerTurnouts();
  const rows = mainRows();
  const lab = rows[0];
  const reform = rows[2];
  const first = ELECTIONS.reduce((a, e) => (e.twoParty > a.twoParty ? e : a), ELECTIONS[0]);
  const govRank = ukRank("government");
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `${gov}% of UK adults said they trusted the national government to a high or moderately high degree in 2023, down from ${gov21}% in 2021, against ${OECD("government")}% on average across the OECD countries surveyed. ${spread.L}% said they had low or no trust. The UK was ${ordinal(govRank.rank)} of ${govRank.of} countries for trust in government.`,
          `Trust in Parliament was ${par}% in 2023 (${par21}% in 2021, OECD average ${OECD("parliament")}%). Courts were the most trusted of the institutions asked about, at ${UKV("courts")}%.`,
          `The British Social Attitudes survey found in the report published in June 2024 that ${BSA.almostNeverGovernment}% almost never trust governments of any party to put the nation's needs above their party's, a record, and ${BSA.almostNeverTruth}% almost never trust politicians to tell the truth in a tight corner. The 2024 survey, published in June 2025, found ${BSA_TRUST.y2024}% trust governments to put the country first at least most of the time, a record low.`,
          `Turnout at the 2024 general election was ${now.turnout}%, ${lowerOnes.length === 1 ? `lower only in ${lowerOnes[0]}` : `the ${ordinal(lowerOnes.length + 1)} lowest`} of the ${ELECTIONS.length} elections since 1945 (${peak.turnout}% in ${peak.id}).`,
          `Labour won ${lab.seatShare}% of the seats with ${lab.voteShare}% of the votes cast, which was ${labourOfElectorate}% of everyone registered to vote. Reform UK won ${reform.voteShare}% of the votes and ${reform.seats} seats.`,
          `The two largest parties together took ${ELECTIONS.at(-1).twoParty}% of the votes in 2024, against ${first.twoParty}% in ${first.id}.`,
        ]}
      />

      <Panel id="h-tr-main" accent={ACCENT} title="The main figures" lead="Trust figures are from surveys that ask people how much they trust. Voting figures are from the official results." sources={[SOURCES.oecd, SOURCES.bsa41, SOURCES.results]}>
        <Stats
          accent={ACCENT}
          items={[
            { value: `${gov}%`, label: "Trust the national government, 2023", note: `${gov21}% in 2021. OECD average ${OECD("government")}%` },
            { value: `${par}%`, label: "Trust Parliament, 2023", note: `${par21}% in 2021. OECD average ${OECD("parliament")}%` },
            { value: `${UKV("localGovernment")}%`, label: "Trust local government, 2023", note: `${UKV("localGovernment", "2021")}% in 2021. OECD average ${OECD("localGovernment")}%` },
            { value: `${BSA.almostNeverGovernment}%`, label: "Almost never trust governments to put the nation first", note: "British Social Attitudes, reported June 2024. A record high" },
            { value: `${now.turnout}%`, label: "Turnout, 2024 general election", note: `${notVoted()}% of registered voters did not vote. ${peak.turnout}% in ${peak.id}` },
            { value: `${lab.voteShare}%`, label: "Labour's share of the votes, 2024", note: `It won ${lab.seatShare}% of the seats, one for every ${lab.perSeat.toLocaleString("en-GB")} votes` },
          ]}
        />
      </Panel>

      <Panel id="h-tr-trends" title="How voting has changed" lead="Pick a measure. Each is on the Voting tab in more detail." accent={ACCENT} sources={[SOURCES.history, SOURCES.results]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "turnout", label: "Turnout", governments: true, lines: [{ name: "Turnout", color: ACCENT, years: ELECTIONS.map((e) => e.t), values: ELECTIONS.map((e) => e.turnout) }], offset: 0, labelFn: electionLabel, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 1945, to: 2026, note: "The share of registered voters who voted at each general election. Parliament's figures count valid votes over the electorate." },
            { key: "two", label: "Labour and Conservative vote share", governments: true, lines: [{ name: "Labour and Conservative together", color: "#C0561F", years: ELECTIONS.map((e) => e.t), values: ELECTIONS.map((e) => e.twoParty) }], offset: 0, labelFn: electionLabel, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 1945, to: 2026, note: "The share of the votes cast in Great Britain and Northern Ireland that went to the two largest parties together." },
          ]}
        />
      </Panel>

      <Panel id="h-tr-go" title="Where to look next" lead="Trust, then votes, then money.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={() => onPick("trust")} style={jump}>How much people trust, and against other countries</button>
          <button type="button" onClick={() => onPick("voting")} style={jump}>Votes and seats in 2024</button>
          <button type="button" onClick={() => onPick("money")} style={jump}>Money and influence</button>
        </div>
      </Panel>
    </div>
  );
}

function Institutions() {
  const rows = INSTITUTION_KEYS.map((k) => ({ label: INSTITUTIONS[k].label, note: `OECD average ${OECD(k)}%`, bars: [{ name: "UK 2021", value: UKV(k, "2021"), text: `${UKV(k, "2021")}%`, colour: "#9CA3AF" }, { name: "UK 2023", value: UKV(k), text: `${UKV(k)}%`, colour: ACCENT }, { name: "OECD average 2023", value: OECD(k), text: `${OECD(k)}%`, colour: "#C0561F" }] }));
  return (
    <Panel id="h-tt-inst" accent={ACCENT} title="How much people trust each part of government" lead="The share of adults in the UK who say they trust each institution to a high or moderately high degree, in the OECD Trust Survey, which the ONS ran in the UK in 2021 and 2023." sources={[SOURCES.oecd, SOURCES.ons]}>
      <PairBars
        label="Trust in each institution, UK in 2021 and 2023 and the OECD average in 2023, percent" max={100}
        legend={[{ name: "UK 2021", colour: "#9CA3AF" }, { name: "UK 2023", colour: ACCENT }, { name: "OECD average 2023", colour: "#C0561F" }]}
        rows={rows}
      />
      <p style={para}>
        In the UK trust fell between the two surveys for government (from {UKV("government", "2021")}% to {UKV("government")}%), Parliament (from {UKV("parliament", "2021")}% to {UKV("parliament")}%), local government, the civil service and the courts. Courts remained the most trusted, and Parliament and government the least. The UK was below the OECD average for government, Parliament and local government, close to it for the civil service, and above it for the courts.
      </p>
    </Panel>
  );
}

function Spread() {
  const rows = [["UK, 2021", spreadOf(UK, "2021")], ["UK, 2023", spreadOf(UK, "2023")], ["OECD average, 2023", spreadOf(AVG, "2023")]].map(([label, s]) => ({
    label, text: `${s.HMH}% trust`,
    parts: [{ name: "High or moderately high trust", value: s.HMH, colour: "#1F7A4D" }, { name: "Neutral", value: s.NEU, colour: "#9CA3AF" }, { name: "Low or no trust", value: s.L, colour: "#C0561F" }, { name: "Do not know", value: s.DK, colour: "#E5E7EB" }].filter((p) => p.value > 0),
  }));
  return (
    <Panel id="h-tt-spread" title="Trust in the national government, the whole spread" lead="Trust is not all or nothing. Many people answer in the middle." sources={[SOURCES.oecd]}>
      <StackBars rows={rows} label="Trust in the national government, percent of adults" format={(v) => `${v}%`} legend={[{ name: "High or moderately high trust", colour: "#1F7A4D" }, { name: "Neutral", colour: "#9CA3AF" }, { name: "Low or no trust", colour: "#C0561F" }, { name: "Do not know", colour: "#E5E7EB" }]} />
      <p style={para}>In 2023 more than half of UK adults ({spreadOf(UK, "2023").L}%) reported low or no trust in the national government, against {spreadOf(AVG, "2023").L}% on average across the OECD countries. In 2021 it was {spreadOf(UK, "2021").L}%.</p>
    </Panel>
  );
}

function Compare() {
  const [key, setKey] = useState("government");
  const m = INSTITUTIONS[key];
  const rows = ranking(key);
  const r = ukRank(key);
  const avg = rows.find((x) => x.avg);
  const countries = rows.filter((x) => !x.avg);
  return (
    <Panel id="h-tt-compare" title="How the UK compares" lead={`${m.blurb} Countries are in order, highest first, in the 2023 survey. The OECD average is shown for reference.`} sources={[SOURCES.oecd]}>
      <div role="group" aria-label="Institution" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {INSTITUTION_KEYS.map((k) => <button key={k} type="button" aria-pressed={k === key} onClick={() => setKey(k)} style={pillStyle(k === key)}>{INSTITUTIONS[k].label}</button>)}
      </div>
      <BarRows
        label={`${m.label}, share with high or moderately high trust, by country`} accent="#9CA3AF" max={100}
        rows={rows.map((x) => ({ label: x.name, value: x.value, text: `${x.value.toFixed(1)}%`, tone: x.uk ? ACCENT : x.avg ? "#C0561F" : "#9CA3AF", strong: x.uk || x.avg }))}
      />
      <p style={para}>The UK is {ordinal(r.rank)} of {r.of} countries, at {rows.find((x) => x.uk).value.toFixed(1)}%, against an OECD average of {avg.value.toFixed(1)}%. The highest is {countries[0].name} ({countries[0].value.toFixed(1)}%) and the lowest {countries.at(-1).name} ({countries.at(-1).value.toFixed(1)}%).</p>
      <Caution title="Reading the comparison">Trust surveys measure how people feel, which depends on what has happened recently, what they expect, and how the question is put to them, so the same score can mean different things in different countries. Not every country has a 2023 figure, and the countries that took part are not all of the OECD, so the average is for those surveyed.</Caution>
    </Panel>
  );
}

function Say() {
  const rows = [["voice", "Confident the political system lets people like them have a say"], ["ownSay", "Confident in their own ability to take part in politics"]].map(([k, label]) => ({ label, note: `OECD average ${OECD(k)}%`, bars: [{ name: "UK 2021", value: UKV(k, "2021"), text: `${UKV(k, "2021")}%`, colour: "#9CA3AF" }, { name: "UK 2023", value: UKV(k), text: `${UKV(k)}%`, colour: ACCENT }, { name: "OECD average 2023", value: OECD(k), text: `${OECD(k)}%`, colour: "#C0561F" }] }));
  const ranksVoice = ranking("voice");
  const rv = ranksVoice.filter((x) => !x.avg).findIndex((x) => x.uk) + 1;
  return (
    <Panel id="h-tt-say" title="Do people feel heard?" lead="The same survey asked whether people feel they have a say. In the UK, confidence that the system lets them have a say is low, and lower than in the OECD as a whole, while confidence in their own ability to take part is close to the average." sources={[SOURCES.oecd]}>
      <PairBars
        label="Share confident they can have a say, percent" max={100}
        legend={[{ name: "UK 2021", colour: "#9CA3AF" }, { name: "UK 2023", colour: ACCENT }, { name: "OECD average 2023", colour: "#C0561F" }]}
        rows={rows}
      />
      <p style={para}>On confidence that the political system lets people have a say, the UK is {ordinal(rv)} of {ranksVoice.filter((x) => !x.avg).length} countries in 2023.</p>
    </Panel>
  );
}

function Surveys() {
  return (
    <Panel id="h-tt-bsa" title="What the long-running British survey says" lead="The British Social Attitudes survey, run by NatCen, has asked about trust in government since 1986. These are the figures NatCen reported in its latest two releases." sources={[SOURCES.bsa41, SOURCES.bsa42]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: `${BSA.almostNeverGovernment}%`, label: "Almost never trust governments of any party to put the nation's needs first", note: `Reported June 2024. ${BSA.almostNeverGovernmentRise} points above the 2020 level` },
          { value: `${BSA.almostNeverTruth}%`, label: "Almost never trust politicians of any party to tell the truth in a tight corner", note: "Reported June 2024. A record high" },
          { value: `${BSA_TRUST.y2024}%`, label: "Trust governments to put the country first just about always or most of the time", note: `The 2024 survey, published June 2025. ${BSA_TRUST.y2023}% in 2023. A record low` },
          { value: `${BSA.systemNeedsImproving}%`, label: "Say the system of governing Britain could be improved quite a lot or a great deal", note: "Reported June 2024" },
        ]}
      />
      <p style={para}>NatCen found that distrust was higher among people who were dissatisfied with the NHS ({BSA.dissatisfiedNhsNeverGovernment}% almost never trusted governments, against {BSA.satisfiedNhsNeverGovernment}% of those satisfied) and among people who said they were struggling on their income ({BSA.strugglingNeverTruth}% almost never trusted politicians to tell the truth, against {BSA.comfortableNeverTruth}% of those living comfortably).</p>
      <Caution title="Two different ways of asking">The OECD survey asks people how much they trust particular institutions on a scale. The British survey asks about trusting governments or politicians of any party to behave in particular ways. The answers measure different things and cannot be set side by side, but both show falling trust.</Caution>
    </Panel>
  );
}

function TrustTab() {
  return (
    <div>
      <Institutions />
      <Spread />
      <Compare />
      <Say />
      <Surveys />
    </div>
  );
}

function VotingTab() {
  const rows = mainRows();
  const now = turnoutNow();
  const peak = turnoutPeak();
  const low = turnoutLow();
  const lab = rows[0];
  const byPerSeat = rows.filter((r) => r.perSeat).sort((a, b) => b.perSeat - a.perSeat);
  const first = ELECTIONS.reduce((a, e) => (e.twoParty > a.twoParty ? e : a), ELECTIONS[0]);
  return (
    <div>
      <Panel id="h-tv-turnout" accent={ACCENT} title="How many people vote" lead={`Turnout was ${now.turnout}% in 2024: ${n(GE2024.validVotes)} valid votes from ${n(electorate)} registered voters. It was highest in ${peak.id} (${peak.turnout}%) and lowest in ${low.id} (${low.turnout}%).`} sources={[SOURCES.history, SOURCES.results]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "turnout", label: "Turnout", governments: true, lines: [{ name: "Turnout", color: ACCENT, years: ELECTIONS.map((e) => e.t), values: ELECTIONS.map((e) => e.turnout) }], offset: 0, labelFn: electionLabel, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 1945, to: 2026, note: "The share of registered voters who voted at each general election, as Parliament counts it (valid votes over the electorate)." },
            { key: "two", label: "Labour and Conservative vote share", governments: true, lines: [{ name: "Labour and Conservative together", color: "#C0561F", years: ELECTIONS.map((e) => e.t), values: ELECTIONS.map((e) => e.twoParty) }], offset: 0, labelFn: electionLabel, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 1945, to: 2026, note: `The two largest parties together took ${first.twoParty}% of the votes in ${first.id} and ${now.twoParty}% in 2024.` },
          ]}
        />
        <p style={para}>The shading, when switched on, shows who was in government, not what caused a change. Turnout fell sharply between 1997 and 2001, recovered part of the way by 2017, and fell again in 2024.</p>
      </Panel>

      <Panel id="h-tv-seats" title="What the votes turned into in 2024" lead="The share of the votes each party won, and the share of the 650 seats. Both are percentages, so the gap between the two bars is the difference between votes and seats." sources={[SOURCES.results]}>
        <PairBars
          label="Share of votes and share of seats in 2024, percent" max={70}
          legend={[{ name: "Votes", colour: "#9CA3AF" }, { name: "Seats", colour: ACCENT }]}
          rows={rows.map((r) => ({ label: r.name, note: `${r.seats} seats from ${million(r.votes)} votes`, bars: [{ name: "Votes", value: r.voteShare, text: `${r.voteShare}%`, colour: "#9CA3AF" }, { name: "Seats", value: r.seatShare, text: `${r.seatShare}%`, colour: ACCENT }] }))}
        />
        <p style={para}>Labour won {lab.seats} of 650 seats ({lab.seatShare}%) with {lab.voteShare}% of the votes cast. That was {labourOfElectorate}% of all registered voters, since {notVoted()}% did not vote. The seats counted are for the parties above; others, including independents, won the rest.</p>
      </Panel>

      <Panel id="h-tv-perseat" title="Votes for each seat won" lead="How many votes each party needed, on average, to win a seat. Parties whose votes are spread thinly across the country need far more." sources={[SOURCES.results]}>
        <BarRows
          label="Votes for each seat won in 2024" accent="#9CA3AF" max={byPerSeat[0].perSeat}
          rows={byPerSeat.map((r) => ({ label: r.name, note: `${r.seats} seat${r.seats === 1 ? "" : "s"}`, value: r.perSeat, text: n(r.perSeat), tone: r.name === "Labour" ? ACCENT : "#9CA3AF", strong: r.name === "Labour" }))}
        />
        <p style={para}>Labour needed about {n(lab.perSeat)} votes for each seat, the Liberal Democrats {n(rows[3].perSeat)}, and Reform UK {n(rows[2].perSeat)}.</p>
        <Caution title="What this does not say">Under the current system each seat is won by the candidate with the most votes in it, so a party needs votes in the right places, not only votes. Different voting systems would turn the same votes into different seats, and people disagree about which is better. The Arguments toggle sets out both sides.</Caution>
      </Panel>
    </div>
  );
}

function MoneyTab() {
  const links = [
    ["partyFinances", "Who funds the parties", "Donations to political parties, by donor and by party."],
    ["followTheMoney", "Trace a donor", "Everyone a donor has funded, among MPs and parties."],
    ["darkMoney", "Hidden donations", "Money that reaches politics with no named donor."],
    ["lobbyingRegister", "Paid lobbyists", "The official register of consultant lobbyists, and what it leaves out."],
    ["revolvingDoor", "Ministers' later jobs", "Jobs taken by former ministers after they leave government."],
    ["thinkTanks", "Who funds think tanks", "The money behind the organisations that advise on policy."],
  ];
  return (
    <div>
      <Panel id="h-tm-intro" accent={ACCENT} title="Money and influence" lead="Trust depends partly on whether people believe money buys influence. This site tracks the money in separate places, each with its own sources. They are linked here so you can look yourself.">
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {links.map(([key, label, text]) => (
            <li key={key} style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
              <a href={`#/${key}`} style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15.5, color: COLORS.ink }}>{label}</a>
              <p style={{ ...para, marginTop: 2, fontSize: 14 }}>{text}</p>
            </li>
          ))}
        </ul>
        <Caution title="What the registers show">Donations above set amounts have to be reported to the Electoral Commission, and only reported donations can be counted. A donation shows who gave and how much, not whether it changed what anyone did. People disagree about how much influence money has, and these pages do not settle it.</Caution>
      </Panel>
    </div>
  );
}

function Arg({ id, title, shows, supporters, critics, sources, sLabel, cLabel }) {
  return (
    <Panel id={id} title={title} sources={sources}>
      <div style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink }}>
        <strong>What the figures show.</strong> {shows}
      </div>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" }}>{sLabel}</h3>
      {supporters.map((t) => <p key={t} style={{ ...para, marginTop: 0, fontSize: 14.5 }}>{t}</p>)}
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: "12px 0 4px" }}>{cLabel}</h3>
      {critics.map((t) => <p key={t} style={{ ...para, marginTop: 0, fontSize: 14.5 }}>{t}</p>)}
    </Panel>
  );
}

function Arguments() {
  const rows = mainRows();
  const lab = rows[0];
  const reform = rows[2];
  const green = rows[4];
  const now = turnoutNow();
  const peak = turnoutPeak();
  const gov = UKV("government");
  return (
    <div>
      <Panel id="h-ta-intro" accent={ACCENT} title="The arguments" lead="Figures show how people say they feel and how they vote. They cannot settle why trust has fallen or what should change, which depends on values as well as evidence. These are the arguments people make, not our view." />
      <Arg
        id="h-ta-fall" title="Has trust really fallen, and why?"
        shows={`${gov}% of UK adults trusted the national government in the 2023 OECD survey, down from ${UKV("government", "2021")}% in 2021, and ${BSA_TRUST.y2024}% trusted governments to put the country first at least most of the time in the 2024 British survey, a record low. The UK was ${ordinal(ukRank("government").rank)} of ${ukRank("government").of} countries for trust in government in 2023, and the OECD average was ${OECD("government")}%.`}
        sLabel="People who see a real decline say" cLabel="People who add context say"
        supporters={["Surveys over decades show the same direction, and the fall is not tied to one party in office. People point to broken promises, scandals such as MPs' expenses and rule-breaking during the pandemic, and to the sense that public services such as the NHS are getting worse. NatCen found distrust is higher among people unhappy with the NHS or struggling on their incomes."]}
        critics={["Trust in government tends to fall when people are unhappy with how things are going, and recovers when conditions improve, so a low reading may reflect the cost of living and public services as much as how politics is conducted. Some argue distrust can be healthy, since voters should check what those in power say, and that how people feel about politicians in general differs from how they feel about their own MP."]}
        sources={[SOURCES.oecd, SOURCES.ons, SOURCES.bsa41, SOURCES.bsa42]}
      />
      <Arg
        id="h-ta-system" title="Should the voting system change?"
        shows={`In 2024 Labour won ${lab.seatShare}% of the seats with ${lab.voteShare}% of the votes cast, while Reform UK won ${reform.seats} seats with ${reform.voteShare}% and the Green Party ${green.seats} with ${green.voteShare}%. NatCen found that ${BSA.favourChangingVotingSystem}% of adults favoured changing the way MPs are elected so that smaller parties get a fairer share of seats, a record, and ${BSA.keepVotingSystem}% wanted to keep the current system to produce effective government.`}
        sLabel="People who want a more proportional system say" cLabel="People who want to keep the current system say"
        supporters={["Seats should match votes, so that a party with several million votes is not left with a handful of seats, and no one's vote is wasted because they live in a safe seat. They argue it would give people a reason to vote and a government that more of them chose."]}
        critics={["The current system produces a clear winner who can govern without a coalition and so can be held to account at the next election, and gives each area an MP who answers to it. They argue proportional systems can lead to deals after the election that voters did not choose, and weaken the link between a place and its MP."]}
        sources={[SOURCES.results, SOURCES.bsa41]}
      />
      <Arg
        id="h-ta-turnout" title="Why do fewer people vote, and does it matter?"
        shows={`Turnout was ${now.turnout}% in 2024, against ${peak.turnout}% in ${peak.id}. ${notVoted()}% of registered voters did not vote in 2024.`}
        sLabel="People who worry about turnout say" cLabel="People who are less worried say"
        supporters={["Low turnout means governments are chosen by a smaller share of the people, and they say the people who do not vote tend to be younger and poorer, so their concerns count for less. They argue for easier registration, automatic registration, or making voting compulsory."]}
        critics={["Not voting can be a choice and does not always mean disengagement, and turnout rose a little between 2010 and 2019. They argue changes to the rules, such as compulsory voting, treat the symptom, and that people vote when they believe there is a real choice. Some also worry that making it easier to vote could weaken the checks against fraud."]}
        sources={[SOURCES.history, SOURCES.results]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-tx-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. The trust charts read from OECD data saved on ${dateText(T.built)}. Election figures are from the results the site already holds.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-tx-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Feelings, not facts.</strong> Trust figures say how people feel. They do not say whether trust is deserved.</li>
          <li style={li}><strong style={strong}>Two waves.</strong> The OECD survey was run in 2021 and 2023, so it shows change over two years only. Some countries took part in only one of them, and the comparison tables use the 2023 figures.</li>
          <li style={li}><strong style={strong}>Two kinds of survey.</strong> The OECD survey and the British Social Attitudes survey ask different questions of different samples, and their answers cannot be set side by side. The British survey's figures for 2023 and 2024 are as reported by NatCen and the press coverage of its release.</li>
          <li style={li}><strong style={strong}>Turnout.</strong> Turnout here is valid votes as a share of the registered electorate, as Parliament counts it. The register itself may miss some eligible people.</li>
          <li style={li}><strong style={strong}>Votes and seats.</strong> The 2024 percentages are for the parties named. Independents and smaller parties that won seats are not shown.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> Trust in the media, the police and the courts' fairness in detail, local elections, and how trust differs between groups of people.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Trust({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/trust" : `#/trust/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconBallot} kicker="Britain in numbers" title="Trust in politics" subtitle="How much people trust government and parliament, here and in other countries, how many vote and what their votes turn into, where to follow the money, and the arguments." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="tr" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="tr-panel" aria-labelledby={`tr-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "trust" && <TrustTab />}
        {tab === "voting" && <VotingTab />}
        {tab === "money" && <MoneyTab />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
