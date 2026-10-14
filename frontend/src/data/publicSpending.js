// How the government plans to spend money in 2025-26, by category. Shared by the Where taxes go page and the pay calculator.
// Figures are for 2025-26 (the most recent year with published headline
// totals at the time this was written), drawn from the OBR's "brief guide
// to the public finances" and, for the Welfare & Pensions split, Full
// Fact's benefit-spending breakdown. This is a curated snapshot of
// well-sourced headline totals, not a live feed — it needs updating by
// hand whenever a new Budget or Spending Review resets these numbers.
// "Other departmental spending" and "Other annually managed expenditure"
// are our own arithmetic remainders (total minus the named categories
// above), not individually published lines. The "breakdown" bullets and
// "didYouKnow" lines are qualitative context, not additional precise
// figures — we don't have confidently-sourced sub-totals for those.
export const TOTAL_BN = 1368;
export const PER_HOUSEHOLD = 48000;

export const CATEGORIES = [
  {
    key: "welfare",
    label: "Welfare & Pensions",
    amountBn: 334,
    color: "#B0473E",
    summary: "The single biggest slice of the budget, benefits and pensions paid directly to individuals.",
    detail:
      "The State Pension alone accounts for roughly £146bn of this: more than any other individual benefit. The rest covers Universal Credit and other working-age support, and disability and incapacity benefits.",
    breakdown: ["State Pension: the largest single benefit, around £146bn", "Universal Credit and other working-age support", "Disability and incapacity benefits", "Housing support and other benefits"],
    didYouKnow: "Bigger than the entire Health budget, welfare and pensions alone account for roughly a quarter of everything the government spends.",
  },
  {
    key: "health",
    label: "Health",
    amountBn: 204,
    color: "#2F6F4E",
    summary: "Day-to-day running costs for the NHS and the rest of the health budget.",
    detail:
      "The large majority goes to NHS England, hospitals, GPs, mental health services, and community care. Building new hospitals counts separately, as capital investment.",
    breakdown: ["NHS England, hospitals, GPs, mental health, community care", "Public health and health protection", "Department of Health & Social Care running costs"],
    didYouKnow: "Health spending has roughly doubled in cash terms over the past 15 years, driven by an ageing population and rising treatment costs.",
  },
  {
    key: "otherAme",
    label: "Other Annually Managed Spending",
    amountBn: 245,
    color: "#8A6D3B",
    summary: "Demand-led spending that isn't fixed in advance, outside welfare and debt interest.",
    detail:
      "Mostly public sector pensions paid to retired teachers, NHS staff, civil servants and the armed forces, plus a number of smaller items that move with need rather than a fixed departmental budget.",
    breakdown: ["Public sector pensions for retired teachers, NHS staff, civil servants and the armed forces", "Locally financed council spending", "A range of smaller demand-led items"],
    didYouKnow: "Unlike departmental budgets, this spending isn't capped in advance. It's forecast, and can rise or fall depending on demand.",
  },
  {
    key: "otherDept",
    label: "Other Departmental Spending",
    amountBn: 185,
    color: "#3C6E8F",
    summary: "Day-to-day running costs for every department other than health, education and defence.",
    detail:
      "Policing, courts and prisons, local government funding, the Home Office, diplomacy and international aid, and every other department's staff and running costs.",
    breakdown: ["Home Office, policing and borders", "Ministry of Justice, courts and prisons", "Local government funding", "Foreign, Commonwealth & Development Office"],
    didYouKnow: "This one catch-all category is actually bigger than the entire Education or Defence budgets: a reminder of just how many departments share it.",
  },
  {
    key: "capital",
    label: "Capital Investment",
    amountBn: 157,
    color: "#6B5B95",
    summary: "Money spent building or buying things, rather than running services day to day.",
    detail:
      "New roads, hospitals, schools and military equipment, plus loans such as student finance. This is the budget for assets that last for years, not this year's running costs.",
    breakdown: ["Transport infrastructure, roads and rail", "New NHS and school buildings", "Student loans", "Defence equipment procurement"],
    didYouKnow: "Capital spending is usually the easiest budget to cut in a squeeze, and the easiest to regret cutting, since the cost shows up years later in worn-out infrastructure.",
  },
  {
    key: "debt",
    label: "Debt Interest",
    amountBn: 110,
    color: "#7A7A7A",
    summary: "Interest paid on the government's accumulated borrowing.",
    detail:
      "Not a public service. This is the cost of past deficits. It moves with interest rates and the size of the national debt, not with any policy choice about services.",
    breakdown: ["Interest on government bonds (gilts)", "A meaningful share is index-linked, so it moves directly with inflation"],
    didYouKnow: "Debt interest now costs more than the entire Education budget: a legacy of borrowing since the 2008 financial crisis and the pandemic.",
  },
  {
    key: "education",
    label: "Education",
    amountBn: 95,
    color: "#B08A2E",
    summary: "Day-to-day running costs for schools, colleges and universities.",
    detail:
      "Covers teaching and running costs across the education system. New school buildings count separately, as capital investment.",
    breakdown: ["Schools", "Further education and skills", "Higher education, net of loan write-offs"],
    didYouKnow: "Only around 7p in every £1 the government spends goes on education.",
  },
  {
    key: "defence",
    label: "Defence",
    amountBn: 39,
    color: "#4A5A6A",
    summary: "Day-to-day running costs of the armed forces.",
    detail:
      "Salaries, training and maintaining existing equipment. Buying new equipment (ships, jets, vehicles) is largely capital spending, counted separately.",
    breakdown: ["Armed forces personnel and training", "Running and maintaining existing equipment", "New equipment is counted separately, as capital spending"],
    didYouKnow: "The government has committed to raising defence spending as a share of national income over the coming years.",
  },
];
