// The boxes on an MP's page (biography, contact, standards, voting, rebellions, activity, news) and the shell they share.
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { RebelMeaning } from "./MpMeaning";
import { motion } from "motion/react";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, readable } from "../theme";
import { supabase } from "../supabaseClient";
import { stripHtml, formatDate } from "../lib/format";
import { matchBillForVote } from "../lib/bills";
import { getBillDescription } from "../lib/billDescriptions";
import { withScrollPreserved } from "../lib/preserveScroll";
import Loading from "./Loading";

// Lazy: this file is part of the bundle every page load pays for, and the
// explainer (a table of division-title patterns) is only needed once an MP's
// profile is open.
const VoteExplainer = lazy(() => import("./VoteExplainer"));

const VoteTitle = lazy(() => import("./VoteTitle"));

// Used to be a bare hairline rule between sections — a dozen of them down
// one column read as one continuous sheet rather than a stack of boxes.
// In practice, on a page this dense (a dozen-plus sections per MP), that
// read as one undifferentiated wall of text rather than clearly separate
// facts, so each section is now a real bordered card, colour-coded by
// what kind of information it is (money-related sections share a colour,
// accountability-related ones share another, and so on) — the same
// per-topic colour language already used for the sidebar and page
// headers elsewhere on the site.
const CARD_ACCENT = {
  "Parliamentary Contact": "#2F80ED",
  "Cabinet Role": "#D9A62A",
  "Standards & Investigations": "#E63946",
  "Voting Record": "#9B4FE0",
  "Rebellion Rate": "#9B4FE0",
  "Recent Parliamentary Activity": "#1FA97C",
  "In the News": "#E0367A",
  "Funding by Sector": "#F2622A",
  "Money & Votes": "#F2622A",
  "Current Outside Roles": "#F2622A",
  "Committee & Donor Overlap": "#E63946",
  "Same Name, Two Registers": "#E63946",
  "Ministerial History": "#D9A62A",
  "Committee Service": "#6E4B6E",
  "How They Got Here": "#5A7FA6",
  "Previously an MP": COLORS.commonsGreen,
};

// "Cabinet Role" reads as "Cabinet role": cards use the same sentence case as
// every other heading. Acronyms and the like keep their capitals.
const KEEP_CAPS = new Set(["MP", "MPs", "UK", "APPG", "APPGs", "IPSA"]);

function sentenceCase(text) {
  return text
    .split(" ")
    .map((w, i) => (i === 0 || KEEP_CAPS.has(w) || /\d/.test(w) ? w : w.toLowerCase()))
    .join(" ");
}

export function CardShell({ title, children }) {
  const accent = CARD_ACCENT[title] ?? COLORS.accent;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="glow"
      style={{
        "--k": accent, position: "relative", overflow: "hidden",
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, boxShadow: "var(--shadow-1)",
        borderRadius: 14, padding: "24px 22px 20px",
      }}
    >
      <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 5, background: accent }} />
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: COLORS.ink, marginBottom: 12 }}>
        {sentenceCase(title)}
      </div>
      {children}
    </motion.div>
  );
}

export function BiographyBox({ politician }) {
  const bio = stripHtml(politician.biography);
  return (
    <CardShell title="Biography">
      {bio ? (
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.65 }}>
          {bio}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft }}>
          No official biography published for this MP yet.
        </div>
      )}
    </CardShell>
  );
}

export function ContactRow({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: COLORS.accentText, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.ink }}>{children}</div>
    </div>
  );
}

export function ContactBox({ politician }) {
  const hasContact = politician.parliamentary_address || politician.parliamentary_phone || politician.parliamentary_email;
  return (
    <CardShell title="Parliamentary Contact">
      {hasContact ? (
        <div>
          {politician.parliamentary_address && <ContactRow label="Address">{politician.parliamentary_address}</ContactRow>}
          {politician.parliamentary_phone && <ContactRow label="Phone">{politician.parliamentary_phone}</ContactRow>}
          {politician.parliamentary_email && (
            <ContactRow label="Email">
              <a href={`mailto:${politician.parliamentary_email}`} style={{ color: COLORS.ink }}>
                {politician.parliamentary_email}
              </a>
            </ContactRow>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft }}>
          No parliamentary contact details published for this MP yet.
        </div>
      )}
    </CardShell>
  );
}

