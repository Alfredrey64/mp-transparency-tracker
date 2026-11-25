/** @jsxImportSource react */
import { sectorsIn, sectorOf, NO_SECTOR } from "../../lib/sectors";
import "../../sectors.css";

// The key to the subject colours used on the three parts of What changed this week. It lists only the subjects that appear in the entries it is given, with how many of each, and says
// in words that the subject is worked out from the title (so it can be wrong or missing, which is why a title that fits none is left "Not sorted").
export default function SectorKey({ entries, label = "The colour of a dot is the subject", note = true }) {
  const rows = sectorsIn(entries);
  if (rows.length === 0) return null;
  return (
    <div className="sx-key">
      <p className="sx-key-t">{label}</p>
      <ul className="sx-key-l">
        {rows.map((s) => <li key={s.key} style={{ "--sc": s.colour }}><i aria-hidden="true" />{s.label}<b>{s.n}</b></li>)}
      </ul>
      {note && <p className="sx-key-n">Subjects are worked out from the words in each title, so a few may be placed wrongly. A title that fits none is shown as &quot;{NO_SECTOR.label}&quot;.</p>}
    </div>
  );
}

// The small subject label shown on a row or card: a dot in the subject's colour and its name. Nothing is shown when no subject fits, so rows are not cluttered.
export function SectorChip({ entry }) {
  const s = sectorOf(entry);
  if (s.key === NO_SECTOR.key) return null;
  return <span className="sx-chip" style={{ "--sc": s.colour }}><i aria-hidden="true" />{s.label}</span>;
}
