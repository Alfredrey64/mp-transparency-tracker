import { useState } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { pillStyle } from "../lib/onsStyles";
import { groupByTopic } from "../lib/questionTopics";
import { ANSWERS, ANSWER_TOPICS, answerById } from "../data/answers";
import { ANSWER_POSITIONS, ONE_NATION_PARTIES, POSITIONS_AS_OF, POSITION_PARTY_ORDER, positionsFor } from "../data/answerPartyPositions";
import { QUIZ_PARTIES } from "../data/partyMatchQuiz";
import { findManifesto, PARTY_MANIFESTOS } from "../data/partyManifestos";
import { partyWash, partyOutline } from "../lib/partyShade";

// "Who promises what": pick a topic, then a question, and see which parties made a clear promise about it and what the promise was.
// Parties that made no clear promise are named too, so a gap is as visible as a commitment. The chosen question goes in the address
// (#/parties/<question>), so a comparison can be shared.

const GROUPS = groupByTopic(ANSWERS.filter((a) => ANSWER_POSITIONS[a.id]), ANSWER_TOPICS);
const DEFAULT_ID = GROUPS[0].items[0].id;
const PARTY = Object.fromEntries(QUIZ_PARTIES.map((p) => [p.key, p]));
const isQuestion = (id) => Boolean(id && ANSWER_POSITIONS[id] && answerById(id));
const topicOf = (id) => GROUPS.find((g) => g.items.some((i) => i.id === id)) ?? GROUPS[0];

function PartyCard({ party, text, index }) {
  const manifesto = PARTY_MANIFESTOS.find((m) => m.key === party.key);
  const nation = ONE_NATION_PARTIES[party.key];
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 6) * 0.045, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", borderRadius: 16, background: `${partyWash(party.color)}, ${COLORS.paperCard}`, border: partyOutline(party.color), borderTop: `5px solid ${party.color}`, padding: "16px 18px 14px", minWidth: 0 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "2px 10px" }}>
        <h4 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: 0, lineHeight: 1.2 }}>{party.name}</h4>
        {nation && <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: COLORS.inkSoft }}>stands in {nation} only</span>}
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: COLORS.ink, margin: "10px 0 12px", flex: 1 }}>{text}</p>
      {manifesto && (
        <a href={manifesto.manifestoUrl} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Read the {manifesto.shortName} manifesto
        </a>
      )}
    </motion.li>
  );
}

// "1  Choose a topic": says what each row of choices is for, in the order to use them.
function StepLabel({ number, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, margin: `${number === 1 ? 0 : 20}px 0 9px`, fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}>
      <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: COLORS.ink, color: COLORS.paper, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>{number}</span>
      {text}
    </div>
  );
}

export default function PromiseExplorer({ initialQuestion }) {
  const [qid, setQid] = useState(isQuestion(initialQuestion) ? initialQuestion : DEFAULT_ID);
  // If the address changes from outside (a pasted link, the back button), follow it.
  const [seenParam, setSeenParam] = useState(initialQuestion);
  if (initialQuestion !== seenParam) {
    setSeenParam(initialQuestion);
    if (isQuestion(initialQuestion)) setQid(initialQuestion);
  }

  const group = topicOf(qid);
  const answer = answerById(qid);
  const found = positionsFor(qid);
  const promised = new Set(found.parties.map((p) => p.key));
  const silent = POSITION_PARTY_ORDER.filter((k) => !promised.has(k));

  function pick(id) {
    setQid(id);
    // Keep the address in step so this exact comparison can be copied and shared, without adding a step to the back button.
    window.history.replaceState(null, "", `#/parties/${id}`);
  }

  return (
    <section aria-labelledby="h-promises" style={{ margin: "4px 0 34px" }}>
      <h2 id="h-promises" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 700, color: COLORS.ink, margin: 0, letterSpacing: "-0.01em" }}>Pick an issue, see who promises what</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "6px 0 16px", maxWidth: 700 }}>
        Choose a topic, then a question. You will see each party that made a clear promise about it, and what the promise was.
      </p>

      <StepLabel number={1} text="Choose a topic" />
      <div role="group" aria-label="Topic" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {GROUPS.map((g) => (
          <button key={g.topic} type="button" className="ons-tap" aria-pressed={g.topic === group.topic} onClick={() => g.topic !== group.topic && pick(g.items[0].id)} style={{ ...pillStyle(g.topic === group.topic), display: "inline-flex", alignItems: "center", gap: 8 }}>
            {g.topic}
            <span aria-hidden="true" style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.7 }}>{g.items.length}</span>
          </button>
        ))}
      </div>

      <StepLabel number={2} text={`Choose a question about ${group.topic.toLowerCase()}`} />
      <div role="group" aria-label="Question" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 22px" }}>
        {group.items.map((q) => {
          const on = q.id === qid;
          return (
            <button
              key={q.id} type="button" className="ons-tap" aria-pressed={on} onClick={() => pick(q.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 9, textAlign: "left", cursor: "pointer",
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: on ? 700 : 500, lineHeight: 1.3, color: COLORS.ink,
                padding: "9px 15px 9px 12px", borderRadius: 12,
                border: `1px solid ${on ? COLORS.ink : COLORS.hairline}`, boxShadow: on ? `0 0 0 1px ${COLORS.ink}` : "none",
                background: on ? COLORS.paperCard : "transparent", transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
              }}
            >
              <span aria-hidden="true" style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", border: `2px solid ${on ? COLORS.ink : COLORS.inkSoft}`, display: "grid", placeItems: "center" }}>
                {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.ink }} />}
              </span>
              {q.question}
            </button>
          );
        })}
      </div>

      <div style={{ minHeight: 320 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "4px 20px", marginBottom: 14 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(19px, 3.4vw, 24px)", fontWeight: 700, color: COLORS.ink, margin: 0, lineHeight: 1.25 }}>{answer.question}</h3>
          <span aria-live="polite" style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.inkSoft }}>
            {found.parties.length} of {POSITION_PARTY_ORDER.length} parties made a clear promise
          </span>
        </div>

        <ul key={qid} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(270px, 100%), 1fr))", gap: 14 }}>
          {found.parties.map((p, i) => <PartyCard key={p.key} party={PARTY[p.key]} text={p.text} index={i} />)}
        </ul>

        {silent.length > 0 && (
          <div style={{ marginTop: 16, fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: COLORS.inkSoft }}>
            <strong style={{ color: COLORS.ink }}>No clear promise found from: </strong>
            {silent.map((k, i) => (
              <span key={k}>
                {i > 0 && ", "}
                <span style={{ whiteSpace: "nowrap" }}>
                  <span aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", border: `2px solid ${PARTY[k].color}`, margin: "0 6px 0 2px", verticalAlign: "baseline" }} />
                  {findManifesto(PARTY[k].name)?.shortName ?? PARTY[k].name}
                </span>
              </span>
            ))}. That does not mean they have no view, only that we could not find a clear commitment on this in the manifesto.
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px", marginTop: 18 }}>
          <a className="ons-tap" href={`#/answers/${qid}`} style={{ ...pillStyle(true), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>See the figures and the full answer</a>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>From {POSITIONS_AS_OF}, in our own words. Parties change their policies, so check each party's own site for the latest.</span>
        </div>
      </div>
    </section>
  );
}
