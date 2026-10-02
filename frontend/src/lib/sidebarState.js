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
