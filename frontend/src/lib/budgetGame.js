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
  return `${c.label}: ${up ? "up" : "down"} ${amount} (${up ? "+" : "-"}${Math.abs(Math.round(c.pct))}%).`;
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
