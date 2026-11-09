/** @jsxImportSource react */
import { useId } from "react";
import { DRAGON_MASK } from "../lib/welshDragon";

// A flag drawn in its own national colours, filling the background of a party's banner. The banner's party colour is laid over it by the stylesheet (strongest behind the text), so
// the flag is never tinted: it shows through as itself. Which flag goes with which party is decided in lib/partyFlags.js. Each is drawn in the real proportions of the flag.
// England's and Scotland's flags are plain geometry, so they are stretched to fill the whole banner; the others keep their proportions and are cropped to fill it.
const FILL = { england: "none", scotland: "none", union: "xMidYMid slice", ireland: "xMaxYMid slice", wales: "xMaxYMid slice" };
const SIZE = { england: [50, 30], scotland: [50, 30], union: [60, 30], ireland: [60, 40], wales: [800, 480] };

export default function PartyFlag({ kind }) {
  const raw = useId();
  const id = `flag${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const size = SIZE[kind];
  if (!size) return null;
  const [w, h] = size;
  return (
    <svg className="ph-flag" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={FILL[kind]} aria-hidden="true" focusable="false">
      {kind === "england" && (
        <>
          <rect width="50" height="30" fill="#FFFFFF" />
          <path d="M22 0h6v30h-6zM0 12h50v6H0z" fill="#CE1124" />
        </>
      )}
      {kind === "scotland" && (
        <>
          <rect width="50" height="30" fill="#0065BD" />
          <path d="M0 0L50 30M50 0L0 30" stroke="#FFFFFF" strokeWidth="5.4" fill="none" />
        </>
      )}
      {kind === "ireland" && (
        <>
          <rect width="20" height="40" fill="#169B62" />
          <rect x="20" width="20" height="40" fill="#FFFFFF" />
          <rect x="40" width="20" height="40" fill="#FF883E" />
        </>
      )}
      {kind === "union" && (
        <>
          <rect width="60" height="30" fill="#012169" />
          <path d="M0 0L60 30M60 0L0 30" stroke="#FFFFFF" strokeWidth="6" fill="none" />
          <path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" strokeWidth="2" fill="none" />
          <path d="M25 0h10v30H25zM0 10h60v10H0z" fill="#FFFFFF" />
          <path d="M27 0h6v30h-6zM0 12h60v6H0z" fill="#C8102E" />
        </>
      )}
      {kind === "wales" && (
        <>
          <rect width="800" height="240" fill="#FFFFFF" />
          <rect y="240" width="800" height="240" fill="#00AB39" />
          <mask id={id} dangerouslySetInnerHTML={{ __html: `<rect width="800" height="480" fill="#000"/>${DRAGON_MASK}` }} />
          <rect width="800" height="480" fill="#D4213D" mask={`url(#${id})`} />
        </>
      )}
    </svg>
  );
}
