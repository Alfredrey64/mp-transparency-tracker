// How a visitor likes the site to look, kept on their own device. It covers text size, a more readable typeface, roomier spacing, stronger contrast,
// underlined links and calmer motion. Nothing here is sent anywhere. The choices are put on the page as attributes (data-readable and so on), and the
// style sheet that reads them is loaded only when one is switched on, so a visitor who changes nothing downloads nothing extra.

export const KEY = "simple-politics-display";
export const DEFAULTS = { size: 0, readable: false, spacing: false, contrast: false, links: false, calm: false };
// Text size is the page zoomed a little, because most of the site's sizes are written in pixels. On a narrow screen the zoom is held back so the page
// is never squeezed into less than 340 pixels, where it would stop fitting.
export const SIZES = [1, 1.15, 1.3];
export const SIZE_LABELS = ["Standard", "Larger", "Largest"];
export const MIN_WIDTH = 340;

export const zoomFor = (size, width) => {
  const wanted = SIZES[size] ?? 1;
  if (!width) return wanted;
  return Math.max(1, Math.min(wanted, width / MIN_WIDTH));
};

// Anything stored that is not understood is dropped, so a changed or damaged value can never leave the page in a strange state.
export function clean(raw) {
  const out = { ...DEFAULTS };
  if (!raw || typeof raw !== "object") return out;
  if (Number.isInteger(raw.size) && raw.size >= 0 && raw.size < SIZES.length) out.size = raw.size;
  for (const k of ["readable", "spacing", "contrast", "links", "calm"]) out[k] = raw[k] === true;
  return out;
}

export const isDefault = (prefs) => JSON.stringify(clean(prefs)) === JSON.stringify(DEFAULTS);

export function load(storage) {
  try {
    const s = storage ?? window.localStorage;
    return clean(JSON.parse(s.getItem(KEY) ?? "null"));
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(prefs, storage) {
  try {
    const s = storage ?? window.localStorage;
    if (isDefault(prefs)) s.removeItem(KEY); else s.setItem(KEY, JSON.stringify(clean(prefs)));
  } catch {
    // The choice still applies for this visit even if it cannot be kept.
  }
}

// The header folds its menu into a drawer at 1100 pixels. Zoomed text makes the page narrower than that, and a wider typeface makes the menu longer. So do the
// longer words of the Welsh menu, so the header needs about 300 pixels more.
export const compactHeader = (prefs, width, lang = "en") => {
  if (!width) return false;
  const p = clean(prefs);
  const wide = p.readable || p.spacing;
  const welsh = lang === "cy";
  const zoom = zoomFor(p.size, width);
  if (zoom <= 1 && !wide && !welsh) return false;
  return width / zoom <= 1100 + (wide ? 400 : 0) + (welsh ? 300 : 0);
};

let sheet = null;
// Puts the choices on the page. `root` and `width` can be given so this can be tested without a browser.
export function apply(prefs, root = document.documentElement, width = typeof window === "undefined" ? 0 : window.innerWidth) {
  const p = clean(prefs);
  const flags = { readable: p.readable, spacing: p.spacing, contrast: p.contrast, links: p.links, calm: p.calm };
  for (const [k, on] of Object.entries(flags)) {
    if (on) root.setAttribute(`data-${k}`, "on"); else root.removeAttribute(`data-${k}`);
  }
  const zoom = zoomFor(p.size, width);
  if (zoom > 1) root.style.zoom = String(zoom); else root.style.removeProperty("zoom");
  root.setAttribute("data-text-size", String(p.size));
  // Bigger or wider letters need the header's phone layout sooner than the page's own width says, so the menu never runs into the buttons beside it.
  const compact = compactHeader(p, width, root.lang);
  if (compact) root.setAttribute("data-compact", "on"); else root.removeAttribute("data-compact");
  // The style sheet that holds these rules is only fetched once something needs it: a choice made here, or a header that has to fold.
  if ((!isDefault(p) || compact) && !sheet && typeof document !== "undefined") sheet = import("../display.css");
  return p;
}

export function start() {
  const prefs = load();
  apply(prefs);
  window.addEventListener("resize", () => apply(load()));
  // The header's layout depends on the language, so a change of language lays it out again.
  window.addEventListener("sp-lang", () => apply(load()));
  return prefs;
}
