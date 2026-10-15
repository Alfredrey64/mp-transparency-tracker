// What the Devolution and the union page says that is not in devolutionData.json (built by scripts/build-devolution-data.mjs): where each figure comes
// from, the 2014 referendum result and the 2022 court ruling, and the English devolution Act. Each is as the named body published it, with its date.

export const CHECKED = "15 October 2026";

export const SOURCES = {
  cra: { label: "HM Treasury, Country and regional analysis: 2025 (19 November 2025)", url: "https://www.gov.uk/government/statistics/country-and-regional-analysis-2025" },
  fiscal: { label: "ONS, Country and regional public sector finances: net fiscal balance tables, financial year ending 2025 (26 May 2026)", url: "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/datasets/countryandregionalpublicsectorfinancesnetfiscalbalancetables" },
  gdp: { label: "ONS, Regional economic activity by gross domestic product, UK: 1998 to 2024 (15 April 2026)", url: "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/regionaleconomicactivitybygrossdomesticproductuk/1998to2024" },
  scotlandAct: { label: "legislation.gov.uk, Scotland Act 1998", url: "https://www.legislation.gov.uk/ukpga/1998/46/contents" },
  walesAct: { label: "legislation.gov.uk, Wales Act 2017", url: "https://www.legislation.gov.uk/ukpga/2017/4/contents" },
  niAct: { label: "legislation.gov.uk, Northern Ireland Act 1998", url: "https://www.legislation.gov.uk/ukpga/1998/47/contents" },
  taxExplainer: { label: "Institute for Government, Tax and devolution", url: "https://www.instituteforgovernment.org.uk/explainers/tax-and-devolution" },
  englandAct: { label: "legislation.gov.uk, English Devolution and Community Empowerment Act 2026", url: "https://www.legislation.gov.uk/ukpga/2026/23" },
  referendum: { label: "Wikipedia, 2014 Scottish independence referendum", url: "https://en.wikipedia.org/wiki/2014_Scottish_independence_referendum" },
  funding: { label: "HM Treasury, Block Grant Transparency: October 2025 explanatory note", url: "https://www.gov.uk/government/publications/block-grant-transparency-october-2025/block-grant-transparency-october-2025-explanatory-note" },
  ruling: { label: "UK Supreme Court, Reference by the Lord Advocate of devolution issues (23 November 2022)", url: "https://www.supremecourt.uk/cases/uksc-2022-0098" },
};

// Facts, as published.
export const REFERENDUM_2014 = { date: "18 September 2014", no: 2001926, yes: 1617989, noPct: 55.3, turnout: 84.6 };
export const RULING = { date: "23 November 2022", text: "The Supreme Court ruled unanimously that the Scottish Parliament cannot legislate for a referendum on independence without the agreement of the UK Parliament, because the future of the UK is a reserved matter." };
export const ENGLAND_ACT = { name: "English Devolution and Community Empowerment Act 2026", assent: "29 April 2026" };
