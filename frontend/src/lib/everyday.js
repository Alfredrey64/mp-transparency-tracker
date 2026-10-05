// Puts a sum of money on a human scale: "about 3 weeks' pay for a typical
// full-time worker". The yardstick is the typical (median) full-time salary,
// and for bigger sums the MP's salary too. Pure and tested.
import { MEDIAN_SALARY, MP_SALARY } from "../data/referenceFigures";

const WEEKS_PER_YEAR = 52;

const round1 = (n) => Math.round(n * 10) / 10;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// "a day's pay", "3 weeks' pay", "about 4 months' pay", "1.5 years' pay", "12 years' pay"
function payTime(amount, salary) {
  const week = salary / WEEKS_PER_YEAR;
  const days = (amount / week) * 5;
  if (days < 0.5) return "less than half a day's pay";
  if (days < 1.5) return "about a day's pay";
  if (days < 10) return `about ${plural(Math.round(days), "day's", "days'")} pay`;
  const weeks = amount / week;
  if (weeks < 8) return `about ${plural(Math.round(weeks), "week's", "weeks'")} pay`;
  const months = amount / (salary / 12);
  if (months < 11.5) return `about ${plural(Math.round(months), "month's", "months'")} pay`;
  const years = amount / salary;
  if (years < 1.15) return "about a year's pay";
  if (years < 10) return `about ${round1(years)} years' pay`;
  return `about ${Math.round(years)} years' pay`;
}

// The sentence for a sum, or null for nothing worth saying (zero, negative, not a number).
export function everyday(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Very large sums read better as a number of people's annual pay.
  if (n >= MEDIAN_SALARY.value * 20) return `the yearly pay of about ${Math.round(n / MEDIAN_SALARY.value).toLocaleString("en-GB")} typical full-time workers`;
  const typical = payTime(n, MEDIAN_SALARY.value);
  // A big sum is also set against an MP's salary, which is easier to picture
  // than a dozen years of someone else's.
  if (n >= MP_SALARY.value * 0.5) {
    const mpYears = n / MP_SALARY.value;
    const mp = mpYears < 0.96 ? `about ${plural(Math.round(mpYears * 12), "month", "months")} of an MP's salary` : mpYears < 1.15 ? "about a year of an MP's salary" : `${mpYears < 10 ? round1(mpYears) : Math.round(mpYears)} years of an MP's salary`;
    return `${typical} for a typical full-time worker, or ${mp}`;
  }
  return `${typical} for a typical full-time worker`;
}

// A short form for tight spaces: "≈ 3 weeks' pay".
export function everydayShort(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= MEDIAN_SALARY.value * 20) return `≈ ${Math.round(n / MEDIAN_SALARY.value).toLocaleString("en-GB")} typical salaries`;
  return payTime(n, MEDIAN_SALARY.value).replace(/^about /, "≈ ").replace(/^less than /, "< ");
}
