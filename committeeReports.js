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

const ENTITIES = { "&nbsp;": " ", "&amp;": "&", "&quot;": "\"", "&#39;": "'", "&rsquo;": "\u2019", "&lsquo;": "\u2018", "&ldquo;": "\u201C", "&rdquo;": "\u201D", "&ndash;": "-", "&mdash;": "-", "&pound;": "\u00A3", "&hellip;": "..." };
const plainText = (html) => String(html ?? "")
  .replace(/<\/(p|li|h\d|div|br)>|<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, " ")
  .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ")
  .replace(/[ \t\u00A0]+/g, " ").replace(/ *\n+ */g, "\n").trim();

// Sentences that ask for evidence, give a deadline or point to a web address say nothing about the subject, so they are left out of the plain-English account.
const ADMIN = /call for evidence|submit|submission|written evidence|oral evidence|evidence session|deadline|closing date|invites?\b|inviting|welcomes?\b|we are (?:now )?(?:seeking|accepting)|terms of reference|www\.|https?:|@|\bemail|please|contact|follow us|click|\bhere\b|send us|your views|share your|have your say|proposal for a draft/i;

// An inquiry's description is written when it opens ("will examine", "has launched an inquiry into"); the report is out now, so the common phrasings are put in the past.
const PAST = [["will look at", "looked at"], ["will examine", "examined"], ["will consider", "considered"], ["will explore", "explored"], ["will investigate", "investigated"], ["will assess", "assessed"], ["will focus on", "focused on"], ["will seek to", "sought to"], ["will review", "reviewed"], ["is to examine", "examined"], ["is to look at", "looked at"], ["is examining", "examined"], ["is looking at", "looked at"], ["is investigating", "investigated"], ["is considering", "considered"]];
const LAUNCH = /^(?:The |This )?[A-Z][^.]{0,110}?\b(?:has launched|is launching|launched|has opened|is opening|has started|is starting|has begun|is beginning|is conducting|has announced|is undertaking|is holding|is carrying out)\s+(?:an?|its|the)\s+(?:new\s+)?(?:inquiry|investigation|call for evidence)\s+(?:into|on|about|looking at|to examine|to look at)\s+/;
const INQUIRING = /^(?:The |This )?[A-Z][^.]{0,110}?\b(?:is inquiring into|is looking into)\s+/;
export function inPast(sentence) {
  let t = sentence.replace(LAUNCH, "The committee looked into ").replace(INQUIRING, "The committee looked into ");
  if (t === sentence) for (const [from, to] of PAST) t = t.replace(new RegExp(`\\b${from}\\b`, "i"), to);
  return t;
}

// What an inquiry is about, in the committee's own words, as at most two short sentences, or nothing when the description is only a request for evidence.
export function plainScope(html, { maxChars = 420 } = {}) {
  const sentences = plainText(html).replace(/\n+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z\u201C"(])/).map((t) => t.trim()).filter((t) => t.length >= 25 && !ADMIN.test(t));
  const out = [];
  let used = 0;
  for (const t of sentences) {
    if (out.length === 2 || (out.length && used + t.length > maxChars)) break;
    if (t.length > maxChars) { if (!out.length) out.push(`${t.slice(0, maxChars).replace(/\s+\S*$/, "")}...`); break; }
    out.push(inPast(t));
    used += t.length;
  }
  return out.length ? [out.join(" ")] : [];
}

// Who a committee is, from the purpose it states: its first sentence.
export function plainRole(html) {
  const first = plainText(html).split("\n").map((t) => t.trim()).find((t) => t.length > 30 && !/follow us|social media/i.test(t)) ?? "";
  const sentence = first.split(/(?<=[.!?])\s+(?=[A-Z])/)[0] ?? "";
  return sentence.length <= 300 ? sentence : "";
}

export function tidyReport(p, { scopes = {}, roles = {} } = {}) {
  const g = p?.governmentResponses;
  if (!p || p.type?.id !== 1 || !g?.responseDeadline) return null;
  const committee = clean(p.committee?.name);
  if (!committee || SCRUTINY.test(committee) || p.committee?.category?.name !== "Select") return null;
  const { number, title } = splitTitle(p.description);
  const replies = (g.publication ?? []).map((r) => ({ id: r.id, date: day(r.publicationStartDate), url: `https://committees.parliament.uk/publications/${r.id}/` })).filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));
  // What the committee was looking into, in the words Parliament gives the inquiry (for example "Pet Parasite Medication"), when the report came out of one.
  const inquiry = clean(p.businesses?.[0]?.title);
  const businessId = p.businesses?.[0]?.id;
  return {
    id: p.id,
    committee,
    house: p.committee?.house ?? "Commons",
    number,
    title,
    inquiry: inquiry && inquiry.toLowerCase() !== title.toLowerCase() ? inquiry : "",
    date: day(p.publicationStartDate),
    due: day(g.responseDeadline),
    replies,
    about: plainScope(scopes[businessId]),
    role: plainRole(roles[p.committee?.id]),
    url: /^https:\/\/(publications|committees)\.parliament\.uk\//.test(p.additionalContentUrl ?? "") ? p.additionalContentUrl : `https://committees.parliament.uk/publications/${p.id}/`,
  };
}

export function summariseReports(items, { from, generated, scopes = {}, roles = {} }) {
  const seen = new Set();
  const byTitle = new Map();
  for (const p of items) {
    const r = tidyReport(p, { scopes, roles });
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
