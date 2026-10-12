// Loads the ONS series behind the Governments tab, one file at a time as it is needed, and keeps what it has loaded.
import { METRICS, prepareSeries } from "./governmentMetrics";

const LOADERS = {
  economy: () => import("../data/ons/economy.json"),
  jobs: () => import("../data/ons/jobs.json"),
  prices: () => import("../data/ons/prices.json"),
  rates: () => import("../data/ons/rates.json"),
  housing: () => import("../data/ons/housing.json"),
  publicFinances: () => import("../data/ons/publicFinances.json"),
  population: () => import("../data/ons/population.json"),
  crime: () => import("../data/ons/crime.json"),
  environment: () => import("../data/ons/environment.json"),
};

const files = new Map();
const prepared = new Map();

// Resolves with the prepared series for a metric: points as [time, value] and the length of a period.
export async function loadMetric(metric) {
  if (prepared.has(metric.id)) return prepared.get(metric.id);
  if (!files.has(metric.file)) files.set(metric.file, LOADERS[metric.file]().then((m) => m.default));
  const data = await files.get(metric.file);
  const series = data.series[metric.series];
  if (!series) throw new Error(`No series ${metric.series} in ${metric.file}`);
  const result = prepareSeries(metric, series);
  prepared.set(metric.id, result);
  return result;
}

export const metricById = (id) => METRICS.find((m) => m.id === id);
