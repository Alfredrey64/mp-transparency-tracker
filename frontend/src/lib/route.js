// Page addresses are real paths: /taxRates/vat, /constituency/Holborn%20and%20St%20Pancras. The rest of the code still writes them the old way, as
// "#/taxRates/vat" in links and history calls, so this file is the one place that turns those into paths. It also keeps every old shared link working:
// an address like https://site/#/taxRates/vat is turned into https://site/taxRates/vat as soon as the page opens.

export const hashToPath = (value) => (typeof value === "string" && value.startsWith("#/") ? value.slice(1) : value);

// "/taxRates/vat" for a path, "#/taxRates/vat" for the old form.
export const pathOf = (value) => hashToPath(value) || "/";

// What the address bar says now, as the part after the first slash: "taxRates/vat".
export const currentRoute = () => window.location.pathname.replace(/^\/+/, "").replace(/\/+$/, "");

// Go to a page: adds a history entry and tells the app, as clicking a link would.
export function navigate(to) {
  window.history.pushState(null, "", pathOf(to));
  window.dispatchEvent(new PopStateEvent("popstate"));
}

let installed = false;

// Call once, before the app starts.
export function installRouting() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // An old hash address becomes a path.
  if (window.location.hash.startsWith("#/")) {
    window.history.replaceState(null, "", `${hashToPath(window.location.hash)}${window.location.search}`);
  }

  // Any history call made with an old-style "#/page" address is made with the path instead.
  for (const method of ["pushState", "replaceState"]) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (state, title, url) => original(state, title, typeof url === "string" ? hashToPath(url) : url);
  }

  // A plain link to "#/page" moves to the page without reloading it. Links opened in a new tab or with a modifier key are left to the browser, which
  // opens the old-style address and has it turned into a path as above.
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const href = link?.getAttribute("href");
    if (!link || !href?.startsWith("#/") || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    event.preventDefault();
    navigate(href);
  });

  // Anything that still changes the hash by hand ends up in the same place.
  window.addEventListener("hashchange", () => {
    if (!window.location.hash.startsWith("#/")) return;
    window.history.replaceState(null, "", `${hashToPath(window.location.hash)}${window.location.search}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}
