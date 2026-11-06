// failingSources.js
//
// Which data sources have failed on the last two daily refreshes in a row. One failure is usually a source having a bad hour and clears itself the next day; two in a row
// means it needs a person. The refresh commits pipelineStatus.json every day, so the last two commits of that file are the last two runs. The site-health workflow runs this
// and opens an issue when it names anything (one source had failed for eight days with nobody told, because the run is deliberately green whatever happens to its steps).
//
// Run it with: node failingSources.js   (prints one source per line; nothing if none)

import { execFileSync } from "child_process";

const FILE = "frontend/src/data/pipelineStatus.json";

// The labels of sources marked as failed in both of two status files.
export function failingInBoth(latest, previous) {
  const failed = (s) => new Set((s?.sources ?? []).filter((x) => !x.succeeded).map((x) => x.label));
  const before = failed(previous);
  return [...failed(latest)].filter((label) => before.has(label));
}

function main() {
  const shas = execFileSync("git", ["log", "-2", "--format=%H", "--", FILE], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  if (shas.length < 2) return;
  const read = (sha) => JSON.parse(execFileSync("git", ["show", `${sha}:${FILE}`], { encoding: "utf8" }));
  for (const label of failingInBoth(read(shas[0]), read(shas[1]))) console.log(label);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
