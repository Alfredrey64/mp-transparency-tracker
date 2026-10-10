import { useId } from "react";

// The Simple Politics mark: a bold S for Simple, finished with an amber full stop. Plain speaking. Indigo tile, white letter, amber dot.
// The same drawing as public/favicon.svg, kept as a component so it stays sharp at any size and takes no extra request.
export default function LogoMark({ size = 40, title }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`lm-bg-${id}`} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0" stopColor="#6A60F5" />
          <stop offset="1" stopColor="#3B33C4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#lm-bg-${id})`} />
      <path d="M43 21.5C43 16.2 38.2 13 32.3 13C26 13 21.5 16.3 21.5 21.4C21.5 26.6 26.2 28.4 32 30C38 31.7 43.5 33.6 43.5 39.8C43.5 46.4 38.4 50 32 50C25.4 50 20.8 46.6 20.2 40.8" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="47" cy="50" r="4.6" fill="#FFC145" />
    </svg>
  );
}
