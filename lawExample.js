// lawExample.js
//
// Chooses the Act that the "How a law is made" page follows. Of the Acts the Bills API lists, it takes the one whose journey had the most distinct stages (so the page
// can show the whole route, with the second House and the back-and-forth between them), and the most recent Royal Assent if two are level. Pure, so it is tested
// without the network.

const day = (d) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null);

// The day Royal Assent was given: the last date on its stage, if the journey has one.
export function royalAssentDate(stages) {
  const s = [...(stages ?? [])].reverse().find((x) => /royal assent/i.test(x.stage ?? ""));
  return s?.dates?.length ? s.dates[s.dates.length - 1] : null;
}

// acts: [{ bill: { billId, shortTitle, longTitle, originatingHouse }, stages: [{ house, stage, dates }] }]
// Returns { bill, stages, royalAssent } or null if no Act has a complete journey (one that ends with a dated Royal Assent).
export function pickLawExample(acts) {
  const complete = (acts ?? [])
    .map((a) => ({ ...a, royalAssent: royalAssentDate(a.stages) }))
    .filter((a) => a.royalAssent && (a.stages ?? []).length >= 5 && a.bill?.shortTitle);
  if (!complete.length) return null;
  complete.sort((a, b) => b.stages.length - a.stages.length || (b.royalAssent > a.royalAssent ? 1 : b.royalAssent < a.royalAssent ? -1 : 0));
  const best = complete[0];
  return {
    bill: {
      billId: best.bill.billId,
      shortTitle: best.bill.shortTitle,
      longTitle: best.bill.longTitle ?? null,
      originatingHouse: best.bill.originatingHouse ?? null,
      url: `https://bills.parliament.uk/bills/${best.bill.billId}`,
    },
    stages: best.stages.map((s) => ({ house: s.house, stage: s.stage, dates: (s.dates ?? []).map(day).filter(Boolean) })),
    royalAssent: best.royalAssent,
  };
}
