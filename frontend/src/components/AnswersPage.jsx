import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconAsk, IconSearch } from "./icons";
import { ANSWERS, ANSWER_TOPICS, answerById } from "../data/answers";
import { findAnswers } from "../lib/answerSearch";
import { positionsFor, POSITIONS_AS_OF, ONE_NATION_PARTIES } from "../data/answerPartyPositions";
import { PARTY_MANIFESTOS } from "../data/partyManifestos";
import { partyColourByName } from "../lib/careerTimeline";
import { loadSector } from "../lib/onsData";
import { fillKeyPoint } from "../lib/onsKeyPoints";
import { card, cardTitle, smallTitle } from "../lib/onsStyles";

// Ask a question: type one, or pick one, and get a plain-English answer with the latest official
// figures beside it and the main arguments from different sides. The answers are written by hand
// (see data/answers.js), so this only knows the questions listed, and says so when it doesn't.

const ACCENT = "#4F46E5";
const SUGGESTED = ["why-housing-expensive", "why-nhs-waiting-list", "why-prices-rising", "why-small-boats", "where-does-tax-go", "why-economy-slow", "why-mortgage-rates-high", "is-crime-rising"];

const sectorCache = new Map();
function useSector(key) {
  const [data, setData] = useState(sectorCache.get(key) ?? null);
  useEffect(() => {
    if (sectorCache.has(key)) return undefined;
    let alive = true;
    loadSector(key).then((r) => { sectorCache.set(key, r); if (alive) setData(r); }).catch(() => {});
    return () => { alive = false; };
  }, [key]);
  return data;
}

// One live figure: the sentence with its numbers filled in, and a link to the chart.
function Fact({ fact }) {
  const loaded = useSector(fact.sector);
  const item = loaded?.series[fact.series];
  const parts = item ? fillKeyPoint(fact.text, item.def, item.points) : null;
  if (!loaded) return <li style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>Loading the latest figure…</li>;
  if (!parts) return null;
  return (
    <li style={{ listStyle: "none", padding: "12px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
      <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.55, color: COLORS.ink, margin: 0 }}>
        {parts.map((p, i) => (p.strong ? <strong key={i} style={{ fontWeight: 800 }}>{p.text}</strong> : <span key={i}>{p.text}</span>))}
      </p>
      <a className="ons-tap" href={`#/${fact.sector}/${encodeURIComponent(`${fact.series}.10.-`)}`} style={{ display: "inline-flex", alignItems: "center", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, textDecoration: "underline", textUnderlineOffset: 3 }}>See the chart</a>
    </li>
  );
}

