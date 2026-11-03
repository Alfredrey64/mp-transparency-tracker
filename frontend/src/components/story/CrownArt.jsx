/** @jsxImportSource react */
import { useId } from "react";

// The crown used across the site, drawn once: a gold crown with three raised points tipped with orbs, a band set with three gems, and a little shading on one side so it reads as
// solid. Nothing is cut out of it, so no background shows through. `CrownShape` is the drawing alone (80 wide, 64 tall, for use inside another picture); `CrownArt` is a
// ready-made picture of it.
export function CrownShape() {
  const id = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFDD7A" />
          <stop offset="1" stopColor="#E3A624" />
        </linearGradient>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2B93B" />
          <stop offset="1" stopColor="#B97D12" />
        </linearGradient>
        <radialGradient id={`${id}-orb`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFF4CC" />
          <stop offset="1" stopColor="#E0A22A" />
        </radialGradient>
      </defs>
      <path d="M10 52 L5 20 L24 36 L40 10 L56 36 L75 20 L70 52 Z" fill={`url(#${id}-gold)`} stroke="#9C6A0E" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M40 10 L56 36 L75 20 L70 52 L40 52 Z" fill="#7A4E05" opacity="0.1" />
      <rect x="8" y="50" width="64" height="11" rx="3" fill={`url(#${id}-band)`} stroke="#9C6A0E" strokeWidth="1.6" />
      <circle cx="21" cy="55.5" r="2.7" fill="#D6334C" stroke="#8F1E30" strokeWidth="0.8" />
      <circle cx="40" cy="55.5" r="2.7" fill="#2F6FDB" stroke="#1B4796" strokeWidth="0.8" />
      <circle cx="59" cy="55.5" r="2.7" fill="#D6334C" stroke="#8F1E30" strokeWidth="0.8" />
      <circle cx="5" cy="18" r="3.8" fill={`url(#${id}-orb)`} stroke="#9C6A0E" strokeWidth="1.2" />
      <circle cx="40" cy="8" r="3.8" fill={`url(#${id}-orb)`} stroke="#9C6A0E" strokeWidth="1.2" />
      <circle cx="75" cy="18" r="3.8" fill={`url(#${id}-orb)`} stroke="#9C6A0E" strokeWidth="1.2" />
    </g>
  );
}

export default function CrownArt({ width = 84 }) {
  return (
    <svg width={width} height={(width * 66) / 80} viewBox="0 2 80 66" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <CrownShape />
    </svg>
  );
}
