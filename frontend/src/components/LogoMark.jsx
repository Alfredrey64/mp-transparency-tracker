import { useId } from "react";

// The Simple Politics mark: the Houses of Parliament with the clock tower and its amber clock face, above the Thames, drawn in white on a
// deep indigo tile. The same drawing as public/favicon.svg, kept as a component so it stays sharp at any size and takes no extra request.
export default function LogoMark({ size = 40, title }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs>
      <linearGradient id={`bg-${id}`} x1="10%" y1="0%" x2="90%" y2="100%"><stop offset="0" stopColor="#6A60F5"/><stop offset="1" stopColor="#352EB4"/></linearGradient>
      <radialGradient id={`glow-${id}`} cx="50%" cy="38%" r="55%"><stop offset="0" stopColor="#fff" stopOpacity=".20"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      <linearGradient id={`clock-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD97A"/><stop offset="1" stopColor="#FFB02E"/></linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#bg-${id})`}/>
      <rect width="512" height="512" rx="112" fill={`url(#glow-${id})`}/>
      <g>
      <rect x="318" y="330" width="152" height="74" fill="#fff" fillOpacity="1"/>
      <polygon points="351,330 361,330 356,306" fill="#fff"/>
      <polygon points="369,330 379,330 374,306" fill="#fff"/>
      <polygon points="387,330 397,330 392,306" fill="#fff"/>
      <polygon points="447,330 457,330 452,306" fill="#fff"/>
      <rect x="318" y="296" width="22" height="108" fill="#fff" fillOpacity="1"/>
      <polygon points="315,296 343,296 329,262" fill="#fff"/>
      <rect x="402" y="282" width="44" height="122" fill="#fff" fillOpacity="1"/>
      <rect x="398" y="274" width="52" height="12" fill="#fff" fillOpacity="1"/>
      <polygon points="402,274 446,274 424,236" fill="#fff"/>
      <rect x="422.5" y="222" width="5.0" height="18" fill="#fff" fillOpacity="1"/>
      <rect x="42" y="330" width="152" height="74" fill="#fff" fillOpacity="1"/>
      <polygon points="161,330 151,330 156,306" fill="#fff"/>
      <polygon points="143,330 133,330 138,306" fill="#fff"/>
      <polygon points="125,330 115,330 120,306" fill="#fff"/>
      <polygon points="65,330 55,330 60,306" fill="#fff"/>
      <rect x="172" y="296" width="22" height="108" fill="#fff" fillOpacity="1"/>
      <polygon points="197,296 169,296 183,262" fill="#fff"/>
      <rect x="66" y="282" width="44" height="122" fill="#fff" fillOpacity="1"/>
      <rect x="62" y="274" width="52" height="12" fill="#fff" fillOpacity="1"/>
      <polygon points="110,274 66,274 88,236" fill="#fff"/>
      <rect x="84.5" y="222" width="5.0" height="18" fill="#fff" fillOpacity="1"/>
      </g>
      <rect x="222" y="168" width="68" height="236" fill="#fff"/>
      <rect x="212" y="150" width="88" height="26" fill="#fff"/>
      <rect x="216" y="116" width="80" height="40" fill="#fff"/>
      <rect x="209" y="108" width="94" height="12" fill="#fff"/>
      <polygon points="213,108 299,108 256,34" fill="#fff"/>
      <rect x="253.5" y="14" width="5" height="26" fill="#fff"/>
      <circle cx="256" cy="138" r="24" fill={`url(#clock-${id})`}/>
      <circle cx="256" cy="138" r="24" fill="none" stroke="#352EB4" strokeWidth="3" strokeOpacity=".55"/>
      <path d="M256 138V122M256 138L267 144" stroke="#352EB4" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
      <rect x="241" y="196" width="8" height="28" rx="4" fill="#4B43D6" fillOpacity=".55"/><rect x="263" y="196" width="8" height="28" rx="4" fill="#4B43D6" fillOpacity=".55"/>
      <rect x="241" y="244" width="8" height="28" rx="4" fill="#4B43D6" fillOpacity=".55"/><rect x="263" y="244" width="8" height="28" rx="4" fill="#4B43D6" fillOpacity=".55"/>
      <rect x="241" y="292" width="8" height="28" rx="4" fill="#4B43D6" fillOpacity=".55"/><rect x="263" y="292" width="8" height="28" rx="4" fill="#4B43D6" fillOpacity=".55"/>
      <rect x="241" y="340" width="8" height="28" rx="4" fill="#4B43D6" fillOpacity=".55"/><rect x="263" y="340" width="8" height="28" rx="4" fill="#4B43D6" fillOpacity=".55"/>
      <rect x="348" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="362" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="376" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="390" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="420" y="304" width="8" height="26" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="420" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="156" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="142" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="128" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="114" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="84" y="304" width="8" height="26" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <rect x="84" y="352" width="8" height="34" rx="4" fill="#4B43D6" fillOpacity=".5"/>
      <path d="M70 430C100 418 130 442 160 430S220 418 256 430 316 442 352 430 412 418 442 430" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="9" strokeLinecap="round"/>
      <path d="M110 456C136 447 162 465 188 456S236 447 256 456 304 465 330 456 376 447 402 456" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  );
}
