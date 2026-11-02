import { useId } from "react";
import {
  COVER_RIGHT, COVER_LEFT, PAGE_LEFT, PAGE_RIGHT, SHADE_RIGHT, SHADE_LEFT, FRAME, PARLIAMENT, CLOCK, RIBBON, THICK_RIGHT, THICK_LEFT, EDGE_RIGHT, EDGE_LEFT, EDGE_LINES_RIGHT, EDGE_LINES_LEFT, LIGHT_RIGHT, LIGHT_LEFT,
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
  // Depth: the board edge under a cover, the paper block under a page, and the light on a cover's top edge. Dark and light are laid over whatever colour the book is.
  const board = (side) => (
    <>
      <path d={side === "r" ? THICK_RIGHT : THICK_LEFT} fill={color} />
      <path d={side === "r" ? THICK_RIGHT : THICK_LEFT} fill="#000" fillOpacity=".4" />
    </>
  );
  const block = (side) => (
    <>
      <path d={side === "r" ? EDGE_RIGHT : EDGE_LEFT} fill="#F6F1E4" />
      <path d={side === "r" ? EDGE_RIGHT : EDGE_LEFT} fill={`url(#${id}edge)`} />
      {(side === "r" ? EDGE_LINES_RIGHT : EDGE_LINES_LEFT).map((d, n) => <path key={n} d={d} stroke="#000" strokeOpacity=".16" strokeWidth=".35" />)}
    </>
  );
  const light = (side) => <path d={side === "r" ? LIGHT_RIGHT : LIGHT_LEFT} stroke="#fff" strokeOpacity=".4" strokeWidth=".8" strokeLinecap="round" />;
  // One leaf that turns: j is its place in the turn (0 is the cover, then the pages), which sets when it moves.
  const leaf = (cls, j, content) => <g key={cls + j} className={cls} style={{ "--i": j }}>{content}</g>;
  return (
    <svg className="lg" data-play={animate || undefined} width={width} viewBox="0 0 120 84" fill="none" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <path id={`${id}r`} d={TEXT_RIGHT} /><path id={`${id}l`} d={TEXT_LEFT} />
        <linearGradient id={`${id}foil`} gradientUnits="userSpaceOnUse" x1="68" y1="14" x2="108" y2="62"><stop offset="0" stopColor="#FFF1C4" /><stop offset=".38" stopColor={ribbon} /><stop offset=".7" stopColor="#E9A62E" /><stop offset="1" stopColor="#B97A16" /></linearGradient>
        <linearGradient id={`${id}foilbox`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C4" /><stop offset=".4" stopColor={ribbon} /><stop offset="1" stopColor="#B97A16" /></linearGradient>
        <radialGradient id={`${id}ground`}><stop offset="0" stopColor="#000" stopOpacity=".34" /><stop offset=".6" stopColor="#000" stopOpacity=".12" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}edge`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity=".18" /><stop offset=".3" stopColor="#000" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".22" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".24" /></linearGradient>
      </defs>
      <g className="lg-g">
        <ellipse className="lg-sh" cx="60" cy="79.500" rx="54" ry="4.200" fill={`url(#${id}ground)`} />
        {board("r")}
        <path d={COVER_RIGHT} fill={color} />
        {light("r")}
        {block("r")}
        {page("r")}
        {words("r", "Politics")}
        {rules(RULES_RIGHT)}
        {[3, 2, 1].map((j) => leaf("lg-f", j, <>{page("r")}{rules(RULES_RIGHT)}</>))}
        {leaf("lg-f", 0, (
          <>
            <path d={COVER_RIGHT} fill={color} stroke={hole} strokeWidth=".6" strokeOpacity=".5" />
            <path d={COVER_RIGHT} fill={`url(#${id}sheen)`} />
            {light("r")}
            <path d={FRAME} stroke={`url(#${id}foilbox)`} strokeWidth="1.1" />
            {/* The building is foil-stamped into the cloth: a dark edge on the upper left where the die pressed in, a pale edge on the lower right where the cloth rises
                again, and gold foil in between. */}
            <g>
              <g transform="translate(0.4 0.45)" fill="#fff" fillOpacity=".38"><path d={PARLIAMENT} /><circle {...CLOCK} /></g>
              <g transform="translate(-0.35 -0.35)" fill="#000" fillOpacity=".5"><path d={PARLIAMENT} /><circle {...CLOCK} /></g>
              <path d={PARLIAMENT} fill={`url(#${id}foil)`} />
              <circle {...CLOCK} fill={color} stroke={`url(#${id}foil)`} strokeWidth=".7" />
              <circle {...CLOCK} r="1.4" fill="#000" fillOpacity=".18" />
            </g>
          </>
        ))}
        {leaf("lg-b", 0, (
          <>
            {board("l")}
            <path d={COVER_LEFT} fill={color} />
            {light("l")}
            {block("l")}
          </>
        ))}
        {[1, 2, 3].map((j) => leaf("lg-b", j, <>{page("l")}{j === 3 && words("l", "UK")}{rules(RULES_LEFT)}</>))}
        <path d={RIBBON} fill={ribbon} />
      </g>
    </svg>
  );
}
