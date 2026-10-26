// A bill's official long title is written in parliamentary drafting language ("A Bill to make provision about X; to confer power on Y to Z;
// and for connected purposes"). This turns each clause into everyday wording, one point per clause, using only the words already in the title:
// the verbs and a few stock phrases are swapped, nothing is added. A clause it does not recognise is kept as written (just tidied), so an
// odd title never ends up saying something the bill does not.

const WORDS = [
  [/\bpersons\b/gi, "people"],
  [/\bperson\b/gi, "person"],
  [/\blocal authorities\b/gi, "councils"],
  [/\blocal authority\b/gi, "council"],
  [/\benactments\b/gi, "laws"],
  [/\bin respect of\b/gi, "for"],
  [/\bin relation to\b/gi, "about"],
  [/\bin connection with\b/gi, "connected with"],
  [/\bpursuant to\b/gi, "under"],
  [/\bprior to\b/gi, "before"],
  [/\bsubsequent to\b/gi, "after"],
  [/\bcommencement\b/gi, "start date"],
  [/\bstatutory\b/gi, "legal"],
  [/\bhereby\b/gi, ""],
];

// Opening words of a clause, longest first. `$1` is whatever follows.
const OPENERS = [
  [/^make(?:s)? provisions?,\s*including [^,]+,\s*about /i, "Sets rules on "],
  [/^make(?:s)?(?: (?:new|further|certain|other|special|transitional))? provisions? (?:about|for|on|regarding|relating to|about the|with regard to|with respect to)\s+/i, "Sets rules on "],
  [/^make(?:s)?(?: (?:new|further|certain|other|special))? provisions? (?=\w+ing\b)/i, "Sets rules "],
  [/^make(?:s)?(?: (?:new|further|certain|other))? provisions? /i, "Sets rules "],
  [/^confer(?:s)? (?:a )?powers? on (.+?) to /i, (m) => `Gives ${m[1]} the power to `],
  [/^confer(?:s)? (?:a )?powers? /i, "Gives the power "],
  [/^impose(?:s)? (?:a )?dut(?:y|ies) on /i, "Puts a legal duty on "],
  [/^place(?:s)? (?:a )?dut(?:y|ies) on /i, "Puts a legal duty on "],
  [/^require(?:s)? /i, "Requires "],
  [/^amend(?:s)? /i, "Changes "],
  [/^repeal(?:s)? /i, "Removes "],
  [/^prohibit(?:s)? /i, "Bans "],
  [/^establish(?:es)? /i, "Sets up "],
  [/^introduce(?:s)? /i, "Brings in "],
  [/^enable(?:s)? /i, "Lets "],
  [/^provide(?:s)? that /i, "Says that "],
  [/^provide(?:s)? for /i, "Provides for "],
  [/^continue(?:s)? /i, "Keeps in force "],
  [/^affirm(?:s)? and protect(?:s)? /i, "Confirms and protects "],
  [/^affirm(?:s)? /i, "Confirms "],
  [/^specify(?:ies)? /i, "Sets "],
  [/^restrict(?:s)? /i, "Limits "],
  [/^limit(?:s)? /i, "Limits "],
  [/^extend(?:s)? /i, "Extends "],
  [/^exempt(?:s)? /i, "Exempts "],
  [/^restore(?:s)? /i, "Restores "],
  [/^change(?:s)? /i, "Changes "],
  [/^ban(?:s)? /i, "Bans "],
  [/^allow(?:s)? /i, "Allows "],
  [/^create(?:s)? /i, "Creates "],
  [/^protect(?:s)? /i, "Protects "],
  [/^increase(?:s)? /i, "Raises "],
  [/^reduce(?:s)? /i, "Cuts "],
  [/^abolish(?:es)? /i, "Abolishes "],
  [/^de-?criminalise(?:s)? /i, "Decriminalises "],
  [/^criminalise(?:s)? /i, "Makes it a crime: "],
  [/^empower(?:s)? (.+?) to /i, (m) => `Gives ${m[1]} the power to `],
  [/^confer(?:s)? ([^,]+?) on ((?:(?!\bto\b).)+)$/i, (m) => `Gives ${m[2]} ${m[1]}`],
  [/^impose(?:s)? (?:enforceable )?dut(?:y|ies) (?:of [a-z]+ )?on /i, "Puts legal duties on "],
  [/^place(?:s)? (?:enforceable )?dut(?:y|ies) on /i, "Puts legal duties on "],
  [/^set(?:s)? up /i, "Sets up "],
  [/^give(?:s)? /i, "Gives "],
  [/^end(?:s)? /i, "Ends "],
  [/^strengthen(?:s)? /i, "Strengthens "],
  [/^reform(?:s)? /i, "Reforms "],
  [/^address(?:es)? /i, "Deals with "],
  [/^improve(?:s)? /i, "Improves "],
  [/^ensure(?:s)? /i, "Makes sure "],
  [/^make(?:s)? (.+?) an offence/i, (m) => `Makes ${m[1]} a crime`],
  [/^make(?:s)? /i, "Makes "],
];

