import { Caution, PairBars, Panel, StackBars, Stats, TrendExplorer } from "./insight";
import { SOURCES } from "../data/transport";
import { DE, DE_LAST, NC, NC_LAST, RC, RC_LAST, TR, TR_LAST, TRANSPORT_EMISSIONS, carShare, carsLicensed, deathRate, deathsAt, deathsPeakSince, fuelShares, last, newCarSeries, round, trafficAt, trafficPeak, trafficPre, trafficSince } from "../lib/transport";
import { ACCENT, group } from "../lib/transportStyle";
import { para } from "../lib/insightStyle";

// Transport, the roads and cars toggle: how much traffic there is, what new cars run on, the state of local roads, road deaths, and transport's emissions.

const line = (name, color, years, values) => ({ name, color, years, values });
const FUEL = [
  { key: "battery", name: "Battery electric", colour: "#0F766E" },
  { key: "plugin", name: "Plug-in hybrid", colour: "#7A5AF0" },
  { key: "hybrid", name: "Hybrid", colour: "#1D4ED8" },
  { key: "petrol", name: "Petrol", colour: "#C0561F" },
  { key: "diesel", name: "Diesel", colour: "#6B7280" },
];

function Traffic() {
  const peak = trafficPeak();
  const pre = trafficPre();
  return (
    <Panel id="h-tr-traffic" accent={ACCENT} title="How much we drive" lead={`Vehicles drove ${last(TR.total)} billion miles on Britain's roads in ${TR_LAST}, more than in any year on record. That is ${trafficSince(2019)}% more than in ${pre.year}, the year before the pandemic (${pre.value} billion). Cars and taxis are ${carShare()}% of it.`} sources={[SOURCES.traffic]}>
      <Stats
        accent={ACCENT}
        items={[
          { value: `${last(TR.total)}bn`, label: `Vehicle miles, ${TR_LAST}`, note: `${peak.year === TR_LAST ? "A record" : `Peak ${peak.value}bn in ${peak.year}`}. ${trafficAt("total", 1949)}bn in 1949`, spark: TR.total },
          { value: `${last(TR.cars)}bn`, label: "Cars and taxis", note: `${trafficAt("cars", 2019)}bn in 2019`, spark: TR.cars },
          { value: `${last(TR.vans)}bn`, label: "Vans", note: `${trafficAt("vans", 2000)}bn in 2000`, spark: TR.vans },
          { value: `${last(TR.hgv)}bn`, label: "Lorries (HGVs)", note: `${trafficAt("hgv", 2000)}bn in 2000`, spark: TR.hgv },
        ]}
      />
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "total", label: "All vehicles", governments: true, lines: [line("All motor vehicles", ACCENT, TR.years, TR.total)], offset: 0, yFormat: (v) => `${Math.round(v)}bn`, captionFormat: (v) => `${v.toFixed(1)} billion miles`, change: "percent", from: TR.years[0], to: TR_LAST + 1, note: "Billions of vehicle miles driven on roads in Great Britain each year. The dip in 2020 and 2021 was the pandemic. The shading shows who was in government, not what caused a change." },
          { key: "type", label: "By type of vehicle", lines: [line("Cars and taxis", ACCENT, TR.years, TR.cars), line("Vans", "#C7871A", TR.years, TR.vans), line("Lorries", "#C0561F", TR.years, TR.hgv), line("Buses and coaches", "#0F766E", TR.years, TR.buses), line("Motorcycles", "#7A5AF0", TR.years, TR.motorcycles)], offset: 0, yFormat: (v) => `${Math.round(v)}bn`, captionFormat: (v) => `${v.toFixed(1)} billion miles`, change: "percent", from: TR.years[0], to: TR_LAST + 1, note: "Billions of vehicle miles. Bus and coach miles have fallen for decades, while van miles have risen quickly." },
        ]}
      />
      <p style={para}>There are {carsLicensed().millions} million cars licensed in Great Britain, up from {carsLicensed().first} million in {carsLicensed().firstYear}. Traffic is measured by counting vehicles on a sample of roads, so each year's figure is an estimate.</p>
    </Panel>
  );
}

