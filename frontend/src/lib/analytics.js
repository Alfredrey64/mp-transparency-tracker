// Anonymous visit counts with Vercel Web Analytics: no cookies, no tracking across sites, no personal details. It counts which page was
// opened, not who opened it. Only the page's own name is sent: never a postcode, a search, a donor name or an MP, which live after the page
// name in this site's addresses. It stays off when the browser says Do Not Track or Global Privacy Control, and while developing.

import { inject, pageview } from "@vercel/analytics";

let started = false;

export function analyticsAllowed(nav = typeof navigator === "undefined" ? {} : navigator) {
  return nav.doNotTrack !== "1" && nav.globalPrivacyControl !== true;
}

// The path to report for a page. Answers keep their question id (it is not personal); every other page is reported by name only.
export function pathFor(view, param) {
  if (view === "answers" && param) return `/answers/${param}`;
  return `/${view}`;
}

export function startAnalytics() {
  if (started || !import.meta.env?.PROD || !analyticsAllowed()) return;
  started = true;
  try {
    inject({ disableAutoTrack: true });
  } catch {
    started = false;
  }
}

export function trackPage(view, param) {
  if (!started) return;
  const path = pathFor(view, param);
  try {
    pageview({ route: path, path });
  } catch {
    // Counting visits must never get in the way of the page.
  }
}
