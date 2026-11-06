// What the live-site check (check-site.mjs) reads off the home page, kept apart so a test can hold it to the page's real wording.
// The home page's figures are a list of label/value pairs ("MPs tracked" / "650", "last updated" / "1h ago"); timeAgo in src/lib/format.js writes the
// age as "Just now", "12m ago", "5h ago", "Yesterday", "4d ago" and, from a week on, a date.

// Turns the pairs [[label, value], ...] read from the page into what the check needs: the MP count and how many days old the data is
// (null when the page gives no age, Infinity when it has gone to a date because it is a week old or more).
export function homeFigures(pairs) {
  const value = (label) => pairs.find(([l]) => l.trim().toLowerCase() === label)?.[1]?.trim();
  const mps = Number((value("mps tracked") ?? "").replace(/,/g, ""));
  const age = value("last updated");
  let days = null;
  if (age !== undefined) {
    if (/^(just now|\d+m ago|\d+h ago)$/i.test(age)) days = 0;
    else if (/^yesterday$/i.test(age)) days = 1;
    else if (/^(\d+)d ago$/i.test(age)) days = Number(/^(\d+)d/i.exec(age)[1]);
    else days = Infinity;
  }
  return { mps: Number.isFinite(mps) && mps > 0 ? mps : null, days, age: age ?? null };
}

// The problems with those figures, as sentences for the report. There are 650 seats, so more than 650 sitting MPs means someone who has left is still in the
// table (see remove-departed-mps.js).
export function homeProblems({ mps, days, age }) {
  const problems = [];
  if (mps === null || mps < 500) problems.push("the home page figures did not load (MPs tracked)");
  else if (mps > 650) problems.push(`the home page counts ${mps} MPs for 650 seats, so someone who has left is still listed`);
  if (days === null) problems.push("the home page does not say when the data was last updated");
  else if (days > 3) problems.push(`the data was last updated ${Number.isFinite(days) ? `${days} days ago` : `a week or more ago (${age})`}`);
  return problems;
}
