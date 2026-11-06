// check-saved-data.js
//
// Run by the daily refresh just before it commits. For every data file the refresh changed (under frontend/src/data and frontend/public/data), asks judge() in
// savedDataCheck.js whether the rebuilt file is fit to publish, and puts the committed version back for any that is not, so the site goes on showing yesterday's good
// figures instead of today's broken ones. It says what it did in the log, and exits with 1 if it put anything back, which the run records as a failed "check".
//
// Run it with: node check-saved-data.js

import { execFileSync } from "child_process";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { judge } from "./savedDataCheck.js";

const DIRS = ["frontend/src/data", "frontend/public/data"];
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

const changed = git("status", "--porcelain", "--untracked-files=all", "--", ...DIRS).split("\n").filter(Boolean)
  .map((l) => ({ state: l.slice(0, 2).trim(), file: l.slice(3).replace(/^"|"$/g, "") }))
  .filter((c) => c.file.endsWith(".json"));

let putBack = 0;
for (const { state, file } of changed) {
  if (!existsSync(file)) continue;
  const isNew = state === "??" || state === "A";
  let before = null;
  if (!isNew) {
    try { before = git("show", `HEAD:${file}`); } catch { before = null; }
  }
  const verdict = judge(before, readFileSync(file, "utf8"));
  if (verdict.ok) continue;
  putBack++;
  console.log(`::warning::${file} was not committed: ${verdict.reason}. The committed version was put back.`);
  if (before === null) unlinkSync(file);
  else git("checkout", "HEAD", "--", file);
}

console.log(`${changed.length} changed data file${changed.length === 1 ? "" : "s"} checked, ${putBack} put back.`);
process.exit(putBack ? 1 : 0);
