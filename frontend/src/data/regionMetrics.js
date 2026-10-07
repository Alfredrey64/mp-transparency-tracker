// What the Regions page can show, and where each region's figures come from.
//
// Each metric names, for every region, a series id in one of the saved sector files (see
// data/ons/*.json), plus a UK-wide series to compare with. House prices and unemployment come
// from the Housing and Jobs files; the rest from the Regions file (see onsSectors.js).

export const REGIONS = [
  { key: "scotland", name: "Scotland", short: "Scotland", tile: [1, 0] },
  { key: "ni", name: "Northern Ireland", short: "N Ireland", tile: [0, 1] },
  { key: "ne", name: "North East", short: "North East", tile: [2, 1] },
  { key: "nw", name: "North West", short: "North West", tile: [1, 2] },
  { key: "yh", name: "Yorkshire and the Humber", short: "Yorkshire", tile: [2, 2] },
  { key: "wales", name: "Wales", short: "Wales", tile: [0, 3] },
  { key: "wm", name: "West Midlands", short: "W Midlands", tile: [1, 3] },
  { key: "em", name: "East Midlands", short: "E Midlands", tile: [2, 3] },
  { key: "east", name: "East of England", short: "East", tile: [3, 3] },
  { key: "sw", name: "South West", short: "South West", tile: [1, 4] },
  { key: "london", name: "London", short: "London", tile: [2, 4] },
  { key: "se", name: "South East", short: "South East", tile: [3, 4] },
];

const HPI = { ne: "hpi-north-east", nw: "hpi-north-west", yh: "hpi-yorkshire", em: "hpi-east-midlands", wm: "hpi-west-midlands", east: "hpi-east", london: "hpi-london", se: "hpi-south-east", sw: "hpi-south-west", wales: "hpi-wales", scotland: "hpi-scotland", ni: "hpi-ni" };
const UNEMPLOYMENT = { ne: "unemployment-north-east", nw: "unemployment-north-west", yh: "unemployment-yorkshire", em: "unemployment-east-midlands", wm: "unemployment-west-midlands", east: "unemployment-east", london: "unemployment-london", se: "unemployment-south-east", sw: "unemployment-south-west", wales: "unemployment-wales", scotland: "unemployment-scotland", ni: "unemployment-ni" };
const own = (prefix) => Object.fromEntries(REGIONS.map((r) => [r.key, { sector: "regions", id: `${prefix}-${r.key}` }]));
const from = (sector, ids) => Object.fromEntries(Object.entries(ids).map(([k, id]) => [k, { sector, id }]));

// A region's name as it reads in a sentence: "the North East", "London".
const THE = new Set(["ne", "nw", "em", "wm", "east", "se", "sw"]);
export const inSentence = (key) => `${THE.has(key) ? "the " : ""}${REGIONS.find((r) => r.key === key)?.name ?? key}`;

export const METRICS = [
  {
    id: "price", label: "House prices", noun: "average house price", format: "gbp", nominal: true, accent: "#2F9E6E",
    series: from("housing", HPI), uk: { sector: "housing", id: "hpi-uk" }, link: { href: "#/housing", label: "House prices in detail" },
    blurb: "The average price paid for a home. London is far ahead of every other place, and the North East and Northern Ireland are the cheapest.",
    why: "The gap in prices is the gap in who can afford to buy where they grew up.",
  },
  {
    id: "price-change", label: "House price change", noun: "change in house prices over a year", format: "pct", accent: "#7B5BD6",
    series: own("hpichg"), uk: { sector: "housing", id: "hpi-change" }, link: { href: "#/housing", label: "House prices in detail" },
    blurb: "How much average house prices have changed compared with a year earlier. Press play to see booms and slumps spread, or fail to spread, across the country.",
    why: "Prices tend to rise first in the south and spread outwards, so the map shows where a boom is, and where it has yet to reach.",
  },
  {
    id: "pay", label: "Pay", noun: "typical annual pay", format: "gbp", nominal: true, accent: "#C0478A",
    series: own("pay"), uk: { sector: "regions", id: "pay-uk" }, link: { href: "#/jobs", label: "Jobs and pay in detail" },
    blurb: "The pay of the typical employee living in each place, before tax, for a full year. It counts where people live, not where they work, so it includes people who commute into London.",
    why: "Pay is where regional gaps show up most plainly. The figures change once a year, each April, so the colours step rather than drift.",
  },
  {
    id: "unemployment", label: "Unemployment", noun: "unemployment rate", format: "pct", accent: "#D9453B",
    series: from("jobs", UNEMPLOYMENT), uk: { sector: "jobs", id: "unemployment" }, link: { href: "#/jobs", label: "Jobs and pay in detail" },
    blurb: "The share of people who want a job, are looking and could start, out of everyone working or looking, aged 16 and over.",
    why: "Local job markets can be weak while the national rate looks fine. Regional estimates are less precise than national ones, so small differences mean little.",
  },
  {
    id: "employment", label: "Employment", noun: "employment rate", format: "pct", accent: "#0E9AA7",
    series: own("emp"), uk: { sector: "jobs", id: "employment" }, link: { href: "#/jobs", label: "Jobs and pay in detail" },
    blurb: "The share of people aged 16 to 64 who are in paid work.",
    why: "The gap between the best and worst regions is a measure of how many working-age people are missing out on work.",
  },
  {
    id: "inactivity", label: "Not working or looking", noun: "economic inactivity rate", format: "pct", accent: "#E07A1F",
    series: own("inact"), uk: { sector: "jobs", id: "inactivity" }, link: { href: "#/jobs", label: "Jobs and pay in detail" },
    blurb: "The share of people aged 16 to 64 who are neither working nor looking for work, for example because of study, caring, or long-term sickness.",
    why: "Inactivity is higher where there is more long-term sickness and where jobs are scarce, and it does not show up in the unemployment rate.",
  },
];

export const metricById = (id) => METRICS.find((m) => m.id === id) ?? null;
