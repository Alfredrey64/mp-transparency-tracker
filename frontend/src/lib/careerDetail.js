// Loads one MP's dated career record. The records are split into SHARDS
// files by member id (see fetch-mp-careers.js), each fetched only when a
// profile's Career tab opens, and kept once loaded.
const SHARDS = 16;
const loaders = import.meta.glob("../data/careerDetail/*.json", { import: "default" });
const loaded = new Map();

export function shardFor(memberId) {
  return String(Number(memberId) % SHARDS).padStart(2, "0");
}

export function loadCareerDetail(memberId) {
  const key = `../data/careerDetail/${shardFor(memberId)}.json`;
  const load = loaders[key];
  if (!load) return Promise.resolve(null);
  if (!loaded.has(key)) loaded.set(key, load().catch((err) => {
    loaded.delete(key);
    throw err;
  }));
  return loaded.get(key).then((shard) => shard[memberId] ?? null);
}
