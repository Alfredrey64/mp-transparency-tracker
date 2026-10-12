// The bigger data files of the General elections page, loaded the first time they are needed and kept.
let constituencies = null;
let book = null;
let margins = null;

export const loadConstituencies = () => (constituencies ??= import("../data/constituencies.json").then((m) => m.default.constituencies));
export const loadSeatBook = () => (book ??= import("../data/electionSeatNames.json").then((m) => m.default));
export const loadMargins = () => (margins ??= import("../data/electionMargins.json").then((m) => m.default));
