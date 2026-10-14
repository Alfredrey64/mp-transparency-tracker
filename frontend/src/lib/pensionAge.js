// When a person reaches State Pension age under the law as it stands (Pensions Acts 1995, 2007, 2011 and 2014, as set out in GOV.UK's State Pension age
// timetable). The same for men and women. Dates of birth are { year, month, day } with the month from 1 to 12.
//
// - Born from 6 October 1954 to 5 April 1960: on the 66th birthday.
// - Born from 6 April 1960 to 5 March 1961: 66 years and one to eleven months, counted from the birthday.
// - Born from 6 March 1961 to 5 April 1977: on the 67th birthday.
// - Born from 6 April 1977 to 5 March 1978: 67 years and one to eleven months, counted from the first day of the six-day-to-six-day band the person was
//   born in (so everyone in a band reaches it on the same date, as the timetable shows).
// - Born from 6 March 1978 to 5 April 1978: 6 March 2046. Born on or after 6 April 1978: on the 68th birthday.
//
// The timetable for the rise to 68 could change after a review, so the answer is "under current law".

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const before = (a, b) => a.year < b.year || (a.year === b.year && (a.month < b.month || (a.month === b.month && a.day < b.day)));

// Add years and months to a date, stopping at the end of a shorter month (31 July plus four months is 30 November).
function add({ year, month, day }, years, months) {
  const total = year * 12 + (month - 1) + years * 12 + months;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return { year: y, month: m, day: Math.min(day, daysIn(y, m)) };
}

// How many months into the year of bands a date of birth is, counting from the band that starts on 6 April of `fromYear` (0 for 6 April to 5 May).
function bandIndex(dob, fromYear) {
  const months = (dob.year - fromYear) * 12 + (dob.month - 4);
  return dob.day < 6 ? months - 1 : months;
}

export const formatDate = ({ year, month, day }) => `${day} ${MONTHS[month - 1]} ${year}`;

export function statePensionAge(dob) {
  if (before(dob, { year: 1954, month: 10, day: 6 })) return { kind: "earlier" };
  if (before(dob, { year: 1960, month: 4, day: 6 })) return { kind: "date", years: 66, months: 0, date: add(dob, 66, 0) };
  if (before(dob, { year: 1961, month: 3, day: 6 })) {
    const months = bandIndex(dob, 1960) + 1;
    return { kind: "date", years: 66, months, date: add(dob, 66, months) };
  }
  if (before(dob, { year: 1977, month: 4, day: 6 })) return { kind: "date", years: 67, months: 0, date: add(dob, 67, 0) };
  if (before(dob, { year: 1978, month: 4, day: 6 })) {
    const months = bandIndex(dob, 1977) + 1;
    const bandStart = add({ year: 1977, month: 4, day: 6 }, 0, bandIndex(dob, 1977));
    return { kind: "date", years: months === 12 ? 68 : 67, months: months === 12 ? 0 : months, date: add(bandStart, 67, months) };
  }
  return { kind: "date", years: 68, months: 0, date: add(dob, 68, 0) };
}

export function ageText({ years, months }) {
  if (!months) return `${years}`;
  return `${years} years and ${months} month${months === 1 ? "" : "s"}`;
}
