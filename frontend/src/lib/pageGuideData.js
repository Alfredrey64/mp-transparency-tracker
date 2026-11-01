// The text of the "What you're looking at" boxes, loaded once and kept. App asks for it the moment a page change starts, so by the time a page is drawn its box
// already has its words and does not pop in afterwards.
export let pageGuideData = null;

export function loadPageGuides() {
  return import("../data/pageGuides").then((m) => { pageGuideData = m; return m; });
}

export function guideFor(m, viewKey) {
  return m.PAGE_GUIDES[m.GUIDE_ALIASES[viewKey] ?? viewKey] ?? null;
}
