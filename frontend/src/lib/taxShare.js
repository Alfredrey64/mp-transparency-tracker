// What goes on the share card for each part of the Tax rates through time page. The cards are drawn by lib/shareCard.js; this works out the content
// from the same data the page shows.

import { GOVERNMENTS } from "../data/governments";
import { CHANCELLORS } from "../data/chancellors";
import { changesByChancellor, changesByGovernment, comingUp, fmt, getTax, headlinesBetween, nowSummary, pastChanges, whenText, chancellorSpan } from "./taxRates";
import { pageShareSpec, sectorShareSpec } from "./shareSpecs";

const KICKER = "Tax rates through time";

const range = (h) => (h.start === undefined || h.end === undefined ? "no record" : h.start === h.end ? fmt(h.unit, h.end) : `${fmt(h.unit, h.start)} to ${fmt(h.unit, h.end)}`);
const pick = (heads, key) => heads.find((h) => h.key === key);

// A rate as a stepped line for the card: each change is a vertical step.
function stepPoints(line, nowT) {
  const pts = [];
  line.points.filter((p) => p.t <= nowT && p.value !== null).forEach((p, i, all) => {
    if (i > 0) pts.push([p.t, all[i - 1].value]);
    pts.push([p.t, p.value]);
  });
  const last = pts.at(-1);
  if (last) pts.push([nowT, last[1]]);
  return pts;
}

export function taxShareSpec(nav, link, now = Date.now()) {
  if (nav.tab === "taxes") {
    const tax = getTax(nav.item);
    const s = nowSummary(tax, now);
    const nowT = now / (365.25 * 86400000) + 1970;
    const pts = stepPoints(s.line, nowT);
    return sectorShareSpec({
      title: tax.name,
      subtitle: tax.summary,
      accent: tax.group.accent,
      tiles: [
        { value: fmt(s.line.unit, s.value), label: `${s.line.label}, now` },
        { value: s.since ? whenText({ date: s.since }) : "", label: "when it last changed" },
        { value: String(pastChanges(tax, now).length), label: "changes in our record" },
        ...(comingUp(tax, now).length ? [{ value: String(comingUp(tax, now).length), label: "already decided, not yet in force" }] : []),
      ].filter((t) => t.value),
      line: pts.length > 1 ? { points: pts, label: s.line.label, firstLabel: String(Math.floor(pts[0][0])), lastLabel: "now", lastText: fmt(s.line.unit, s.value) } : null,
      newest: null,
      link,
    });
  }
  if (nav.tab === "who" && nav.mode === "government") {
    const g = GOVERNMENTS.find((x) => x.id === nav.item);
    const heads = headlinesBetween(g.from, g.to, now);
    const ch = changesByGovernment(g.id, now);
    return sectorShareSpec({
      title: `${g.pm}: tax changes`,
      subtitle: `${g.from.slice(0, 4)} to ${g.to ? g.to.slice(0, 4) : "now"}. ${ch.length} changes decided: ${ch.filter((c) => c.effect === "more").length} meant more tax and ${ch.filter((c) => c.effect === "less").length} meant less.`,
      accent: g.party === "l" ? "#d50000" : "#0063ba",
      tiles: [
        { value: range(pick(heads, "incomeTax.basic")), label: "Basic rate of income tax" },
        { value: range(pick(heads, "vat.standard")), label: "VAT" },
        { value: range(pick(heads, "corp.main")), label: "Corporation tax" },
        { value: range(pick(heads, "ni.employee")), label: "Employee National Insurance" },
      ],
      line: null,
      newest: null,
      link,
    });
  }
  if (nav.tab === "who" && nav.mode === "chancellor") {
    const c = CHANCELLORS.find((x) => x.name === nav.item);
    const span = chancellorSpan(c.name);
    const heads = headlinesBetween(span.from, span.to, now);
    const ch = changesByChancellor(c.name, now);
    return sectorShareSpec({
      title: `${c.name}: tax changes`,
      subtitle: `Chancellor of the Exchequer, ${span.from.slice(0, 4)} to ${span.to ? span.to.slice(0, 4) : "now"}. ${ch.length} changes credited to them.`,
      accent: "#C7871A",
      tiles: [
        { value: range(pick(heads, "incomeTax.basic")), label: "Basic rate of income tax" },
        { value: range(pick(heads, "vat.standard")), label: "VAT" },
        { value: range(pick(heads, "corp.main")), label: "Corporation tax" },
        { value: range(pick(heads, "ni.employee")), label: "Employee National Insurance" },
      ],
      line: null,
      newest: null,
      link,
    });
  }
  const titles = {
    budget: ["Budget by Budget", "Every tax change tied to the Budget where it was decided, and who made it."],
    compare: ["Tax rates beside the economy", "Put any tax rate next to growth, jobs, prices or house prices, with the governments of the day."],
    pay: ["What would you have paid?", "Income tax and National Insurance on the same pay in every year since 1990."],
    about: ["Tax rates through time: the figures", "Where the rates come from, how a change is credited and what is left out."],
  };
  const key = nav.tab === "who" ? "budget" : nav.tab;
  const [title, subtitle] = titles[key] ?? ["Tax rates through time", "How the main UK tax rates have changed since 1945 and which government decided each change."];
  return pageShareSpec({ kicker: KICKER, title, subtitle, accent: "#0E9AA7", link });
}
