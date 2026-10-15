// What the Transport page says that is not in transportData.json (built by scripts/build-transport-data.mjs): where each figure comes from, and the facts about
// who runs trains and buses that are in statements and Acts of Parliament. Each is as the named body published it, with its date.

export const CHECKED = "15 October 2026";

export const SOURCES = {
  traffic: { label: "Department for Transport, Road traffic estimates in Great Britain: 2025", url: "https://www.gov.uk/government/statistics/road-traffic-estimates-in-great-britain-2025" },
  vehicles: { label: "Department for Transport, Vehicle licensing statistics data tables", url: "https://www.gov.uk/government/statistical-data-sets/vehicle-licensing-statistics-data-tables" },
  roads: { label: "Department for Transport, Road conditions in England to March 2026 (14 October 2026)", url: "https://www.gov.uk/government/statistics/road-conditions-in-england-to-march-2026" },
  deaths: { label: "Department for Transport, Road safety statistics: data tables (RAS0101)", url: "https://www.gov.uk/government/statistical-data-sets/road-safety-statistics-data-tables" },
  buses: { label: "Department for Transport, Bus statistics data tables", url: "https://www.gov.uk/government/statistical-data-sets/bus-statistics-data-tables" },
  railUsage: { label: "Office of Rail and Road, Passenger rail usage", url: "https://dataportal.orr.gov.uk/statistics/usage/passenger-rail-usage/" },
  railFinance: { label: "Office of Rail and Road, Rail industry finance: government support to the rail industry", url: "https://dataportal.orr.gov.uk/statistics/finance/rail-industry-finance/" },
  railFares: { label: "Office of Rail and Road, Rail fares: average change in fares", url: "https://dataportal.orr.gov.uk/statistics/finance/rail-fares/" },
  railPerformance: { label: "Office of Rail and Road, Passenger rail performance", url: "https://dataportal.orr.gov.uk/statistics/performance/passenger-rail-performance/" },
  population: { label: "ONS, Population estimates for the UK, England, Wales, Scotland and Northern Ireland: mid-2025", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/annualmidyearpopulationestimates/mid2025" },
  ghg: { label: "DESNZ, Final UK greenhouse gas emissions statistics: 1990 to 2024", url: "https://www.gov.uk/government/statistics/final-uk-greenhouse-gas-emissions-statistics-1990-to-2024" },
  railOwnership: { label: "GOV.UK, Transfer of Chiltern Railways services into public ownership (written statement, September 2026)", url: "https://www.gov.uk/government/speeches/transfer-of-chiltern-railways-services-into-public-ownership" },
  busAct: { label: "legislation.gov.uk, Bus Services Act 2025", url: "https://www.legislation.gov.uk/ukpga/2025/24" },
};

// Facts from statements and Acts, as published.
export const RAIL_OWNERSHIP = { publicOf: 10, operators: 14, transferred: "20 September 2026", operator: "Chiltern Railways", completion: "the end of 2027" };
export const BUS_ACT = { name: "Bus Services Act 2025", assent: "27 October 2025", franchising: "26 January 2026" };
