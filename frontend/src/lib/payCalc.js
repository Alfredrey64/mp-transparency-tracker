import BANDS from "../data/taxBands.json";

// What an employee would pay in income tax and National Insurance in any tax year from 1990 to 1991, under that year's rules for England, Wales
// and Northern Ireland. The rates, allowances and bands come from HMRC's published tables (src/data/taxBands.json). It is a simplified picture: a
// single job, no pension contributions, no other income, under State Pension age, contracted in to the State Second Pension, and no tax
// credits or benefits. It is meant for comparing years, not for working out a real tax bill.

export const FIRST_YEAR = BANDS[0].y;
export const LAST_YEAR = BANDS[BANDS.length - 1].y;
export const yearRule = (y) => BANDS.find((b) => b.y === y) ?? null;

// Income tax on a yearly pay figure (pounds) in the tax year starting in April of year `y`.
export function incomeTax(y, gross) {
  const r = yearRule(y);
  if (!r) return null;
  // From 2010 the personal allowance is withdrawn by £1 for every £2 of income over £100,000.
  const allowance = y >= 2010 ? Math.max(0, r.pa - Math.max(0, (gross - 100000) / 2)) : r.pa;
  const taxable = Math.max(0, gross - allowance);
  let tax = 0;
  let from = 0;
  const slice = (upper, rate) => {
    if (upper === null || upper === undefined || rate === null) return;
    const top = Math.min(taxable, upper);
    if (top > from) { tax += ((top - from) * rate) / 100; from = top; }
  };
  slice(r.lowerUpper, r.lowerRate);
  slice(r.startUpper, r.startRate);
  slice(r.basicUpper, r.basicRate);
  const higherTop = r.addFrom ?? Infinity;
  if (taxable > from) {
    const top = Math.min(taxable, higherTop);
    tax += ((top - from) * r.higherRate) / 100;
    from = top;
  }
  if (r.addFrom && taxable > from) tax += ((taxable - from) * r.addRate) / 100;
  return { tax, allowance, taxable };
}

// Employee National Insurance on a yearly pay figure, worked out weekly as it is charged.
export function nationalInsurance(y, gross) {
  const r = yearRule(y);
  if (!r) return null;
  const n = r.ni;
  const week = gross / 52;
  if (week < n.pt) return 0;
  const main = (n.main / 100) * (Math.min(week, n.uel) - n.pt);
  const above = (n.above / 100) * Math.max(0, week - n.uel);
  const entry = (n.entry / 100) * n.lel;
  return (entry + main + above) * 52;
}

// Everything for one year: pay, income tax, National Insurance, what is left, and each as a share of pay.
export function payslip(y, gross) {
  const it = incomeTax(y, gross);
  if (!it) return null;
  const ni = nationalInsurance(y, gross);
  const total = it.tax + ni;
  return { y, gross, incomeTax: it.tax, ni, total, takeHome: gross - total, allowance: it.allowance, taxShare: (it.tax / gross) * 100, niShare: (ni / gross) * 100, totalShare: (total / gross) * 100 };
}

export const taxYearLabel = (y) => `${y} to ${String(y + 1).slice(2)}`;
