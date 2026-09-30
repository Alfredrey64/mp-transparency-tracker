import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The frontend has its own, separate vitest setup (frontend/package.json)
    // with its own devDependencies — without this, running `npm test` here
    // also picks up frontend/src/lib/bills.test.js by directory scan, which
    // is redundant with the frontend's own `npm test` and couples this
    // root-level run to the frontend's dependency tree for no reason.
    exclude: ["**/node_modules/**", "frontend/**"],
  },
});
