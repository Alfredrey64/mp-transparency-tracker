import { useId } from "react";
import {
  COVER_RIGHT, COVER_LEFT, PAGE_LEFT, PAGE_RIGHT, STACK_RIGHT, STACK_LEFT, SHADE_RIGHT, SHADE_LEFT, FRAME, PARLIAMENT, PARLIAMENT_AT, CLOCK, RIBBON,
  TEXT_LEFT, TEXT_RIGHT, RULES_LEFT, RULES_RIGHT,
} from "../lib/bookMark";

// The Domesday Live mark: an open book with "UK" and "Politics" printed in the site's serif on its curved pages, one word centred on each, in one colour with a
// gold ribbon. `hole` is the colour behind the mark, which the words, ruled lines and the thin gap round each page are drawn in. The drawing itself is in
// lib/bookMark.js, shared with the share image. The app icon is a separate drawing (the Parliament silhouette, see scripts/build-icons.mjs).
// With `animate` the book starts closed, grows in, the cover swings open and three pages turn (see .lg in chrome.css), once, when it first draws. Every
// turning leaf is drawn already turned, so a still mark and reduced motion both show the open book.
const WORDS = { fontFamily: "'Figures', 'Newsreader', Georgia, serif", fontSize: 11, fontWeight: 700, letterSpacing: 0.1, textAnchor: "middle" };

export default function LogoMark({ width = 76, color = "var(--sb-accent)", hole = "var(--sb-bg)", ribbon = "#FFB84D", title, animate }) {
  const id = useId().replace(/:/g, "");
  const rules = (list) => list.map((d, n) => <path key={n} d={d} stroke={hole} strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round" />);
  const words = (path, text) => <text fill={hole} {...WORDS}><textPath href={`#${id}${path}`} startOffset="50%">{text}</textPath></text>;
  const page = (side) => (
    <>
      <path d={side === "r" ? PAGE_RIGHT : PAGE_LEFT} fill={color} stroke={hole} strokeWidth="1" />
      <path d={side === "r" ? SHADE_RIGHT : SHADE_LEFT} fill="#000" fillOpacity=".11" />
    </>
  );
  // One leaf that turns: j is its place in the turn (0 is the cover, then the pages), which sets when it moves.
  const leaf = (cls, j, content) => <g key={cls + j} className={cls} style={{ "--i": j }}>{content}</g>;
  return (
    <svg className="lg" data-play={animate || undefined} width={width} viewBox="0 0 120 84" fill="none" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs><path id={`${id}r`} d={TEXT_RIGHT} /><path id={`${id}l`} d={TEXT_LEFT} /></defs>
      <g className="lg-g">
        <path d={COVER_RIGHT} fill={color} />
        <path d={STACK_RIGHT} stroke={hole} strokeOpacity=".45" strokeWidth="1.1" strokeLinecap="round" />
        {page("r")}
        {words("r", "Politics")}
        {rules(RULES_RIGHT)}
        {[3, 2, 1].map((j) => leaf("lg-f", j, <>{page("r")}{rules(RULES_RIGHT)}</>))}
        {leaf("lg-f", 0, (
          <>
            <path d={COVER_RIGHT} fill={color} stroke={hole} strokeWidth=".6" strokeOpacity=".5" />
            <path d={FRAME} stroke={hole} strokeOpacity=".5" strokeWidth="1" />
            <g transform={PARLIAMENT_AT}>
              <path d={PARLIAMENT} fill={ribbon} />
              <circle {...CLOCK} fill={color} stroke={ribbon} strokeWidth="7" />
            </g>
          </>
        ))}
        {leaf("lg-b", 0, (
          <>
            <path d={COVER_LEFT} fill={color} />
            <path d={STACK_LEFT} stroke={hole} strokeOpacity=".45" strokeWidth="1.1" strokeLinecap="round" />
          </>
        ))}
        {[1, 2, 3].map((j) => leaf("lg-b", j, <>{page("l")}{j === 3 && words("l", "UK")}{rules(RULES_LEFT)}</>))}
        <path d={RIBBON} fill={ribbon} />
      </g>
    </svg>
  );
}
