// The class budget game: a pot of public money (the real total for 2025-26, plus or minus what the class decides to raise in tax) shared out between
// the real spending categories. Pure, so it can be tested. Amounts are in £ billion.
import { CATEGORIES, PER_HOUSEHOLD } from "../data/publicSpending";

// Debt interest has to be paid whatever anyone decides, and is shown but cannot be moved.
export const LOCKED = new Set(["debt"]);
export const TAX_RANGE = 60;

export const realBudget = () => Object.fromEntries(CATEGORIES.map((c) => [c.key, c.amountBn]));
export const totalOf = (alloc) => Object.values(alloc).reduce((a, b) => a + b, 0);
// The pot is the real categories added up (the published total differs by a pound of rounding), plus any change in tax.
export const BASE_BN = totalOf(realBudget());
export const potFor = (taxChangeBn) => BASE_BN + taxChangeBn;
export const leftToSpend = (alloc, taxChangeBn) => Math.round((potFor(taxChangeBn) - totalOf(alloc)) * 10) / 10;

// Pounds a household would pay (or save) a year for a change of `bn` billion in tax: the real total spent per household scaled to the change.
export const perHousehold = (bn) => Math.round((bn * PER_HOUSEHOLD) / BASE_BN);

// Sets one category in whole billions, never below zero and never beyond what is left in the pot. A locked category does not move.
export function setAmount(alloc, key, value, taxChangeBn) {
  if (LOCKED.has(key) || !(key in alloc)) return alloc;
  const room = Math.floor(alloc[key] + leftToSpend(alloc, taxChangeBn));
  return { ...alloc, [key]: Math.max(0, Math.min(Math.round(value), room)) };
}

// Sets one category and keeps the total fixed: whatever is not already free in the pot is taken from the other categories, in proportion to their size,
// so a slider can always be moved. Lowering a category frees money for the class to place somewhere else. Returns the new amounts and where the money
// came from (for a line of explanation).
export function shift(alloc, key, value, taxChangeBn) {
  if (LOCKED.has(key) || !(key in alloc)) return { alloc, took: [] };
  const others = Object.keys(alloc).filter((k) => k !== key && !LOCKED.has(k));
  const pool = others.reduce((t, k) => t + alloc[k], 0);
  const free = Math.max(0, Math.floor(leftToSpend(alloc, taxChangeBn)));
  const target = Math.max(0, Math.min(Math.round(value), alloc[key] + free + pool));
  const next = { ...alloc, [key]: target };
  const need = target - alloc[key] - free;
  const took = [];
  if (need > 0 && pool > 0) {
    let left = need;
    const order = [...others].sort((a, b) => alloc[b] - alloc[a]);
    for (const k of order) {
      const share = Math.min(alloc[k], Math.floor((need * alloc[k]) / pool));
      next[k] -= share; left -= share;
      if (share > 0) took.push([k, share]);
    }
    for (const k of order) { // the pounds lost to rounding come off the biggest categories, one at a time
      if (left <= 0) break;
      if (next[k] > 0) { next[k] -= 1; left -= 1; const t = took.find(([x]) => x === k); if (t) t[1] += 1; else took.push([k, 1]); }
    }
  }
  return { alloc: next, took };
}

// How each category differs from the real budget, biggest changes first.
export function changes(alloc) {
  const real = realBudget();
  return CATEGORIES.map((c) => ({ key: c.key, label: c.label, color: c.color, real: real[c.key], now: alloc[c.key], diff: alloc[c.key] - real[c.key], pct: real[c.key] ? ((alloc[c.key] - real[c.key]) / real[c.key]) * 100 : 0 }))
    .filter((c) => c.diff !== 0).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

// A line for the class about one change, in plain words and without saying whether it is a good idea.
export function describeChange(c) {
  const up = c.diff > 0;
  const amount = `£${Math.abs(c.diff)}bn`;
  const pct = Math.abs(Math.round(c.pct));
  return `${c.label}: ${up ? "up" : "down"} ${amount} (${pct === 0 ? "under 1%" : `${up ? "+" : "-"}${pct}%`}).`;
}

// Questions to put to the class, whatever they chose.
export const CHALLENGES = [
  "The NHS asks for £20bn more. Where does the money come from: other departments, higher taxes, or borrowing?",
  "A cut to one category means a cut to services people use. Which cut would hurt the fewest people, and who decides that?",
  "Debt interest cannot be changed. Why do you think it takes so much of the pot?",
  "If you raise tax by £20bn, how much is that for each household? Is it fair that everyone pays the same amount?",
  "Which category would you protect, and would you still protect it if it meant raising tax on your own family?",
  "Real governments can borrow instead of raising tax. What might go wrong if they borrow a lot?",
];
