// What a repayment mortgage costs each month, for the "what a mortgage costs" calculator.
// Simplified on purpose: the rate stays the same for the whole term, and there are no fees.

export function monthlyPayment(loan, annualRatePercent, years) {
  const n = Math.round(years * 12);
  if (!(loan > 0) || !(n > 0)) return 0;
  const r = annualRatePercent / 100 / 12;
  if (Math.abs(r) < 1e-9) return loan / n;
  return (loan * r) / (1 - (1 + r) ** -n);
}
