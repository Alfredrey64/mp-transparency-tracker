import { useState } from "react";
import { Caution, Panel } from "./insight";
import RegionMetricMap from "./RegionMetricMap";
import { SOURCES } from "../data/transport";
import { MAP_METRICS, RC_LAST, V } from "../lib/transport";
import { para } from "../lib/insightStyle";

// Transport, the place toggle: cars, local roads and buses in each region and nation.

export default function TransportPlace() {
  const [selected, setSelected] = useState(null);
  const sources = { cars: SOURCES.vehicles, plug: SOURCES.vehicles, plugChange: SOURCES.vehicles, roadA: SOURCES.roads, roadBC: SOURCES.roads, bus: SOURCES.buses, busChange: SOURCES.buses };
  return (
    <div>
      <RegionMetricMap
        id="h-tp-map" title="Cars, roads and buses by place" lead="How many cars people have, how many new cars are plug-in, how much of the local road network needs attention, and how often people take the bus, in each region and nation. Pick a measure, and tap a place to see it on all of them. Some measures cover England or Great Britain only, and those places outside are left blank."
        metrics={MAP_METRICS.map((m) => ({ ...m, source: sources[m.id] }))} defaultMetric="cars" selected={selected} onSelect={setSelected}
        tapNote="Tap a place on the map, or a name in the list below, to see it on every measure. Some measures have no figure for some places."
      />
      <Panel id="h-tp-notes" title="Reading the place figures" sources={[SOURCES.population]}>
        <p style={{ ...para, marginTop: 0 }}>Cars and buses are counted for each resident using the Office for National Statistics' population estimates, and the road figures are for the year to March {RC_LAST}. New cars are counted where they are registered, and company and leasing cars are registered where the company is, which is why the South East looks high on new and plug-in cars, and the figures for {V.byPlace.year} are the latest full year.</p>
        <Caution title="Averages hide the differences inside a place">A region's figure covers cities, towns and countryside together. Car ownership is lower in the centre of cities and higher in rural areas, and bus use is much higher in cities than in the countryside.</Caution>
      </Panel>
    </div>
  );
}
