import { useId } from "react";

// The Simple Politics mark: a speech bubble drawn as a single clean line, with a tick that breaks out through its corner. A question
// asked, and a clear answer. Indigo tile, white line, amber tick. The same drawing as public/favicon.svg, kept as a component so it
// stays sharp at any size and takes no extra request.
export default function LogoMark({ size = 40, title }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`lm-bg-${id}`} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0" stopColor="#6A60F5" />
          <stop offset="1" stopColor="#3B33C4" />
        </linearGradient>
        <linearGradient id={`lm-tick-${id}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0" stopColor="#FFB02E" />
          <stop offset="1" stopColor="#FFD97A" />
        </linearGradient>
        <mask id={`lm-cut-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <path d="M23.5 32l6.5 6.5L49.5 13.5" fill="none" stroke="#000" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#lm-bg-${id})`} />
      <path mask={`url(#lm-cut-${id})`} d="M23 15H41A10 10 0 0 1 51 25V33A10 10 0 0 1 41 43H31L21 52V43H23A10 10 0 0 1 13 33V25A10 10 0 0 1 23 15Z" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
      <path d="M23.5 32l6.5 6.5L49.5 13.5" fill="none" stroke={`url(#lm-tick-${id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
