import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconSplit } from "./icons";
import { Caution, PageToggles, Panel, Stats, Takeaways, TrendExplorer } from "./insight";
import DevolutionMoney from "./DevolutionMoney";
import DevolutionEconomy from "./DevolutionEconomy";
import DevolutionPlace from "./DevolutionPlace";
import { ENGLAND_ACT, REFERENDUM_2014, RULING, CHECKED, SOURCES } from "../data/devolution";
import { NATIONS } from "../data/devolvedElections";
import { D, F_LAST, G_LAST, NAMES, S_LAST, fiscalTotal, gbp, gdpPerHead, indexOf, perHead, surplusPlaces, yearText } from "../lib/devolution";
import { ACCENT, jump, li } from "../lib/devolutionStyle";
import { para, strong } from "../lib/insightStyle";

// Devolution and the union: what Scotland, Wales and Northern Ireland and the regions of England spend, raise and produce, who decides what, and the
// arguments about funding, the union and English devolution. One page with a row of toggles; the address carries the toggle (/union/money).

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures on spending, revenue and output in each nation and region, and what is devolved.", colour: "#9D174D" },
  { key: "money", label: "Money", blurb: "What is spent on services per person, what it is spent on, and what each place raises and receives.", colour: "#1D4ED8" },
  { key: "economy", label: "The economy", blurb: "How much each nation and region produces for each resident, and how that has grown.", colour: "#C7871A" },
  { key: "place", label: "By place", blurb: "Spending, revenue and output on one map, for each nation and region.", colour: "#0F766E" },
  { key: "powers", label: "Who decides what", blurb: "What the devolved governments decide, what stays with Westminster, and who votes for them.", colour: "#7A5AF0" },
  { key: "arguments", label: "The arguments", blurb: "Whether funding is fair, whether the union should continue, and how far power should go to English regions, set out fairly.", colour: "#C0561F" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };
const bn = (m) => `£${(Math.abs(m) / 1000).toFixed(1)}bn`;

function Overview({ onPick }) {
  const surplus = surplusPlaces();
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `Public spending on services that can be identified with a place was ${gbp(perHead("ni"))} for each person in Northern Ireland, ${gbp(perHead("scotland"))} in Scotland and ${gbp(perHead("wales"))} in Wales in ${yearText(S_LAST)}, against ${gbp(perHead("england"))} in England and ${gbp(perHead("uk"))} across the UK. Within England it ranged from ${gbp(perHead("london"))} in London to ${gbp(perHead("se"))} in the South East.`,
          `${surplus.map((k) => NAMES[k]).join(" and ")} ${surplus.length === 1 ? "was" : "were"} the only ${surplus.length === 1 ? "place" : "places"} in surplus in ${yearText(F_LAST)}: every other nation and region spent more than it raised. The UK ran a deficit of ${bn(fiscalTotal("uk"))}, of which Scotland's was ${bn(fiscalTotal("scotland"))}, Wales's ${bn(fiscalTotal("wales"))} and Northern Ireland's ${bn(fiscalTotal("ni"))}, counting North Sea revenue where the fields are.`,
          `Output per person in ${G_LAST} was ${gbp(gdpPerHead("london"))} in London and ${gbp(gdpPerHead("ne"))} in the North East. It was ${gbp(gdpPerHead("scotland"))} in Scotland, ${gbp(gdpPerHead("ni"))} in Northern Ireland and ${gbp(gdpPerHead("wales"))} in Wales.`,
          `Scotland, Wales and Northern Ireland each have their own parliament or assembly that decides health, education, housing and other matters, and part of their tax. Westminster keeps defence, foreign policy, immigration, the constitution and most tax and welfare.`,
          `In the 2014 referendum ${REFERENDUM_2014.noPct}% of Scottish voters chose to stay in the UK. In November 2022 the Supreme Court ruled that the Scottish Parliament cannot hold another without Westminster's agreement.`,
          `In England, the ${ENGLAND_ACT.name}, which received Royal Assent on ${ENGLAND_ACT.assent}, puts into law regional bodies called strategic authorities, led by elected mayors in many areas.`,
        ]}
      />

      <Panel id="h-uo-main" accent={ACCENT} title="The main figures" lead="Spending and output per person in the nations and in England's regions, and the deficit or surplus of each." sources={[SOURCES.cra, SOURCES.fiscal, SOURCES.gdp]}>
        <Stats
          accent={ACCENT}
          items={[
            { value: gbp(perHead("scotland")), label: `Spent per person in Scotland, ${yearText(S_LAST)}`, note: `UK = 100: ${indexOf("scotland")}. England ${gbp(perHead("england"))}` },
            { value: gbp(perHead("wales")), label: "Per person in Wales", note: `UK = 100: ${indexOf("wales")}` },
            { value: gbp(perHead("ni")), label: "Per person in Northern Ireland", note: `UK = 100: ${indexOf("ni")}` },
            { value: bn(fiscalTotal("scotland")), label: `Scotland's deficit, ${yearText(F_LAST)}`, note: `Wales ${bn(fiscalTotal("wales"))}, Northern Ireland ${bn(fiscalTotal("ni"))}. London surplus ${bn(fiscalTotal("london"))}` },
            { value: gbp(gdpPerHead("london")), label: `Output per person in London, ${G_LAST}`, note: `${gbp(gdpPerHead("ne"))} in the North East` },
            { value: gbp(gdpPerHead("scotland")), label: "Output per person in Scotland", note: `UK ${gbp(gdpPerHead("uk"))}. Wales ${gbp(gdpPerHead("wales"))}` },
          ]}
        />
      </Panel>

      <Panel id="h-uo-go" title="Where to look next" lead="Money first, then the economy and the map.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={() => onPick("money")} style={jump}>What is spent, and what each place raises</button>
          <button type="button" onClick={() => onPick("economy")} style={jump}>The economy by nation and region</button>
          <button type="button" onClick={() => onPick("place")} style={jump}>The map</button>
          <button type="button" onClick={() => onPick("powers")} style={jump}>Who decides what</button>
        </div>
      </Panel>
    </div>
  );
}

