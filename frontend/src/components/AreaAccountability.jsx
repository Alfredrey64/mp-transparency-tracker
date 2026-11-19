/** @jsxImportSource react */
import { Card } from "./AreaSections";
import { IconBroadcast } from "./icons";
import { useDataFile } from "../lib/useDataFile";
import { councilComplaints } from "../lib/dataFiles";
import { investigated, against } from "../lib/complaintsView";

// The complaints card on the Your area page (In numbers view). It reads the same saved file as the How councils handle complaints page.

const n = (v) => Number(v ?? 0).toLocaleString("en-GB");

function Line({ c, year }) {
  const inv = investigated(c);
  const rel = against(c);
  return (
    <p>
      <b>{c.name}:</b> the Ombudsman decided {n(c.decided)} complaints and enquiries in {year}
      {inv > 0 ? `, and investigated ${n(inv)} in full. ${n(c.upheld)} were upheld${rel ? `, which is ${rel} the average for similar councils` : ""}.` : ", and none went to a full investigation."}
    </p>
  );
}

export function ComplaintsCard({ council, county, i }) {
  const { data, failed } = useDataFile(councilComplaints);
  const ids = [council?.id, county?.id].filter(Boolean);
  if (failed || !council || (data && !ids.some((id) => data.councils[id]))) return null; // outside England, or no figures for this council: the card is left out
  return (
    <Card i={i} colour="#2C7DA0" icon={<IconBroadcast size={20} />} title="Complaints about your council" className="ma-complaints">
      {!data ? <p className="ma-sub">Loading the Ombudsman's figures...</p> : (
        <>
          {ids.filter((id) => data.councils[id]).map((id) => <Line key={id} c={data.councils[id]} year={data.year} />)}
          <a className="ma-link" href="#/councilComplaints">All the figures, and how to read them fairly</a>
        </>
      )}
    </Card>
  );
}
