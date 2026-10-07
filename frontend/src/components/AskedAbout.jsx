/** @jsxImportSource react */
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, numeric } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import { sanitiseTopicQuery, summariseQuestions, questionsBy, MIN_TOPIC_LENGTH, SUGGESTED_TOPICS } from "../lib/topicSearch";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconTopic, IconSearch } from "./icons";
import BarRow from "./BarRow";
import CountUp from "./CountUp";
import DownloadCsvButton from "./DownloadCsvButton";
import AskerQuestionsModal from "./AskerQuestionsModal";
import { WRITTEN_QUESTION_COLUMNS } from "../lib/exportColumns";

// PostgREST's default page size; a single request can't return more.
const FETCH_LIMIT = 1000;
const fmt = (n) => n.toLocaleString("en-GB");
const pct0 = (n) => `${Math.round(n)}%`;

const SELECT =
  "id, uin, house, heading, date_tabled, date_answered, question_text, answering_body_name, " +
  "asking_member_id, asking_member_name, asking_member_party, asking_member_party_colour, asking_member_thumbnail_url, politician_id";

function Section({ title, note, children }) {
  return (
    <section style={{ marginTop: 44 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, margin: "0 0 6px", letterSpacing: "-0.01em" }}>{title}</h2>
      {note && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.55, margin: "0 0 14px", maxWidth: 620 }}>{note}</p>}
      {!note && <div style={{ height: 8 }} />}
      {children}
    </section>
  );
}

function Stat({ children, label }) {
  return (
    <div style={{ flex: "1 1 130px" }}>
      <div style={{ ...numeric, fontSize: "clamp(30px, 5vw, 40px)", fontWeight: 600, lineHeight: 1, color: COLORS.ink }}>{children}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 6 }}>{label}</div>
    </div>
  );
}

// One bar split into party colours, so the whole picture of "who is asking"
// reads at a glance; the exact figures sit in the legend underneath.
function PartySplit({ parties, total }) {
  const reduce = useReducedMotion();
  const shown = parties.slice(0, 7);
  const rest = parties.slice(7).reduce((n, p) => n + p.count, 0);
  const segments = [...shown.map((p) => ({ label: p.party, count: p.count, colour: partyColour(p.colour, COLORS.inkSoft) })), ...(rest ? [{ label: "Other parties", count: rest, colour: COLORS.inkSoft }] : [])];
  const asked = segments.reduce((n, s) => n + s.count, 0);
  return (
    <div>
      <div role="img" aria-label={`Questions by party: ${segments.map((s) => `${s.label} ${s.count}`).join(", ")}`} style={{ display: "flex", gap: 2, height: 18, borderRadius: 9, overflow: "hidden", background: COLORS.paperCard }}>
        {segments.map((s, i) => (
          <motion.div
            key={s.label}
            title={`${s.label}: ${s.count}`}
            initial={reduce ? false : { flexGrow: 0 }}
            animate={{ flexGrow: s.count }}
            transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexBasis: 0, background: s.colour, minWidth: 3 }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: "10px 22px", marginTop: 16 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 9, minWidth: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.colour, flexShrink: 0, alignSelf: "center" }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{s.label}</span>
            <span style={{ ...numeric, fontSize: 17, fontWeight: 700, color: COLORS.ink }}>{pct0((s.count / total) * 100)}</span>
            <span style={{ ...numeric, fontSize: 12.5, color: COLORS.inkSoft }}>{fmt(s.count)}</span>
          </div>
        ))}
      </div>
      {asked < total && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 8 }}>{fmt(total - asked)} of the questions have no named asker and aren't counted here.</div>}
    </div>
  );
}

