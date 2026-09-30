// report-pipeline-status.js
//
// The daily fetch-data workflow runs 19 independent scripts with
// continue-on-error set on every one of them (deliberately — see that
// workflow's own comment for why), which means the workflow run itself can
// show green even when several of those scripts silently failed. Nothing
// surfaced that anywhere except by opening the Actions tab and reading
// every step by hand.
//
// This runs as the workflow's last step (with `if: always()`, so it runs
// whether earlier steps failed or not) and turns each step's outcome
// (passed in as a `STATUS_<id>` env var — see fetch-data.yml) into a
// small JSON file the live site can read directly, the same way the
// donor-sector tagger's own generated JSON already works.
//
// Run it with: node report-pipeline-status.js (normally only from CI)

import { writeFileSync } from "fs";

// id (matches each step's `id:` in fetch-data.yml) -> a short, page-ready
// label. Order here is the order the status list renders in.
const SCRIPTS = [
  { id: "fetch_interests", label: "Financial interests" },
  { id: "fetch_votes", label: "Voting records" },
  { id: "fetch_bills", label: "Bills" },
  { id: "fetch_mp_news", label: "MP news" },
  { id: "fetch_donor_sectors", label: "Donor sector tagging" },
  { id: "fetch_party_donations", label: "Party donations" },
  { id: "fetch_party_donor_sectors", label: "Party donor sector tagging" },
  { id: "fetch_former_mps", label: "Former MPs" },
  { id: "fetch_by_elections", label: "By-elections" },
  { id: "fetch_on_this_day", label: "On this day" },
  { id: "fetch_todays_business", label: "Today's Commons business" },
  { id: "fetch_peers", label: "House of Lords peers" },
  { id: "fetch_mp_activity", label: "MP activity" },
  { id: "fetch_ipsa_expenses", label: "IPSA business cost claims" },
  { id: "fetch_petitions", label: "Petitions" },
  { id: "fetch_ministerial_gifts", label: "Ministerial gifts & hospitality" },
  { id: "fetch_committees", label: "Select committees" },
  { id: "fetch_written_questions", label: "Written questions" },
  { id: "fetch_standards_reports", label: "Standards reports" },
];

// GitHub Actions step `outcome` is "success", "failure", "cancelled", or
// "skipped" — anything not explicitly "success" counts as failed here,
// same as continue-on-error already treats it for the workflow's own
// purposes.
const results = SCRIPTS.map(({ id, label }) => ({
  label,
  succeeded: process.env[`STATUS_${id}`] === "success",
}));

const output = {
  generatedAt: new Date().toISOString(),
  succeededCount: results.filter((r) => r.succeeded).length,
  totalCount: results.length,
  sources: results,
};

writeFileSync("frontend/src/data/pipelineStatus.json", JSON.stringify(output, null, 2) + "\n");
console.log(`Pipeline status: ${output.succeededCount}/${output.totalCount} sources succeeded.`);
if (output.succeededCount < output.totalCount) {
  console.log("Failed:", results.filter((r) => !r.succeeded).map((r) => r.label).join(", "));
}
