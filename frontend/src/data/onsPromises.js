// Which of the government's pledges (see promises.js) go with each Britain in numbers page, and,
// where a pledge can be measured by one of the series on the page, how to measure it.
//
// measure: { series, mode, target?, targetText }
//   mode "atLeast": the pledge is met when the figure reaches `target`
//   mode "atMost":  the pledge is met when the figure falls to `target` or below
//   mode "peak":    the pledge is to bring the figure down, shown against its highest point
// `promise` must match a pledge's text in promises.js exactly.

export const SECTOR_PROMISES = {
  health: [
    { promise: "Meet the NHS 18-week waiting time standard", measure: { series: "rtt-within-18", mode: "atLeast", target: 92, targetText: "the 92% standard" } },
    { promise: "40,000 additional NHS appointments every week" },
    { promise: "Double the number of NHS CT and MRI scanners" },
    { promise: "700,000 more urgent dental appointments" },
    { promise: "Recruit 8,500 additional mental health staff" },
    { promise: "A National Care Service for England" },
  ],
  immigration: [
    { promise: "Reduce net migration", measure: { series: "migration-net", mode: "peak" } },
    { promise: "Close hotels used to house asylum seekers", measure: { series: "asylum-hotels", mode: "atMost", target: 0, targetText: "its goal of zero" } },
    { promise: "Create a Border Security Command" },
    { promise: "End the Rwanda removals partnership" },
    { promise: "Add 1,000 returns-enforcement staff" },
  ],
  housing: [
    { promise: "Build 1.5 million new homes in England", measure: { series: "homes-net", mode: "atLeast", target: 300000, targetText: "the 300,000 a year needed to reach 1.5 million in five years" } },
    { promise: "Restore mandatory local housing targets" },
    { promise: "Abolish Section 21 \"no-fault\" evictions" },
    { promise: "End rough sleeping" },
  ],
  tax: [
    { promise: "No tax rises on \"working people\" (income tax, NI, VAT)" },
    { promise: "No income tax rate increases" },
    { promise: "Cap Corporation Tax at 25% for the parliament" },
    { promise: "Abolish non-dom tax status" },
    { promise: "One major fiscal event (Budget) per year" },
    { promise: "Set up a National Wealth Fund capitalised with £7.3bn" },
  ],
  environment: [
    { promise: "Set up Great British Energy, a publicly-owned energy company" },
    { promise: "Capitalise Great British Energy with £8.3bn" },
    { promise: "No new North Sea oil and gas exploration licences" },
    { promise: "Halve sewage pollution from water companies" },
  ],
};
