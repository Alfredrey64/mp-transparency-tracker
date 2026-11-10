/** @jsxImportSource react */
import { useRef, useState } from "react";
import { m as motion, AnimatePresence } from "motion/react";
import { useDialog } from "../../lib/useDialog";
import { useGo } from "./useGo";
import { PartyHemicycle } from "../PartyHemicycle";
import { QUIZ_PARTIES } from "../../data/partyMatchQuiz";
import { ONE_NATION_PARTIES } from "../../data/answerPartyPositions";
import { manifestoFootprint } from "../../lib/manifestoFootprint";
import { chip, readable } from "../../theme";
import "../../manifestos.css";
import CloseX from "../CloseX";

// The pictures that open the "What the parties promise" page: the chamber seat by seat, and a grid showing where each party made a clear promise. Both play once as they
// scroll into view. The words are on the page (components/PartyPolicies.jsx); the numbers come from the site's own party data.

const FOOTPRINT = manifestoFootprint();
const PARTY = Object.fromEntries(QUIZ_PARTIES.map((p) => [p.key, p]));
const SHORT = { labour: "Labour", conservative: "Conservative", "liberal-democrat": "Lib Dem", "reform-uk": "Reform", green: "Green", snp: "SNP", "plaid-cymru": "Plaid" };

// The Commons as a dome of seats, one for each member, with the parties to pick from underneath.
export function Chamber({ politicians, onSelectParty }) {
  return (
    <figure className="mf mf-chamber">
      <figcaption>
        <b>The Commons today, seat by seat</b>
        <span>Every seat is one MP, coloured by party. Pick a party to read its headline promises.</span>
      </figcaption>
      <PartyHemicycle
        politicians={politicians}
        onSelectParty={onSelectParty}
        legendCount={9}
        maxWidth={760}
        centre={<span className="mf-centre"><b>{politicians.length}</b><small>seats</small></span>}
      />
    </figure>
  );
}

