import { useEffect, useState } from "react";
import { partyChange } from "./partyChange";
import { seatKey } from "./constituency";

// The party-change note for an MP from their profile, found through their seat's 2024 result. Loads the seat data only when asked.
export function usePartyChange(politician) {
  const [found, setFound] = useState({ key: null, change: null });
  const seat = politician?.constituency ? seatKey(politician.constituency) : null;
  useEffect(() => {
    if (!seat) return undefined;
    let alive = true;
    import("../data/constituencies.json").then((m) => {
      const record = m.default.constituencies?.[seat];
      if (alive) setFound({ key: `${seat}|${politician.party}`, change: record ? partyChange({ ...record, mp: { ...record.mp, name: politician.name, party: politician.party, memberId: politician.parliament_member_id ?? record.mp?.memberId } }) : null });
    }).catch(() => {});
    return () => { alive = false; };
  }, [seat, politician?.party, politician?.name, politician?.parliament_member_id]);
  return found.key === `${seat}|${politician?.party}` ? found.change : null;
}
