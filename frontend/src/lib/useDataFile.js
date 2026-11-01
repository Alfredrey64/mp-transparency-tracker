import { useEffect, useState } from "react";

// The JSON data files a page draws on are fetched the first time any page asks for one and then kept, so going back to a page shows its figures straight away
// instead of a loading screen again, and two pages that use the same file share one fetch. A file that failed to load is not kept, so the next visit tries again.
const loaded = new Map();
const pending = new Map();

export function loadDataFile(load) {
  if (loaded.has(load)) return Promise.resolve(loaded.get(load));
  if (!pending.has(load)) pending.set(load, load().then((m) => { loaded.set(load, m.default); return m.default; }).finally(() => pending.delete(load)));
  return pending.get(load);
}

// `load` must be one of the loaders in dataFiles.js (the same function every time), which is also what the cache is keyed on.
export function useDataFile(load) {
  const [state, setState] = useState(() => ({ data: loaded.has(load) ? loaded.get(load) : null, failed: false }));
  useEffect(() => {
    if (loaded.has(load)) return undefined;
    let alive = true;
    loadDataFile(load).then((data) => alive && setState({ data, failed: false })).catch(() => alive && setState({ data: null, failed: true }));
    return () => { alive = false; };
  }, [load]);
  return state;
}