// Other opening verbs: base form to the form that follows "This bill".
const VERBS = {
  expand: "Expands", replace: "Replaces", publish: "Publishes", review: "Reviews", appoint: "Appoints", close: "Closes", transfer: "Transfers",
  withdraw: "Withdraws", regulate: "Regulates", raise: "Raises", grant: "Grants", delay: "Delays", suspend: "Suspends", cap: "Caps", fix: "Fixes",
  recognise: "Recognises", promote: "Promotes", support: "Supports", lift: "Lifts", scrap: "Scraps", charge: "Charges", designate: "Names",
  define: "Defines", apply: "Applies", direct: "Directs", authorise: "Authorises", permit: "Allows", remove: "Removes", add: "Adds",
  secure: "Secures", maintain: "Keeps up", provide: "Provides", report: "Asks for a report", consult: "Consults", introduce: "Brings in",
  supplement: "Adds to", revoke: "Cancels", omit: "Removes", appropriate: "Allocates", update: "Updates", simplify: "Simplifies", clarify: "Clarifies", widen: "Widens", tighten: "Tightens", keep: "Keeps", offer: "Offers",
};

const MAX_CLAUSE = 170;

function tidy(text) {
  let t = text;
  for (const [re, to] of WORDS) t = t.replace(re, to);
  return t.replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();
}

function clauseToPoint(raw) {
  let c = tidy(raw.replace(/^(?:and|to)\s+/i, "").replace(/^to\s+/i, "").replace(/[.\s]+$/, ""));
  if (!c) return null;
  let out = null;
  let known = true;
  for (const [re, to] of OPENERS) {
    const m = c.match(re);
    if (!m) continue;
    out = (typeof to === "function" ? to(m) : to) + c.slice(m[0].length);
    break;
  }
  if (!out) {
    const first = c.match(/^(\w+)\s+(.*)$/);
    if (first && VERBS[first[1].toLowerCase()]) out = `${VERBS[first[1].toLowerCase()]} ${first[2]}`;
    else if (/^about\b/i.test(c)) out = `Sets rules on ${c.replace(/^about\s+/i, "")}`;
    else if (/^for\b/i.test(c)) out = `Sets rules for ${c.replace(/^for\s+/i, "")}`;
    else if (/^\w+ing\b/i.test(c)) { out = `Includes ${c.charAt(0).toLowerCase()}${c.slice(1)}`; known = false; }
    else { out = `Aims to ${c.charAt(0).toLowerCase()}${c.slice(1)}`; known = false; }
  }
  out = out.replace(/\s+/g, " ").trim();
  if (out.length > MAX_CLAUSE) {
    const cut = out.slice(0, MAX_CLAUSE);
    const at = Math.max(cut.lastIndexOf(", "), cut.lastIndexOf(" and "), cut.lastIndexOf(" or "));
    out = `${(at > 70 ? cut.slice(0, at) : cut.slice(0, cut.lastIndexOf(" "))).replace(/[,;:\s]+$/, "")}…`;
  }
  return { text: out.charAt(0).toUpperCase() + out.slice(1), known };
}

function pointsInfo(longTitle) {
  let t = String(longTitle ?? "").replace(/[ﬁ]/g, "fi").replace(/\s+/g, " ").trim();
  if (!t) return [];
  t = t.replace(/[.\s]+$/, "")
    .replace(/[;,]?\s*and\s+for\s+(?:connected|related|incidental|consequential|supplementary)\s+purposes$/i, "")
    .replace(/^an?\s+bill\s+to\s+/i, "")
    .replace(/^an?\s+act\s+to\s+/i, "");
  const clauses = t.split(/;\s*/).map((c) => c.trim()).filter(Boolean);
  return clauses.map(clauseToPoint).filter(Boolean);
}

export function plainPoints(longTitle) {
  return pointsInfo(longTitle).map((p) => p.text);
}

// The long title as a short list of plain points, or [] when there is nothing to say.

// The same, as one sentence for places with room for a line only.
export function plainSentence(longTitle) {
  const info = pointsInfo(longTitle);
  if (info.length === 0 || !info[0].known) return null;
  const pts = info.map((p) => p.text.replace(/[.…]+$/, ""));
  // Two points that open the same way read better as one: "Sets rules on A and B".
  const open = pts[1] && /^(Sets rules on |Sets rules for |Requires |Bans |Gives )/.exec(pts[0]);
  const merged = Boolean(open) && pts[1].startsWith(open[0]);
  const shown = merged ? [`${pts[0]} and ${pts[1].slice(open[0].length)}`] : pts.slice(0, 2);
  const more = pts.length > (merged ? 2 : shown.length) ? " and more" : "";
  return `${shown.join(". ")}${more}.`;
}