// What a party promised on one topic, in a pop-up: each question it made a clear promise on with what it said, the ones it did not, and a row to move to another topic.
function PromisePopup({ pick, onPick, onClose, onOpenParty, openerRef }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  useDialog({ open: true, onClose, panelRef, returnFocusRef: openerRef, initialFocusRef: closeRef });
  const party = PARTY[pick.key];
  const idx = FOOTPRINT.totals.findIndex((t) => t.key === pick.key);
  const cell = FOOTPRINT.topics.find((t) => t.topic === pick.topic).cells[idx];
  const total = cell.items.length + cell.missing.length;
  const { background, color } = chip(party.color);
  return (
    <>
      <motion.div className="mf-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
      <div className="mf-pop-wrap">
        <motion.div
          ref={panelRef} className="mf-pop" role="dialog" aria-modal="true" aria-labelledby="mf-pop-title" tabIndex={-1}
          style={{ "--c": party.color, "--t": readable(party.color), "--bg": background, "--fg": color }}
          initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.14 } }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        >
          <div className="mf-pop-head" style={{ background, color }}>
            <button ref={closeRef} type="button" className="mf-pop-x" aria-label="Close" onClick={onClose}><CloseX size={16} /></button>
            <small>{party.name}{ONE_NATION_PARTIES[pick.key] ? `, ${ONE_NATION_PARTIES[pick.key]} only` : ""}</small>
            <h3 id="mf-pop-title">{pick.topic}</h3>
            <p>A clear promise on <b>{cell.n}</b> of {total} {total === 1 ? "issue" : "issues"}</p>
            <span className="mf-pop-meter" aria-hidden="true">{Array.from({ length: total }, (_, k) => <i key={k} data-on={k < cell.n ? "1" : "0"} style={{ "--k": k }} />)}</span>
          </div>
          <div className="mf-pop-topics" role="group" aria-label="Topic">
            {FOOTPRINT.topics.map((t) => {
              const c = t.cells[idx];
              return (
                <button key={t.topic} type="button" aria-pressed={t.topic === pick.topic} onClick={() => onPick({ key: pick.key, topic: t.topic })}>
                  {t.topic}<b>{c.n}/{t.total}</b>
                </button>
              );
            })}
          </div>
          <div className="mf-pop-body" key={pick.topic}>
            {cell.items.length === 0 && <p className="mf-pop-none">No clear promise on this topic in our summary. That does not mean {party.name} has no view, only that we have not summarised one.</p>}
            <ul>
              {cell.items.map((it, k) => (
                <motion.li key={it.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + k * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                  <span className="mf-pop-tick" aria-hidden="true" />
                  <div>
                    <small>{it.question}</small>
                    <p>{it.text}</p>
                    <a href={`/answers/${it.id}`}>Compare every party on this</a>
                  </div>
                </motion.li>
              ))}
            </ul>
            {cell.items.length > 0 && cell.missing.length > 0 && (
              <p className="mf-pop-miss">No clear promise in our summary on: {cell.missing.map((m) => m.question).join(" ")}</p>
            )}
          </div>
          <div className="mf-pop-foot">
            {onOpenParty && <button type="button" onClick={() => onOpenParty(pick.key)}>Read all of {SHORT[pick.key]}'s headline promises</button>}
            <span>Our own summary of the 2024 manifesto, not the original text.</span>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// A grid of the seven parties against the topics: a circle in each cell, bigger the more of that topic's questions the party made a clear promise on. Pressing a circle opens
// what the party promised.
export function Footprint({ onOpenParty }) {
  const [ref, go] = useGo(0.15);
  const f = FOOTPRINT;
  const [hot, setHot] = useState(null);
  const [pick, setPick] = useState(null);
  const openerRef = useRef(null);
  const keys = f.totals.map((t) => t.key);
  const close = () => setPick(null);
  return (
    <figure ref={ref} className="mf mf-grid" data-go={go}>
      <figcaption>
        <b>Where each party made a clear promise</b>
        <span>Each circle grows with the share of a topic's issues that the party gave a clear answer to in its 2024 manifesto. Press a circle to see what it promised.</span>
      </figcaption>
      <div className="mf-scroll">
        <table>
          <thead>
            <tr>
              <td />
              {keys.map((k) => (
                <th key={k} scope="col" data-dim={hot && hot !== k ? "1" : undefined} style={{ "--c": PARTY[k].color, "--t": readable(PARTY[k].color) }} onMouseEnter={() => setHot(k)} onMouseLeave={() => setHot(null)}>
                  <span>{SHORT[k]}</span>
                  {ONE_NATION_PARTIES[k] && <small>{ONE_NATION_PARTIES[k]} only</small>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {f.topics.map((t, row) => (
              <tr key={t.topic}>
                <th scope="row">{t.topic}</th>
                {t.cells.map((c, col) => (
                  <td key={c.key} data-dim={hot && hot !== c.key ? "1" : undefined}>
                    <button
                      type="button"
                      className="mf-cell"
                      data-n={c.n === 0 ? "0" : "1"}
                      style={{ "--c": PARTY[c.key].color, "--t": readable(PARTY[c.key].color), "--r": c.n / t.total, "--d": `${row * 70 + col * 45}ms` }}
                      aria-label={`${PARTY[c.key].name}, ${t.topic}: a clear promise on ${c.n} of ${t.total} issues. Press to read.`}
                      aria-haspopup="dialog"
                      onMouseEnter={() => setHot(c.key)}
                      onMouseLeave={() => setHot(null)}
                      onFocus={() => setHot(c.key)}
                      onBlur={() => setHot(null)}
                      onClick={(e) => { openerRef.current = e.currentTarget; setPick({ key: c.key, topic: t.topic }); }}
                    ><i /></button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Questions answered</th>
              {f.totals.map((t) => (
                <td key={t.key} data-dim={hot && hot !== t.key ? "1" : undefined} style={{ "--c": PARTY[t.key].color, "--t": readable(PARTY[t.key].color), "--w": t.n / f.questions }}>
                  <b>{t.n}</b><small>of {f.questions}</small><span className="mf-bar"><i /></span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mf-hint" aria-hidden="true">Slide the grid sideways to see every party.</p>
      <p className="mf-say">A small grey dot means no clear promise in our summary, which does not mean the party has no view.</p>
      <AnimatePresence>
        {pick && <PromisePopup key="pop" pick={pick} onPick={setPick} onClose={close} openerRef={openerRef} onOpenParty={onOpenParty ? (k) => { close(); onOpenParty(k, openerRef.current); } : null} />}
      </AnimatePresence>
    </figure>
  );
}

// A small row of nine bars on a party's card, one for each topic, as tall as the share of that topic's questions the party made a clear promise on.
export function FootprintStrip({ partyKey }) {
  const f = FOOTPRINT;
  const idx = f.totals.findIndex((t) => t.key === partyKey);
  if (idx < 0) return null;
  const total = f.totals[idx].n;
  return (
    <div className="mf-strip" style={{ "--c": PARTY[partyKey].color, "--t": readable(PARTY[partyKey].color) }}>
      <span className="mf-strip-bars" aria-hidden="true">
        {f.topics.map((t, i) => <i key={t.topic} title={t.topic} style={{ "--r": t.cells[idx].n / t.total, "--i": i }} />)}
      </span>
      <span className="mf-strip-say">A clear promise on <b>{total}</b> of {f.questions} issues</span>
    </div>
  );
}
