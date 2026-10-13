// The next Budget, and the names of the Budgets and fiscal statements at which tax changes were decided.
//
// `NEXT_BUDGET` is shown with a countdown on the Tax rates through time page until the day arrives. After the Budget, add what it changed to
// taxSeries.json (see the README) and set this to the next one, or to null.

export const NEXT_BUDGET = {
  date: "2026-10-28",
  name: "Autumn Budget 2026",
  note: "Delivered by Chancellor John Healey, with the Office for Budget Responsibility's forecast published the same day. Nothing has been announced on tax rates yet.",
  source: ["Money to the Masses: Healey refuses to rule out tax rises", "https://moneytothemasses.com/news/autumn-budget-2026-chancellor-john-healey-refuses-to-rule-out-tax-rises"],
};

// Dates on which tax changes were decided, with the name of the statement. Other dates are shown as "Budget, <date>".
export const EVENT_NAMES = {
  "1979-06-12": "The first Budget of the Thatcher government",
  "1988-03-15": "Budget 1988",
  "1991-03-19": "Budget 1991",
  "1993-03-16": "Budget 1993",
  "1997-07-02": "Summer Budget 1997",
  "2002-04-17": "Budget 2002",
  "2007-03-21": "Budget 2007",
  "2007-10-09": "Pre-Budget Report 2007",
  "2008-11-24": "Pre-Budget Report 2008",
  "2009-12-09": "Pre-Budget Report 2009",
  "2010-06-22": "Emergency Budget 2010",
  "2012-03-21": "Budget 2012",
  "2013-03-20": "Budget 2013",
  "2015-07-08": "Summer Budget 2015",
  "2015-11-25": "Autumn Statement 2015",
  "2016-03-16": "Budget 2016",
  "2017-03-08": "Spring Budget 2017",
  "2018-10-29": "Budget 2018",
  "2020-07-08": "Summer Economic Update 2020",
  "2021-03-03": "Budget 2021",
  "2021-09-07": "The Health and Social Care Levy announcement",
  "2022-09-23": "The mini-budget (Growth Plan)",
  "2022-11-17": "Autumn Statement 2022",
  "2023-03-15": "Spring Budget 2023",
  "2023-11-22": "Autumn Statement 2023",
  "2024-03-06": "Spring Budget 2024",
  "2024-10-30": "Autumn Budget 2024",
  "2025-11-26": "Autumn Budget 2025",
  "2026-07-21": "First announcements of the Burnham government",
};

// Dates we only know to the month (shown as the month alone).
export const APPROX = new Set(["2026-07-21"]);

export const eventName = (iso) =>
  EVENT_NAMES[iso] ?? `Budget, ${new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`;
