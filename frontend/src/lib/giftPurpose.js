// What the registers actually say about a gift, in plain words. Neither register records what a donation was meant to achieve,
// and a donation is not recorded as buying influence, so this only describes how each gift was declared: the kind of support, not
// its aim. The MP register files each entry under a category; the Electoral Commission records whether a party gift was cash,
// goods and services, or public money.

const MP_KINDS = [
  { test: /^Donations and other support/i, key: "support", label: "Support for the MP's political work", short: "Support for work as an MP" },
  { test: /^Gifts, benefits and hospitality/i, key: "gift", label: "Gift or hospitality", short: "Gift or hospitality" },
  { test: /^Gifts and benefits from sources outside/i, key: "gift-abroad", label: "Gift from abroad", short: "Gift from abroad" },
  { test: /^Visits outside the UK/i, key: "visit", label: "Trip abroad paid for by someone else", short: "Trip abroad" },
  { test: /^Employment and earnings/i, key: "paid-work", label: "Pay for work", short: "Pay for work" },
  { test: /^Land and property/i, key: "property", label: "Land or property", short: "Land or property" },
  { test: /^Shareholdings/i, key: "shares", label: "Shares in a company", short: "Shares" },
  { test: /^Family members/i, key: "family", label: "Work involving a family member", short: "Family member's work" },
  { test: /^Miscellaneous/i, key: "other", label: "Other declared interest", short: "Other declared interest" },
];

export function mpGiftKind(category) {
  const found = MP_KINDS.find((k) => k.test.test(category ?? ""));
  return found ? { key: found.key, label: found.label, short: found.short } : { key: "other", label: "Other declared interest", short: "Other declared interest" };
}

const PARTY_KINDS = {
  Cash: { key: "party-cash", label: "Cash gift to the party", short: "Cash to a party" },
  "Non Cash": { key: "party-goods", label: "Goods or services given to the party", short: "Goods or services to a party" },
  "Public Funds": { key: "party-public", label: "Public money paid to the party, not a private gift", short: "Public money to a party" },
  "Exempt Trust": { key: "party-trust", label: "Gift from a trust", short: "Gift from a trust" },
};

export function partyGiftKind(type) {
  return PARTY_KINDS[type] ?? { key: "party-other", label: "Gift to the party", short: "Gift to a party" };
}

// How a donor's money splits by kind of gift, biggest first: [{ key, label, total, count }].
export function declaredAs(mpRows, partyRows) {
  const map = new Map();
  const add = (kind, amount) => {
    const e = map.get(kind.key) ?? { key: kind.key, label: kind.short, total: 0, count: 0 };
    e.total += amount ?? 0;
    e.count += 1;
    map.set(kind.key, e);
  };
  for (const r of mpRows) add(mpGiftKind(r.category), r.value_amount);
  for (const r of partyRows) add(partyGiftKind(r.donation_type), r.value);
  return [...map.values()].sort((a, b) => b.total - a.total);
}
