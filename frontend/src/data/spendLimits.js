// The campaign spending limits as they stand in the Acts on 12 November 2026 (Representation of the People Act 1983 section 76; Political Parties, Elections and Referendums Act 2000
// Schedule 9), after the uprating of November 2023. Used by the calculators on the election spending page.
export const LIMITS = {
  candidateFixed: 11390,
  perVoter: { county: 0.12, borough: 0.08 },
  byElection: 180050,
  party: { perSeat: 54010, minimum: { England: 1458440, Scotland: 216060, Wales: 108030 } },
  gbSeats: 632,
};
export const candidateLimit = (kind, voters) => LIMITS.candidateFixed + LIMITS.perVoter[kind] * voters;
export const partyLimit = (seats) => LIMITS.party.perSeat * seats;
// The most seats a party can stand in a part of Great Britain before its per-seat total passes that part's minimum.
export const minimumReach = (nation) => Math.floor(LIMITS.party.minimum[nation] / LIMITS.party.perSeat);
