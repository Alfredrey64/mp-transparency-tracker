// The Domesday Live mark: an open book with "UK Politics" on its pages, flat and single colour. `hole` is the colour behind the mark, which the words
// and page lines are drawn in. The app icon is a separate drawing (the Parliament silhouette, see scripts/build-icons.mjs). With `animate` the book grows in and three pages turn
// to show the words, once, when it first draws (see .lg in chrome.css). The pages are drawn already turned, so a still mark and reduced motion both show
// the open book.
const RIGHT = "M62 19C74 11 94 10 114 14V67C94 63 74 64 62 72Z";
const LEFT = "M58 19C46 11 26 10 6 14V67C26 63 46 64 58 72Z";
const WORDS = { fontFamily: "'Public Sans', system-ui, sans-serif", fontSize: 12.5, fontWeight: 800, textAnchor: "middle" };

export default function LogoMark({ width = 76, color = "var(--sb-accent)", hole = "var(--sb-bg)", title, animate }) {
  const lines = (cx) => [[48, 34], [54, 28], [60, 32]].map(([y, w]) => <path key={y} d={`M${cx - w / 2} ${y}h${w}`} stroke={hole} strokeOpacity=".35" strokeWidth="1.8" strokeLinecap="round" />);
  const leaf = (cls, d, cx, i, words) => (
    <g key={cls + i} className={cls} style={{ "--i": i }}>
      <path d={d} fill={color} stroke={hole} strokeWidth=".9" />
      {words && <text x={cx} y="39" fill={hole} {...WORDS}>{words}</text>}
      {lines(cx)}
    </g>
  );
  return (
    <svg className="lg" data-play={animate || undefined} width={width} viewBox="0 0 120 84" fill="none" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <g className="lg-g">
        <path d="M3 71C24 66 46 67 60 76C74 67 96 66 117 71" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
        <path d={RIGHT} fill={color} />
        <text x="88" y="39" fill={hole} {...WORDS}>Politics</text>
        {lines(88)}
        {[2, 1, 0].map((i) => leaf("lg-f", RIGHT, 88, i))}
        {[0, 1, 2].map((i) => leaf("lg-b", LEFT, 32, i, i === 2 && "UK"))}
      </g>
    </svg>
  );
}
