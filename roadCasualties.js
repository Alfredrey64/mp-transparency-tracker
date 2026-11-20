// roadCasualties.js — turns the Department for Transport's road casualty statistics ("STATS19": every road collision in Great Britain that police recorded with an injury) into the
// small table the Your area page reads: for every council area, how many people were killed, seriously injured and slightly injured in each of the last five years, and who the
// people killed or seriously injured in the latest year were (on foot, on a bike, on a motorbike, in a car, other). Pure, so the rules can be tested without the 150 MB of files.

// A few lines at a time: files this size are read as text and split on newlines, so quotes with newlines inside do not occur in these (all fields are plain codes).
export function csvLine(line) { return line.split(","); }

// Councils that no longer exist under the code the early years used (reorganised on 1 April 2023). The new code is what a postcode lookup returns today, so old collisions are
// counted under it: Cumbria, North Yorkshire and Somerset became unitary councils; Barnsley and Sheffield were given new codes.
export const CODE_NOW = {
  E07000026: "E06000063", E07000028: "E06000063", E07000029: "E06000063", // Allerdale, Carlisle, Copeland -> Cumberland
  E07000027: "E06000064", E07000030: "E06000064", E07000031: "E06000064", // Barrow, Eden, South Lakeland -> Westmorland and Furness
  E07000163: "E06000065", E07000164: "E06000065", E07000165: "E06000065", E07000166: "E06000065", E07000167: "E06000065", E07000168: "E06000065", E07000169: "E06000065", // North Yorkshire districts
  E07000187: "E06000066", E07000188: "E06000066", E07000189: "E06000066", E07000246: "E06000066", // Mendip, Sedgemoor, South Somerset, Somerset West and Taunton -> Somerset
  E08000016: "E08000038", E08000019: "E08000039", // Barnsley, Sheffield
};

// STATS19 casualty_type codes -> the groups the page shows.
export function userGroup(code) {
  const c = Number(code);
  if (c === 0) return "walking";
  if (c === 1) return "cycling";
  if ([2, 3, 4, 5, 23, 97].includes(c)) return "motorbike";
  if ([8, 9, 10, 11, 19, 20, 21, 98].includes(c)) return "vehicle";
  return "other"; // mobility scooters, horse riders, tram, e-scooters, other
}
export const GROUPS = ["walking", "cycling", "motorbike", "vehicle", "other"];

// Police forces have been moving, one by one, from judging "serious" by what an officer sees at the scene to recording the actual injury, which counts more people as serious. The Department
// publishes for every casualty the chance, on the injury-based standard, that they would count as serious (0 to 1; for a force already on that standard it is simply 0 or 1). Adding those up
// gives serious and slight counts that mean the same thing in every year and every area, so those are what is kept. Killed is exact. If a file lacks the column, the police's own severity is used.
const SERIOUS_CHANCE = "casualty_adjusted_severity_serious";
const FATAL = "1";

function rows(text, needs) {
  const lines = text.split(/\r?\n/);
  const head = csvLine(lines[0]);
  const col = Object.fromEntries(head.map((h, i) => [h, i]));
  for (const n of needs) if (col[n] == null) throw new Error(`The road casualty file has no ${n} column`);
  return { lines, col };
}

// collisionText / casualtyText: the two files' contents. Casualties carry no area, so each is placed through its collision.
export function buildRoadCasualties(collisionText, casualtyText) {
  const c = rows(collisionText, ["collision_index", "collision_year", "local_authority_ons_district"]);
  const place = new Map(); // collision_index -> [area, year]
  const years = new Set();
  for (let i = 1; i < c.lines.length; i++) {
    const line = c.lines[i];
    if (!line) continue;
    const f = csvLine(line);
    const raw = f[c.col.local_authority_ons_district];
    if (!/^[ESWN]\d{8}$/.test(raw)) continue; // Heathrow and blanks have no council
    const area = CODE_NOW[raw] ?? raw;
    const year = Number(f[c.col.collision_year]);
    if (!year) continue;
    place.set(f[c.col.collision_index], [area, year]);
    years.add(year);
  }
  if (!place.size) throw new Error("The road collision file had no usable rows");
  const yearList = [...years].sort((a, b) => a - b);
  const latest = yearList[yearList.length - 1];
  const y = rows(casualtyText, ["collision_index", "casualty_severity", "casualty_type"]);
  const areas = {};
  const gb = { by: Object.fromEntries(yearList.map((yr) => [yr, [0, 0, 0]])), now: Object.fromEntries(GROUPS.map((g) => [g, 0])) };
  let matched = 0;
  for (let i = 1; i < y.lines.length; i++) {
    const line = y.lines[i];
    if (!line) continue;
    const f = csvLine(line);
    const where = place.get(f[y.col.collision_index]);
    if (!where) continue;
    const sev = f[y.col.casualty_severity];
    if (sev !== FATAL && sev !== "2" && sev !== "3") continue;
    matched++;
    const [area, year] = where;
    const a = (areas[area] ??= { by: Object.fromEntries(yearList.map((yr) => [yr, [0, 0, 0]])), now: Object.fromEntries(GROUPS.map((g) => [g, 0])) });
    let killed = 0; let serious = 0;
    if (sev === FATAL) killed = 1;
    else {
      const chance = y.col[SERIOUS_CHANCE] != null ? Number(f[y.col[SERIOUS_CHANCE]]) : NaN;
      serious = chance >= 0 && chance <= 1 ? chance : sev === "2" ? 1 : 0;
    }
    const slight = sev === FATAL ? 0 : 1 - serious;
    for (const t of [a, gb]) { const row = t.by[year]; row[0] += killed; row[1] += serious; row[2] += slight; }
    if (year === latest && killed + serious > 0) { const g = userGroup(f[y.col.casualty_type]); const w = killed + serious; a.now[g] += w; gb.now[g] += w; }
  }
  if (matched < place.size * 0.5) throw new Error("Too few casualties matched a collision; the two files do not line up");
  const tidy = (t) => { for (const yr of Object.keys(t.by)) t.by[yr] = t.by[yr].map((v) => Math.round(v * 10) / 10); for (const g of GROUPS) t.now[g] = Math.round(t.now[g] * 10) / 10; };
  tidy(gb); Object.values(areas).forEach(tidy);
  return { years: yearList, latest, areas: Object.fromEntries(Object.entries(areas).sort(([a], [b]) => a.localeCompare(b))), gb };
}
