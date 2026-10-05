import { useEffect, useState } from "react";

// The daily benchmarks file (every MP's figures and the sorted list of
// everyone's), loaded on first use and kept, or null until it arrives.
let cached = null;
let loading = null;

export function useBenchmarks() {
  const [data, setData] = useState(cached);
  useEffect(() => {
    if (cached) return;
    loading ??= import("../data/benchmarks.json").then((m) => {
      cached = m.default;
      return cached;
    });
    let cancelled = false;
    loading.then((d) => {
      if (!cancelled) setData(d);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
