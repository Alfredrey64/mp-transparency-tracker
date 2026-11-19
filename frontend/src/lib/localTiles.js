import { tilesAround } from "./nearYou";

// The records in the map tiles round a point, for any of the local datasets saved as tiles under public/data/<folder>/<tile>.json (schools, health services). Only the few tiles
// the radius can touch are fetched, and a tile that cannot be fetched is treated as empty, so a gap shows as "none found" rather than as an error for the whole card.
export async function loadTiles(folder, point, radius) {
  const tiles = await Promise.all(tilesAround(point, radius).map((k) => fetch(`/data/${folder}/${k}.json`).then((r) => (r.ok ? r.json() : [])).catch(() => [])));
  return tiles.flat();
}
