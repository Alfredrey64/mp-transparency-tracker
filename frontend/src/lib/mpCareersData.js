// The careers file (terms, posts, party changes for every MP), loaded once and kept, so a page that asks for it can start with it already in hand.
export let mpCareers = null;

export function loadMpCareers() {
  return import("../data/mpCareers.json").then((m) => { mpCareers = m.default.mps; return mpCareers; });
}
