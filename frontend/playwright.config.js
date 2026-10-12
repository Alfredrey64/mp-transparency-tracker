import { defineConfig } from "@playwright/test";

// The phone-layout test: every page is opened at phone widths and checked for sideways scrolling and for landing at the top.
// It runs against the production build served locally. The data service is pointed at a dead local address and its requests are
// refused (see e2e/phone-layout.spec.js), so the result does not depend on the network.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { baseURL: "http://localhost:4175", browserName: "chromium" },
  webServer: {
    command: "npm run build && npx vite preview --port 4175 --strictPort",
    url: "http://localhost:4175",
    reuseExistingServer: !process.env.CI,
    timeout: 240000,
    env: { VITE_SUPABASE_URL: "http://127.0.0.1:54321", VITE_SUPABASE_ANON_KEY: "test-key-not-real" },
  },
});
