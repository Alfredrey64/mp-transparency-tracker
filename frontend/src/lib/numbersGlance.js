// The six boxes at the top of Your area in numbers. Each one is a single figure for this place, set against England (or the UK), with a plain word for how they compare. Pure and
// tested; the component only draws what this returns. A box whose figure is not available for this place (outside England, say) is left out.
import { ordinal } from "./constituency";

// How a figure compares with the one to measure it against. `lowerIsBetter` says which way is good news; with `neutral` neither way is (council tax, house prices).
export function verdict(value, ref, { lowerIsBetter = false, neutral = false, margin = 0.05, name = "England" } = {}) {
  if (value == null || ref == null || !(ref !== 0)) return null;
  const rel = (value - ref) / Math.abs(ref);
  const dir = rel > margin ? "above" : rel < -margin ? "below" : "close";
  const text = dir === "close" ? `Close to ${name}` : dir === "above" ? `Higher than ${name}` : `Lower than ${name}`;
  const tone = neutral || dir === "close" ? "flat" : (dir === "above") === lowerIsBetter ? "warn" : "good";
  return { dir, text, tone, arrow: dir === "above" ? "up" : dir === "below" ? "down" : "same" };
}

// The deprivation tenth: 1st is the most deprived tenth of the nation's neighbourhoods, 10th the least.
export function tenthVerdict(decile) {
  if (!(decile >= 1 && decile <= 10)) return null;
  if (decile <= 3) return { text: "Among the more deprived areas", tone: "warn", arrow: "down" };
  if (decile >= 8) return { text: "Among the less deprived areas", tone: "good", arrow: "up" };
  return { text: "Around the middle", tone: "flat", arrow: "same" };
}

const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
export const FORMATS = { money, pct1: (n) => `${n.toFixed(1)}%`, pct0: (n) => `${Math.round(n)}%` };

// inputs: nb (neighbourhood tenth), tax, snapshot (region figures), claim and pay (constituency rows), roads (road condition rows), regionName.
export function glanceTiles({ nb, tax, snapshot, claim, pay, roads, regionName }) {
  const tiles = [];
  if (nb?.decile) {
    const v = tenthVerdict(nb.decile);
    tiles.push({ id: "hood", section: "ma-n-hood", colour: "#C0478A", icon: "place", label: "How deprived your neighbourhood is", kind: "tenth", decile: nb.decile, valueText: `${ordinal(nb.decile)} tenth`, verdict: v, note: `1st is the most deprived tenth of neighbourhoods in ${nb.nation}, 10th the least.` });
  }
  if (claim?.rate != null) {
    tiles.push({ id: "jobs", section: "ma-n-money", colour: "#E8741A", icon: "jobs", label: "Residents claiming out-of-work benefits", kind: "bars", value: claim.rate, format: "pct1", ref: claim.nat, refName: "England", verdict: verdict(claim.rate, claim.nat, { lowerIsBetter: true, margin: 0.08 }), note: `Share of people aged 16 to 64, ${claim.month}.` });
  }
  if (pay?.pay != null) {
    tiles.push({ id: "pay", section: "ma-n-money", colour: "#7A5AF0", icon: "pay", label: "Typical full-time pay for jobs here", kind: "bars", value: pay.pay, format: "money", ref: pay.nat, refName: "England", verdict: verdict(pay.pay, pay.nat, { margin: 0.03 }), note: `A year before tax, ${pay.year}.` });
  }
  if (tax?.last != null) {
    tiles.push({ id: "tax", section: "ma-n-money", colour: "#D9822B", icon: "tax", label: "Council tax for a Band D home", kind: "bars", value: tax.last, format: "money", ref: tax.average, refName: "England average", verdict: verdict(tax.last, tax.average, { neutral: true, margin: 0.03, name: "the England average" }), note: "For one year. Most homes are in a lower band." });
  }
  const price = snapshot?.find((s) => s.metric.id === "price");
  if (price?.value != null) {
    tiles.push({ id: "homes", section: "ma-n-region", colour: "#2F9E6E", icon: "homes", label: `Average house price in ${regionName ?? "your region"}`, kind: "bars", value: price.value, format: "money", ref: price.uk, refName: "UK", verdict: verdict(price.value, price.uk, { neutral: true, margin: 0.03, name: "the UK average" }), note: "For the whole region, not your street." });
  }
  const street = roads?.find((r) => r.key === "u");
  if (street) {
    tiles.push({ id: "roads", section: "ma-n-council", colour: "#2C7DA0", icon: "roads", label: "Residential roads in poor condition", kind: "bars", value: street.value, format: "pct0", ref: street.nat, refName: "England", verdict: verdict(street.value, street.nat, { lowerIsBetter: true, margin: 0.1 }), note: "Unclassified roads, where repair should be considered." });
  }
  return tiles;
}
