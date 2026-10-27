/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { bingoCard, completedLines, CARD } from "../../../lib/teacherGamesMore";
import { starsFor } from "../../../lib/teacherGamesMore";
import { Coach, Confetti, Stars } from "./kit";
import { settingsFor } from "../../../lib/classCode";

// Parliament bingo: a card of sixteen words from Parliament. A clue rolls out of the bingo machine, and the class finds the word it describes and stamps it.
// A row, a column or a diagonal is a bingo. Keep going for a full house.
export default function ParliamentBingo({ settings, onSettings }) {
  const [seed, setSeed] = useState(() => settingsFor("bingo", settings).seed);
  useEffect(() => { onSettings?.({ seed }); }, [seed, onSettings]);
  const { card, calls } = useMemo(() => bingoCard(seed), [seed]);
  const [order, setOrder] = useState(() => calls.map((c) => c.term));
  const [marked, setMarked] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [line, setLine] = useState(null);
  const [flash, setFlash] = useState(null);
  const [burst, setBurst] = useState(0);
  const [lines, setLines] = useState(0);
  const current = order[0] ? calls.find((c) => c.term === order[0]) : null;
  const full = marked.length === CARD;

  const fresh = (s) => { const b = bingoCard(s); setSeed(s); setOrder(b.calls.map((c) => c.term)); setMarked([]); setMistakes(0); setLine(null); setLines(0); setFlash(null); };
  const tap = (i) => {
    if (!current || marked.includes(i)) return;
    if (card[i].term === current.term) {
      const nextMarked = [...marked, i];
      const nl = completedLines(nextMarked).length;
      setMarked(nextMarked); setOrder((o) => o.slice(1)); setFlash(null);
      if (nl > lines) { setBurst((b) => b + 1); setLines(nl); setLine({ mood: "cheer", text: nextMarked.length === CARD ? "FULL HOUSE! Every word is stamped." : nl === 1 ? "BINGO! A line! Keep going for a full house." : "Another line! Keep going." }); }
      else setLine({ mood: "happy", text: `${current.term}: ${current.clue}` });
    } else {
      setMistakes((m) => m + 1); setFlash(i);
      setLine({ mood: "oops", text: "Not that one. Read the clue again, and look for the word it describes." });
      setTimeout(() => setFlash(null), 900);
    }
  };
  const skip = () => setOrder((o) => [...o.slice(1), o[0]]);

  return (
    <div className="gm gm-bingo">
      <Confetti burst={burst} />
      <div className="gm-ball" key={current?.term ?? "end"}>
        <span className="gm-ball-n" aria-hidden="true">{full ? "★" : marked.length + 1}</span>
        <div><small>{full ? "Full house" : `Clue ${marked.length + 1} of ${CARD}`}</small><b>{current ? current.clue : "Every word is stamped."}</b></div>
      </div>
      <div className="gm-card-grid" role="group" aria-label="Your bingo card">
        {card.map((t, i) => (
          <button key={t.term} type="button" className="gm-sq" data-state={marked.includes(i) ? "on" : flash === i ? "no" : "idle"} disabled={full} aria-pressed={marked.includes(i)} onClick={() => tap(i)}>
            <span>{t.term}</span>
            {marked.includes(i) && <svg viewBox="0 0 40 40" className="gm-stamp" aria-hidden="true"><circle cx="20" cy="20" r="16" /><path d="M12 21l6 6 11-13" /></svg>}
          </button>
        ))}
      </div>
      <Coach mood={line?.mood ?? "think"} right={line?.mood === "happy" || line?.mood === "cheer"}>{line?.text ?? "Read the clue, then tap the word on your card that matches."}</Coach>
      <div className="cr-row">
        {!full && <button type="button" className="btn btn-secondary" onClick={skip}>Skip this clue for now</button>}
        <button type="button" className="btn btn-secondary" onClick={() => fresh((seed % 999) + 1)}>{full ? "Play again with a new card" : "Deal a new card"}</button>
      </div>
      {full && <div className="gm-end"><Stars n={starsFor(Math.floor(mistakes / 2))} /><b>{mistakes === 0 ? "A perfect card" : `${mistakes} ${mistakes === 1 ? "slip" : "slips"} on the way`}</b><p>You stamped all sixteen words. Every one of them is used in the lesson, and you can find them in the Jargon buster too.</p></div>}
    </div>
  );
}
