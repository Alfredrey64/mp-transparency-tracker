// How to refer to a page of this site in an essay, a report or a news story. Three common styles, built from the page's name, its address and today's date.

export const SITE = "Simple Politics";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const longDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

// The page's own name, without the site's name on the end ("Voting records | Simple Politics" becomes "Voting records").
export function pageName(title) {
  const t = String(title ?? "").split("|").map((s) => s.trim()).filter((s) => s && s !== SITE);
  return t.length ? t.join(": ") : SITE;
}

// Addresses that carry something personal after the page's name (a postcode, an area, an MP you looked up) are cited by the page's name alone.
const PERSONAL = new Set(["myMP", "myArea", "watchlist", "constituency", "councillors"]);
export function citeAddress(loc) {
  const parts = String(loc.pathname ?? "/").split("/").filter(Boolean);
  const keep = parts.length && PERSONAL.has(parts[0]) ? parts.slice(0, 1) : parts;
  return `${loc.origin}/${keep.join("/")}`.replace(/\/$/, "") || loc.origin;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "page";

export function citations(title, url, now = new Date()) {
  const year = now.getFullYear();
  const day = longDate(now);
  return [
    { key: "harvard", label: "Harvard", text: `${SITE} (${year}) ${title}. Available at: ${url} (Accessed: ${day}).` },
    { key: "apa", label: "APA", text: `${SITE}. (n.d.). ${title}. Retrieved ${MONTHS[now.getMonth()]} ${now.getDate()}, ${year}, from ${url}` },
    { key: "bibtex", label: "BibTeX", text: `@misc{simplepolitics${year}${slug(title)},\n  author = {{${SITE}}},\n  title = {${title}},\n  year = {${year}},\n  url = {${url}},\n  note = {Accessed ${day}}\n}` },
  ];
}

export const REPO_ISSUES = "https://github.com/Alfredrey64/mp-transparency-tracker/issues";
export function problemLink(title, url) {
  const body = `**Page:** ${url}\n\n**What were you trying to do?**\n\n\n**What went wrong, or what could be better?**\n\n\n_Please do not put personal details in this report. It is public._`;
  return `${REPO_ISSUES}/new?title=${encodeURIComponent(`Problem on: ${title}`)}&body=${encodeURIComponent(body)}`;
}
