import { useId } from "react";
import { COVER, PAGE_LEFT, PAGE_RIGHT, STACK, RIBBON, TEXT_LEFT, TEXT_RIGHT, RULES_LEFT, RULES_RIGHT } from "../lib/bookMark";

// The Domesday Live mark: an open book with "UK Politics" printed on its curved pages, in one colour with a ribbon marker. `hole` is the colour behind the mark,
// which the words, ruled lines and the thin gap round each page are drawn in. The drawing itself is in lib/bookMark.js, shared with the share image. The app
// icon is a separate drawing (the Parliament silhouette, see scripts/build-icons.mjs). With `animate` the book grows in and three pages turn to show the words,
// once, when it first draws (see .lg in chrome.css). The pages are drawn already turned, so a still mark and reduced motion both show the open book.
const WORDS = { fontFamily: "'Public Sans', system-ui, sans-serif", fontSize: 10.2, fontWeight: 800, letterSpacing: 0.15, textAnchor: "middle" };

export default function LogoMark({ width = 76, color = "var(--sb-accent)", hole = "var(--sb-bg)", ribbon = "#FFB84D", title, animate }) {
  const id = useId().replace(/:/g, "");
  const rules = (list) => list.map((d, n) => <path key={n} d={d} stroke={hole} strokeOpacity=".38" strokeWidth="1.7" strokeLinecap="round" />);
  const words = (path, text) => <text fill={hole} {...WORDS}><textPath href={`#${id}${path}`} startOffset="50%">{text}</textPath></text>;
  const leaf = (cls, d, list, i, text) => (
    <g key={cls + i} className={cls} style={{ "--i": i }}>
      <path d={d} fill={color} stroke={hole} strokeWidth="1" />
      {text}
      {rules(list)}
    </g>
  );
  return (
    <svg className="lg" data-play={animate || undefined} width={width} viewBox="0 0 120 84" fill="none" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs><path id={`${id}r`} d={TEXT_RIGHT} /><path id={`${id}l`} d={TEXT_LEFT} /></defs>
      <g className="lg-g">
        <path d={COVER} fill={color} />
        <path d={STACK} stroke={hole} strokeOpacity=".45" strokeWidth="1.1" strokeLinecap="round" />
        <path d={PAGE_RIGHT} fill={color} stroke={hole} strokeWidth="1" />
        {words("r", "Politics")}
        {rules(RULES_RIGHT)}
        {[2, 1, 0].map((i) => leaf("lg-f", PAGE_RIGHT, RULES_RIGHT, i))}
        {[0, 1, 2].map((i) => leaf("lg-b", PAGE_LEFT, RULES_LEFT, i, i === 2 && words("l", "UK")))}
        <path d={RIBBON} fill={ribbon} />
      </g>
    </svg>
  );
}
