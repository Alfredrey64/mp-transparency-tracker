/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { Card } from "./AreaSections";
import { IconBroadcast, IconPin } from "./icons";
import { useDataFile } from "../lib/useDataFile";
import { councilComplaints } from "../lib/dataFiles";
import { investigated, against } from "../lib/complaintsView";
import { schoolsWithin, nearestTrusts } from "../lib/nearYou";
import { aeNearYou } from "../lib/dataFiles";
import { loadSchools } from "../lib/schoolTiles";
import { School, TrustCard } from "./story/NearYouParts";

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

// The nearest school and the nearest A&E trust to the postcode, drawn with the same cards as the Schools and A&E near you page, with a link to the rest.
const RADIUS = 5;

export function NearYouCard({ r, i }) {
  const point = r.latitude != null && r.longitude != null ? { lat: r.latitude, lon: r.longitude } : null;
  const england = !r.country || r.country === "England";
  const { data: ae, failed: aeFailed } = useDataFile(aeNearYou);
  const [schools, setSchools] = useState(undefined); // undefined while loading, null if it failed
  useEffect(() => {
    if (!point || !england) return undefined;
    let alive = true;
    loadSchools(point, RADIUS).then((list) => alive && setSchools(list)).catch(() => alive && setSchools(null));
    return () => { alive = false; };
  }, [point?.lat, point?.lon, england]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!point || !england) return null; // the figures cover England only
  const school = schools ? schoolsWithin(schools, point, RADIUS)[0] : null;
  const trust = ae ? nearestTrusts(ae.trusts, point, 1)[0] : null;
  return (
    <Card i={i} colour="#7B5BD6" icon={<IconPin size={20} />} title="Your nearest school and A&E" className="ma-nearyou">
      <ul className="ma-nearyou-grid">
        <li>
          <span className="ma-nearyou-label">Nearest school</span>
          {schools === undefined ? <p className="ma-sub">Finding the nearest school...</p>
            : school ? <ul style={{ listStyle: "none", margin: 0, padding: 0 }}><School s={school} /></ul>
              : <p className="ma-sub">{schools === null ? "The school figures did not load." : `No state-funded school is listed within ${RADIUS} miles.`}</p>}
        </li>
        <li>
          <span className="ma-nearyou-label">Nearest A&amp;E trust</span>
          {aeFailed ? <p className="ma-sub">The A&amp;E figures did not load.</p>
            : !trust ? <p className="ma-sub">Finding the nearest A&amp;E...</p>
              : <ul style={{ listStyle: "none", margin: 0, padding: 0 }}><TrustCard t={trust} nat={ae.national} month={ae.month} /></ul>}
        </li>
      </ul>
      <a className="ma-link" href="#/nearYou">All the schools within three miles, and the three nearest A&amp;E trusts</a>
    </Card>
  );
}
