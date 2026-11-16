import { use } from "react";

// Like React.lazy, with one difference that matters for page changes: a page whose code has already been fetched (see preloadPage) renders in
// the very same pass, instead of suspending once while React notices the code has arrived. That one-off suspension is what used to put the
// loading skeleton on screen for a frame in the middle of a cross-fade.
const pages = new Map();

export function lazyPage(loader) {
  const known = pages.get(loader);
  if (known) return known.Page;
  const entry = { promise: null };
  entry.load = () => {
    if (!entry.promise) {
      const p = loader().then((m) => { p.status = "fulfilled"; p.value = m.default; return m.default; });
      // A failed fetch (the connection dropped, or a newer publish replaced the file) is shown as a failure for a couple of seconds, so the page's error box appears
      // instead of the page asking again and again behind "Loading", and is then forgotten so that going back to the page really tries again.
      p.catch((error) => {
        p.status = "rejected"; p.reason = error;
        setTimeout(() => { if (entry.promise === p) entry.promise = null; }, 2000);
      });
      entry.promise = p;
    }
    return entry.promise;
  };
  entry.Page = function Page(props) {
    const Component = use(entry.load());
    return <Component {...props} />;
  };
  pages.set(loader, entry);
  return entry.Page;
}

// Fetches a page's code ahead of showing it. Resolves once it is ready (or immediately when it already is); never rejects.
export function preloadPage(loader) {
  const entry = pages.get(loader);
  if (entry?.promise?.status === "rejected") entry.promise = null; // asked for on purpose (a hover, a tap): try again now
  return Promise.resolve(entry ? entry.load() : loader?.()).catch(() => {});
}