function Cars() {
  const s = fuelShares();
  const first = fuelShares(2019);
  const dieselSeries = newCarSeries("diesel");
  const dieselPeak = { value: Math.max(...dieselSeries), year: NC.years[dieselSeries.indexOf(Math.max(...dieselSeries))] };
  const salesPeak = { value: Math.max(...NC.total), year: NC.years[NC.total.indexOf(Math.max(...NC.total))] };
  const rows = [2019, 2022, NC_LAST].map((y) => ({ label: String(y), text: `${(NC.total[NC.years.indexOf(y)] / 1000).toFixed(2)} million`, parts: FUEL.map((f) => ({ name: f.name, value: fuelShares(y)[f.key], colour: f.colour })).filter((p) => p.value > 0.1) }));
  return (
    <Panel id="h-tr-cars" title="What new cars run on" lead={`Cars registered for the first time in Great Britain. In ${NC_LAST} ${s.battery}% were battery electric and ${s.plugin}% plug-in hybrids, against ${first.battery}% and ${first.plugin}% in 2019. Petrol and diesel cars with no electric help were ${round(s.petrol + s.diesel, 1)}% of new cars.`} sources={[SOURCES.vehicles]}>
      <StackBars rows={rows} label="Fuel of new cars registered, percent" format={(v) => `${v.toFixed(0)}%`} legend={FUEL.map((f) => ({ name: f.name, colour: f.colour }))} />
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "battery", label: "Battery electric share", lines: [line("Battery electric", "#0F766E", NC.years, newCarSeries("battery")), line("Plug-in hybrid", "#7A5AF0", NC.years, newCarSeries("plugin"))], offset: 0, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: NC.years[0], to: NC_LAST + 1, note: "The share of new cars each year. Electric cars were almost none of the market until about 2019." },
          { key: "ice", label: "Petrol and diesel", lines: [line("Petrol", "#C0561F", NC.years, newCarSeries("petrol")), line("Diesel", "#6B7280", NC.years, newCarSeries("diesel")), line("Hybrid", "#1D4ED8", NC.years, newCarSeries("hybrid"))], offset: 0, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(1)}%`, change: "pp", from: NC.years[0], to: NC_LAST + 1, note: `The share of new cars each year. Diesel peaked at ${dieselPeak.value}% in ${dieselPeak.year} and has fallen sharply; hybrids that cannot be plugged in have grown.` },
          { key: "numbers", label: "How many new cars", lines: [line("New cars registered", ACCENT, NC.years, NC.total.map((v) => v / 1000))], offset: 0, yFormat: (v) => `${v.toFixed(1)}m`, captionFormat: (v) => `${v.toFixed(2)} million`, change: "percent", from: NC.years[0], to: NC_LAST + 1, note: `Millions of cars registered for the first time in Great Britain each year. Sales were highest in ${salesPeak.year} (${(salesPeak.value / 1000).toFixed(2)} million) and fell sharply in 2020 with the pandemic.` },
        ]}
      />
      <Caution title="New cars, not all cars">New registrations show what is being bought, not what is on the road. Most cars on the road are older, so the fleet changes much more slowly than the new car market.</Caution>
    </Panel>
  );
}

function Roads() {
  return (
    <Panel id="h-tr-roads" title="The state of local roads" lead="Councils survey their roads each year, and report how much of the length is in a condition where maintenance should be considered. It is a guide to need, not to potholes, and it says nothing about how much a council spends." sources={[SOURCES.roads]}>
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "roads", label: "A roads", governments: true, lines: [line("A roads and motorways run by councils", ACCENT, RC.a.years, RC.a.england), line("London", "#C0561F", RC.a.years, RC.a.london), line("North West", "#0F766E", RC.a.years, RC.a.nw)], offset: 0.5, labelFn: (x) => `year to March ${Math.floor(x) + 1}`, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(0)}%`, change: "pp", from: RC.a.years[0], to: RC_LAST + 1, note: "The share of the length of local A roads where maintenance should have been considered, England, with two regions. Lower is better." },
          { key: "bc", label: "B and C roads", governments: true, lines: [line("B and C roads", ACCENT, RC.bc.years, RC.bc.england), line("London", "#C0561F", RC.bc.years, RC.bc.london), line("North West", "#0F766E", RC.bc.years, RC.bc.nw)], offset: 0.5, labelFn: (x) => `year to March ${Math.floor(x) + 1}`, yFormat: (v) => `${Math.round(v)}%`, captionFormat: (v) => `${v.toFixed(0)}%`, change: "pp", from: RC.bc.years[0], to: RC_LAST + 1, note: "The share of the length of B and C roads where maintenance should have been considered. Lower is better." },
        ]}
      />
      <p style={para}>In the year to March {RC_LAST}, maintenance should have been considered on {last(RC.a.england)}% of local A roads and {last(RC.bc.england)}% of B and C roads in England. The results come from machine surveys and the figures for each region are for roads councils look after, not the motorways and trunk roads National Highways looks after.</p>
      <Caution title="Red roads and potholes">A road in the survey's red category is one where, on the measure, maintenance should be considered. It is different from a pothole count, and councils choose which roads to mend first, so a road may be in poor condition for a time before it is done.</Caution>
    </Panel>
  );
}

