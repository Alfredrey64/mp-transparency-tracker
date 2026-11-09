/** @jsxImportSource react */
import { useState } from "react";
import { initials } from "../lib/partyHistory";
import "../portrait.css";

// The arched portrait of a party's leader, with their initials behind it in case the photo cannot load. It is decoration beside the leader's name, so it is hidden from
// screen readers. The page it sits on decides when it rises into view (see .ph-arch in partyhistory.css and manifestos.css).
export default function LeaderPortrait({ leader }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="ph-arch" aria-hidden="true">
      <span className="ph-mono">{initials(leader.name)}</span>
      {leader.photo && !broken && <img src={leader.photo} alt="" width="136" height="172" loading="lazy" decoding="async" onError={() => setBroken(true)} />}
    </div>
  );
}
