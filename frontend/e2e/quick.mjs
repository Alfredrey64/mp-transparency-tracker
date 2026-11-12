// The quick browser test set: every spec except the few that open every page, which is where the time goes. Run it after each change (npm run test:quick). The full set,
// including those, is `npm run test:full`, and is what GitHub runs (the jobs in .github/workflows/ci.yml split it into parallel parts). A new spec joins the quick set on its own
// unless it is added to SLOW below.
//
// The slow specs each open every page (or every page at several widths), so a change that breaks a page is still caught, just by the full run: layout-audit (every page at five
// widths), phone-layout (every page at two phone widths), axe and accessibility (every page checked for accessibility problems), contrast (every page, light and dark),
// safari-touch (iPad and iPhone taps), teacher (every page in teacher mode) and polish (the page-top checks open every grouped page). Polish's one menu-width test, which catches a
// new page put in the wrong group, is added back on its own below.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SLOW = new Set(["layout-audit", "phone-layout", "axe", "accessibility", "contrast", "safari-touch", "teacher", "polish"]);

const specs = readdirSync(here)
  .filter((f) => f.endsWith(".spec.js"))
  .filter((f) => !SLOW.has(f.replace(/\.spec\.js$/, "")))
  .map((f) => join("e2e", f));

const run = (args) => spawnSync("npx", ["playwright", "test", ...args], { stdio: "inherit", cwd: join(here, "..") }).status ?? 1;

const first = run(specs);
const second = run(["e2e/polish.spec.js", "-g", "same menu group"]);
console.log(`\nQuick set: ${specs.length} specs plus the menu-width check. Run \`npm run test:full\` before a big release, or let GitHub do it.`);
process.exit(first || second ? 1 : 0);
