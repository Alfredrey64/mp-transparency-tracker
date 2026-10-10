// The Simple Politics mark: the Houses of Parliament as a flat, single-colour silhouette. No tile, no gradient. The same drawing as
// public/favicon.svg (which sits it on a plain indigo square). `hole` is the colour behind the building, shown through the clock face.
export default function LogoMark({ width = 76, color = "var(--sb-accent)", hole = "var(--sb-bg)", title }) {
  return (
    <svg width={width} viewBox="0 -8 240 122" fill="none" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <line x1="0" y1="112" x2="240" y2="112" stroke={color} strokeWidth="1.5" />
      <rect x="18" y="70" width="120" height="42" fill={color} />
      {[18, 30, 42, 54, 66, 78, 90, 102, 114, 126].map((x) => (
        <rect key={x} x={x} y="64" width="6" height="8" fill={color} />
      ))}
      <rect x="10" y="58" width="10" height="54" fill={color} />
      <polygon points="10,58 15,46 20,58" fill={color} />
      <rect x="150" y="30" width="26" height="82" fill={color} />
      <rect x="146" y="24" width="34" height="8" fill={color} />
      <polygon points="150,24 163,4 176,24" fill={color} />
      <circle cx="163" cy="46" r="7" fill={hole} stroke={color} strokeWidth="2" />
      <line x1="163" y1="4" x2="163" y2="-6" stroke={color} strokeWidth="2" />
      <rect x="190" y="80" width="14" height="32" fill={color} />
      <polygon points="190,80 197,66 204,80" fill={color} />
    </svg>
  );
}
