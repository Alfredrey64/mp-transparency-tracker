// Loads dated career records. They are split into SHARDS files by member id
// (see fetch-mp-careers.js and fetch-lords-careers.js), one set for MPs and
// one for peers. A profile fetches only its own shard when the Career tab
// opens; the offices page fetches them all. Each file is kept once loaded.
const SHARDS = 16;
const SETS = {
  commons: import.meta.glob("../data/careerDetail/*.json", { import: "default" }),
  lords: import.meta.glob("../data/lordsCareerDetail/*.json", { import: "default" }),
};
const DIRS = { commons: "careerDetail", lords: "lordsCareerDetail" };
const loaded = new Map();

export function shardFor(memberId) {
  return String(Number(memberId) % SHARDS).padStart(2, "0");
}

function loadShard(key, load) {
  if (!loaded.has(key)) {
    loaded.set(key, load().catch((err) => {
      loaded.delete(key);
      throw err;
    }));
  }
  return loaded.get(key);
}

export function loadCareerDetail(memberId, house = "commons") {
  const key = `../data/${DIRS[house]}/${shardFor(memberId)}.json`;
  const load = SETS[house]?.[key];
  if (!load) return Promise.resolve(null);
  return loadShard(key, load).then((shard) => shard[memberId] ?? null);
}

// Every record for one House, as { [memberId]: detail }.
export async function loadAllCareerDetail(house = "commons") {
  const entries = Object.entries(SETS[house] ?? {});
  const shards = await Promise.all(entries.map(([key, load]) => loadShard(key, load)));
  return Object.assign({}, ...shards);
}
