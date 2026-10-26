// Stamp Duty Land Tax on a home in England or Northern Ireland, from GOV.UK's "Stamp Duty Land Tax: residential property rates". Scotland
// charges LBTT and Wales charges LTT instead, with different bands, so they are not worked out here.
//
// Each rate is charged only on the slice of the price inside its band. Standard rates are in force from 1 April 2025. First-time buyers pay nothing up
// to £300,000 and 5% from there to £500,000, and get no relief above £500,000. Someone who already owns another home pays 5 points more in every
// band (the higher rate for additional dwellings), and a buyer who is not resident in the UK pays 2 points more.

export const STANDARD = [
  { upTo: 125000, rate: 0 },
  { upTo: 250000, rate: 2 },
  { upTo: 925000, rate: 5 },
  { upTo: 1500000, rate: 10 },
  { upTo: Infinity, rate: 12 },
];
export const FIRST_TIME = [
  { upTo: 300000, rate: 0 },
  { upTo: 500000, rate: 5 },
];
export const FIRST_TIME_LIMIT = 500000;
export const ADDITIONAL_SURCHARGE = 5;
export const NON_RESIDENT_SURCHARGE = 2;
// The extra charge for another home only applies from this price.
export const SURCHARGE_FROM = 40000;

// buyer: "mover" (buying a main home), "first" (a first-time buyer) or "additional" (a second home or buy to let).
export function stampDuty(price, { buyer = "mover", nonResident = false } = {}) {
  const p = Math.max(0, Math.round(price));
  const firstTime = buyer === "first" && p <= FIRST_TIME_LIMIT;
  const bands = firstTime ? FIRST_TIME : STANDARD;
  const extra = (buyer === "additional" && p >= SURCHARGE_FROM ? ADDITIONAL_SURCHARGE : 0) + (nonResident ? NON_RESIDENT_SURCHARGE : 0);
  const slices = [];
  let lower = 0;
  for (const band of bands) {
    if (p <= lower) break;
    const part = Math.min(p, band.upTo) - lower;
    const rate = band.rate + extra;
    slices.push({ from: lower, to: Math.min(p, band.upTo), rate, amount: (part * rate) / 100 });
    lower = band.upTo;
  }
  // Above the first-time buyer bands (only reachable at exactly the limit) nothing more is charged.
  const total = slices.reduce((sum, s) => sum + s.amount, 0);
  return { price: p, total, slices, effective: p > 0 ? (total / p) * 100 : 0, reliefApplied: firstTime, reliefLost: buyer === "first" && !firstTime };
}
