import { useId } from "react";

// The Simple Politics mark: a speech bubble with a tick in it, a clear answer, on a deep indigo tile. The same drawing as
// public/favicon.svg, kept as a component so it stays sharp at any size and takes no extra request.
export default function LogoMark({ size = 40, title }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`lm-bg-${id}`} x1="8%" y1="4%" x2="92%" y2="96%">
          <stop offset="0%" stopColor="#6C63F1" />
          <stop offset="55%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#332DA1" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#lm-bg-${id})`} />
      <path fill="#fff" d="M23 12h18a9 9 0 0 1 9 9v10a9 9 0 0 1-9 9h-8l-9 8v-8h-1a9 9 0 0 1-9-9V21a9 9 0 0 1 9-9z" />
      <path fill="none" stroke="#4F46E5" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" d="M23 26l6 6 12-12" />
    </svg>
  );
}
