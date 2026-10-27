// Which language the site speaks. English is the default and is written straight into the pages. Welsh (Cymraeg) is a dictionary keyed by the English
// sentence: t("Your postcode") gives "Eich cod post" when Welsh is on and the dictionary has it, and the English words in every other case, so a sentence
// nobody has translated yet shows in English and never as a blank or a key. The dictionary is a separate chunk that is only downloaded once Welsh is chosen.
// The choice is kept on the visitor's own device, or set for a visit with ?lang=cy in a link. Nothing here is sent anywhere.

export const KEY = "simple-politics-lang";
export const LANGS = ["en", "cy"];
export const LANG_NAMES = { en: "English", cy: "Cymraeg" };

export const clean = (v) => (v === "cy" ? "cy" : "en");

// The language to start in: ?lang=cy or ?lang=en in the address wins (so a link can open the Welsh site), then the saved choice, then English.
export function initialLang(search = "", storage) {
  try {
    const q = new URLSearchParams(search).get("lang");
    if (q === "cy" || q === "en") return q;
  } catch {
    // An unreadable address just means no choice was made in it.
  }
  try {
    const s = storage ?? window.localStorage;
    return clean(s.getItem(KEY));
  } catch {
    return "en";
  }
}

// Swaps {name} markers for values. Welsh puts a singular noun after a number ("5 diwrnod"), so one sentence with {n} in it serves every count.
export function fill(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (Object.hasOwn(vars, k) ? String(vars[k]) : m));
}

// The words for `text` in a dictionary, or the English if there are none. Pure, so it is easy to test.
export function translate(words, text, vars) {
  const base = words && Object.hasOwn(words, text) && typeof words[text] === "string" && words[text] ? words[text] : text;
  return fill(base, vars);
}

const state = { lang: "en", words: null, ver: 0 };
const listeners = new Set();
const tell = () => { state.ver += 1; listeners.forEach((fn) => fn()); };

export const getLang = () => state.lang;
export const isWelsh = () => state.lang === "cy";
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getVersion = () => state.ver;
export const t = (text, vars) => translate(state.lang === "cy" ? state.words : null, text, vars);

// Dates and numbers follow the language, so "27 October 2026" becomes "27 Hydref 2026".
export const dateLocale = () => (state.lang === "cy" ? "cy-GB" : "en-GB");

let loading = null;
async function loadWords() {
  if (state.words) return;
  loading ??= import("../i18n/cy/index.js").then((m) => { state.words = m.default; }).catch(() => { loading = null; });
  await loading;
}

function mark(lang) {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export async function setLang(lang, storage) {
  const next = clean(lang);
  try {
    const s = storage ?? window.localStorage;
    if (next === "en") s.removeItem(KEY); else s.setItem(KEY, next);
  } catch {
    // The choice still applies for this visit even if it cannot be kept.
  }
  if (next === "cy") await loadWords();
  state.lang = next;
  mark(next);
  tell();
}

// Called once when the page starts.
export function start(search = typeof window === "undefined" ? "" : window.location.search, storage) {
  const lang = initialLang(search, storage);
  if (lang === "en") { mark("en"); return Promise.resolve(); }
  return setLang("cy", storage);
}
