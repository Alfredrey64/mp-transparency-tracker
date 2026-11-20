import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The browser refuses any request to a host that vercel.json's Content-Security-Policy does not list, and it does so silently, before the request is sent. The preview used by the
// tests has no such header, so a new live lookup can pass every test and still fail on the real site (this happened to the police.uk and Food Standards Agency cards).
// Every outside host the code fetches from while a page is open must therefore be named in connect-src, in both policies.
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const policies = vercel.headers.flatMap((h) => h.headers).filter((h) => h.key === "Content-Security-Policy").map((h) => h.value);

const connectHosts = (policy) => (policy.match(/connect-src ([^;]+)/)?.[1] ?? "").split(/\s+/).filter((x) => x.startsWith("https://"));

// Where each library keeps the address it calls from the browser.
const SOURCES = ["streetCrime.js", "foodHygiene.js", "floodLive.js", "floodWarnings.js", "waterNear.js", "ballots.js", "areaReps.js", "postcodeLookup.js"];
// Only addresses that are fetched count (a constant called API, URL or SERVICE, or a fetch call), not links the reader can click.
const hostsIn = (file) => fs.readFileSync(path.join(here, file), "utf8").split("\n")
  .filter((line) => /\b(API|SERVICE|[A-Z_]*_URL|fetch\w*)\b/.test(line))
  .flatMap((line) => [...line.matchAll(/["'`](https:\/\/[a-z0-9.-]+)[/"'`?]/gi)].map((m) => m[1]));

describe("Content-Security-Policy connect-src", () => {
  it("has a policy to check", () => expect(policies.length).toBeGreaterThan(0));
  for (const file of SOURCES) {
    it(`allows every host ${file} calls`, () => {
      for (const host of new Set(hostsIn(file))) for (const policy of policies) expect(connectHosts(policy), `${host} (from ${file})`).toContain(host);
    });
  }
});