// What each party said it would do about the question, from its 2024 manifesto, with a link to the whole manifesto.
function PartyPositions({ answerId }) {
  const found = positionsFor(answerId);
  if (!found) return null;
  return (
    <section style={card} aria-labelledby="h-parties">
      <h3 id="h-parties" style={{ ...cardTitle, fontSize: 19 }}>What the parties said they would do</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "4px 0 14px", lineHeight: 1.55 }}>
        The clearest commitments {found.about} in {POSITIONS_AS_OF}. A party is left out where it made no clear commitment we can point to, which does not mean it has no view.
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 12 }}>
        {found.parties.map((p) => {
          const m = PARTY_MANIFESTOS.find((x) => x.key === p.key);
          const colour = partyColourByName(p.key === "liberal-democrat" ? "Liberal Democrat" : m.shortName);
          return (
            <li key={p.key} style={{ display: "flex", flexDirection: "column", padding: "14px 16px 12px", borderRadius: 16, background: `linear-gradient(160deg, ${colour}16, ${COLORS.paper} 70%)`, border: `1px solid ${colour}44`, borderTop: `4px solid ${colour}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 800, color: COLORS.ink }}>{m.shortName}</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.58, color: COLORS.ink, margin: "6px 0 10px", flex: 1 }}>{p.text}</p>
              <a href={m.manifestoUrl} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft }}>Read the {m.manifestoYear} manifesto</a>
            </li>
          );
        })}
      </ul>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "14px 0 0" }}>
        {found.parties.filter((p) => ONE_NATION_PARTIES[p.key]).map((p) => `${PARTY_MANIFESTOS.find((x) => x.key === p.key).shortName} only stands in ${ONE_NATION_PARTIES[p.key]}. `).join("")}We summarise in our own words and do not rank or judge the plans. Parties change their policies after an election, so check each party&apos;s own website for its latest position. Labour has been in government since July 2024, so what it has done in office can differ from what it promised.
      </p>
    </section>
  );
}

function AnswerCard({ answer }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      key={answer.id} aria-labelledby="h-answer"
      initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
      style={{ display: "grid", gap: 18 }}
    >
      <section style={{ ...card, position: "relative", overflow: "hidden", background: `radial-gradient(600px 240px at 100% 0%, ${ACCENT}22, transparent 70%), ${COLORS.paperCard}` }}>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT}22)` }} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: ACCENT }}>{answer.topic}</div>
        <h2 id="h-answer" style={{ ...cardTitle, fontSize: "clamp(22px, 4vw, 30px)", margin: "4px 0 14px" }}>{answer.question}</h2>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 4 }}>In short</div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16.5, lineHeight: 1.6, color: COLORS.ink, margin: 0, maxWidth: 760 }}>{answer.short}</p>
      </section>

      <section style={card} aria-labelledby="h-facts">
        <h3 id="h-facts" style={{ ...cardTitle, fontSize: 19 }}>The latest figures</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "4px 0 6px" }}>Taken straight from the official statistics, and updated when new figures are published.</p>
        <ul style={{ margin: 0, padding: 0 }}>{answer.facts.map((f) => <Fact key={f.series} fact={f} />)}</ul>
      </section>

      <section style={card} aria-labelledby="h-why">
        <h3 id="h-why" style={{ ...cardTitle, fontSize: 19 }}>Why it happens</h3>
        <ol style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 14 }}>
          {answer.reasons.map((r, i) => (
            <li key={r.title} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12, alignItems: "start" }}>
              <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, background: ACCENT, color: "#fff", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, display: "grid", placeItems: "center", marginTop: 1 }}>{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ ...smallTitle, fontSize: 15, margin: "0 0 2px" }}>{r.title}</h4>
                <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0 }}>{r.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {answer.views.length > 0 && (
        <section style={card} aria-labelledby="h-views">
          <h3 id="h-views" style={{ ...cardTitle, fontSize: 19 }}>What people argue</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, margin: "4px 0 12px" }}>These are the main arguments made, stated as fairly as we can. They are not our view.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 12 }}>
            {answer.views.map((v) => (
              <div key={v.who} style={{ padding: "12px 14px", borderRadius: 14, background: `${ACCENT}0f`, border: `1px solid ${ACCENT}30` }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>{v.who}</div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.inkSoft, margin: 0 }}>{v.says}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <PartyPositions answerId={answer.id} />

      <section style={card} aria-labelledby="h-next">
        <h3 id="h-next" style={{ ...cardTitle, fontSize: 19 }}>Look closer</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {answer.next.map((n) => (
            <a key={n.href} className="ons-tap" href={n.href} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, textDecoration: "none", padding: "9px 16px", borderRadius: 999, border: `1px solid ${ACCENT}77`, background: `${ACCENT}12` }}>{n.label}</a>
          ))}
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "14px 0 0" }}>
          Written by us from official figures (ONS, NHS England, the Home Office, the Bank of England and others). The explanations are a summary and cannot cover everything. Check the sources on each page.
        </p>
      </section>
    </motion.article>
  );
}

