// The results lines shown on a school's card: GCSE results for a secondary school, the Year 6 test results for a primary school, each set against England's. A school with no
// published figure gets no line. `meta` is src/data/schoolResultsMeta.json (England's figures). Pure and tested.

const near = (value, nat, margin) => (value - nat > margin ? "above" : nat - value > margin ? "below" : "close to");

const compare = (value, nat, margin) => `${near(value, nat, margin)} the England average`;

// Returns { label, small, big, text, extra: [{ label, text }] } or null.
export function resultRow(school, meta) {
  const s4 = school.s4;
  const s2 = school.s2;
  if (s4 && meta?.ks4) {
    const n = meta.ks4;
    const same = s4.y === n.y;
    return {
      label: "GCSE results",
      small: `${s4.y}${s4.v ? ", provisional" : ""}`,
      big: s4.a.toFixed(1),
      text: `Attainment 8: the average score across eight subjects for each pupil. ${same ? `England's state-funded schools average ${n.a.toFixed(1)}, so this is ${compare(s4.a, n.a, 1)}.` : `England averaged ${n.a.toFixed(1)} in ${n.y}.`}`,
      extra: [
        s4.g5 != null && { label: "Grade 5 or above in English and maths", text: `${s4.g5}% of pupils${same && n.g5 != null ? `, against ${n.g5}% across England` : ""}.` },
        s4.g4 != null && { label: "Grade 4 or above in English and maths", text: `${s4.g4}% of pupils${same && n.g4 != null ? `, against ${n.g4}% across England` : ""}.` },
        s4.pr != null && { label: "Progress 8", text: `${s4.pr > 0 ? "+" : ""}${s4.pr.toFixed(2)}: how far pupils progressed from their Year 6 results, compared with similar pupils elsewhere. 0 is average.` },
      ].filter(Boolean),
    };
  }
  if (s2 && meta?.ks2) {
    const n = meta.ks2;
    const same = s2.y === n.y;
    return {
      label: "Year 6 test results",
      small: s2.y,
      big: `${s2.e}%`,
      text: `reached the expected standard in reading, writing and maths. ${same ? `Across England's state-funded schools it was ${n.e}%, so this is ${compare(s2.e, n.e, 3)}.` : `England was ${n.e}% in ${n.y}.`}${s2.h != null ? ` ${s2.h}% reached the higher standard.` : ""}`,
      extra: [],
    };
  }
  return null;
}
