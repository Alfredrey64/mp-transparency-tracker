// Ready-made starting points for the Compare over time page: a question people ask, and the measures that help answer it.
// Each lists up to four references ("<page>.<measure>", see refOf in onsSectors.js), the year to start from, and, where every
// measure uses the same unit, whether to draw them on one chart.

export const COMPARE_STORIES = [
  {
    id: "affordable",
    title: "Is life getting more affordable?",
    blurb: "Prices, pay and the cost of a home, side by side.",
    refs: ["prices.cpi", "jobs.pay-growth", "housing.homes-years-of-pay"],
    from: 2000,
  },
  {
    id: "homes",
    title: "Can people afford to buy?",
    blurb: "House prices, mortgage costs and how much of pay they swallow.",
    refs: ["housing.homes-years-of-pay", "housing.mortgage-share-of-pay", "rates.mortgage-2y", "housing.hpi-change"],
    from: 2000,
  },
  {
    id: "squeeze",
    title: "The cost of living squeeze",
    blurb: "How energy and food prices compared with inflation and pay after 2019.",
    refs: ["prices.cpi", "prices.energy", "prices.food", "jobs.pay-real"],
    from: 2019,
  },
  {
    id: "crash",
    title: "The 2008 crash and what came after",
    blurb: "Growth, jobs and national debt through the crash and the years of cuts.",
    refs: ["economy.gdp-year", "jobs.unemployment", "publicFinances.debt"],
    from: 2005,
  },
  {
    id: "covid",
    title: "Covid and the recovery",
    blurb: "The sharpest fall and rebound in living memory.",
    refs: ["economy.gdp-quarter", "jobs.unemployment", "prices.cpi"],
    from: 2018,
  },
  {
    id: "borrowing",
    title: "What borrowing costs",
    blurb: "Bank Rate and the rates families pay, on one chart.",
    refs: ["rates.bank-rate", "rates.mortgage-2y", "rates.mortgage-5y", "rates.credit-card"],
    from: 2000,
    mode: "overlay",
  },
  {
    id: "nhs",
    title: "Waiting for the NHS",
    blurb: "Waiting lists, A&E waits and how many staff there are.",
    refs: ["health.rtt-waiting", "health.ae-4-hour", "health.nhs-staff"],
    from: 2010,
  },
  {
    id: "debt",
    title: "What the government owes",
    blurb: "National debt, and how much of the tax collected goes on the interest.",
    refs: ["publicFinances.debt", "tax.interest-share", "rates.gilt-10y"],
    from: 2000,
  },
  {
    id: "work",
    title: "Are people better off in work?",
    blurb: "Jobs, pay after inflation, and people out of work through illness.",
    refs: ["jobs.employment", "jobs.pay-real", "health.long-term-sick"],
    from: 2010,
  },
  {
    id: "migration",
    title: "Migration and asylum",
    blurb: "Net migration alongside asylum claims and small boat arrivals.",
    refs: ["immigration.migration-net", "immigration.asylum-claims", "immigration.small-boats-12m"],
    from: 2010,
  },
];
