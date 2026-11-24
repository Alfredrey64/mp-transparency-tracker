// Searching and ordering a list of places near a postcode (food businesses, health services, schools, sewage overflows). Every such list starts nearest first; the visitor can search by
// name and pick another order. Pure, so it can be tested.

// Lower case, accents and punctuation removed, one space between words: "St. Anthony's Café" -> "st anthony s cafe".
export const normalise = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// True when every word typed appears somewhere in the text of the fields, in any order ("goan cafe" finds "St Anthony Goan Cafe"). An empty search matches everything.
export function matches(query, fields) {
  const words = normalise(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const hay = normalise((fields ?? []).filter(Boolean).join(" "));
  return words.every((w) => hay.includes(w));
}

// Nearest first; places the same distance (to the figure shown) fall back to name order so the list never shuffles between loads.
export const byMiles = (a, b) => (a.miles ?? Infinity) - (b.miles ?? Infinity) || String(a.name ?? a.n ?? "").localeCompare(String(b.name ?? b.n ?? ""), "en-GB");
export const byName = (a, b) => String(a.name ?? a.n ?? "").localeCompare(String(b.name ?? b.n ?? ""), "en-GB") || byMiles(a, b);

// The items that match the search, in the order asked for (a compare function, or none to keep the given order).
export function browse(items, { query = "", textOf = (x) => [x.name ?? x.n], compare } = {}) {
  const found = (items ?? []).filter((x) => matches(query, textOf(x)));
  return compare ? found.sort(compare) : found;
}

// "5 of 23 businesses, nearest first" / "23 businesses matching “goan”, nearest first".
export function countLine({ shown, total, noun, query, order }) {
  const word = total === 1 ? noun.one : noun.many;
  const q = normalise(query) ? ` matching “${String(query).trim()}”` : "";
  return `${shown < total ? `${shown} of ${total}` : total} ${word}${q}, ${order}`;
}
