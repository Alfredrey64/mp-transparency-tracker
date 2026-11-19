// The two views of the Your area page. "Politics" is who represents you and what is coming up; "In numbers" is every statistic about the place. The view is kept in the address
// (#/myArea/numbers) so a link opens straight to it.

export const POLITICS_JUMPS = [["ma-week", "Your week"], ["ma-mp", "MP and seat"], ["ma-council", "Council"], ["ma-vote", "Elections"], ["ma-act", "Get help"]];
export const NUMBERS_JUMPS = [["ma-n-hood", "Neighbourhood"], ["ma-n-money", "Money and jobs"], ["ma-n-council", "Council"], ["ma-n-health", "Health"], ["ma-n-school", "Schools"], ["ma-n-crime", "Crime"], ["ma-n-water", "Water"], ["ma-n-region", "Region"]];

export const VIEWS = [
  { key: "politics", title: "Politics", sub: "Your MP, council, elections and what to do" },
  { key: "numbers", title: "In numbers", sub: "Health, schools, crime, water, money and more" },
];

export const viewOf = (param) => (param === "numbers" ? "numbers" : "politics");
export const pathOf = (view) => (view === "numbers" ? "/myArea/numbers" : "/myArea");
