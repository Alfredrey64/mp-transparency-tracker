// What the Health and NHS page says that is not in healthData.json (built by scripts/build-health-data.mjs): where each figure comes from, the targets
// the NHS works to, and the arguments. Targets are written as NHS England publishes them.

export const CHECKED = "15 October 2026";

export const SOURCES = {
  rtt: { label: "NHS England, Consultant-led Referral to Treatment waiting times", url: "https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/" },
  ae: { label: "NHS England, A&E waiting times and activity", url: "https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/" },
  ambulance: { label: "NHS England, Ambulance quality indicators", url: "https://www.england.nhs.uk/statistics/statistical-work-areas/ambulance-quality-indicators/" },
  cancer: { label: "NHS England, Cancer waiting times", url: "https://www.england.nhs.uk/statistics/statistical-work-areas/cancer-waiting-times/" },
  staff: { label: "ONS, Public sector employment: NHS (full-time equivalent)", url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/publicsectorpersonnel/bulletins/publicsectoremployment/latest" },
  sick: { label: "ONS, Economic inactivity: long-term sickness (Labour Force Survey)", url: "https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/economicinactivity/bulletins/economicinactivity/latest" },
  population: { label: "ONS, Population estimates for the UK, England, Wales, Scotland and Northern Ireland: mid-2025", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/annualmidyearpopulationestimates/mid2025" },
  worldBank: { label: "World Bank, World Development Indicators (health spending from the WHO Global Health Expenditure Database; doctors, nurses and hospital beds from the OECD and WHO)", url: "https://databank.worldbank.org/source/world-development-indicators" },
  obr: { label: "Office for Budget Responsibility, A brief guide to the public finances (2025-26 spending)", url: "https://obr.uk/forecasts-in-depth/brief-guides-and-explainers/public-finances/" },
};

// The standards the NHS measures itself against, as percentages (minutes for the ambulance standard).
export const STANDARDS = {
  rtt18: { value: 92, label: "Treatment within 18 weeks", note: "The NHS standard is that 92% of people waiting are within 18 weeks. An interim target of 65% by March 2026 was set on the way there." },
  ae4: { value: 95, label: "A&E within four hours", note: "The NHS standard is that 95% of people are admitted, transferred or discharged within four hours." },
  cancer62: { value: 85, label: "Cancer treatment within 62 days of an urgent referral", note: "The standard is 85%." },
  cancer31: { value: 96, label: "Cancer treatment within 31 days of the decision to treat", note: "The standard is 96%." },
  cancer28: { value: 80, label: "Cancer diagnosed or ruled out within 28 days", note: "The faster diagnosis target is 80%." },
  ambCat2: { value: 18, label: "Ambulance, emergency calls (category 2)", note: "The standard is an average response of 18 minutes. The NHS set itself a 30-minute target for 2025/26 on the way there." },
  ambCat1: { value: 7, label: "Ambulance, life-threatening calls (category 1)", note: "The standard is an average response of 7 minutes." },
};
