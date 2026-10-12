// The national result of the 4 July 2024 UK general election, as published by Parliament at electionresults.parliament.uk (the "By party"
// table for the UK). Votes are for the party across every seat it stood in. The table covers registered parties only: independent candidates
// and the Speaker's are not in it, so the votes of everyone else is worked out as what is left of the valid votes.
//
// Seats are not copied here as a source of truth: the page counts them from each seat's own result (data/constituencies.json), and a test
// checks that count against `seats` below, so a change in the data that disagrees with the published result is noticed.

export const GE2024 = {
  date: "2024-07-04",
  source: "UK Parliament, election results for the 4 July 2024 general election",
  sourceUrl: "https://electionresults.parliament.uk/general-elections/6",
  electorate: 48224212,
  validVotes: 28809340,
  invalidVotes: 116253,
  // [party as named in our seat data, votes, seats won]
  parties: [
    ["Labour", 9708716, 411],
    ["Conservative", 6828925, 121],
    ["Reform UK", 4117610, 5],
    ["Liberal Democrat", 3519143, 72],
    ["Green Party", 1843124, 4],
    ["Scottish National Party", 724758, 9],
    ["Plaid Cymru", 194811, 4],
    ["Sinn Féin", 210891, 7],
    ["Democratic Unionist Party", 172058, 5],
    ["Alliance", 117191, 1],
    ["Social Democratic & Labour Party", 86861, 2],
    ["Ulster Unionist Party", 94779, 1],
    ["Traditional Unionist Voice", 48685, 1],
    ["Workers Party of Britain", 210252, 0],
  ],
  // Elected as independents, including the Speaker, who stands without a party label.
  independentSeats: 7,
};

// Share of turnout, the way Parliament's own table counts it: valid votes over the electorate.
export const turnoutPct = () => (GE2024.validVotes / GE2024.electorate) * 100;
