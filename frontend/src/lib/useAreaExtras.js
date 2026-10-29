import { useEffect, useState } from "react";
import { seatKey } from "./constituency";
import { seatDeprivation, regionSnapshot, yearsOfPay } from "./seatLocal";
import { loadSector } from "./onsData";
import { findContests } from "./ballots";
import { regionKeyOf } from "./areaFigures";
import { loadCouncilDetail } from "./councilDetail";
import { historyRows } from "./councils";
import { seatProfile, councilTaxProfile, neighbourhoodRank, censusFacts, placeFacts, whoDoesWhat, responsibilities, nextContests, seatMapProfile, councilYears } from "./areaProfile";

const soft = (p) => Promise.resolve(p).catch(() => null);

const load = (file) => soft(file.then((m) => m.default));

// Everything the sections need, loaded once the postcode lookup has answered. It arrives in three stages so each card can fill in as soon as its own files
// are here, instead of every card waiting for the largest: the small files first, then the 2024 results and history, then the elections lookup. A field is
// `undefined` while it is still on its way, and `null` or empty once it is known that there is nothing to show.
export function useAreaExtras(data) {
  const [x, setX] = useState(null);
  const { result: r, council, county } = data;
  useEffect(() => {
    let alive = true;
    const put = (patch) => { if (alive) setX((prev) => ({ ...prev, ...patch })); };
    const key = seatKey(r.parliamentary_constituency);
    const regionKey = regionKeyOf(r);

    // Stage 1: small files.
    Promise.all([
      load(import("../data/councilTaxByCouncil.json")), load(import("../data/deprivationConstituencies.json")), load(import("../data/deprivationNations.json")),
      load(import("../data/deprivation.json")), load(import("../data/regionalProfile.json")), load(import("../data/councilsIndex.json")),
      soft(loadSector("housing")), soft(loadSector("jobs")), soft(loadSector("regions")),
      council ? soft(loadCouncilDetail(council.id)) : null,
    ]).then(([taxFile, depSeats, depNations, depAreas, census, councilIndex, housing, jobs, regions, councilDetail]) => {
      const sectors = { housing, jobs, regions };
      const tax = councilTaxProfile(taxFile, council?.name, county?.name);
      const snapshot = regionKey && housing ? regionSnapshot(regionKey, (ref) => sectors[ref.sector]?.series?.[ref.id] ?? null) : [];
      const sources = depSeats && depNations ? { england: depSeats.seats, wales: depNations.wales?.seats, scotland: depNations.scotland?.seats, northernireland: depNations.northernireland?.seats } : null;
      put({
        tax, regionKey, snapshot, pay: yearsOfPay(snapshot), census: censusFacts(census, regionKey),
        nb: neighbourhoodRank(r),
        seatDep: sources ? seatDeprivation(r.parliamentary_constituency, sources) : null,
        seatDomains: depSeats?.seats?.find((z) => seatKey(z.name) === key)?.domains ?? null,
        councilDep: depAreas?.areas && council ? (() => { const a = depAreas.areas.find((z) => z.code === council.id); return a ? { rank: a.rank, of: depAreas.areas.length, worst10: a.worst10 } : null; })() : null,
        facts: placeFacts(r), who: whoDoesWhat({ council, county, taxType: tax?.type }), topics: council ? responsibilities({ council, county, result: r }) : [],
        years: councilIndex && councilDetail ? councilYears(historyRows(councilDetail, councilIndex.historyColumns)) : [],
      });
    });

    // Stage 2: the 2024 results, who won before, and the map.
    Promise.all([
      soft(import("../data/constituencies.json").then((m) => m.default.constituencies)), load(import("../data/constituencySummary.json")),
      soft(import("../data/constituencyHistory.json").then((m) => m.default.bySeat)), load(import("../data/electionHistory.json")),
      soft(import("../data/seatHexes.json").then((m) => m.default.hexes)),
    ]).then(([seats, summary, history, elections, hexes]) => {
      put({ seat: seats ? seatProfile({ key, seats, summary, history, elections }) : null, map: hexes && seats ? seatMapProfile({ hexes, seats, key }) : null });
    });

    // Stage 3: the elections coming up, which need the network.
    soft(findContests(r.postcode)).then((contests) => put({ contests: contests ? nextContests(contests) : null }));
    return () => { alive = false; };
  }, [r, council, county]);
  return x;
}
