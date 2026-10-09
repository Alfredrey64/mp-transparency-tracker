// The government's pledges and how they are going, as assessed by Full Fact's independent,
// non-partisan Government Tracker (fullfact.org/government-tracker), which looks at Labour's
// 2024 manifesto pledges plus later commitments. We did not judge these ourselves: we cite Full
// Fact's verdicts as of when we last checked. This is a curated subset of their ~94 tracked
// pledges, chosen to span every major policy area rather than cherry-pick a flattering sample.
//
// Shared by the Promises tracker page and the Britain in numbers pages, which show the
// pledges that go with each set of figures.

export const LAST_CHECKED = "September 2026";
export const SOURCE_URL = "https://fullfact.org/government-tracker/";

export const STATUS = {
  achieved: { label: "Achieved", color: "#2F6F4E", icon: "check" },
  on_track: { label: "On track", color: "#0D8A7A", icon: "check" },
  in_progress: { label: "In progress", color: "#B08A2E", icon: "clock" },
  wait_see: { label: "Too early to tell", color: "#6B7280", icon: "clock" },
  off_track: { label: "Off track", color: "#C1622E", icon: "warning" },
  not_kept: { label: "Not kept", color: "#9C3B3B", icon: "cross" },
  disputed: { label: "Disputed", color: "#6B5B95", icon: "question" },
};

export const CATEGORIES = [
  {
    name: "Economy & Tax",
    pledges: [
      {
        promise: "No tax rises on \"working people\" (income tax, NI, VAT)",
        status: "not_kept",
        reality: "Employer National Insurance was raised in the October 2024 Budget. Income tax and employee NI rates themselves haven't risen, and VAT wasn't raised, but Full Fact rates the broad promise as not kept overall.",
      },
      {
        promise: "Cap Corporation Tax at 25% for the parliament",
        status: "on_track",
        reality: "The rate has been held at 25% throughout.",
      },
      {
        promise: "Set up a National Wealth Fund capitalised with £7.3bn",
        status: "off_track",
        reality: "The fund itself was established and is investing, but its capital came in below the promised £7.3bn figure. Full Fact rates the funding pledge specifically as not kept.",
      },
      {
        promise: "Abolish non-dom tax status",
        status: "achieved",
        reality: "The regime was abolished and replaced with a new residence-based tax scheme, as promised.",
      },
      {
        promise: "One major fiscal event (Budget) per year",
        status: "on_track",
        reality: "The government has stuck to a single annual Budget so far, giving businesses the predictability promised.",
      },
    ],
  },
  {
    name: "Health & Social Care",
    pledges: [
      {
        promise: "40,000 additional NHS appointments every week",
        status: "achieved",
        reality: "Full Fact confirms this numerical target has been met.",
      },
      {
        promise: "Meet the NHS 18-week waiting time standard",
        status: "in_progress",
        reality: "Performance is improving gradually but the standard itself has not yet been met.",
      },
      {
        promise: "Double the number of NHS CT and MRI scanners",
        status: "off_track",
        reality: "New scanner capacity is being added, but slower than the pace originally promised.",
      },
      {
        promise: "700,000 more urgent dental appointments",
        status: "in_progress",
        reality: "Appointment slots are being added but the full total isn't reached yet.",
      },
      {
        promise: "A National Care Service for England",
        status: "wait_see",
        reality: "This is a long-term structural reform; an independent commission is still working through recommendations.",
      },
      {
        promise: "Recruit 8,500 additional mental health staff",
        status: "on_track",
        reality: "Recruitment is progressing against this target.",
      },
    ],
  },
  {
    name: "Immigration & Borders",
    pledges: [
      {
        promise: "Create a Border Security Command",
        status: "achieved",
        reality: "The command has been established with the promised counter-terror-style powers against smuggling gangs.",
      },
      {
        promise: "End the Rwanda removals partnership",
        status: "achieved",
        reality: "The scheme was cancelled, as promised, shortly after taking office.",
      },
      {
        promise: "Close hotels used to house asylum seekers",
        status: "off_track",
        reality: "The transition away from hotel accommodation is underway but well behind the pace needed, per Full Fact.",
      },
      {
        promise: "Add 1,000 returns-enforcement staff",
        status: "not_kept",
        reality: "Staffing levels for this specific pledge fell short of the target.",
      },
      {
        promise: "Reduce net migration",
        status: "on_track",
        reality: "Migration figures are on a declining trend, per the latest official statistics Full Fact reviewed.",
      },
    ],
  },
  {
    name: "Energy & Environment",
    pledges: [
      {
        promise: "Set up Great British Energy, a publicly-owned energy company",
        status: "achieved",
        reality: "The company has been legally established and is operational.",
      },
      {
        promise: "Capitalise Great British Energy with £8.3bn",
        status: "in_progress",
        reality: "Funding is being phased in over the parliament rather than delivered upfront.",
      },
      {
        promise: "No new North Sea oil and gas exploration licences",
        status: "on_track",
        reality: "The policy has been maintained since taking office.",
      },
      {
        promise: "Halve sewage pollution from water companies",
        status: "wait_see",
        reality: "This is a decade-long target, too early in the parliament for a meaningful assessment.",
      },
    ],
  },
  {
    name: "Housing",
    pledges: [
      {
        promise: "Build 1.5 million new homes in England",
        status: "off_track",
        reality: "Planning rules were reformed as promised, but actual housebuilding numbers are running behind the pace needed to hit the target.",
      },
      {
        promise: "Restore mandatory local housing targets",
        status: "achieved",
        reality: "The planning policy framework was updated to reinstate mandatory targets.",
      },
      {
        promise: "Abolish Section 21 \"no-fault\" evictions",
        status: "achieved",
        reality: "The relevant legislation has passed, banning this eviction method.",
      },
      {
        promise: "End rough sleeping",
        status: "wait_see",
        reality: "Programme is in its early stages; too soon for Full Fact to assess delivery.",
      },
    ],
  },
  {
    name: "Education",
    pledges: [
      {
        promise: "Add VAT and business rates to private school fees",
        status: "achieved",
        reality: "VAT and business rates relief were removed from private schools, with revenue earmarked for state education.",
      },
      {
        promise: "Recruit 6,500 new expert teachers",
        status: "on_track",
        reality: "Hiring is progressing toward this target.",
      },
      {
        promise: "Free breakfast clubs in every primary school",
        status: "in_progress",
        reality: "Rollout is underway but not yet universal.",
      },
    ],
  },
  {
    name: "Democracy & Constitution",
    pledges: [
      {
        promise: "Remove the right of hereditary peers to sit in the Lords",
        status: "achieved",
        reality: "Legislation removing this right has passed.",
      },
      {
        promise: "Votes at 16 for UK elections",
        status: "on_track",
        reality: "The legislative framework is being put in place.",
      },
      {
        promise: "No income tax rate increases",
        status: "disputed",
        reality: "Full Fact flags this as disputed. It depends on a technical reading of frozen thresholds versus headline rates, which different sides interpret differently.",
      },
    ],
  },
];


// Every pledge with the area it was filed under.
export const ALL_PLEDGES = CATEGORIES.flatMap((c) => c.pledges.map((p) => ({ ...p, category: c.name })));

export const pledgeByPromise = (text) => ALL_PLEDGES.find((p) => p.promise === text) ?? null;
