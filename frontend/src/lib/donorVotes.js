// Links a donor to votes, carefully. A donor is placed in an industry (from Companies House or a known-union list), the industry is
// mapped to the closest policy area of bills, and then we count how the MPs the donor gave to personally voted on bills in that
// area. It shows an overlap and nothing more: most MPs vote with their party whoever has funded them.

import { getDonorSector } from "./donorSectors";
import { sectorToBillCategory } from "./sectorBillMapping";
import { categoriseBill, matchBillForVote } from "./bills";

// The industry and policy area for a donor, or null where it cannot be placed with confidence.
export function donorPolicyArea(donorName) {
  const tag = getDonorSector(donorName);
  if (!tag) return null;
  const category = sectorToBillCategory(tag.sector);
  return category ? { sector: tag.sector, category } : null;
}

// votes: rows of { politician_id, title, date, voted_aye } for the MPs concerned; bills: rows of { short_title, sponsoring_department }.
// mps: [{ id, name }] in the order to show them. Returns who voted which way on bills in the policy area, bill by bill.
export function votesInArea({ votes, bills, mps, category }) {
  const categorised = (bills ?? []).map((b) => ({ ...b, category: categoriseBill(b) }));
  const byBill = new Map();
  const byMp = new Map(mps.map((m) => [m.id, { id: m.id, name: m.name, aye: 0, no: 0 }]));
  for (const v of votes ?? []) {
    const mp = byMp.get(v.politician_id);
    if (!mp || v.title == null) continue;
    const bill = matchBillForVote(v.title, categorised);
    if (bill?.category.label !== category) continue;
    if (v.voted_aye) mp.aye += 1; else mp.no += 1;
    const entry = byBill.get(v.title) ?? { title: v.title, date: v.date, aye: 0, no: 0 };
    if (v.voted_aye) entry.aye += 1; else entry.no += 1;
    byBill.set(v.title, entry);
  }
  const perMp = [...byMp.values()].filter((m) => m.aye + m.no > 0);
  const bills_ = [...byBill.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
  return {
    category,
    perMp,
    bills: bills_,
    aye: perMp.reduce((n, m) => n + m.aye, 0),
    no: perMp.reduce((n, m) => n + m.no, 0),
    mpsWithVotes: perMp.length,
  };
}