function AskerRow({ person, rank, max, onOpen }) {
  const colour = partyColour(person.colour, COLORS.inkSoft);
  const label = `${person.name}, ${person.count} ${person.count === 1 ? "question" : "questions"}. Show them.`;
  return (
    <motion.button
      type="button"
      className="asker-row"
      onClick={onOpen}
      aria-label={label}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.3, delay: Math.min(rank, 6) * 0.04 }}
      style={{ display: "grid", gridTemplateColumns: "24px 44px minmax(0, 1fr) auto 14px", gap: 12, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.hairline}`, padding: "11px 8px", cursor: "pointer", borderRadius: 10 }}
    >
      <span style={{ ...numeric, fontSize: 14, color: COLORS.inkSoft, textAlign: "right" }}>{rank + 1}</span>
      {person.thumbnail ? (
        <img src={person.thumbnail} alt="" width={44} height={44} loading="lazy" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", background: COLORS.paperCard, border: `2px solid ${colour}` }} />
      ) : (
        <span style={{ width: 44, height: 44, borderRadius: "50%", background: `${colour}33`, border: `2px solid ${colour}` }} />
      )}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.name}</span>
        <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{[person.party, person.house].filter(Boolean).join(" · ")}</span>
        <span style={{ display: "block", height: 5, background: COLORS.paperCard, borderRadius: 3, marginTop: 6, maxWidth: 260 }}>
          <span style={{ display: "block", width: `${(person.count / max) * 100}%`, height: "100%", background: colour, borderRadius: "0 3px 3px 0" }} />
        </span>
      </span>
      <span style={{ textAlign: "right" }}>
        <span style={{ ...numeric, display: "block", fontSize: 22, fontWeight: 700, color: COLORS.ink, lineHeight: 1 }}>{person.count}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft }}>{person.count === 1 ? "question" : "questions"}</span>
      </span>
      <span aria-hidden="true" style={{ color: COLORS.inkSoft, fontSize: 18 }}>›</span>
    </motion.button>
  );
}

export default function AskedAbout({ onSelectPolitician, onNavigateForMp, initialTopic = null }) {
  const [input, setInput] = useState(initialTopic ?? "");
  const [state, setState] = useState({ status: "idle" });
  // Which asker's pop-up is open, and the row that opened it (focus returns there).
  const [open, setOpen] = useState(null);
  const requestId = useRef(0);

  const query = sanitiseTopicQuery(input);
  const searchable = query.length >= MIN_TOPIC_LENGTH;

  // Debounced, and every response checked against the latest request so a
  // slow earlier search can't overwrite a newer one.
  useEffect(() => {
    if (!searchable) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setState({ status: "loading" });
      const { data, error, count } = await supabase
        .from("written_questions")
        .select(SELECT, { count: "exact" })
        .or(`question_text.ilike.*${query}*,heading.ilike.*${query}*`)
        .order("date_tabled", { ascending: false })
        .range(0, FETCH_LIMIT - 1);
      if (id !== requestId.current) return;
      if (error) setState({ status: "error", query });
      else setState({ status: "done", query, rows: data ?? [], matching: count ?? (data ?? []).length });
    }, 400);
    return () => clearTimeout(timer);
  }, [query, searchable]);

  const summary = useMemo(() => (state.status === "done" ? summariseQuestions(state.rows) : null), [state]);

  async function fetchProfile(politicianId) {
    const { data } = await supabase.from("politicians").select("*").eq("id", politicianId).single();
    return data ?? null;
  }

  // Results (or an error) only count for the query they were fetched for;
  // anything else is a search still on its way.
  const settled = (state.status === "done" || state.status === "error") && state.query === query;
  const view = !searchable ? "idle" : settled ? state.status : "loading";
  const maxPerson = summary?.people[0]?.count ?? 1;
  const maxDept = summary?.departments[0]?.count ?? 1;
  const openPerson = summary && open ? summary.people.find((p) => p.key === open.key) : null;
  const openQuestions = openPerson ? questionsBy(state.rows, openPerson.key) : [];

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconTopic}
        kicker="Written Questions"
        title="Who's asking about a topic"
        subtitle="Type a topic to see which MPs and peers have put written questions to ministers about it in the last 30 days: which parties, which departments and what they asked."
      />

      <div
        style={{
          marginTop: 26, padding: "clamp(16px, 3.5vw, 26px)", borderRadius: 22, border: `1px solid ${COLORS.hairline}`,
          background: `radial-gradient(110% 100% at 100% 0%, ${COLORS.accent}22, transparent 62%), ${COLORS.paperCard}`,
        }}
      >
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: COLORS.accent, display: "flex" }}>
            <IconSearch size={19} />
          </span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="A topic, e.g. housing, NHS, water…"
            aria-label="Topic to search written questions for"
            style={{ width: "100%", boxSizing: "border-box", padding: "17px 20px 17px 50px", fontFamily: FONT_DISPLAY, fontSize: 18, border: `1.5px solid ${COLORS.hairline}`, borderRadius: 999, background: COLORS.paper, color: COLORS.ink, outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
            onBlur={(e) => (e.target.style.borderColor = COLORS.hairline)}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {SUGGESTED_TOPICS.map((t) => {
            const active = query.toLowerCase() === t.toLowerCase();
            return (
              <button
                key={t}
                type="button"
                onClick={() => setInput(t)}
                style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: "7px 15px", borderRadius: 999, cursor: "pointer", border: `1px solid ${active ? COLORS.accent : COLORS.hairline}`, background: active ? COLORS.accent : COLORS.paper, color: active ? "#fff" : COLORS.inkSoft, transition: "background 0.15s, color 0.15s" }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {view === "idle" && input.trim().length > 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 20 }}>Type at least {MIN_TOPIC_LENGTH} letters.</div>}
      {view === "idle" && input.trim().length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.65, marginTop: 24, maxWidth: 640 }}>
          Written questions are one of the clearest day-to-day signals of what an MP is actually pressing the government on. Pick a topic above, or type your own. It
          searches both the question itself and the subject heading it was filed under. Then tap any name to read their questions.
        </div>
      )}
      {view === "loading" && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 28 }}>Searching…</div>}
      {view === "error" && <div style={{ marginTop: 28 }}><LoadFailedNote item="the written questions search" /></div>}

      {view === "done" && summary && (
        <>
          {summary.total === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 28 }}>
              No written questions in the last 30 days mention “{query}”. Try a broader word, or a different spelling.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 34px", alignItems: "flex-end", marginTop: 34 }}>
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ ...numeric, fontSize: "clamp(64px, 12vw, 96px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.04em", color: COLORS.ink }}>
                    <CountUp value={state.matching} />
                  </div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, marginTop: 8 }}>
                    {state.matching === 1 ? "question mentions" : "questions mention"} “{query}”
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>in the last 30 days</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 28px", flex: "2 1 300px" }}>
                  <Stat label={summary.askers === 1 ? "MP or peer" : "MPs and peers"}><CountUp value={summary.askers} /></Stat>
                  <Stat label="answered so far"><CountUp value={summary.total ? (summary.answered / summary.total) * 100 : 0} format={(n) => pct0(n)} /></Stat>
                  <Stat label={summary.departments.length === 1 ? "department" : "departments"}><CountUp value={summary.departments.length} /></Stat>
                </div>
              </div>
              {state.matching > summary.total && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 10 }}>
                  That's a lot, so the breakdown below covers the {fmt(summary.total)} most recent. Try a more specific topic to narrow it.
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <DownloadCsvButton label={`Download these ${fmt(summary.total)} questions (CSV)`} slug={`written-questions-${query}`} columns={WRITTEN_QUESTION_COLUMNS} rows={state.rows} />
              </div>

              {summary.parties.length > 0 && (
                <Section title="Who is asking, by party" note="This counts questions, not MPs, so a party's share reflects both how many members it has and how many of them are asking.">
                  <PartySplit parties={summary.parties} total={summary.parties.reduce((n, p) => n + p.count, 0)} />
                </Section>
              )}

              {summary.people.length > 0 && (
                <Section title="Who has asked the most" note="Tap anyone to read the questions they've put on this topic.">
                  <div>
                    {summary.people.map((p, i) => (
                      <AskerRow key={p.key} person={p} rank={i} max={maxPerson} onOpen={(e) => setOpen({ key: p.key, el: e.currentTarget })} />
                    ))}
                  </div>
                </Section>
              )}

              {summary.departments.length > 0 && (
                <Section title="Which departments were asked">
                  {summary.departments.map((d, i) => (
                    <BarRow key={d.name} label={d.name} color={COLORS.accent} fraction={d.count / maxDept} valueText={fmt(d.count)} labelWidth={260} delay={Math.min(i, 8) * 0.04} />
                  ))}
                </Section>
              )}

              <Section title="Most recent">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {summary.recent.map((r) => (
                    <div key={r.id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "13px 16px" }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 4 }}>
                        <strong style={{ color: COLORS.ink }}>{r.asking_member_name ?? "Unknown member"}</strong>
                        {r.asking_member_party ? ` · ${r.asking_member_party}` : ""} → {r.answering_body_name ?? "the government"} · {formatDate(r.date_tabled)}
                      </div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.5 }}>{r.question_text}</div>
                      <a href={`https://questions-statements.parliament.uk/written-questions/detail/${r.date_tabled}/${r.uin}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 6, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.accent }}>
                        Full record ↗
                      </a>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}
        </>
      )}

      <AnimatePresence>
        {openPerson && (
          <AskerQuestionsModal
            key={openPerson.key}
            person={openPerson}
            questions={openQuestions}
            topic={query}
            returnFocusTo={open?.el}
            onClose={() => setOpen(null)}
            onOpenProfile={
              openPerson.politicianId
                ? async () => {
                    const mp = await fetchProfile(openPerson.politicianId);
                    setOpen(null);
                    if (mp) onSelectPolitician?.(mp);
                  }
                : undefined
            }
            onOpenAllQuestions={
              openPerson.politicianId && onNavigateForMp
                ? async () => {
                    const mp = await fetchProfile(openPerson.politicianId);
                    setOpen(null);
                    if (mp) onNavigateForMp("writtenQuestions", mp);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
