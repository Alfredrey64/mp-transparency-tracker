import { SECTIONS, collapseItems, hubLead } from "./sidebarSections";

// The top menu: five headings, each opening a panel that holds one or two of the page groups in sidebarSections.js. The groups are the same
// ones the page headers, the search and the phone menu use, so a page is always found under the same name.
export const MENU_GROUPS = [
  { key: "learn", label: "Learn", sections: ["learn", "history"] },
  { key: "area", label: "Your area", sections: ["involved", "elections"] },
  { key: "parliament", label: "Parliament", sections: ["government", "accountability"] },
  { key: "money", label: "Money", sections: ["money", "gaps"] },
  { key: "numbers", label: "Britain in numbers", sections: ["country"] },
];

const byKey = new Map(SECTIONS.map((s) => [s.key, s]));

// Each menu heading with its page groups filled in (the tour page has its own button, and Teacher mode has its own tile at the foot of the menu).
export const MENU = MENU_GROUPS.map((g) => ({
  ...g,
  groups: g.sections.map((k) => byKey.get(k)).filter(Boolean).map((s) => ({ ...s, items: collapseItems(s.items.filter((i) => i.key !== "start" && !i.standalone)) })),
}));

// Which menu heading holds a page, or null.
export const menuKeyFor = (view) => MENU.find((m) => m.groups.some((s) => s.items.some((i) => i.key === hubLead(view))))?.key ?? null;

export const pathFor = (key) => (key === "home" ? "/" : `/${key}`);

export const FOOTER_LINKS = [
  { key: "methodology", label: "Where our data comes from" },
  { key: "settings", label: "Settings" },
  { key: "privacy", label: "Privacy" },
  { key: "terms", label: "Terms" },
  { key: "accessibility", label: "Accessibility" },
  { key: "whatsnew", label: "What's new" },
];

// The three columns of links in the page footer.
export const FOOTER_COLUMNS = [
  { title: "Start here", links: [["start", "Take the guided tour"], ["answers", "Ask a question"], ["howitworks", "How Parliament works"], ["glossary", "Jargon buster"], ["numbers", "Parliament in numbers"]] },
  { title: "Your area", links: [["myMP", "Find your MP"], ["myArea", "Your area"], ["constituency", "Your constituency"], ["councils", "Your council"], ["councillors", "Your councillors"], ["thisWeek", "What changed this week"], ["generalElection", "General elections"], ["howtovote", "How to vote"]] },
  { title: "About", links: [["methodology", "Where our data comes from"], ["settings", "Settings"], ["privacy", "Privacy"], ["terms", "Terms"], ["accessibility", "Accessibility"], ["whatsnew", "What's new"], ["teacher", "Teacher mode"], ["funding", "Funding and independence"]] },
];

// The short list at the foot of the phone menu, as [page, name]. The header gives each its icon.
export const DRAWER_FOOT = [
  ["watchlist", "My watchlist"], ["methodology", "Where our data comes from"], ["settings", "Settings"], ["privacy", "Privacy"], ["terms", "Terms"], ["accessibility", "Accessibility"], ["teacher", "Teacher mode"],
];
