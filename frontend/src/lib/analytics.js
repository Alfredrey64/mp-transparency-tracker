// Anonymous visit counts with Vercel Web Analytics: no cookies, no tracking across sites, no personal details. It counts which page was
// opened, not who opened it. Only the page's own name is sent: never a postcode, a search, a donor name or an MP, which live after the page
// name in this site's addresses. It stays off when the browser says Do Not Track or Global Privacy Control, and while developing.

import { inject, pageview } from "@vercel/analytics";

let started = false;
let ready = false;
let latest = null;

export function analyticsAllowed(nav = typeof navigator === "undefined" ? {} : navigator) {
  return nav.doNotTrack !== "1" && nav.globalPrivacyControl !== true;
}

// The path to report for a page. Answers keep their question id (it is not personal); every other page is reported by name only.
export function pathFor(view, param) {
  if (view === "answers" && param) return `/answers/${param}`;
  return `/${view}`;
}

// Vercel only serves its counting script once Web Analytics is switched on for the project. Until then the address falls through to this
// site's own page, which the browser refuses as a script and logs as an error. So ask first, and start only when a script comes back.
export function isScript(res) {
  return !!res && res.ok && /javascript/i.test(res.headers?.get("content-type") || "");
}

export async function startAnalytics(probe = (url) => fetch(url, { method: "HEAD", credentials: "omit" })) {
  if (started || !import.meta.env?.PROD || !analyticsAllowed()) return;
  started = true;
  try {
    if (!isScript(await probe("/_vercel/insights/script.js"))) throw new Error("not switched on");
    inject({ disableAutoTrack: true });
    ready = true;
    if (latest) trackPage(...latest);
  } catch {
    started = false;
  }
}

export function trackPage(view, param) {
  latest = [view, param];
  if (!ready) return;
  const path = pathFor(view, param);
  try {
    pageview({ route: path, path });
  } catch {
    // Counting visits must never get in the way of the page.
  }
}
