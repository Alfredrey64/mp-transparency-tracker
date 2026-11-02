// The Spending Review 2025 plans for each department (HM Treasury, June 2025, Tables 5.3 and 5.4): Resource DEL excluding depreciation (r) and Capital DEL (c) in
// £ billion at current prices, as [2025-26, 2028-29]. A department's total is its day-to-day plus its capital; High Speed 2, Sizewell C and the other lines of one
// department are added together, and local government and housing are the two lines of the Ministry of Housing, Communities and Local Government.
export const DEPARTMENT_ROWS = [
  { name: "Health and Social Care", short: "Health", r: [202.0, 232.0], c: [13.6, 14.8] },
  { name: "Education", short: "Education", r: [94.1, 101.5], c: [6.8, 7.7] },
  { name: "Defence", short: "Defence", r: [38.9, 42.0], c: [23.2, 31.5] },
  { name: "Scottish Government", short: "Scottish Government", r: [41.5, 45.0], c: [6.5, 7.1] },
  { name: "Welsh Government", short: "Welsh Government", r: [17.9, 19.4], c: [3.4, 3.5] },
  { name: "Northern Ireland Executive", short: "Northern Ireland Executive", r: [16.2, 17.3], c: [2.2, 2.4] },
  { name: "Housing, Communities and Local Government", short: "Housing and Local Government", r: [15.0 + 4.1, 15.8 + 4.2], c: [8.8, 9.2] },
  { name: "Home Office", short: "Home Office", r: [20.5, 20.6], c: [1.5, 1.7] },
  { name: "Transport", short: "Transport", r: [8.3, 7.5], c: [14.7 + 7.1, 18.3 + 5.6] },
  { name: "Science, Innovation and Technology", short: "Science and Technology", r: [0.6, 0.7], c: [14.7, 15.8] },
  { name: "Energy Security and Net Zero", short: "Energy and Net Zero", r: [1.9, 1.7], c: [9.4 + 2.7, 10.9 + 2.5] },
  { name: "Justice", short: "Justice", r: [11.9, 13.2], c: [2.0, 2.3] },
  { name: "Foreign, Commonwealth and Development Office", short: "Foreign Office", r: [8.4, 7.1], c: [3.7, 2.7] },
  { name: "Work and Pensions", short: "Work and Pensions", r: [10.2, 10.9], c: [0.7, 0.6] },
  { name: "Environment, Food and Rural Affairs", short: "Environment and Farming", r: [4.8, 4.7], c: [2.7, 2.8] },
  { name: "HM Revenue and Customs", short: "HM Revenue and Customs", r: [5.9, 6.4], c: [0.9, 0.5] },
].map((d) => ({ ...d, now: d.r[0] + d.c[0], later: d.r[1] + d.c[1] }));

export const DEPARTMENT_TOTAL = { r: [517.1, 567.8], c: [131.3, 149.1] };
