// Loads one council's wards, councillors and party history. The details are
// split into 16 files (see fetch-councils.js), so opening a council fetches
// a small file, kept once loaded. shardOf must match the one that wrote them.
const SHARDS = 16;
const loaders = import.meta.glob("../data/councilDetail/*.json", { import: "default" });
const loaded = new Map();

export function shardOf(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % SHARDS;
}

export function loadCouncilDetail(id) {
  const key = `../data/councilDetail/${String(shardOf(id)).padStart(2, "0")}.json`;
  const load = loaders[key];
  if (!load) return Promise.resolve(null);
  if (!loaded.has(key)) {
    loaded.set(key, load().catch((err) => {
      loaded.delete(key);
      throw err;
    }));
  }
  return loaded.get(key).then((shard) => shard[id] ?? null);
}
