import { stripHtml } from "./format";

// Column layouts for each downloadable table. Headers are written for
// someone opening the file cold in a spreadsheet, not for this app.

const qLink = (q) => (q.uin && q.date_tabled ? `https://questions-statements.parliament.uk/written-questions/detail/${q.date_tabled}/${q.uin}` : "");

export const WRITTEN_QUESTION_COLUMNS = [
  { header: "UIN", key: "uin" },
  { header: "House", key: "house" },
  { header: "Date tabled", key: "date_tabled" },
  { header: "Date answered", key: "date_answered" },
  { header: "Asked by", key: "asking_member_name" },
  { header: "Party", key: "asking_member_party" },
  { header: "Department asked", key: "answering_body_name" },
  { header: "Subject", key: "heading" },
  { header: "Question", value: (q) => stripHtml(q.question_text) },
  { header: "Answer", value: (q) => stripHtml(q.answer_text) },
  { header: "Link", value: qLink },
];

// mp: the politician row the interest belongs to (looked up per row for
// the whole-register download, fixed for a single MP's own).
export const interestColumns = (mpOf) => [
  { header: "MP", value: (i) => mpOf(i)?.name },
  { header: "Party", value: (i) => mpOf(i)?.party },
  { header: "Constituency", value: (i) => mpOf(i)?.constituency },
  { header: "Category", key: "category" },
  { header: "Summary", key: "summary" },
  { header: "Donor or source", key: "donor_name" },
  { header: "Declared value (GBP)", key: "value_amount" },
  { header: "Date registered", key: "date_registered" },
  { header: "Source record", key: "source_url" },
];

export const voteColumns = (mp) => [
  { header: "MP", value: () => mp.name },
  { header: "Party", value: () => mp.party },
  { header: "Division", key: "title" },
  { header: "Date", key: "date" },
  { header: "Voted", value: (v) => (v.voted_aye == null ? "" : v.voted_aye ? "Aye" : "No") },
  { header: "Ayes in total", key: "aye_count" },
  { header: "Noes in total", key: "no_count" },
  { header: "Voted with majority of own party", value: (v) => (v.voted_with_party_majority == null ? "" : v.voted_with_party_majority ? "Yes" : "No") },
  { header: "Source record", key: "source_url" },
];

export const mpColumns = (origin) => [
  { header: "Name", key: "name" },
  { header: "Party", key: "party" },
  { header: "Constituency", key: "constituency" },
  { header: "MP since", key: "membership_start_date" },
  { header: "Government post", key: "cabinet_role" },
  { header: "Profile on this site", value: (p) => `${origin}/#/mp/${p.id}` },
];

export const SEATS_COLUMNS = [
  { header: "Party", key: "party" },
  { header: "MPs", key: "count" },
  { header: "Share of seats (%)", value: (r) => Math.round(r.pct * 10) / 10 },
  { header: "Women MPs", key: "women" },
  { header: "Share women (%)", value: (r) => Math.round(r.womenPct * 10) / 10 },
];
