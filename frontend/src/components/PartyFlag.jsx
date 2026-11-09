/** @jsxImportSource react */
import { useId } from "react";
import { DRAGON_MASK } from "../lib/welshDragon";

// A flag drawn as a soft, see-through ghost of itself, for the corner of a party's banner: the field a little lighter than the banner, the cross, saltire or dragon lighter still,
// all in the banner's text colour (white on a dark banner, dark on a light one). Which flag goes with which party is decided in lib/partyFlags.js. Each is drawn in the real
// proportions of the flag so it reads as a flag, not as a pattern.
const SIZE = { england: [50, 30], scotland: [50, 30], union: [60, 30], ireland: [60, 40], wales: [800, 480] };

export default function PartyFlag({ kind }) {
  const raw = useId();
  const id = `flag${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const size = SIZE[kind];
  if (!size) return null;
  const [w, h] = size;
  return (
    <svg className="ph-flag" viewBox={`0 0 ${w} ${h}`} style={{ aspectRatio: `${w} / ${h}` }} fill="currentColor" aria-hidden="true" focusable="false">
      {kind === "england" && (
        <>
          <rect width="50" height="30" opacity="0.1" />
          <path d="M22 0h6v30h-6zM0 12h50v6H0z" opacity="0.22" />
        </>
      )}
      {kind === "scotland" && (
        <>
          <rect width="50" height="30" opacity="0.1" />
          <path d="M0 0L50 30M50 0L0 30" stroke="currentColor" strokeWidth="5.4" fill="none" opacity="0.22" />
        </>
      )}
      {kind === "ireland" && (
        <>
          <rect width="20" height="40" opacity="0.12" />
          <rect x="20" width="20" height="40" opacity="0.24" />
          <rect x="40" width="20" height="40" opacity="0.18" />
        </>
      )}
      {kind === "union" && (
        <>
          <rect width="60" height="30" opacity="0.1" />
          <mask id={id}>
            <rect width="60" height="30" fill="#000" />
            <path d="M0 0L60 30M60 0L0 30" stroke="#fff" strokeWidth="6" fill="none" />
            <path d="M25 0h10v30H25zM0 10h60v10H0z" fill="#fff" />
            <path d="M0 0L60 30M60 0L0 30" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M27 0h6v30h-6zM0 12h60v6H0z" fill="#000" />
          </mask>
          <rect width="60" height="30" opacity="0.22" mask={`url(#${id})`} />
        </>
      )}
      {kind === "wales" && (
        <>
          <rect width="800" height="240" opacity="0.16" />
          <rect y="240" width="800" height="240" opacity="0.08" />
          <mask id={id} dangerouslySetInnerHTML={{ __html: `<rect width="800" height="480" fill="#000"/>${DRAGON_MASK}` }} />
          <rect width="800" height="480" opacity="0.3" mask={`url(#${id})`} />
        </>
      )}
      <rect x="0.3" y="0.3" width={w - 0.6} height={h - 0.6} fill="none" stroke="currentColor" strokeWidth={Math.max(w, h) / 300} opacity="0.24" />
    </svg>
  );
}