function Powers() {
  const turnout = NATIONS.map((n) => ({ name: n.name, body: n.body, last: n.elections.at(-1), first: n.elections[0] }));
  const line = (n, color) => ({ name: n.name, color, years: n.elections.map((e) => yearOf(e.date)), values: n.elections.map((e) => e.turnout) });
  return (
    <div>
      <Panel id="h-up-powers" accent={ACCENT} title="Who decides what" lead="Scotland, Wales and Northern Ireland each have an elected parliament or assembly, set up in 1999 (Wales's Senedd began as the National Assembly for Wales). Each decides some matters for its own nation, and Westminster decides the rest. The details differ in each nation." sources={[SOURCES.scotlandAct, SOURCES.walesAct, SOURCES.niAct, SOURCES.taxExplainer]}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: "6px 0 4px" }}>Mostly decided by the devolved governments</h3>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}>Health and social care, and education and schools.</li>
          <li style={li}>Housing, local government, planning and the environment.</li>
          <li style={li}>Most transport, agriculture and fisheries, and culture and sport.</li>
          <li style={li}>Justice and policing in Scotland and Northern Ireland, but not in Wales, where they stay with Westminster.</li>
        </ul>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: "14px 0 4px" }}>Mostly decided at Westminster, for the whole UK</h3>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}>The constitution, defence, foreign policy and national security.</li>
          <li style={li}>Immigration, trade policy, the currency and the Bank of England's interest rates.</li>
          <li style={li}>Most taxes and most of the welfare system, with the exceptions below.</li>
          <li style={li}>Broadcasting, and much of energy policy.</li>
        </ul>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: "14px 0 4px" }}>Tax and benefits that are devolved</h3>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Scotland</strong> sets its own rates and bands of income tax on earnings (not on savings and dividends), and its own taxes on property transactions and landfill. It also pays some benefits itself, through Social Security Scotland.</li>
          <li style={li}><strong style={strong}>Wales</strong> sets Welsh rates of income tax within each UK band (it cannot change the bands or the personal allowance), and its own taxes on property transactions and landfill.</li>
          <li style={li}><strong style={strong}>Northern Ireland</strong> sets its own domestic rates and business rates and has a devolved power over long-haul air passenger duty. Corporation tax powers have not been used.</li>
          <li style={li}><strong style={strong}>Local taxes</strong> (council tax and business rates, or domestic and business rates in Northern Ireland) are devolved in all three nations.</li>
        </ul>
        <Caution title="A summary, not the law">This is a short guide. The lists in the Scotland Act 1998, the Wales Act 2017 and the Northern Ireland Act 1998 are long and have been changed several times, and Northern Ireland's divide matters into transferred, reserved and excepted. Some powers are shared, and the Westminster Parliament can still legislate on devolved matters.</Caution>
      </Panel>

      <Panel id="h-up-vote" title="Voting for the devolved parliaments" lead={`${turnout.map((t) => `${t.name}: turnout ${t.last.turnout}% in ${t.last.id}, against ${t.first.turnout}% in ${t.first.id}`).join(". ")}.`} sources={[]}>
        <TrendExplorer
          accent={ACCENT}
          options={[{ key: "turnout", label: "Turnout", lines: NATIONS.map((n, i) => line(n, ["#2F6DB5", "#348837", "#B5651D"][i])), offset: 0, labelFn: (t) => String(Math.round(t)), yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: 1997, to: 2028, note: "The share of voters who voted in each election to the Scottish Parliament, the Senedd and the Northern Ireland Assembly. Where voters have two votes, the figure is for the constituency vote." }]}
        />
        <p style={para}>Results, seats and who formed each government are on the <a href="#/generalElection/devolved/scotland" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>devolved elections</a> pages, and what the three governments do day to day is on <a href="#/devolved" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>Scotland, Wales and Northern Ireland</a>.</p>
      </Panel>
    </div>
  );
}
const yearOf = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return d.getUTCFullYear() + d.getUTCMonth() / 12; };

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
  const scot = NATIONS.find((n) => n.key === "scotland").elections.at(-1);
  const seats = Object.values(scot.seats).reduce((a, b) => a + b, 0);
  return (
    <div>
      <Panel id="h-ua-intro" accent={ACCENT} title="The arguments" lead="Figures show where money goes and what is produced. They cannot settle whether the funding is fair, whether the union should continue or how far power should be devolved, which depends on values as well as evidence. These are the arguments people make, not our view." />
      <Arg
        id="h-ua-money" title="Is the way money is shared across the UK fair?"
        shows={`Identifiable spending per person in ${yearText(S_LAST)} was ${gbp(perHead("ni"))} in Northern Ireland, ${gbp(perHead("scotland"))} in Scotland, ${gbp(perHead("wales"))} in Wales and ${gbp(perHead("england"))} in England, where it ranged from ${gbp(perHead("london"))} in London to ${gbp(perHead("se"))} in the South East. London and the South East were the only places that raised more than was spent there; Scotland's deficit was ${bn(fiscalTotal("scotland"))}, Wales's ${bn(fiscalTotal("wales"))} and Northern Ireland's ${bn(fiscalTotal("ni"))}. The devolved governments' block grants are mainly adjusted by the Barnett formula, which changes them by a population share of changes in comparable spending in England; it is Treasury policy, not law, and the Treasury adds a needs-based adjustment for Wales and Northern Ireland.`}
        sLabel="People who defend the higher spending in the devolved nations say" cLabel="People who want it changed say"
        supporters={["Services cost more to provide where people are spread out, as in the Highlands, rural Wales and parts of Northern Ireland, and some places have older, poorer or less healthy populations, so need for spending is higher. The union, they argue, exists in part to share resources between richer and poorer parts of the country, as taxes do within England."]}
        critics={["Per person, more is spent in the devolved nations than in most of England, including in poorer English regions such as the North East and Yorkshire, and they argue that spending should follow need wherever it is, with a clear and independent way of deciding it. Others say the deficit figures show how much the rest of the UK pays for the devolved nations, while those in the devolved nations point to the part of North Sea revenue and the taxes they raise, and say deficits are driven by UK policy."]}
        sources={[SOURCES.cra, SOURCES.fiscal, SOURCES.funding]}
      />
      <Arg
        id="h-ua-union" title="Should the union continue?"
        shows={`In the referendum on ${REFERENDUM_2014.date}, ${REFERENDUM_2014.noPct}% of voters in Scotland chose No and ${round1(100 - REFERENDUM_2014.noPct)}% Yes, on a turnout of ${REFERENDUM_2014.turnout}%. ${RULING.text} In the 2026 Scottish Parliament election the SNP won ${scot.seats.snp} of ${seats} seats, short of a majority. Scotland's public sector deficit was ${bn(fiscalTotal("scotland"))} in ${yearText(F_LAST)} when North Sea oil and gas revenue is counted where the fields are, and ${bn(D.fiscal.places.scotland.balancePop.at(-1))} when it is shared by population.`}
        sLabel="People who want Scotland, or another nation, to leave say" cLabel="People who want the union to continue say"
        supporters={["Decisions about a nation's tax, spending and trade should be made by the people who live there, and a nation of Scotland's size can run its own affairs, as other European countries of its size do. They argue that the 2014 vote was before Brexit, which Scotland voted against, and that the issue should be put to voters again."]}
        critics={["The union gives nations a larger market, a shared currency and defence, and spreads risk, such as the fall in oil revenue, across the whole UK. They argue the 2014 result was decisive, that an independent nation would have to find a way to cover its deficit and agree its trade, currency and border with the rest of the UK, and that the energy and effort of constitutional arguments would be better spent on services."]}
        sources={[SOURCES.referendum, SOURCES.ruling, SOURCES.fiscal]}
      />
      <Arg
        id="h-ua-england" title="How far should power go to the regions of England?"
        shows={`Output per person in ${G_LAST} ranged from ${gbp(gdpPerHead("london"))} in London to ${gbp(gdpPerHead("ne"))} in the North East. Identifiable spending per person ranged from ${gbp(perHead("london"))} to ${gbp(perHead("se"))} between English regions. The ${ENGLAND_ACT.name}, which received Royal Assent on ${ENGLAND_ACT.assent}, defines strategic authorities (groups of councils, many led by an elected mayor), and gives them and their mayors more say over transport, local infrastructure and other functions.`}
        sLabel="People who want more power for English regions say" cLabel="People who are cautious about it say"
        supporters={["England is the most centralised part of the UK, and decisions made in Westminster do not fit the places they affect. Regions with their own transport, skills and planning powers, and money to spend on them, could close the gap between London and the rest, as city regions with mayors have started to do."]}
        critics={["Another layer of government adds cost and confusion about who is responsible, and can mean that services and standards differ from place to place. They argue that regions without a mayor or the capacity to use the powers can be left behind, and that real control needs the power to raise taxes, which most English authorities do not have."]}
        sources={[SOURCES.englandAct, SOURCES.gdp, SOURCES.cra]}
      />
    </div>
  );
}
const round1 = (v) => Math.round(v * 10) / 10;

