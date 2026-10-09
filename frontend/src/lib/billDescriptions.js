// A bill's official `long_title` on this site is drawn straight from
// Parliament's own data, but for most bills it's boilerplate legal
// phrasing ("A Bill to make provision about health and social care")
// that says almost nothing about what's actually in it — and the
// `summary` field the official API exposes alongside it is empty for
// all but a handful of bills, so there's no richer machine-readable text
// to fall back on. Rather than either show the unhelpful boilerplate or
// invent plausible-sounding detail we can't stand behind, this is a small,
// hand-written, plain-English description for the specific bills that
// currently show up in the Manifesto tab's vote matching — grounded in
// each bill's real published impact assessments, explanatory material and
// news coverage, not guessed. Written once, only for the bills that need
// it; a bill with no entry here just falls back to its own long_title.
const BILL_DESCRIPTIONS = {
  "Health Bill":
    "Restructures NHS oversight in England, folding NHS England's functions back into the Department of Health and Social Care directly, changing how Integrated Care Boards and foundation trusts operate, and updating patient safety, pharmacy regulation and medical device licensing rules.",
  "Immigration and Asylum Bill":
    "The government's main immigration and asylum legislation for the session, covering how asylum claims are processed, new enforcement powers against illegal working and smuggling, and protections for victims of modern slavery.",
  "Public Office (Accountability) Bill":
    "Often called the 'Hillsborough Law', creates a legal duty for public officials and public authorities to act with candour in inquiries and investigations, makes it a specific offence to knowingly mislead the public in that role, and replaces the old common-law offence of misconduct in public office with clearer statutory ones.",
};

export function getBillDescription(shortTitle, fallback) {
  return BILL_DESCRIPTIONS[shortTitle] ?? fallback ?? null;
}
