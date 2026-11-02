// committeeReports.js
//
// Turns the reports select committees have published, as Parliament's Committees API lists them, into the short list the Committee reports and replies page uses:
// each report the government is expected to answer, when the answer was due, and the replies published so far. Pure functions, no network, so they can be tested.

const clean = (s) => String(s ?? "").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
const day = (iso) => String(iso ?? "").slice(0, 10);

// "6th Report - The obesity moonshot: making it a priority" -> { number: "6th Report", title: "The obesity moonshot: making it a priority" }.
export function splitTitle(description) {
  const text = clean(description);
  const m = text.match(/^((?:\d+(?:st|nd|rd|th)|First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth|Thirteenth|Fourteenth|Fifteenth|Sixteenth|Seventeenth|Eighteenth|Nineteenth|Twentieth)(?:\s+Special)?\s+Report(?:\s+of\s+Session\s+[\d-]+)?)\s*(?:-|:)\s*(.+)$/i);
  return m ? { number: m[1], title: m[2] } : { number: "", title: text };
}

// A report the government is expected to answer: one that has a response deadline. Left out are the committees that only check delegated legislation or a single
// private bill, and the ones that report on MPs' and peers' conduct, since the answer to those comes from a House, not the government.
const SCRUTINY = /Statutory Instruments|Secondary Legislation Scrutiny|Delegated Powers|Regulatory Reform|European Scrutiny|Standards|Conduct|Privileges|Selection|Procedure|\bBill\b/i;

export function tidyReport(p) {
  const g = p?.governmentResponses;
  if (!p || p.type?.id !== 1 || !g?.responseDeadline) return null;
  const committee = clean(p.committee?.name);
  if (!committee || SCRUTINY.test(committee) || p.committee?.category?.name !== "Select") return null;
  const { number, title } = splitTitle(p.description);
  const replies = (g.publication ?? []).map((r) => ({ id: r.id, date: day(r.publicationStartDate) })).filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));
  return {
    id: p.id,
    committee,
    house: p.committee?.house ?? "Commons",
    number,
    title,
    date: day(p.publicationStartDate),
    due: day(g.responseDeadline),
    replies,
    url: /^https:\/\/(publications|committees)\.parliament\.uk\//.test(p.additionalContentUrl ?? "") ? p.additionalContentUrl : `https://committees.parliament.uk/publications/${p.id}/`,
  };
}

export function summariseReports(items, { from, generated }) {
  const seen = new Set();
  const byTitle = new Map();
  for (const p of items) {
    const r = tidyReport(p);
    if (!r || seen.has(r.id) || r.date < from) continue;
    seen.add(r.id);
    // A sub-committee's report is often published again by its parent committee under the same title; the parent's copy is the one kept.
    const key = `${r.title.toLowerCase()}|${r.date}`;
    const have = byTitle.get(key);
    if (!have || (/Sub-Committee/i.test(have.committee) && !/Sub-Committee/i.test(r.committee))) byTitle.set(key, r);
  }
  const reports = [...byTitle.values()];
  reports.sort((a, b) => b.date.localeCompare(a.date) || a.committee.localeCompare(b.committee));
  return { generated, from, reports };
}

const dayNumber = (d) => Math.round(Date.parse(`${d}T00:00:00Z`) / 86400000);
export const daysBetween = (a, b) => dayNumber(b) - dayNumber(a);
