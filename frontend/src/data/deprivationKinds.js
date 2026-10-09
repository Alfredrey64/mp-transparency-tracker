// The nations on the Deprivation page and the kinds of deprivation each one measures, with a plain-English line for each kind.

// [id, full name, short name for a narrow screen]
export const NATIONS = [
  ["uk", "Whole UK", "Whole UK"],
  ["england", "England", "England"],
  ["wales", "Wales", "Wales"],
  ["scotland", "Scotland", "Scotland"],
  ["northernireland", "Northern Ireland", "N. Ireland"],
];

const k = (id, label, note) => ({ id, label, note });

const IMD = (n) => k("imd", "Overall deprivation", n);

export const KINDS = {
  england: [
    IMD("All seven kinds below added together into one overall picture of how hard-pressed an area is."),
    k("income", "Income", "How many people are on a low income, including people who get benefits or tax credits."),
    k("employment", "Employment", "People who would like to work but can't, because of unemployment, illness, disability or caring."),
    k("education", "Education, skills and training", "Few qualifications, poor school results and low skills among adults."),
    k("health", "Health and disability", "People dying young, poor health (including mental health) and disability that gets in the way of daily life."),
    k("crime", "Crime", "How likely you are to be a victim of violence, burglary, theft or vandalism."),
    k("barriers", "Barriers to housing and services", "How hard it is to find a home you can afford, and how far away things like a GP and a school are."),
    k("living", "Living environment", "How good people's homes are (damp, disrepair, no central heating) and the quality of the air and roads outside."),
  ],
  wales: [
    IMD("All eight kinds below added together into one overall picture. Income and employment count for the most."),
    k("income", "Income", "How many people are on a low income, including people who get benefits or tax credits."),
    k("employment", "Employment", "People of working age who are out of work because of unemployment, illness, disability or caring."),
    k("health", "Health", "Early death, long-term illness, poor mental health and low birth weight."),
    k("education", "Education", "Few qualifications, children missing school and young people not in education, work or training."),
    k("access", "Access to services", "How far people live from a GP, a school, a shop, a library and public transport, and how good their broadband is."),
    k("housing", "Housing", "Overcrowding, poor housing conditions and homes without central heating."),
    k("safety", "Community safety", "How much crime and how many fires there are."),
    k("environment", "Physical environment", "Air quality, flood risk and how easy it is to reach green space."),
  ],
  scotland: [
    IMD("All seven kinds below added together into one overall picture. Income and employment count for the most."),
    k("income", "Income", "How many people are on a low income, including people who get benefits or tax credits."),
    k("employment", "Employment", "People of working age who are out of work because of unemployment, illness or disability."),
    k("education", "Education, skills and training", "Few qualifications, poor school attendance and results, and few young people going on to higher education."),
    k("health", "Health", "Early death, hospital stays, prescriptions for anxiety and depression, and low birth weight."),
    k("access", "Access to services", "How long it takes to drive or take a bus to a GP, a shop, a school and a post office, and how good broadband is."),
    k("crime", "Crime", "How often there is violence, break-ins, vandalism, drug offences and assault."),
    k("housing", "Housing", "Overcrowded homes and homes without central heating."),
  ],
  northernireland: [
    IMD("All seven kinds below added together into one overall picture. Income and employment count for the most."),
    k("income", "Income", "People living in households with less than 60% of the typical Northern Ireland income."),
    k("employment", "Employment", "People of working age who are out of work because of unemployment, illness, disability or caring."),
    k("health", "Health and disability", "Early death, poor physical and mental health, hospital admissions and long-term illness or disability."),
    k("education", "Education, skills and training", "Children with special needs or missing school, GCSE results, young people not in education or work, and adult qualifications."),
    k("access", "Access to services", "How far and how long it takes to reach a GP, a school or a shop, and how good broadband is."),
    k("living", "Living environment", "Poor or unfit housing, overcrowding, road defects and collisions, and flood risk."),
    k("crime", "Crime and disorder", "Violence, burglary, theft, vehicle crime and vandalism, plus deliberate fires and anti-social behaviour."),
  ],
};

// The six kinds every nation measures, so the whole-UK map can show them side by side.
KINDS.uk = [
  IMD("All the kinds each nation measures added together into one overall picture."),
  k("income", "Income", KINDS.england[1].note),
  k("employment", "Employment", KINDS.england[2].note),
  k("health", "Health", KINDS.england[4].note),
  k("education", "Education and skills", KINDS.england[3].note),
  k("crime", "Crime", KINDS.england[5].note),
];

// Keep the chosen kind when changing nation if the new nation measures it, otherwise fall back to the overall picture.
export const kindFor = (nation, id) => (KINDS[nation].some((x) => x.id === id) ? id : "imd");