export default function AnswersPage({ param }) {
  const [query, setQuery] = useState("");
  const answer = answerById(param);
  const results = useMemo(() => findAnswers(query, ANSWERS, 6), [query]);
  const searching = query.trim().length > 0;
  const open = (id) => { setQuery(""); window.location.hash = `#/answers/${id}`; window.scrollTo({ top: 0 }); };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconAsk} title="Ask a question" subtitle="Type a question, such as why housing is so expensive, or pick one below. You get a plain answer, the latest official figures, and the main arguments from different sides." maxWidth={720} />

      <form role="search" onSubmit={(e) => { e.preventDefault(); if (results[0]) open(results[0].id); }} style={{ position: "relative", margin: "22px 0 16px" }}>
        <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: ACCENT, display: "flex" }}><IconSearch size={19} /></span>
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Ask a question" placeholder="Why is housing so expensive?" autoComplete="off" enterKeyHint="search"
          style={{ width: "100%", boxSizing: "border-box", padding: "16px 20px 16px 50px", fontFamily: FONT_BODY, fontSize: 17, border: `1.5px solid ${COLORS.hairline}`, borderRadius: 999, background: COLORS.paperCard, color: COLORS.ink, outline: "none" }}
          onFocus={(e) => { e.target.style.borderColor = ACCENT; }} onBlur={(e) => { e.target.style.borderColor = COLORS.hairline; }}
        />
      </form>

      {searching && (
        <section aria-live="polite" aria-label="Matching questions" style={{ ...card, marginBottom: 18 }}>
          {results.length > 0 ? (
            <>
              <h2 style={{ ...cardTitle, fontSize: 18 }}>{results.length === 1 ? "This looks like what you are asking" : "These look like what you are asking"}</h2>
              <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
                {results.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="ons-chip" onClick={() => open(r.id)} style={{ display: "block", width: "100%", textAlign: "left", font: "inherit", background: "none", border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "10px 14px", cursor: "pointer" }}>
                      <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 15.5, fontWeight: 700, color: COLORS.ink }}>{r.question}</span>
                      <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 2 }}>{r.short.split(". ")[0]}.</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 style={{ ...cardTitle, fontSize: 18 }}>We have no written answer to that yet</h2>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "8px 0 0" }}>
                The answers here are written by hand, so we only cover the questions listed below. Try different words (for example &ldquo;rent&rdquo; instead of &ldquo;lodging&rdquo;), pick one of the questions below, or use the search box in the menu to find a page or an MP.
              </p>
            </>
          )}
        </section>
      )}

      {!searching && answer && <AnswerCard answer={answer} />}

      {!searching && param && !answer && (
        <section style={{ ...card, marginBottom: 18 }}>
          <h2 style={{ ...cardTitle, fontSize: 18 }}>We could not find that answer</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, margin: "8px 0 0" }}>Pick one of the questions below.</p>
        </section>
      )}

      {!searching && (
        <section aria-labelledby="h-all" style={{ marginTop: answer ? 28 : 6 }}>
          <h2 id="h-all" style={{ ...cardTitle, fontSize: 20 }}>{answer ? "More questions" : "Popular questions"}</h2>
          {!answer && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 24px" }}>
              {SUGGESTED.map((id) => (
                <button key={id} type="button" className="ons-chip" onClick={() => open(id)} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink, padding: "9px 16px", borderRadius: 999, border: `1px solid ${ACCENT}77`, background: `${ACCENT}12`, cursor: "pointer" }}>
                  {answerById(id).question}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gap: 26, marginTop: answer ? 12 : 0 }}>
            {ANSWER_TOPICS.map((topic) => (
              <div key={topic}>
                <h3 style={{ ...smallTitle, fontSize: 14, color: ACCENT, margin: "0 0 10px" }}>{topic}</h3>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(270px, 100%), 1fr))", gap: 10 }}>
                  {ANSWERS.filter((a) => a.topic === topic).map((a) => {
                    const here = answer?.id === a.id;
                    return (
                      <li key={a.id} style={{ display: "flex" }}>
                        <a
                          className="ons-tap answer-box" href={`#/answers/${a.id}`} aria-current={here ? "page" : undefined}
                          style={{ display: "flex", alignItems: "center", width: "100%", boxSizing: "border-box", fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.4, fontWeight: here ? 700 : 600, color: COLORS.ink, textDecoration: "none", padding: "13px 16px", minHeight: 56, borderRadius: 14, background: here ? `${ACCENT}1c` : COLORS.paperCard, borderTop: `1px solid ${here ? ACCENT : COLORS.hairline}`, borderRight: `1px solid ${here ? ACCENT : COLORS.hairline}`, borderBottom: `1px solid ${here ? ACCENT : COLORS.hairline}`, borderLeft: `4px solid ${ACCENT}`, transition: "background 0.15s, transform 0.15s, box-shadow 0.15s" }}
                        >
                          {a.question}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <style>{`.answer-box:hover { background: ${ACCENT}14 !important; transform: translateY(-2px); box-shadow: 0 14px 26px -20px rgba(0, 0, 0, 0.6); } @media (prefers-reduced-motion: reduce) { .answer-box:hover { transform: none; } }`}</style>
        </section>
      )}
    </div>
  );
}
