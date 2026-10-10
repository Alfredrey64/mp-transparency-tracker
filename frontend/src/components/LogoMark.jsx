import { useId } from "react";

// The Simple Politics mark: two speech bubbles, the front one carrying a tick, on a deep indigo tile. A conversation that ends in a
// clear answer. The same drawing as public/favicon.svg, kept as a component so it stays sharp at any size and takes no extra request.
export default function LogoMark({ size = 40, title }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`lm-bg-${id}`} x1="8%" y1="4%" x2="92%" y2="96%">
          <stop offset="0" stopColor="#7C74FF" />
          <stop offset="0.55" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#2B2594" />
        </linearGradient>
        <radialGradient id={`lm-sheen-${id}`} cx="28%" cy="12%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#lm-bg-${id})`} />
      <rect width="64" height="64" rx="16" fill={`url(#lm-sheen-${id})`} />
      <path fill="#fff" fillOpacity="0.38" d="M38 9H47A9 9 0 0 1 56 18V24A9 9 0 0 1 47 33H46V40L38 33H38A9 9 0 0 1 29 24V18A9 9 0 0 1 38 9Z" />
      <path fill="#fff" d="M17 23H35A9 9 0 0 1 44 32V39A9 9 0 0 1 35 48H27L17 56V48A9 9 0 0 1 8 39V32A9 9 0 0 1 17 23Z" />
      <path fill="none" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" d="M18.5 36l5.5 5.5L33.5 31" />
    </svg>
  );
}
