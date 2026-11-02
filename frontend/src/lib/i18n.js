// The site is in English only for now. A Welsh (Cymraeg) version was built and taken out again until it can be checked by a fluent Welsh speaker (it is in the git history).
// What stays is the small layer the pages already use: t("words") gives the words back (with {name} markers filled in), and dateLocale() gives the date format, so a
// language can be put back without touching every page.

export const clean = () => "en";

// Swaps {name} markers for values, so one sentence with {n} in it serves every count.
export function fill(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (Object.hasOwn(vars, k) ? String(vars[k]) : m));
}

export const t = (text, vars) => fill(text, vars);
export const getLang = () => "en";
export const isWelsh = () => false;
export const dateLocale = () => "en-GB";
export const subscribe = () => () => {};
export const getVersion = () => 0;
