// Chancellors of the Exchequer since 1945, with the dates they held the office. Used to say who was in charge of the Treasury when a tax rate was
// set. `name` is the usual full name; `short` is the surname used in tight spaces.

export const CHANCELLORS = [
  { name: "Hugh Dalton", short: "Dalton", from: "1945-07-27" },
  { name: "Stafford Cripps", short: "Cripps", from: "1947-11-13" },
  { name: "Hugh Gaitskell", short: "Gaitskell", from: "1950-10-19" },
  { name: "Rab Butler", short: "Butler", from: "1951-10-28" },
  { name: "Harold Macmillan", short: "Macmillan", from: "1955-12-20" },
  { name: "Peter Thorneycroft", short: "Thorneycroft", from: "1957-01-13" },
  { name: "Derick Heathcoat-Amory", short: "Heathcoat-Amory", from: "1958-01-06" },
  { name: "Selwyn Lloyd", short: "Lloyd", from: "1960-07-27" },
  { name: "Reginald Maudling", short: "Maudling", from: "1962-07-13" },
  { name: "James Callaghan", short: "Callaghan", from: "1964-10-16" },
  { name: "Roy Jenkins", short: "Jenkins", from: "1967-11-30" },
  { name: "Iain Macleod", short: "Macleod", from: "1970-06-20" },
  { name: "Anthony Barber", short: "Barber", from: "1970-07-25" },
  { name: "Denis Healey", short: "Healey", from: "1974-03-05" },
  { name: "Geoffrey Howe", short: "Howe", from: "1979-05-04" },
  { name: "Nigel Lawson", short: "Lawson", from: "1983-06-11" },
  { name: "John Major", short: "Major", from: "1989-10-26" },
  { name: "Norman Lamont", short: "Lamont", from: "1990-11-28" },
  { name: "Kenneth Clarke", short: "Clarke", from: "1993-05-27" },
  { name: "Gordon Brown", short: "Brown", from: "1997-05-02" },
  { name: "Alistair Darling", short: "Darling", from: "2007-06-28" },
  { name: "George Osborne", short: "Osborne", from: "2010-05-11" },
  { name: "Philip Hammond", short: "Hammond", from: "2016-07-14" },
  { name: "Sajid Javid", short: "Javid", from: "2019-07-24" },
  { name: "Rishi Sunak", short: "Sunak", from: "2020-02-13" },
  { name: "Nadhim Zahawi", short: "Zahawi", from: "2022-07-05" },
  { name: "Kwasi Kwarteng", short: "Kwarteng", from: "2022-09-06" },
  { name: "Jeremy Hunt", short: "Hunt", from: "2022-10-14" },
  { name: "Rachel Reeves", short: "Reeves", from: "2024-07-05" },
  { name: "John Healey", short: "Healey", from: "2026-07-20" },
];

// The Chancellor in office on a date (an ISO string), with how many days they had held the job.
export function chancellorOn(iso) {
  let found = null;
  for (const c of CHANCELLORS) if (c.from <= iso) found = c;
  if (!found) return null;
  const days = Math.round((Date.parse(iso) - Date.parse(found.from)) / 86400000);
  return { ...found, days };
}
