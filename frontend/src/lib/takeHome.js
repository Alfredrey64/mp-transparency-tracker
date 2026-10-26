import { LAST_YEAR, nationalInsurance, payslip } from "./payCalc";

// What a person on a given salary takes home in the latest tax year (2026 to 27), for England, Wales and Northern Ireland or for Scotland, which has
// its own income tax bands. The England figures come from the same tables as the tax pages (src/data/taxBands.json). The Scottish bands are the ones
// on GOV.UK's "Rates and thresholds for employers 2026 to 2027" (each width is the slice of income above the personal allowance). National Insurance
// is the same everywhere. A simplified picture: one job, no student loan, no other income, no benefits in kind, a standard tax code, and any pension
// taken before tax under a "net pay" arrangement (which lowers income tax but not National Insurance).

export const TAX_YEAR = LAST_YEAR;
export const PERSONAL_ALLOWANCE = 12570;
// Upper limits of each band, in income above the personal allowance, and the rate charged inside it.
const SCOTLAND = [
  { upTo: 3967, rate: 19 },
  { upTo: 16956, rate: 20 },
  { upTo: 31092, rate: 21 },
  { upTo: 62430, rate: 42 },
  { upTo: 125140, rate: 45 },
  { upTo: Infinity, rate: 48 },
];

export function scottishIncomeTax(gross) {
  // From £100,000 the personal allowance is withdrawn by £1 for every £2 of income over it.
  const allowance = Math.max(0, PERSONAL_ALLOWANCE - Math.max(0, (gross - 100000) / 2));
  const taxable = Math.max(0, gross - allowance);
  let tax = 0;
  let lower = 0;
  for (const { upTo, rate } of SCOTLAND) {
    if (taxable > lower) tax += (Math.min(taxable, upTo) - lower) * (rate / 100);
    lower = upTo;
  }
  return { tax, allowance, taxable };
}

export function takeHome(gross, { region = "england", pensionPct = 0 } = {}) {
  const pension = (gross * pensionPct) / 100;
  if (region === "scotland") {
    const it = scottishIncomeTax(gross - pension);
    const ni = nationalInsurance(TAX_YEAR, gross);
    return { gross, pension, incomeTax: it.tax, ni, takeHome: gross - it.tax - ni - pension, allowance: it.allowance };
  }
  const s = payslip(TAX_YEAR, gross, { pensionPct });
  return { gross, pension: s.pension, incomeTax: s.incomeTax, ni: s.ni, takeHome: s.takeHome, allowance: s.allowance };
}