function Deaths() {
  const rate = deathRate();
  const peak = deathsPeakSince();
  return (
    <Panel id="h-tr-deaths" title="Road deaths" lead={`${group(deathsAt(DE_LAST))} people were killed on Britain's roads in ${DE_LAST}, against ${group(peak.value)} in ${peak.year}, the highest since 1949. Drivers and passengers are less likely to die than before, but the fall has slowed since 2010.`} sources={[SOURCES.deaths, SOURCES.traffic]}>
      <TrendExplorer
        accent={ACCENT}
        options={[
          { key: "deaths", label: "People killed", governments: true, lines: [line("All road users", ACCENT, DE.years.filter((y) => y >= 1949), DE.all.filter((_, i) => DE.years[i] >= 1949))], offset: 0, yFormat: (v) => group(v), captionFormat: (v) => group(v), change: "percent", from: 1949, to: DE_LAST + 1, note: "People killed in reported road collisions in Great Britain each year. Only collisions reported to the police are counted." },
          { key: "rate", label: "For every billion miles", lines: [line("Deaths per billion vehicle miles", "#C0561F", rate.years, rate.values)], offset: 0, yFormat: (v) => `${Math.round(v)}`, captionFormat: (v) => `${v.toFixed(1)}`, change: "percent", from: 1949, to: DE_LAST + 1, note: "Deaths divided by billions of vehicle miles driven. It takes account of how much more we drive than in 1949." },
          { key: "who", label: "By who was killed", lines: [line("Car occupants", ACCENT, DE.years.filter((y) => y >= 1990), DE.carOccupants.filter((_, i) => DE.years[i] >= 1990)), line("Pedestrians", "#C0561F", DE.years.filter((y) => y >= 1990), DE.pedestrians.filter((_, i) => DE.years[i] >= 1990)), line("Motorcyclists", "#7A5AF0", DE.years.filter((y) => y >= 1990), DE.motorcyclists.filter((_, i) => DE.years[i] >= 1990)), line("Cyclists", "#0F766E", DE.years.filter((y) => y >= 1990), DE.cyclists.filter((_, i) => DE.years[i] >= 1990))], offset: 0, yFormat: (v) => group(v), captionFormat: (v) => group(v), change: "percent", from: 1990, to: DE_LAST + 1, note: "People killed, by the kind of road user." },
        ]}
      />
    </Panel>
  );
}

function Emissions() {
  const e = TRANSPORT_EMISSIONS();
  return (
    <Panel id="h-tr-emissions" title="Transport and climate" lead={`Domestic transport released ${group(e.value)} million tonnes of greenhouse gases in ${e.year}, ${e.share}% of the UK total and more than any other sector. It is down ${Math.abs(e.pct)}% from ${group(e.first)} million tonnes in 1990, a smaller fall than any other major sector.`} sources={[SOURCES.ghg]}>
      <PairBars
        label="Greenhouse gases from domestic transport, 1990, 2019 and the latest year, million tonnes"
        legend={[{ name: "1990", colour: "#9CA3AF" }, { name: "2019", colour: "#C7871A" }, { name: String(e.year), colour: ACCENT }]}
        rows={[{ label: "Domestic transport", note: "Mostly cars, vans and lorries", bars: [{ name: "1990", value: e.first, text: group(e.first), colour: "#9CA3AF" }, { name: "2019", value: e.values[e.years.indexOf(2019)], text: group(e.values[e.years.indexOf(2019)]), colour: "#C7871A" }, { name: String(e.year), value: e.value, text: group(e.value), colour: ACCENT }] }]}
      />
      <p style={para}>The Net zero and energy bills page sets this against every other sector and the UK's targets. Domestic transport leaves out international flights and shipping.</p>
    </Panel>
  );
}

export default function TransportRoads() {
  return (
    <div>
      <Traffic />
      <Cars />
      <Roads />
      <Deaths />
      <Emissions />
    </div>
  );
}
