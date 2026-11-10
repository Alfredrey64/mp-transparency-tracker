// The calendar files people can subscribe to (written by calendarFeed.js at the repo root, served from /calendar/), as the Coming up page describes them. The names and
// what each holds are repeated here because the page cannot import the script; calendarFeeds.test.js holds the two lists together.
export const SITE_HOST = "domesdaylive.co.uk";

export const FEED_LIST = [
  { key: "bills", file: "parliament-bills.ics", name: "Bills only", about: "Each stage a bill reaches in the Commons or Lords, bill committee meetings and Royal Assent.", kinds: ["bill", "billcommittee", "assent"], away: false },
  { key: "chambers", file: "parliament-chambers.ics", name: "Bills, debates and questions", about: "The above, plus debates, questions and statements in both Houses, and the days each House is away.", kinds: ["bill", "billcommittee", "assent", "debate", "questions", "statement"], away: true },
  { key: "all", file: "parliament-everything.ics", name: "Everything listed", about: "Everything the calendar lists, including committee hearings and regulations.", kinds: null, away: true },
];

// How many items a feed holds today, counted from the calendar data the page already has.
export function countFor(feed, data) {
  const events = data.events.filter((e) => (feed.kinds ? feed.kinds.includes(e.k) : true)).length;
  return events + (feed.away ? (data.away ?? []).length : 0);
}

// The three ways in: a link the calendar app opens to subscribe, the same for Google Calendar's web page, and the plain address to paste or download.
export function feedUrls(file) {
  const path = `${SITE_HOST}/calendar/${file}`;
  return {
    webcal: `webcal://${path}`,
    google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(`webcal://${path}`)}`,
    https: `https://${path}`,
    local: `/calendar/${file}`,
  };
}
