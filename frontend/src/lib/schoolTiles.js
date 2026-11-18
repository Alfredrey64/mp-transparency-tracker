import { tilesAround } from "./nearYou";

// The schools in the map tiles round a point, as the files on this site hold them (public/data/schools). Only the few tiles the radius can touch are fetched, and a tile that
// cannot be fetched is treated as empty.
export async function loadSchools(point, radius) {
  const tiles = await Promise.all(tilesAround(point, radius).map((k) => fetch(`/data/schools/${k}.json`).then((r) => (r.ok ? r.json() : [])).catch(() => [])));
  return tiles.flat();
}
