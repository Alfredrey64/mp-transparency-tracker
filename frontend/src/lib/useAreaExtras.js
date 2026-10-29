import { useEffect, useState } from "react";
import { seatKey } from "./constituency";
import { seatDeprivation, regionSnapshot, yearsOfPay } from "./seatLocal";
import { loadSector } from "./onsData";
import { findContests } from "./ballots";
import { regionKeyOf } from "./areaFigures";
import { seatProfile, councilTaxProfile, neighbourhoodRank, censusFacts, placeFacts, whoDoesWhat, responsibilities, nextContests } from "./areaProfile";

const soft = (p) => Promise.resolve(p).catch(() => null);

// Everything the sections need, loaded once the postcode lookup has answered.
export function useAreaExtras(data) {
  const [x, setX] = useState(null);
  const { result: r, council, county } = data;
  useEffect(() => {
    let alive = true;
    (async () => {
      const key = seatKey(r.parliamentary_constituency);
      const regionKey = regionKeyOf(r);
      const [seats, summary, history, elections, taxFile, depSeats, depNations, depAreas, census, housing, jobs, regions, contests] = await Promise.all([
        soft(import("../data/constituencies.json").then((m) => m.default.constituencies)),
        soft(import("../data/constituencySummary.json").then((m) => m.default)),
        soft(import("../data/constituencyHistory.json").then((m) => m.default.bySeat)),
        soft(import("../data/electionHistory.json").then((m) => m.default)),
        soft(import("../data/councilTaxByCouncil.json").then((m) => m.default)),
        soft(import("../data/deprivationConstituencies.json").then((m) => m.default)),
        soft(import("../data/deprivationNations.json").then((m) => m.default)),
        soft(import("../data/deprivation.json").then((m) => m.default)),
        soft(import("../data/regionalProfile.json").then((m) => m.default)),
        soft(loadSector("housing")), soft(loadSector("jobs")), soft(loadSector("regions")),
        soft(findContests(r.postcode)),
      ]);
      const sectors = { housing, jobs, regions };
      const tax = councilTaxProfile(taxFile, council?.name, county?.name);
      const snapshot = regionKey && housing ? regionSnapshot(regionKey, (ref) => sectors[ref.sector]?.series?.[ref.id] ?? null) : [];
      const sources = depSeats && depNations ? { england: depSeats.seats, wales: depNations.wales?.seats, scotland: depNations.scotland?.seats, northernireland: depNations.northernireland?.seats } : null;
      const next = {
        seat: seats ? seatProfile({ key, seats, summary, history, elections }) : null,
        tax,
        nb: neighbourhoodRank(r),
        seatDep: sources ? seatDeprivation(r.parliamentary_constituency, sources) : null,
        seatDomains: depSeats?.seats?.find((s) => seatKey(s.name) === key)?.domains ?? null,
        councilDep: depAreas?.areas && council ? (() => { const a = depAreas.areas.find((z) => z.code === council.id); return a ? { rank: a.rank, of: depAreas.areas.length, worst10: a.worst10 } : null; })() : null,
        snapshot, pay: yearsOfPay(snapshot), census: censusFacts(census, regionKey),
        facts: placeFacts(r), who: whoDoesWhat({ council, county, taxType: tax?.type }), topics: council ? responsibilities({ council, county, result: r }) : [],
        contests: contests ? nextContests(contests) : null,
      };
      if (alive) setX(next);
    })();
    return () => { alive = false; };
  }, [r, council, county]);
  return x;
}
