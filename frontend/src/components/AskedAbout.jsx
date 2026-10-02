/** @jsxImportSource react */
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { formatDate, partyColour } from "../lib/format";
import { sanitiseTopicQuery, summariseQuestions, MIN_TOPIC_LENGTH, SUGGESTED_TOPICS } from "../lib/topicSearch";
import { PageHeader, LoadFailedNote } from "./shared";
import { IconTopic, IconSearch } from "./icons";
import BarRow from "./BarRow";
import DownloadCsvButton from "./DownloadCsvButton";
import { WRITTEN_QUESTION_COLUMNS } from "../lib/exportColumns";

// PostgREST's default page size; a single request can't return more.
const FETCH_LIMIT = 1000;
const fmt = (n) => n.toLocaleString("en-GB");

const SELECT =
  "id, uin, house, heading, date_tabled, date_answered, question_text, answering_body_name, " +
  "asking_member_id, asking_member_name, asking_member_party, asking_member_party_colour, politician_id";

function Section({ title, note, children }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.ink, margin: "0 0 10px" }}>{title}</h2>
      {note && <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55, margin: "-4px 0 10px", maxWidth: 640 }}>{note}</p>}
      {children}
    </section>
  );
}

export default function AskedAbout({ onSelectPolitician }) {
  const [input, setInput] = useState("");
  const [state, setState] = useState({ status: "idle" });
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

  async function openProfile(politicianId) {
    const { data } = await supabase.from("politicians").select("*").eq("id", politicianId).single();
    if (data) onSelectPolitician?.(data);
  }

  // Results (or an error) only count for the query they were fetched for;
  // anything else is a search still on its way.
  const settled = (state.status === "done" || state.status === "error") && state.query === query;
  const view = !searchable ? "idle" : settled ? state.status : "loading";
  const maxPerson = summary?.people[0]?.count ?? 1;
  const maxDept = summary?.departments[0]?.count ?? 1;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconTopic}
        kicker="Public Record · Written Questions"
        title="Who's asking about…"
        subtitle="Type a topic and see which MPs and peers have put written questions to ministers about it in the last 30 days — which parties, which departments, and the most recent examples."
      />

      <div style={{ position: "relative", maxWidth: 520, marginTop: 24 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="A topic, e.g. housing, NHS, water…"
          aria-label="Topic to search written questions for"
          style={{
            width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 36px", fontFamily: FONT_BODY, fontSize: 14,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {SUGGESTED_TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setInput(t)}
            style={{
              fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${query.toLowerCase() === t.toLowerCase() ? COLORS.accent : COLORS.hairline}`,
              background: query.toLowerCase() === t.toLowerCase() ? `${COLORS.accent}18` : "transparent",
              color: query.toLowerCase() === t.toLowerCase() ? COLORS.accent : COLORS.inkSoft,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {view === "idle" && input.trim().length > 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 20 }}>Type at least {MIN_TOPIC_LENGTH} letters.</div>
      )}
      {view === "idle" && input.trim().length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.6, marginTop: 24, maxWidth: 640 }}>
          Written questions are one of the clearest day-to-day signals of what an MP is actually pressing the government on. Pick a topic above, or
          type your own, to see who is raising it. It searches both the question itself and the subject heading it was filed under.
        </div>
      )}
      {view === "loading" && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Searching…</div>}
      {view === "error" && <div style={{ marginTop: 24 }}><LoadFailedNote item="the written questions search" /></div>}

      {view === "done" && summary && (
        <>
          {summary.total === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 24 }}>
              No written questions in the last 30 days mention “{query}”. Try a broader word, or a different spelling.
            </div>
          ) : (
            <>
              <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink, lineHeight: 1.6, marginTop: 24 }}>
                <strong>{fmt(state.matching)}</strong> {state.matching === 1 ? "question mentions" : "questions mention"} “{query}” in the last 30 days
                {summary.askers > 0 && <>, from <strong>{fmt(summary.askers)}</strong> {summary.askers === 1 ? "MP or peer" : "MPs and peers"}</>}.{" "}
                {fmt(summary.answered)} of {fmt(summary.total)} shown {summary.answered === 1 ? "has" : "have"} been answered.
              </div>
              {state.matching > summary.total && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6 }}>
                  That's a lot, so the breakdown below covers the {fmt(summary.total)} most recent. Try a more specific topic to narrow it.
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <DownloadCsvButton label={`Download these ${fmt(summary.total)} questions (CSV)`} slug={`written-questions-${query}`} columns={WRITTEN_QUESTION_COLUMNS} rows={state.rows} />
              </div>

              {summary.parties.length > 0 && (
                <Section title="By party" note="This counts questions, not MPs, so a party's total reflects both how many members it has and how many of them are asking.">
                  {summary.parties.map((p) => (
                    <BarRow key={p.party} label={p.party} color={partyColour(p.colour, COLORS.inkSoft)} fraction={p.count / summary.parties[0].count} valueText={fmt(p.count)} detail={`${Math.round((p.count / summary.total) * 100)}%`} />
                  ))}
                </Section>
              )}

              {summary.people.length > 0 && (
                <Section title="Who has asked the most">
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {summary.people.map((p) => {
                      const clickable = Boolean(p.politicianId);
                      return (
                        <div key={`${p.name}-${p.politicianId}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.hairline}` }}>
                          <div style={{ minWidth: 0 }}>
                            <button
                              type="button"
                              onClick={clickable ? () => openProfile(p.politicianId) : undefined}
                              style={{
                                background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink,
                                cursor: clickable ? "pointer" : "default", textDecoration: clickable ? "underline" : "none", textDecorationColor: `${partyColour(p.colour, COLORS.inkSoft)}66`,
                              }}
                            >
                              {p.name}
                            </button>
                            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{[p.party, p.house].filter(Boolean).join(" · ")}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 90, height: 8, background: COLORS.paperCard, borderRadius: 4 }}>
                              <div style={{ width: `${(p.count / maxPerson) * 100}%`, height: "100%", background: partyColour(p.colour, COLORS.accent), borderRadius: "0 4px 4px 0" }} />
                            </div>
                            <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: COLORS.ink, minWidth: 24, textAlign: "right" }}>{p.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {summary.departments.length > 0 && (
                <Section title="Which departments were asked">
                  {summary.departments.map((d) => (
                    <BarRow key={d.name} label={d.name} color={COLORS.accent} fraction={d.count / maxDept} valueText={fmt(d.count)} />
                  ))}
                </Section>
              )}

              <Section title="Most recent">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {summary.recent.map((r) => (
                    <div key={r.id} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 4 }}>
                        <strong style={{ color: COLORS.ink }}>{r.asking_member_name ?? "Unknown member"}</strong>
                        {r.asking_member_party ? ` · ${r.asking_member_party}` : ""} → {r.answering_body_name ?? "the government"} · {formatDate(r.date_tabled)}
                      </div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.5 }}>{r.question_text}</div>
                      <a
                        href={`https://questions-statements.parliament.uk/written-questions/detail/${r.date_tabled}/${r.uin}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 6, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.accent }}
                      >
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
    </div>
  );
}
