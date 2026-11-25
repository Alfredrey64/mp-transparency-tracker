// What a think tank's card says about its entry on the Charity Commission register (data/thinkTankCharities.json). Pure and tested.

// £6,512,345 -> "£6.5 million"; £812,000 -> "£812,000"; null -> null. Whole pounds under a million, so a small charity's figure is not rounded away.
export function poundsShort(n) {
  if (!Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} million`;
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const dayText = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : null;
};

// The sentence under "On the Charity Commission register". Says only what the register holds: its number, and the income and spending the charity reported for its latest year.
export function charityLine(c) {
  if (!c) return null;
  const inc = poundsShort(c.income);
  const exp = poundsShort(c.expenditure);
  const end = dayText(c.yearEnd);
  if (!inc && !exp) return "Its latest income and spending are not on the register.";
  const parts = [inc && `income of ${inc}`, exp && `spending of ${exp}`].filter(Boolean).join(" and ");
  return `In the year ${end ? `to ${end}` : "it last reported"} it reported ${parts}.`;
}
