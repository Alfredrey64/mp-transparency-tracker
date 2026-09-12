import donorProfileData from "../data/donorProfiles.json";

// Hand-researched, sourced descriptions for the largest named-individual
// donors to each party — who they are, in their own public words or
// well-reported facts, not a guess at their motive for giving. Deliberately
// small and manually curated (unlike the Companies House sector tagging,
// there's no reliable API for "who is this person") — most donors simply
// won't have an entry, and that's left blank rather than guessed at.
export function getDonorProfile(donorName) {
  if (!donorName) return null;
  return donorProfileData[donorName.trim()] ?? null;
}

// Several of the largest "donors" to parties aren't donors at all — they're
// statutory state funding (Short Money, Cranborne Money, Policy Development
// Grants) that the Electoral Commission's donations register happens to
// record the same way as a real donation. Surfacing what these actually are
// matters for transparency: money that looks like a mega-donation from "The
// Electoral Commission" is really Parliament funding opposition parties to
// do their job.
const PUBLIC_FUND_RULES = [
  { test: /electoral commission/i, description: "A Policy Development Grant — a small state grant the Electoral Commission distributes to help political parties develop policy. Not a donation from a person or organisation." },
  { test: /house of lords/i, description: "\"Cranborne Money\" — UK state funding paid to opposition parties to support their work in the House of Lords. Not a donation from a person or organisation." },
  { test: /house of commons|gwasanaethau corfforaethol/i, description: "\"Short Money\" — UK state funding paid to opposition parties to support their parliamentary work in the Commons. Not a donation from a person or organisation." },
  { test: /northern ireland assembly/i, description: "Financial Assistance for Political Parties — the Northern Ireland Assembly's equivalent of Short Money, funding opposition parties' Assembly work. Not a donation from a person or organisation." },
  { test: /scottish parliament/i, description: "State funding the Scottish Parliament provides to political parties to support their parliamentary duties. Not a donation from a person or organisation." },
];

export function publicFundDescription(donorName) {
  if (!donorName) return null;
  const hit = PUBLIC_FUND_RULES.find((r) => r.test.test(donorName));
  return hit?.description ?? null;
}
