/** @jsxImportSource react */
import { Card } from "./AreaSections";
import { IconBroadcast, IconPin } from "./icons";
import { useDataFile } from "../lib/useDataFile";
import { councilComplaints } from "../lib/dataFiles";
import { investigated, against } from "../lib/complaintsView";

// Two small cards on the Your area page that point at the pages built on the Ombudsman's complaint figures and on the school and A&E figures. The complaints card reads
// the same saved file as the How councils handle complaints page; the other is a signpost only, because the page itself finds schools and A&E from the saved postcode.

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

export function NearYouCard({ r, i }) {
  if (r.country && r.country !== "England") return null;
  return (
    <Card i={i} colour="#7B5BD6" icon={<IconPin size={20} />} title="Schools and A&E near you" className="ma-nearyou">
      <p>Every state-funded school within three miles of {r.postcode} with its latest Ofsted result, and how the three nearest NHS trusts are doing on four-hour A&amp;E waits.</p>
      <a className="ma-link" href="#/nearYou">See what is near {r.postcode}</a>
    </Card>
  );
}
