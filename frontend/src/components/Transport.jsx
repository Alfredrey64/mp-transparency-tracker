import { useRef, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconTransport } from "./icons";
import { PageToggles, Panel, Stats, Takeaways, TrendExplorer } from "./insight";
import TransportRoads from "./TransportRoads";
import TransportRail from "./TransportRail";
import TransportBuses from "./TransportBuses";
import TransportPlace from "./TransportPlace";
import { BUS_ACT, CHECKED, RAIL_OWNERSHIP, SOURCES } from "../data/transport";
import { B, B_LAST, D, DE, DE_LAST, NC, NC_LAST, R, RJ_LAST, SUP_LAST, TR, TR_LAST, TRANSPORT_EMISSIONS, busAt, busChange, busPeak, carShare, carsLicensed, deathRate, deathsAt, deathsPeakSince, fuelShares, last, newCarSeries, ordinalYear, railPeakBefore, round, supportAt, trafficPre, trafficSince } from "../lib/transport";
import { ACCENT, group, jump, li } from "../lib/transportStyle";
import { para, strong } from "../lib/insightStyle";

// Transport: how much we drive and in what, how many people die on the roads, how rail and buses are used and paid for, and where it differs, with the
// arguments. One page with a row of toggles; the address carries the toggle (/transport/rail).

const TABS = [
  { key: "overview", label: "Overview", blurb: "The main figures for roads, rail and buses, and how they have changed.", colour: "#1D4ED8" },
  { key: "roads", label: "Roads and cars", blurb: "How much we drive, what new cars run on, the state of local roads, road deaths and emissions.", colour: "#C0561F" },
  { key: "rail", label: "Trains", blurb: "How many journeys, what the government pays, fares against prices, punctuality, and who runs the trains.", colour: "#0F766E" },
  { key: "buses", label: "Buses", blurb: "Bus journeys, fares and support, and who decides how buses run.", colour: "#C7871A" },
  { key: "place", label: "By place", blurb: "Cars, local roads and buses in each region and nation.", colour: "#7A5AF0" },
  { key: "arguments", label: "The arguments", blurb: "Roads against alternatives, who should run and pay for the railways, and how buses should be run, set out fairly.", colour: "#9D174D" },
  { key: "about", label: "Sources", blurb: "Where each figure comes from and what it leaves out.", colour: "#6B7280" },
];
const KEYS = new Set(TABS.map((t) => t.key));
const parse = (param) => { const first = String(param ?? "").split("/")[0]; return KEYS.has(first) ? first : "overview"; };
const bn = (m) => `£${(m / 1000).toFixed(1)}bn`;
const fy = (t) => ordinalYear(Math.floor(t));