function About() {
  return (
    <div>
      <Panel id="h-ux-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. The charts read from HM Treasury and ONS data saved on ${D.built}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-ux-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Identifiable spending.</strong> The spending figures count only spending that can be tied to a place. Defence, overseas aid, debt interest and some other spending cannot, so they are left out, and they do not count what the devolved governments raise themselves.</li>
          <li style={li}><strong style={strong}>Deficits and surpluses.</strong> The ONS's figures are estimates, many of them allocated by rules. They count North Sea oil and gas revenue in two ways, and the result for Scotland is different under each.</li>
          <li style={li}><strong style={strong}>Years.</strong> Spending is for {yearText(S_LAST)}, revenue and deficits for {yearText(F_LAST)} and output for {G_LAST}. The latest year differs between sources.</li>
          <li style={li}><strong style={strong}>Output per person.</strong> It counts where the work is done, so commuting makes some places look richer and others poorer than their residents are.</li>
          <li style={li}><strong style={strong}>The Barnett formula.</strong> The description of how the block grants change is a summary. The Treasury's explanatory note gives the details and the needs-based factors.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> Opinion polls on independence and the union, local government finance, and the powers of the Welsh and Scottish governments to borrow.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Union({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/union" : `#/union/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconSplit} kicker="Britain in numbers" title="Devolution and the union" subtitle="What Scotland, Wales, Northern Ireland and the regions of England spend, raise and produce, who decides what, and the arguments about funding, the union and English devolution." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="un" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="un-panel" aria-labelledby={`un-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "money" && <DevolutionMoney />}
        {tab === "economy" && <DevolutionEconomy />}
        {tab === "place" && <DevolutionPlace />}
        {tab === "powers" && <Powers />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
