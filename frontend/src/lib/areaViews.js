// The two views of the Your area page. "Politics" is who represents you and what is coming up; "In numbers" is every statistic about the place. The view is kept in the address
// (#/myArea/numbers) so a link opens straight to it.

export const POLITICS_JUMPS = [["ma-week", "Your week"], ["ma-mp", "MP and seat"], ["ma-council", "Council"], ["ma-vote", "Elections"], ["ma-act", "Get help"]];
// The numbers view is read top to bottom in four parts, each a short run of sections: the place itself, the money in it, the services around it, then safety and the
// environment. `sections` are [id, label] pairs for the links inside each part; `icon` names an icon the page draws.
export const NUMBER_GROUPS = [
  { id: "ma-g-place", n: 1, title: "The place", short: "The place", icon: "place", colour: "#C0478A", lede: "Where you live, and how it and your region compare with the rest of the country.", sections: [["ma-n-hood", "Your neighbourhood"], ["ma-n-region", "Your region"]] },
  { id: "ma-g-money", n: 2, title: "Money", short: "Money", icon: "money", colour: "#E8741A", lede: "What people earn and claim here, and what you pay your council.", sections: [["ma-n-money", "Jobs, pay and council tax"]] },
  { id: "ma-g-services", n: 3, title: "Services", short: "Services", icon: "services", colour: "#2F8F6B", lede: "The doctors, hospitals and schools nearby, and what your council does with its roads and its rules.", sections: [["ma-n-health", "Health"], ["ma-n-school", "Schools"], ["ma-n-council", "Your council"]] },
  { id: "ma-g-safety", n: 4, title: "Safety and the environment", short: "Safety and water", icon: "safety", colour: "#2C7DA0", lede: "Crime recorded near you, and the sewage and bathing water in your area.", sections: [["ma-n-crime", "Crime"], ["ma-n-water", "Water"]] },
];
export const NUMBERS_JUMPS = NUMBER_GROUPS.map((g) => [g.id, `${g.n}. ${g.short}`]);

export const VIEWS = [
  { key: "politics", title: "Politics", sub: "Your MP, council, elections and what to do" },
  { key: "numbers", title: "In numbers", sub: "Health, schools, crime, water, money and more" },
];

export const viewOf = (param) => (param === "numbers" ? "numbers" : "politics");
export const pathOf = (view) => (view === "numbers" ? "/myArea/numbers" : "/myArea");
