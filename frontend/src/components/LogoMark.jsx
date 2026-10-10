import { useId } from "react";

// The Simple Politics mark: the Houses of Parliament, drawn as a clean white silhouette on a deep indigo tile. The same drawing as
// public/favicon.svg, kept as a component so it stays sharp at any size and takes no extra request.
export default function LogoMark({ size = 40, title }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <clipPath id={`tile-${id}`}>
          <rect width="512" height="512" rx="112" />
        </clipPath>
      </defs>
      <g clipPath={`url(#tile-${id})`}>
        <defs>
        <linearGradient id={`bg-${id}`} x1="8%" y1="4%" x2="92%" y2="96%">
        <stop offset="0%" stopColor="#6C63F1"/>
        <stop offset="50%" stopColor="#4F46E5"/>
        <stop offset="100%" stopColor="#332DA1"/>
        </linearGradient>
        <radialGradient id={`sheen-${id}`} cx="32%" cy="16%" r="70%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.20"/>
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0.04"/>
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`vignette-${id}`} cx="50%" cy="58%" r="75%">
        <stop offset="60%" stopColor="#000000" stopOpacity="0"/>
        <stop offset="100%" stopColor="#1B1650" stopOpacity="0.22"/>
        </radialGradient>
        <filter id={`lift-${id}`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="9" stdDeviation="12" floodColor="#171248" floodOpacity="0.5"/>
        </filter>
        </defs>
        <rect width="512" height="512" fill={`url(#bg-${id})`}/>
        <rect width="512" height="512" fill={`url(#vignette-${id})`}/>
        <rect width="512" height="512" fill={`url(#sheen-${id})`}/>
        <g transform="translate(58 148) scale(1.85)" filter={`url(#lift-${id})`} stroke="#2B2578" strokeWidth="1.2" strokeLinejoin="round">
        <rect x="18" y="70" width="120" height="42" fill="#ffffff"/>
        <rect x="18" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="30" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="42" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="54" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="66" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="78" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="90" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="102" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="114" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="126" y="64" width="6" height="8" fill="#ffffff"/>
        <rect x="10" y="58" width="10" height="54" fill="#ffffff"/>
        <polygon points="10,58 15,46 20,58" fill="#ffffff"/>
        <rect x="150" y="30" width="26" height="82" fill="#ffffff"/>
        <rect x="146" y="24" width="34" height="8" fill="#ffffff"/>
        <polygon points="150,24 163,4 176,24" fill="#ffffff"/>
        <circle cx="163" cy="46" r="7" fill="#4F46E5" stroke="#ffffff" strokeWidth="2"/>
        <line x1="163" y1="4" x2="163" y2="-8" stroke="#ffffff" strokeWidth="2"/>
        <rect x="190" y="80" width="14" height="32" fill="#ffffff"/>
        <polygon points="190,80 197,66 204,80" fill="#ffffff"/>
        <line x1="6" y1="112" x2="208" y2="112" stroke="#ffffff" strokeWidth="2"/>
        </g>
        <g transform="translate(58 148) scale(1.85)" stroke="#000000" strokeOpacity="0.24" strokeWidth="0.9" fill="none" strokeLinecap="round">
        <line x1="21" y1="82" x2="135" y2="82"/>
        <line x1="21" y1="94" x2="135" y2="94"/>
        <line x1="21" y1="106" x2="135" y2="106"/>
        <rect x="30" y="86" width="9" height="14"/>
        <line x1="34.5" y1="86" x2="34.5" y2="100"/>
        <rect x="54" y="86" width="9" height="14"/>
        <line x1="58.5" y1="86" x2="58.5" y2="100"/>
        <rect x="78" y="86" width="9" height="14"/>
        <line x1="82.5" y1="86" x2="82.5" y2="100"/>
        <rect x="102" y="86" width="9" height="14"/>
        <line x1="106.5" y1="86" x2="106.5" y2="100"/>
        <rect x="120" y="86" width="9" height="14"/>
        <line x1="124.5" y1="86" x2="124.5" y2="100"/>
        <line x1="15" y1="66" x2="15" y2="108"/>
        <line x1="163" y1="34" x2="163" y2="105"/>
        <rect x="156" y="58" width="5" height="9"/>
        <rect x="165" y="58" width="5" height="9"/>
        <rect x="156" y="72" width="5" height="9"/>
        <rect x="165" y="72" width="5" height="9"/>
        <rect x="156" y="86" width="5" height="9"/>
        <rect x="165" y="86" width="5" height="9"/>
        <line x1="163" y1="40.5" x2="163" y2="42"/>
        <line x1="169.5" y1="46" x2="168" y2="46"/>
        <line x1="163" y1="51.5" x2="163" y2="50"/>
        <line x1="156.5" y1="46" x2="158" y2="46"/>
        <line x1="163" y1="46" x2="163" y2="42.3" strokeWidth="1.1"/>
        <line x1="163" y1="46" x2="166" y2="46" strokeWidth="1.1"/>
        <rect x="194" y="90" width="6" height="10"/>
        </g>
      </g>
    </svg>
  );
}
