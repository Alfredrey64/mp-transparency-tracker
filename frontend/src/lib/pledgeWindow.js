// General elections since 1997 (the manifestos on the site start there), as the date of the vote.
const ELECTIONS = { "1997": "1997-05-01", "2001": "2001-06-07", "2005": "2005-05-05", "2010": "2010-05-06", "2015": "2015-05-07", "2017": "2017-06-08", "2019": "2019-12-12", "2024": "2024-07-04" };
const ORDER = Object.keys(ELECTIONS);

// The window a manifesto covers: from its election to the next election, or to today for the latest (`to` is null).
export const windowFor = (election) => {
  const i = ORDER.indexOf(String(election));
  return i < 0 ? null : { from: ELECTIONS[ORDER[i]], to: ELECTIONS[ORDER[i + 1]] ?? null };
};
