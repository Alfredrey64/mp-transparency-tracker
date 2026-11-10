// The names of every page the site can show, read from the text of src/pageLoaders.js. The audit scripts run under plain Node, which cannot import that file itself (its imports have no
// file endings, which the build tools allow and Node does not).
import fs from "node:fs";

const text = fs.readFileSync(new URL("../src/pageLoaders.js", import.meta.url), "utf8");
const body = text.slice(text.indexOf("export const LOADERS"));
export const PAGE_NAMES = [...body.matchAll(/^ {2}([A-Za-z0-9_]+): /gm)].map((m) => m[1]);
