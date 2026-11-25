// auditReports.js
//
// Turns what the National Audit Office's website lists (its WordPress API) into the short list the Spending watchdog page uses: each report from the last 12 months with
// the department it is about, its topic and the Office's own one-sentence summary. Pure functions, no network, so they can be tested.

const ENTITIES = { "&amp;": "&", "&nbsp;": " ", "&quot;": "\"", "&#39;": "'", "&#8217;": "’", "&#8216;": "‘", "&#8211;": "-", "&#8212;": "-", "&#8220;": "“", "&#8221;": "”", "&rsquo;": "’", "&lsquo;": "‘", "&ndash;": "-", "&mdash;": "-", "&pound;": "£", "&hellip;": "..." };
export const plain = (html) => String(html ?? "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&[#a-z0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ")
  .replace(/[‑‐]/g, "-")
  .replace(/\s+/g, " ")
  .trim();

const day = (iso) => String(iso ?? "").slice(0, 10);

const KIND = { "value for money": "Value for money", "financial audit": "Accounts audit", "interactive visualisation": "Data tool" };
const kindOf = (name) => KIND[String(name).toLowerCase()] ?? plain(name);

// The report's own page is split at its headings. What it found is the section the Office calls its conclusion (or, for an audit of accounts, its opinion); the background section says what
// the thing is and why it was looked at. Both are the Office's words, cut at a sentence so they never stop half way.
const FOUND = /^(conclusions?|concluding remarks|key findings|summary|clean audit opinion|modified audit opinion|disclaimed opinion|opinion on|financial statements|regularity|trust statement|resource accounts)/i;
const BACKGROUND = /^background/i;
const SCOPE = /^scope/i;

export function sections(html) {
  const out = [];
  for (const part of String(html ?? "").split(/<h2\b/i).slice(1)) {
    const end = part.indexOf("</h2>");
    if (end < 0) continue;
    const heading = plain(part.slice(part.indexOf(">") + 1, end));
    const paras = [...part.slice(end).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => plain(m[1])).filter((t) => t.length > 1);
    out.push({ heading, paras });
  }
  return out;
}

// Whole paragraphs up to `limit` characters; if even the first is longer, its whole sentences up to the limit.
export function fit(paras, limit) {
  const kept = [];
  let used = 0;
  for (const p of paras) {
    if (used + p.length <= limit) { kept.push(p); used += p.length; continue; }
    if (!kept.length) {
      let t = "";
      for (const sentence of p.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? []) { if ((t + sentence).length > limit) break; t += sentence; }
      if (t.trim()) kept.push(t.trim());
    }
    break;
  }
  return kept;
}

// One NAO report as the page shows it. `names` maps taxonomy ids to names: { department: Map, topic: Map, type: Map }.
export function tidyReport(r, names) {
  const title = plain(r.title?.rendered);
  if (!title || !r.link) return null;
  const departments = (r.department ?? []).map((id) => names.department.get(id)).filter(Boolean);
  const topics = (r.topic ?? []).map((id) => names.topic.get(id)).filter(Boolean);
  const type = kindOf(names.type.get((r.report_type ?? [])[0]) ?? "");
  const parts = sections(r.content?.rendered);
  const found = fit(parts.filter((x) => FOUND.test(x.heading)).flatMap((x) => x.paras), 1100);
  const why = fit(parts.filter((x) => BACKGROUND.test(x.heading)).flatMap((x) => x.paras), 650);
  const scope = fit(parts.filter((x) => SCOPE.test(x.heading)).flatMap((x) => x.paras), 550);
  return {
    id: r.id,
    title,
    date: day(r.date),
    summary: plain(r.excerpt?.rendered),
    departments,
    topics: topics.slice(0, 3),
    type,
    url: /^https:\/\/www\.nao\.org\.uk\//.test(r.link) ? r.link : "",
    found,
    why,
    scope,
  };
}

const tally = (list, pick, top) => {
  const counts = new Map();
  for (const item of list) for (const k of pick(item)) counts.set(k, (counts.get(k) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, top);
};

export function summariseNao(items, names, { from, generated }) {
  const seen = new Set();
  const reports = [];
  for (const raw of items) {
    const r = tidyReport(raw, names);
    if (!r || !r.url || r.date < from || seen.has(r.id)) continue;
    seen.add(r.id);
    reports.push(r);
  }
  reports.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  return {
    generated,
    from,
    total: reports.length,
    byType: tally(reports, (r) => [r.type], 4),
    byDepartment: tally(reports, (r) => r.departments, 10),
    byTopic: tally(reports, (r) => r.topics.slice(0, 1), 8),
    reports,
  };
}
