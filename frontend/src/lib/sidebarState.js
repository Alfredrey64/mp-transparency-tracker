// Which sidebar sections the visitor has explicitly opened or closed.
// Anything they haven't touched follows a simple default: open if it
// contains the page they're on, closed otherwise. Kept in the browser only,
// and safe if storage is blocked.

const KEY = "mpTracker.sidebarSections.v1";

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readSectionChoices(storage = defaultStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(KEY) ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => typeof v === "boolean"));
  } catch {
    return {};
  }
}

export function writeSectionChoices(choices, storage = defaultStorage()) {
  try {
    storage?.setItem(KEY, JSON.stringify(choices));
  } catch {
    /* blocked or full: the sidebar still works, it just forgets */
  }
}

// choices: { [sectionKey]: boolean }; contains: whether the section holds
// the active page.
export function isSectionOpen(choices, key, contains) {
  return key in choices ? choices[key] : contains;
}

// The menu has two views: "simple" shows the dozen pages most people want,
// "all" shows every page. A first-time visitor starts on simple, and whichever
// they pick is remembered.
const MODE_KEY = "mpTracker.sidebarMode.v1";

export function readSidebarMode(storage = defaultStorage()) {
  try {
    const v = storage?.getItem(MODE_KEY);
    return v === "all" ? "all" : "simple";
  } catch {
    return "simple";
  }
}

export function writeSidebarMode(mode, storage = defaultStorage()) {
  try {
    storage?.setItem(MODE_KEY, mode === "all" ? "all" : "simple");
  } catch {
    /* blocked or full: the choice just isn't remembered */
  }
}

// The sections to draw for a mode: in the simple view only the pages marked
// essential, plus whichever page you are on (so you never lose your place),
// and no section left empty. In the full view everything.
export function sectionsForMode(sections, mode, activeView) {
  const base = sections.map((s) => ({ ...s, items: s.items.filter((i) => i.key !== "start") }));
  if (mode === "all") return base;
  return base
    .map((s) => ({ ...s, items: s.items.filter((i) => i.essential || i.key === activeView) }))
    .filter((s) => s.items.length > 0);
}

// Whether a section starts open. A choice the visitor made wins; otherwise the
// simple view opens every section (each is short) and the full view opens only
// the one holding the page you are on.
export function sectionStartsOpen(choices, key, mode, containsActive) {
  if (key in choices) return choices[key];
  return mode === "simple" ? true : containsActive;
}
