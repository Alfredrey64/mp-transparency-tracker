/** @jsxImportSource react */
import { useState } from "react";
import { useGo } from "./useGo";
import { PartyHemicycle } from "../PartyHemicycle";
import { QUIZ_PARTIES } from "../../data/partyMatchQuiz";
import { ONE_NATION_PARTIES } from "../../data/answerPartyPositions";
import { manifestoFootprint } from "../../lib/manifestoFootprint";
import { readable } from "../../theme";
import "../../manifestos.css";

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
        <b>The 2024 Commons, seat by seat</b>
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

// A grid of the seven parties against the topics: a circle in each cell, bigger the more of that topic's questions the party made a clear promise on.
export function Footprint() {
  const [ref, go] = useGo(0.15);
  const f = FOOTPRINT;
  const [hot, setHot] = useState(null);
  const [pick, setPick] = useState(null);
  const keys = f.totals.map((t) => t.key);
  const say = pick
    ? `${PARTY[pick.key].name} made a clear promise on ${pick.n} of the ${pick.total} ${pick.total === 1 ? "question" : "questions"} about ${pick.topic.toLowerCase()}.`
    : "Press a circle to read it. A small grey dot means no clear promise in our summary, which does not mean the party has no view.";
  return (
    <figure ref={ref} className="mf mf-grid" data-go={go}>
      <figcaption>
        <b>Where each party made a clear promise</b>
        <span>Each circle grows with the share of a topic's questions that the party gave a clear answer to in its 2024 manifesto.</span>
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
                      aria-label={`${PARTY[c.key].name}, ${t.topic}: a clear promise on ${c.n} of ${t.total} questions`}
                      onMouseEnter={() => setHot(c.key)}
                      onMouseLeave={() => setHot(null)}
                      onFocus={() => setHot(c.key)}
                      onBlur={() => setHot(null)}
                      onClick={() => setPick({ key: c.key, n: c.n, total: t.total, topic: t.topic })}
                      data-picked={pick && pick.key === c.key && pick.topic === t.topic ? "1" : undefined}
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
      <p className="mf-say" aria-live="polite">{say}</p>
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
      <span className="mf-strip-say">A clear promise on <b>{total}</b> of {f.questions} questions</span>
    </div>
  );
}
