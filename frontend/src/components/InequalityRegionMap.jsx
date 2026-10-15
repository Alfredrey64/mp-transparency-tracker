import { SOURCES } from "../data/inequality";
import { MAP_METRICS } from "../lib/inequalityPlace";
import RegionMetricMap from "./RegionMetricMap";

// The Inequality page's map: eight measures of income, poverty and wealth for the twelve regions and nations.

const SOURCE_FOR = { gdhi: SOURCES.gdhi, hbai: SOURCES.hbai, wealth: SOURCES.wealthTables };
const METRICS = MAP_METRICS.map((m) => ({ ...m, source: SOURCE_FOR[m.source] }));

export default function InequalityRegionMap({ selected, onSelect }) {
  return (
    <RegionMetricMap
      id="h-place-map" title="Pick a measure and see the country" lead="The twelve regions and nations, painted by the measure you choose. Tap a place to see it against the UK on every measure."
      metrics={METRICS} defaultMetric="poverty" selected={selected} onSelect={onSelect}
    />
  );
}