export function CabinetRoleBox({ politician }) {
  return (
    <CardShell title="Cabinet Role">
      {politician.cabinet_role ? (
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: COLORS.ink }}>
            {politician.cabinet_role}
          </div>
          {politician.cabinet_role_start_date && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 3 }}>
              Since {formatDate(politician.cabinet_role_start_date)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft }}>
          No current government post. This MP is a backbencher.
        </div>
      )}
    </CardShell>
  );
}

export function StandardsBox({ politician }) {
  const encodedName = encodeURIComponent(politician.name);
  const [reports, setReports] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("standards_reports").select("title, report_url, publication_date").eq("politician_id", politician.id);
      setFailed(Boolean(error));
      setReports(data ?? []);
    }
    load();
  }, [politician.id]);

  if (failed) {
    return (
      <CardShell title="Standards & Investigations">
        <LoadFailedNote item="Standards & Investigations data" />
      </CardShell>
    );
  }

  return (
    <CardShell title="Standards & Investigations">
      {reports?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {reports.map((r) => (
            <a
              key={r.report_url}
              href={r.report_url}
              target="_blank"
              rel="noreferrer"
              style={{ display: "block", background: "#F3E4E2", borderRadius: 8, padding: "8px 10px", fontFamily: FONT_BODY, fontSize: 14, color: readable("#9C3B3B"), fontWeight: 600 }}
            >
              {r.title} ↗
            </a>
          ))}
        </div>
      )}
      <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 10 }}>
        {reports?.length > 0
          ? "The published finding above is a matter of public record. See the Standards & Sanctions tab for the full context. For anything more recent:"
          : "No published Committee on Standards finding currently matched to this MP. To check for yourself:"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <a
          href="https://committees.parliament.uk/committee/290/committee-on-standards/publications/"
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink, fontWeight: 600 }}
        >
          Committee on Standards, published findings ↗
        </a>
        <a
          href={`https://www.parliament.uk/site-information/search/?q=${encodedName}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink, fontWeight: 600 }}
        >
          Search parliament.uk for "{politician.name}" ↗
        </a>
      </div>
    </CardShell>
  );
}

// MPs sitting under these labels don't belong to a whipped party, so "voted
// with their own party's majority" isn't a meaningful comparison for them.
const NO_PARTY_MAJORITY_CONCEPT = ["independent", "speaker"];

export function VotingSummaryBox({ politician, onNavigate }) {
  const [votes, setVotes] = useState(null);
  const [bills, setBills] = useState(null);
  const [failed, setFailed] = useState(false);
  const hasPartyMajorityConcept = !NO_PARTY_MAJORITY_CONCEPT.includes((politician.party ?? "").toLowerCase());

  useEffect(() => {
    async function load() {
      const [{ data: v, error: vErr }, { data: b, error: bErr }] = await Promise.all([
        supabase
          .from("voting_records")
          .select("title, date, voted_aye, voted_with_party_majority, source_url")
          .eq("politician_id", politician.id)
          .order("date", { ascending: false })
          .limit(4),
        supabase.from("bills").select("short_title, long_title"),
      ]);
      setFailed(Boolean(vErr || bErr));
      setVotes(v ?? []);
      setBills(b ?? []);
    }
    load();
  }, [politician.id]);

  // Each vote's own title (e.g. "Finance Bill: New Clause 4") rarely says
  // what the bill actually does — matching it back to the bill it belongs
  // to gets a real, plain-English description onto the row, using the same
  // hand-written-or-fall-back-to-official-title approach as the Manifesto
  // tab, rather than inventing summary text this site can't stand behind.
  const billByVote = useMemo(() => {
    if (!bills) return null;
    const map = new Map();
    for (const v of votes ?? []) {
      if (map.has(v.title)) continue;
      const bill = matchBillForVote(v.title, bills);
      if (bill) map.set(v.title, getBillDescription(bill.short_title, bill.long_title));
    }
    return map;
  }, [votes, bills]);

  if (votes === null) {
    return (
      <CardShell title="Voting Record">
        <Loading compact />
      </CardShell>
    );
  }

  if (failed) {
    return (
      <CardShell title="Voting Record">
        <LoadFailedNote item="voting record" />
      </CardShell>
    );
  }

  if (votes.length === 0) {
    return (
      <CardShell title="Voting Record">
        <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft }}>
          No recorded votes found for this MP in the tracked period.
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell title="Voting Record">
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 10 }}>
        Their {votes.length} most recent recorded vote{votes.length === 1 ? "" : "s"}. Tap any of these, or their full
        history below, to see every recorded vote.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {votes.map((v, i) => {
          const againstParty = hasPartyMajorityConcept && v.voted_with_party_majority === false;
          const description = billByVote?.get(v.title);
          return (
            <button
              key={i}
              onClick={() => withScrollPreserved(() => onNavigate?.("voting", politician))}
              style={{
                display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: onNavigate ? "pointer" : "default", padding: 0,
                borderLeft: `3px solid ${againstParty ? "#9C3B3B" : COLORS.hairline}`,
                paddingLeft: 10,
                paddingBottom: i < votes.length - 1 ? 8 : 0,
                borderBottom: i < votes.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
              }}
            >
              <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4 }}>
                <Suspense fallback={v.title}>
                  <VoteTitle title={v.title} />
                </Suspense>
              </div>
              {description && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 3 }}>
                  {description}
                </div>
              )}
              <Suspense fallback={null}>
                <VoteExplainer title={v.title} votedAye={v.voted_aye} inline />
              </Suspense>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                <span
                  style={{
                    fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 700, textTransform: "uppercase",
                    padding: "2px 7px", borderRadius: 999,
                    background: v.voted_aye ? "#E4EEE7" : "#F3E4E2",
                    color: v.voted_aye ? readable("#2F6F4E") : readable("#9C3B3B"),
                  }}
                >
                  {v.voted_aye ? "Aye" : "No"}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{formatDate(v.date)}</span>
                {againstParty && (
                  <span
                    style={{
                      fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, textTransform: "uppercase",
                      letterSpacing: "0.04em", padding: "2px 7px", borderRadius: 999,
                      background: "#F3E4E2", color: readable("#9C3B3B"),
                    }}
                  >
                    Against party
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {onNavigate ? (
        <button
          onClick={() => withScrollPreserved(() => onNavigate("voting", politician))}
          style={{ display: "block", marginTop: 10, fontSize: 13.5, color: COLORS.accentText, fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY }}
        >
          See their full voting history
        </button>
      ) : (
        <div style={{ marginTop: 10, fontSize: 13.5, color: COLORS.inkSoft }}>
          See the "Voting Records" tab in the sidebar for their full history.
        </div>
      )}
    </CardShell>
  );
}

// "Rebellion rate" — how often an MP voted against the majority of their
// own party, using the same voted_with_party_majority flag fetch-votes.js
// already computes per division. This is a proxy for "went against the
// whip", not the whip's actual instruction (which is never published), so
// the label and copy are careful to say so.
export function RebellionRateBox({ politician }) {
  const hasPartyMajorityConcept = !NO_PARTY_MAJORITY_CONCEPT.includes((politician.party ?? "").toLowerCase());
  const [stats, setStats] = useState(hasPartyMajorityConcept ? undefined : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hasPartyMajorityConcept) return;
    async function load() {
      const [{ count: total, error: totalErr }, { count: against, error: againstErr }] = await Promise.all([
        supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", politician.id).not("voted_with_party_majority", "is", null),
        supabase.from("voting_records").select("*", { count: "exact", head: true }).eq("politician_id", politician.id).eq("voted_with_party_majority", false),
      ]);
      // A genuine zero-votes MP and a failed count query both leave `total`
      // as 0/null here — worth telling apart, since this box otherwise just
      // renders nothing for "no votes", which would silently hide a real
      // rebellion rate behind a network blip instead of showing it.
      setFailed(Boolean(totalErr || againstErr));
      setStats({ total: total ?? 0, against: against ?? 0 });
    }
    load();
  }, [politician.id, hasPartyMajorityConcept]);

  if (stats === undefined) {
    return (
      <CardShell title="Rebellion Rate">
        <Loading compact />
      </CardShell>
    );
  }

  if (failed) {
    return (
      <CardShell title="Rebellion Rate">
        <LoadFailedNote item="rebellion rate data" />
      </CardShell>
    );
  }

  if (stats === null || stats.total === 0) {
    return null;
  }

  const pct = Math.round((stats.against / stats.total) * 1000) / 10;

  return (
    <CardShell title="Rebellion Rate">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: pct > 0 ? readable("#9C3B3B") : COLORS.ink }}>{pct}%</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft }}>
          of {stats.total} recorded vote{stats.total === 1 ? "" : "s"}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: COLORS.paper, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, height: "100%", background: "#9C3B3B", borderRadius: 999 }} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>
        The share of recorded Commons divisions where this MP voted against the majority of their own party.
        Actual whip instructions are never published, so this is our best available proxy, not a claim about
        what the whip actually told them to do.
      </div>
      <RebelMeaning politician={politician} />
    </CardShell>
  );
}

// Recent debate contributions and written questions — the Commons
// equivalent of the section already shown on each Lords peer's profile,
// pulled from the same Members API endpoints. Written questions carry
// their actual question text (the Members API returns it, we just weren't
// showing it) so a click can take you to this site's own Written Questions
// register, searched to this MP, to read the full exchange. Debate
// contributions can't do the same internally — the Members API's
// contribution summary gives titles, sections and speech/question/
// intervention counts, never the actual words spoken, and this site
// doesn't scrape Hansard's full transcripts — but the same API response
// does carry the debate's own id, which resolves to a real, working
// Hansard URL (verified against several live debates), so a click there
// goes to the actual transcript instead of nowhere.
export function RecentActivityBox({ politician, onNavigate }) {
  const activity = politician.recent_activity;
  const contributions = activity?.contributions ?? [];
  const writtenQuestions = activity?.writtenQuestions ?? [];
  if (contributions.length === 0 && writtenQuestions.length === 0) return null;

  return (
    <CardShell title="Recent Parliamentary Activity">
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 12, lineHeight: 1.5 }}>
        Their most recent debate contributions and written questions, from Hansard and the official record.
      </div>

      {contributions.length > 0 && (
        <div style={{ marginBottom: writtenQuestions.length > 0 ? 16 : 0 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: COLORS.accentText, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Debate Contributions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contributions.map((c, i) => {
              const row = (
                <>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.4 }}>
                    {c.title}
                    {c.hansardUrl && <span style={{ color: COLORS.accentText }}> ↗</span>}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>
                    {formatDate(c.date)} · {c.section}
                    {c.speechCount > 0 ? ` · ${c.speechCount} speech${c.speechCount === 1 ? "" : "es"}` : ""}
                    {c.questionCount > 0 ? ` · ${c.questionCount} question${c.questionCount === 1 ? "" : "s"}` : ""}
                    {c.interventionCount > 0 ? ` · ${c.interventionCount} intervention${c.interventionCount === 1 ? "" : "s"}` : ""}
                  </div>
                </>
              );
              const rowStyle = { display: "block", paddingBottom: 10, borderBottom: i < contributions.length - 1 ? `1px solid ${COLORS.hairline}` : "none" };
              return c.hansardUrl ? (
                <a key={i} href={c.hansardUrl} target="_blank" rel="noreferrer" style={{ ...rowStyle, textDecoration: "none" }}>
                  {row}
                </a>
              ) : (
                <div key={i} style={rowStyle}>{row}</div>
              );
            })}
          </div>
        </div>
      )}

      {writtenQuestions.length > 0 && (
        <div>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: COLORS.accentText, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Written Questions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {writtenQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => withScrollPreserved(() => onNavigate?.("writtenQuestions", politician))}
                style={{
                  display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: onNavigate ? "pointer" : "default", padding: 0,
                  paddingBottom: 10, borderBottom: i < writtenQuestions.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
                }}
              >
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{q.heading}</div>
                {q.questionText && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.5, marginTop: 4 }}>
                    {stripHtml(q.questionText)}
                  </div>
                )}
                <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 5, letterSpacing: "0.01em" }}>
                  To {q.department} · tabled {formatDate(q.dateTabled)}
                  {q.dateAnswered ? ` · answered ${formatDate(q.dateAnswered)}` : " · awaiting answer"}
                </div>
              </button>
            ))}
          </div>
          {onNavigate && (
            <button
              onClick={() => withScrollPreserved(() => onNavigate("writtenQuestions", politician))}
              style={{ display: "block", marginTop: 10, fontSize: 13.5, color: COLORS.accentText, fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY }}
            >
              See all their written questions
            </button>
          )}
        </div>
      )}
    </CardShell>
  );
}

export function NewsBox({ politician }) {
  // Kept with the MP it belongs to, so switching MPs never shows the last one's articles, and a late reply for a previous MP is ignored.
  const [result, setResult] = useState({ id: null, articles: null, failed: false });

  useEffect(() => {
    let alive = true;
    const done = (articles, failed) => { if (alive) setResult({ id: politician.id, articles, failed }); };
    (async () => {
      try {
        const { data, error } = await supabase
          .from("mp_news")
          .select("headline, source, url, published_date")
          .eq("politician_id", politician.id)
          .order("published_date", { ascending: false });
        // Only ordinary web links are ever shown as links.
        done(error ? [] : (data ?? []).filter((a) => /^https?:\/\//i.test(a.url)), Boolean(error));
      } catch {
        done([], true);
      }
    })();
    return () => { alive = false; };
  }, [politician.id]);

  const current = result.id === politician.id;
  const articles = current ? result.articles : null;
  const failed = current && result.failed;

  if (failed) {
    return (
      <CardShell title="In the News">
        <LoadFailedNote item="news coverage" />
      </CardShell>
    );
  }

  return (
    <CardShell title="In the News">
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
        Not a verified fact-check: a same-named person or a passing mention can occasionally slip through. See Data
        & Methodology for how this is compiled.
      </div>
      {articles === null && <Loading compact />}
      {articles?.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.inkSoft }}>
          No recent news coverage found for this MP in the last two weeks.
        </div>
      )}
      {articles && articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {articles.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block", textDecoration: "none", paddingBottom: i < articles.length - 1 ? 10 : 0,
                borderBottom: i < articles.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
              }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.35 }}>{a.headline}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.accentText, marginTop: 3, fontWeight: 600 }}>
                {a.source} · {formatDate(a.published_date)} ↗
              </div>
            </a>
          ))}
        </div>
      )}
    </CardShell>
  );
}

// A failed fetch and a genuinely empty result both leave `data` null/[] if
// the caller only ever checks `data ?? []` — which on a transparency site
// means a network hiccup can render as "no published Committee on
// Standards finding" or "no declared financial interests", stating a
// clean record when the truth is just "we don't know right now". This is
// the distinct message for the failure case, so it never gets silently
// swallowed into the same copy as an actual empty result.
export function LoadFailedNote({ item = "this" }) {
  return (
    <div
      style={{
        fontFamily: FONT_BODY, fontSize: 14.5, color: readable("#9C3B3B"), background: "#9C3B3B14",
        border: "1px solid #9C3B3B33", borderRadius: 8, padding: "10px 13px", lineHeight: 1.5,
      }}
    >
      Couldn't load {item}. This looks like a connection problem, not an empty record. Try refreshing the page.
    </div>
  );
}

export { FONT_DISPLAY, FONT_BODY, FONT_MONO, COLORS };