function Overview({ onPick }) {
  const s = fuelShares();
  const s19 = fuelShares(2019);
  const pre = trafficPre();
  const dpk = deathsPeakSince();
  const rate = deathRate();
  const pr = railPeakBefore();
  const e = TRANSPORT_EMISSIONS();
  const eng = B.journeys.england;
  const bp = busPeak("england");
  const o = RAIL_OWNERSHIP;
  const lic = carsLicensed();
  return (
    <div>
      <Takeaways
        accent={ACCENT}
        items={[
          `Vehicles drove ${last(TR.total)} billion miles on Britain's roads in ${TR_LAST}, a record and ${trafficSince(2019)}% more than in ${pre.year}. Cars and taxis are ${carShare()}% of it. There are ${lic.millions} million cars licensed in Great Britain.`,
          `${s.battery}% of new cars in Great Britain in ${NC_LAST} were battery electric and ${s.plugin}% plug-in hybrids, against ${s19.battery}% and ${s19.plugin}% in 2019. Petrol and diesel cars with no electric help were ${round(s.petrol + s.diesel, 0)}% of new cars.`,
          `${group(deathsAt(DE_LAST))} people were killed on Britain's roads in ${DE_LAST}, against ${group(dpk.value)} in ${dpk.year}. That is ${rate.values.at(-1)} deaths for every billion vehicle miles, against ${rate.values[0]} in 1949.`,
          `Passengers made ${(last(R.journeys.millions) / 1000).toFixed(2)} billion rail journeys in ${ordinalYear(RJ_LAST)}, more than the ${(pr.value / 1000).toFixed(2)} billion in ${ordinalYear(pr.year)}. Government support was ${bn(supportAt(SUP_LAST))} in ${ordinalYear(SUP_LAST)}, against ${bn(supportAt(2019))} in ${ordinalYear(2019)} in the same prices. ${o.publicOf} of ${o.operators} operators with Department for Transport contracts are now in public ownership.`,
          `There were ${(last(eng) / 1000).toFixed(2)} billion local bus journeys in England in the year to March ${B_LAST}, ${Math.abs(busChange("england", 2020))}% fewer than in the year to March 2020 and ${Math.round(((bp.value - last(eng)) / bp.value) * 100)}% below the peak in ${bp.year}. ${Math.round((last(B.journeys.london) / last(eng)) * 100)}% of them were in London.`,
          `Domestic transport released ${group(e.value)} million tonnes of greenhouse gases in ${e.year}, ${e.share}% of the UK total and down only ${Math.abs(e.pct)}% since 1990.`,
        ]}
      />

      <Panel id="h-to-main" accent={ACCENT} title="The main figures" lead="The latest year for each, with its trend. Road figures are for Great Britain, rail for Great Britain, and buses for England unless said." sources={[SOURCES.traffic, SOURCES.vehicles, SOURCES.deaths, SOURCES.railUsage, SOURCES.buses]}>
        <Stats
          accent={ACCENT}
          items={[
            { value: `${last(TR.total)}bn`, label: `Vehicle miles driven, ${TR_LAST}`, note: `${pre.value}bn in ${pre.year}`, spark: TR.total },
            { value: `${s.battery}%`, label: `Of new cars battery electric, ${NC_LAST}`, note: `${s19.battery}% in 2019. A further ${s.plugin}% are plug-in hybrids`, spark: newCarSeries("battery") },
            { value: group(deathsAt(DE_LAST)), label: `Killed on the roads, ${DE_LAST}`, note: `${group(dpk.value)} in ${dpk.year}`, spark: DE.all.filter((_, i) => DE.years[i] >= 1949) },
            { value: `${(last(R.journeys.millions) / 1000).toFixed(2)}bn`, label: `Rail journeys, ${ordinalYear(RJ_LAST)}`, note: `${(pr.value / 1000).toFixed(2)}bn in ${ordinalYear(pr.year)}`, spark: R.journeys.millions },
            { value: `${(last(eng) / 1000).toFixed(2)}bn`, label: "Bus journeys in England", note: `Year to March ${B_LAST}. ${(busAt("england", 2020) / 1000).toFixed(2)}bn in the year to March 2020`, spark: eng },
            { value: `${e.share}%`, label: "Of UK emissions from transport", note: `${group(e.value)} million tonnes in ${e.year}`, spark: e.values },
          ]}
        />
      </Panel>

      <Panel id="h-to-trends" title="How things have changed" lead="Pick a measure. Each is on its own toggle in more detail." accent={ACCENT} sources={[SOURCES.traffic, SOURCES.vehicles, SOURCES.railUsage, SOURCES.buses]}>
        <TrendExplorer
          accent={ACCENT}
          options={[
            { key: "traffic", label: "Road traffic", governments: true, lines: [{ name: "All motor vehicles", color: ACCENT, years: TR.years, values: TR.total }], offset: 0, yFormat: (v) => `${Math.round(v)}bn`, captionFormat: (v) => `${v.toFixed(1)} billion miles`, change: "percent", from: TR.years[0], to: TR_LAST + 1, note: "Billions of vehicle miles driven each year in Great Britain." },
            { key: "ev", label: "Electric cars", lines: [{ name: "Battery electric", color: "#0F766E", years: NC.years, values: newCarSeries("battery") }, { name: "Plug-in hybrid", color: "#7A5AF0", years: NC.years, values: newCarSeries("plugin") }], offset: 0, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: NC.years[0], to: NC_LAST + 1, note: "The share of new cars registered each year in Great Britain." },
            { key: "rail", label: "Rail journeys", governments: true, lines: [{ name: "Passenger journeys", color: "#0F766E", years: R.journeys.years, values: R.journeys.millions.map((v) => v / 1000) }], offset: 0.5, labelFn: fy, yFormat: (v) => `${v.toFixed(1)}bn`, captionFormat: (v) => `${v.toFixed(2)} billion`, change: "percent", from: R.journeys.years[0], to: RJ_LAST + 1, note: "Billions of passenger journeys in Great Britain each financial year." },
            { key: "bus", label: "Bus journeys", governments: true, lines: [{ name: "England", color: "#C7871A", years: B.journeys.years, values: eng.map((v) => v / 1000) }], offset: 0, labelFn: (t) => `year to March ${Math.floor(t)}`, yFormat: (v) => `${v.toFixed(1)}bn`, captionFormat: (v) => `${v.toFixed(2)} billion`, change: "percent", from: B.journeys.years[0], to: B_LAST + 1, note: "Billions of local bus journeys in England in each year to March." },
          ]}
        />
      </Panel>

      <Panel id="h-to-go" title="Where to look next" lead="Roads first, then trains and buses, then your part of the country.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={() => onPick("roads")} style={jump}>Roads, cars and road deaths</button>
          <button type="button" onClick={() => onPick("rail")} style={jump}>Trains: journeys, cost and punctuality</button>
          <button type="button" onClick={() => onPick("buses")} style={jump}>Buses</button>
          <button type="button" onClick={() => onPick("place")} style={jump}>By region and nation</button>
        </div>
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
  const pre = trafficPre();
  const e = TRANSPORT_EMISSIONS();
  const s = fuelShares();
  const o = RAIL_OWNERSHIP;
  const j = R.journeys;
  const pr = railPeakBefore();
  const eng = B.journeys.england;
  const bp = busPeak("england");
  const ratio = round((last(R.fares.allTickets) / last(R.fares.rpi)) * 100 - 100, 0);
  const ldn = last(B.perHead.london);
  const east = last(B.perHead.east);
  return (
    <div>
      <Panel id="h-ta-intro" accent={ACCENT} title="The arguments" lead="Figures show how we travel and what it costs. They cannot settle how the country should travel or who should pay, which depends on values as well as evidence. These are the arguments people make, not our view." />
      <Arg
        id="h-ta-roads" title="Should the country spend more on roads, or on other ways to travel?"
        shows={`Road traffic was ${last(TR.total)} billion vehicle miles in ${TR_LAST}, a record and ${trafficSince(2019)}% above ${pre.year}, with cars and taxis ${carShare()}% of it. Transport released ${e.share}% of the UK's greenhouse gases and is down only ${Math.abs(e.pct)}% since 1990. ${s.battery}% of new cars in ${NC_LAST} were battery electric. Maintenance should be considered on ${last(D.roadConditions.a.england)}% of local A roads and ${last(D.roadConditions.bc.england)}% of B and C roads in England.`}
        sLabel="People who want more spent on roads say" cLabel="People who want more spent on other ways to travel say"
        supporters={["Most journeys are made by car, goods travel mostly by road, and in much of the country there is no practical alternative. They argue that congestion costs the economy, that repairing roads is cheaper than letting them decay, and that electric cars will remove most of the climate case against driving."]}
        critics={["New roads tend to fill with new traffic, so congestion returns, and cars take up space in towns and produce emissions, noise and pollution even when electric. They argue that money spent on trains, buses, cycling and walking moves more people for each pound in cities, gives a choice to people who cannot drive, and is needed to meet climate targets, as electric cars alone will not cut transport emissions fast enough."]}
        sources={[SOURCES.traffic, SOURCES.vehicles, SOURCES.roads, SOURCES.ghg]}
      />
      <Arg
        id="h-ta-rail" title="Who should run the railways, and who should pay?"
        shows={`Rail passengers made ${(last(j.millions) / 1000).toFixed(2)} billion journeys in ${ordinalYear(RJ_LAST)}, above ${(pr.value / 1000).toFixed(2)} billion in ${ordinalYear(pr.year)}. Government support was ${bn(supportAt(SUP_LAST))} in ${ordinalYear(SUP_LAST)}, against ${bn(supportAt(2019))} in ${ordinalYear(2019)}, in the same prices. Fares have risen ${ratio}% faster than the Retail Prices Index since 1995. ${o.publicOf} of the ${o.operators} operators that hold passenger contracts with the Department for Transport in England are now publicly owned.`}
        sLabel="People who support public ownership say" cLabel="People who prefer private operators, or want to keep a mix, say"
        supporters={["A single public body can plan timetables, fares and track together, instead of dividing them between companies, and any surplus goes back to the railway rather than to shareholders. They argue the franchise system fragmented responsibility and that those who run trains should answer to ministers."]}
        critics={["Private operators bring investment and ideas, and compete to improve service, and ownership alone does not lower costs or fix the track, signalling and trains that cause most delays. They argue that taxpayers carry the cost and risk under public ownership, and that the railway needs more fare income, from the people who use it, not less. Others say fares are already too high and the cost should fall on all taxpayers or on road users."]}
        sources={[SOURCES.railUsage, SOURCES.railFinance, SOURCES.railFares, SOURCES.railOwnership]}
      />
      <Arg
        id="h-ta-bus" title="How should buses be run?"
        shows={`There were ${(last(eng) / 1000).toFixed(2)} billion bus journeys in England in the year to March ${B_LAST}, ${Math.round(((bp.value - last(eng)) / bp.value) * 100)}% below the peak in the year to March ${bp.year}. In London each person made ${Math.round(ldn)} bus journeys a year, against ${Math.round(east)} in the East of England. The ${BUS_ACT.name} (Royal Assent ${BUS_ACT.assent}) makes it easier for councils in England to franchise buses, as London does.`}
        sLabel="People who want councils to control buses say" cLabel="People who want to keep the current system say"
        supporters={["Where a council sets routes, fares and timetables, as in London, buses run as a network, which people use more. They argue that companies running only what pays leave gaps, that a single ticket and fare cap need public control, and that the money paid to operators should buy a service the council chooses."]}
        critics={["Franchising costs a council money and risk if fares do not cover costs, and takes years to set up. They argue that partnerships between councils and operators can do much of the same, that bus use is falling for reasons such as traffic and home working that franchising alone will not change, and that competition between operators keeps costs down."]}
        sources={[SOURCES.buses, SOURCES.busAct]}
      />
    </div>
  );
}

function About() {
  return (
    <div>
      <Panel id="h-tx-src" title="Where the figures come from" lead={`Checked on ${CHECKED}. The charts read from Department for Transport and Office of Rail and Road data saved on ${D.built}.`}>
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} style={li}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontFamily: FONT_BODY, fontWeight: 600 }}>{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-tx-limits" title="What to bear in mind">
        <ul style={{ ...para, margin: 0, paddingLeft: 20 }}>
          <li style={li}><strong style={strong}>Different places.</strong> Road traffic, deaths, vehicles and rail are for Great Britain unless stated, bus and local road figures are mainly for England, and each of the four nations runs its own transport policy.</li>
          <li style={li}><strong style={strong}>Estimates.</strong> Traffic is estimated from counts on a sample of roads. Road condition comes from surveys of the roads each council looks after, and a council's figure depends on how much of its network is surveyed.</li>
          <li style={li}><strong style={strong}>Years.</strong> Rail figures are for financial years, April to March, and the latest year is provisional. Bus figures are for years to March. Rail punctuality for the year in progress is left out of the yearly charts until the year ends.</li>
          <li style={li}><strong style={strong}>New cars.</strong> New car registrations show what is bought, not the whole fleet, and company cars are counted where the company is registered.</li>
          <li style={li}><strong style={strong}>Real terms.</strong> Rail support and bus fares and support are adjusted for inflation by the Office of Rail and Road and the Department for Transport, in the prices of the latest year.</li>
          <li style={li}><strong style={strong}>Road deaths.</strong> Only collisions reported to the police are counted. Deaths are those within 30 days of the collision.</li>
          <li style={li}><strong style={strong}>Not covered.</strong> Walking and cycling in detail, freight, aviation and shipping, new roads and rail lines and what they cost, and the price of fuel and car ownership.</li>
        </ul>
      </Panel>
    </div>
  );
}

export default function Transport({ param }) {
  const [tab, setTab] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  const ref = useRef(null);
  if (param !== seen) { setSeen(param); setTab(parse(param)); }
  function go(next) {
    const moved = next !== tab;
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? "#/transport" : `#/transport/${next}`);
    if (moved && ref.current && ref.current.getBoundingClientRect().top < 0) ref.current.scrollIntoView({ block: "start" });
  }
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconTransport} kicker="Britain in numbers" title="Transport" subtitle="How much we drive and what in, how many people die on the roads, how rail and buses are used and paid for, where it differs across the country, and the arguments." />
      <div ref={ref} style={{ scrollMarginTop: 12 }}>
        <PageToggles tabs={TABS} current={tab} onPick={go} label="What to look at" idPrefix="to" />
      </div>
      <div key={tab} className="ge-fade" role="tabpanel" id="to-panel" aria-labelledby={`to-tab-${tab}`}>
        {tab === "overview" && <Overview onPick={go} />}
        {tab === "roads" && <TransportRoads />}
        {tab === "rail" && <TransportRail />}
        {tab === "buses" && <TransportBuses />}
        {tab === "place" && <TransportPlace />}
        {tab === "arguments" && <Arguments />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
