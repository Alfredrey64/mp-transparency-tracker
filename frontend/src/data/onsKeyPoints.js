// The "key points" shown near the top of each Britain in numbers page: three or four plain
// sentences that say what the latest figures mean, filled in from the data so they stay current.
// `series` is the page's series the point is about (the chart it links to); see lib/onsKeyPoints.js
// for the {tokens}.

export const KEY_POINTS = {
  economy: [
    { series: "gdp-quarter", text: "The economy grew by {value} {when}, {change}. Two quarters in a row below zero is called a recession." },
    { series: "gdp-year", text: "Over a whole year, growth was {value} {when}. Growth is what pays for better public services and rising pay." },
    { series: "productivity", text: "Output per hour worked changed by {value} {when}. In the long run, pay can only rise as fast as this does." },
    { series: "investment-share", text: "Businesses spent {value} of the country's output on machinery, software and buildings {when}, {change}." },
  ],
  prices: [
    { series: "cpi", text: "The yearly rise in prices was {value} {when}, {change}. The Bank of England aims for 2%." },
    { series: "food", text: "Food prices are up {value} on a year earlier {when}." },
    { series: "energy", text: "Energy bills changed by {value} on a year earlier {when}." },
    { series: "rents", text: "Private rents are up {value} on a year earlier {when}." },
  ],
  jobs: [
    { series: "unemployment", text: "{value} of people who want a job do not have one {when}, {change}." },
    { series: "employment", text: "{value} of people aged 16 to 64 are in work {when}." },
    { series: "pay-real", text: "After inflation, pay changed by {value} {when}. Above zero means pay buys more than a year ago." },
    { series: "vacancies", text: "Employers had {value} job vacancies {when}." },
  ],
  publicFinances: [
    { series: "debt", text: "The national debt is {value} of the size of the economy {when}, {change}." },
    { series: "borrowing-12m", text: "Over the past 12 months the government borrowed {value} ({period}). Borrowing is spending more than it collects." },
    { series: "public-workers", text: "{value} people work in the public sector {when}." },
  ],
  population: [
    { series: "uk", text: "The UK had {value} people {when}." },
    { series: "uk-growth", text: "The population grew by {value} {when}, from births, deaths and people moving in and out." },
    { series: "england", text: "England is home to {value} people, about 85% of the UK." },
  ],
  health: [
    { series: "rtt-waiting", text: "The NHS waiting list in England stands at {value} {when}, {change}." },
    { series: "rtt-within-18", text: "{value} of people on the list have waited under 18 weeks {when}. The standard is 92%." },
    { series: "ae-4-hour", text: "{value} of people at A&E were seen within 4 hours {when}. The standard is 95%." },
    { series: "ambulance-c2", text: "Ambulances took {value} on average to reach emergencies such as strokes and heart attacks {when}. The standard is 18 minutes." },
  ],
  housing: [
    { series: "hpi-uk", text: "The average UK home costs {value} {when}, {change}." },
    { series: "homes-net", text: "England added {value} homes {when}. The 1.5 million homes pledge needs about 300,000 a year." },
    { series: "rents-rate", text: "Rents are up {value} on a year earlier {when}." },
  ],
  crime: [
    { series: "csew-all", text: "People in England and Wales experienced about {value} crimes {when}, {change}. This survey counts crimes that were never reported." },
    { series: "prc-all", text: "Police recorded {value} crimes {when}, {change}. This only counts crimes that were reported and recorded." },
    { series: "prc-homicide", text: "There were {value} homicides recorded {when}. Homicide is the most reliably counted crime." },
  ],
  trade: [
    { series: "trade-balance", text: "The UK's trade balance was {value} {when}. A negative number means we bought more from abroad than we sold." },
    { series: "exports", text: "The UK sold {value} of goods and services abroad {when}, {change}." },
  ],
  environment: [
    { series: "ghg", text: "The UK produced {value} of greenhouse gases {when}, {change}." },
    { series: "non-fossil-share", text: "{value} of the energy the UK uses comes from non-fossil sources {when}." },
  ],
  business: [
    { series: "manufacturing-growth", text: "Compared with a year earlier, factory output changed by {value} {when}. A minus sign means it shrank." },
    { series: "construction-growth", text: "Compared with a year earlier, building output changed by {value} {when}. A minus sign means it shrank." },
    { series: "online-share", text: "{value} of shopping is done online {when}, {change}." },
    { series: "online-sales", text: "People spent {value} online in an average week {when}, {change}." },
  ],
  tax: [
    { series: "receipts-12m", text: "The government collected {value} {when}, {change}." },
    { series: "income-tax-share", text: "{value} of everything it collects is income tax taken from pay {when}." },
    { series: "interest-share", text: "Interest on past borrowing takes {value} of everything collected {when}, before any new spending." },
    { series: "benefits-share", text: "{value} of public spending goes on benefits and pensions {when}." },
  ],
  rates: [
    { series: "bank-rate", text: "Bank Rate is {value} {when}, {change}. It sets the price of borrowing across the economy." },
    { series: "mortgage-2y", text: "The average two-year fixed mortgage rate is {value} {when}, {change}." },
    { series: "mortgage-approvals", text: "Lenders approved {value} mortgages to buy a home {when}, {change}." },
    { series: "usd", text: "One pound buys {value} {when}, {change}." },
  ],
  immigration: [
    { series: "migration-net", text: "Net migration (people arriving minus people leaving) was {value} {when}, {change}. It peaked at {peak} ({peakWhen})." },
    { series: "small-boats-12m", text: "{value} people arrived in small boats {when}, {change}." },
    { series: "asylum-awaiting", text: "{value} people were waiting for a first decision on their asylum claim {when}, {change}." },
    { series: "asylum-hotels", text: "{value} asylum seekers were living in hotels {when}, {change}." },
  ],
};
