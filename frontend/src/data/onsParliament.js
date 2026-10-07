// Where each Britain in numbers page meets the rest of the site: topics to look up
// in MPs' written questions, the category of bills to look at, and related pages.
// `topics` open "Who's asking about a topic"; `billCategory` must be one of the
// category labels in lib/bills.js; `pages` are page keys from the sidebar.

export const PARLIAMENT_LINKS = {
  economy: { topics: ["economy", "productivity", "growth"], billCategory: "Economy & Finance", pages: [{ key: "budget", label: "Where taxes go" }, { key: "tracker", label: "Promises tracker" }] },
  prices: { topics: ["cost of living", "inflation", "energy bills"], billCategory: "Economy & Finance", pages: [{ key: "budget", label: "Where taxes go" }, { key: "parties", label: "What parties promise" }] },
  jobs: { topics: ["unemployment", "minimum wage", "apprenticeships"], billCategory: "Work & Pensions", pages: [{ key: "parties", label: "What parties promise" }, { key: "tracker", label: "Promises tracker" }] },
  publicFinances: { topics: ["national debt", "borrowing", "public spending"], billCategory: "Economy & Finance", pages: [{ key: "budget", label: "Where taxes go" }, { key: "committees", label: "Watchdog committees" }] },
  population: { topics: ["immigration", "migration", "census"], billCategory: "Justice & Home Affairs", pages: [{ key: "devolved", label: "Scotland, Wales & N. Ireland" }, { key: "constituency", label: "Your constituency" }] },
  health: { topics: ["NHS", "waiting lists", "social care"], billCategory: "Health", pages: [{ key: "committees", label: "Watchdog committees" }, { key: "budget", label: "Where taxes go" }] },
  housing: { topics: ["housing", "renters", "planning"], billCategory: "Housing & Communities", pages: [{ key: "councils", label: "Your council" }, { key: "parties", label: "What parties promise" }] },
  crime: { topics: ["knife crime", "policing", "sentencing"], billCategory: "Justice & Home Affairs", pages: [{ key: "committees", label: "Watchdog committees" }, { key: "parties", label: "What parties promise" }] },
  trade: { topics: ["trade", "tariffs", "exports"], billCategory: "Economy & Finance", pages: [{ key: "committees", label: "Watchdog committees" }, { key: "tracker", label: "Promises tracker" }] },
  tax: { topics: ["taxation", "national insurance", "public spending"], billCategory: "Economy & Finance", pages: [{ key: "budget", label: "Where taxes go" }, { key: "tracker", label: "Promises tracker" }] },
  rates: { topics: ["interest rates", "mortgages", "inflation"], billCategory: "Economy & Finance", pages: [{ key: "parties", label: "What parties promise" }, { key: "committees", label: "Watchdog committees" }] },
  environment: { topics: ["net zero", "climate", "energy"], billCategory: "Environment & Energy", pages: [{ key: "parties", label: "What parties promise" }, { key: "tracker", label: "Promises tracker" }] },
};
