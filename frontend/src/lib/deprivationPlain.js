// Plain-English ways of saying a deprivation percentage. A figure such as "21%" means little on its own, so these turn it into
// "about 1 in 5" and say how it compares with a fair share (10% of people in each tenth, if deprivation were spread evenly).

// "about 1 in 5", "about half", "nearly everyone", "almost none".
export function oneIn(pct) {
  if (!Number.isFinite(pct) || pct <= 0.4) return "almost none";
  if (pct >= 92) return "nearly all";
  if (pct >= 80) return "about 4 in 5";
  if (pct >= 70) return "about 3 in 4";
  if (pct >= 60) return "about 2 in 3";
  if (pct >= 45) return "about half";
  if (pct >= 38) return "about 2 in 5";
  const n = 100 / pct;
  // Nearest whole number up to 20, then to the nearest 5, so "1 in 7" but "1 in 35".
  const r = n <= 20 ? Math.round(n) : Math.round(n / 5) * 5;
  return `about 1 in ${r}`;
}

// The short form for a table cell or a bar: "1 in 5" (no "about").
export function oneInShort(pct) {
  return oneIn(pct).replace(/^about /, "");
}

// How a share compares with a fair one: "twice", "3.4 times", "about the same as", "less than half", ...
export function againstFair(pct, fair = 10) {
  if (!Number.isFinite(pct) || !(fair > 0)) return { ratio: null, text: "" };
  const ratio = pct / fair;
  let text;
  if (ratio >= 10) text = `${Math.round(ratio)} times`;
  else if (ratio >= 2.2) text = `${(Math.round(ratio * 10) / 10).toFixed(1).replace(/\.0$/, "")} times`;
  else if (ratio >= 1.8) text = "twice";
  else if (ratio >= 1.35) text = "about 1½ times";
  else if (ratio >= 1.12) text = "a little more than";
  else if (ratio > 0.88) text = "about the same as";
  else if (ratio > 0.5) text = "less than";
  else if (ratio > 0.15) text = "well under half of";
  else text = "far below";
  return { ratio, text };
}

// One sentence for a place: "about 1 in 5 people (21%) live in the most deprived tenth, twice the fair share."
export function sentenceFor(pct, { who = "people", where = "live in the most deprived tenth", fair = 10 } = {}) {
  const f = againstFair(pct, fair);
  const verdict = f.ratio == null ? "" : f.ratio >= 1.12 ? `, ${f.text === "twice" ? "twice" : f.text} the fair share` : f.ratio > 0.88 ? ", about a fair share" : ", less than a fair share";
  return `${oneIn(pct)} ${who} (${(Math.round(pct * 10) / 10).toFixed(1).replace(/\.0$/, "")}%) ${where}${verdict}`;
}
