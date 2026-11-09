/** @jsxImportSource react */
import { useId } from "react";
import { DRAGON_MASK } from "../lib/welshDragon";

// A flag drawn in plain white, for the faint ghost behind a party's banner (the banner's own colour shows through wherever the flag is not drawn). Which flag goes with which
// party is decided in lib/partyFlags.js.

const SIZE = { england: [90, 54], scotland: [90, 54], union: [60, 30], ireland: [90, 60], wales: [800, 480] };

export default function PartyFlag({ kind }) {
  const raw = useId();
  const id = `flag${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const size = SIZE[kind];
  if (!size) return null;
  const [w, h] = size;
  return (
    <svg className="ph-flag" viewBox={`0 0 ${w} ${h}`} style={{ aspectRatio: `${w} / ${h}` }} aria-hidden="true" focusable="false">
      {kind === "england" && <path d="M36 0h18v54H36zM0 21h90v12H0z" fill="#fff" />}
      {kind === "scotland" && <path d="M0 0L90 54M90 0L0 54" stroke="#fff" strokeWidth="11" fill="none" />}
      {kind === "ireland" && (
        <>
          <rect width="30" height="60" fill="#fff" opacity="0.45" />
          <rect x="30" width="30" height="60" fill="#fff" />
          <rect x="60" width="30" height="60" fill="#fff" opacity="0.7" />
        </>
      )}
      {kind === "union" && (
        <>
          <mask id={id}>
            <rect width="60" height="30" fill="#000" />
            <path d="M0 0L60 30M60 0L0 30" stroke="#fff" strokeWidth="6" fill="none" />
            <path d="M25 0h10v30H25zM0 10h60v10H0z" fill="#fff" />
            <path d="M0 0L60 30M60 0L0 30" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M27 0h6v30h-6zM0 12h60v6H0z" fill="#000" />
          </mask>
          <rect width="60" height="30" fill="#fff" mask={`url(#${id})`} />
        </>
      )}
      {kind === "wales" && (
        <>
          <mask id={id} dangerouslySetInnerHTML={{ __html: `<rect width="800" height="480" fill="#000"/>${DRAGON_MASK}` }} />
          <rect width="800" height="480" fill="#fff" mask={`url(#${id})`} />
        </>
      )}
    </svg>
  );
}
