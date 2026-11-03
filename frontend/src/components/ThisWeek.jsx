/** @jsxImportSource react */
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconFeed } from "./icons";
import { GlanceStrip } from "./GlanceStrip";
import Loading from "./Loading";
import { fetchAllRows } from "../lib/supabasePagination";
import { KINDS, sinceDate, billItems, voteItems, moneyItems, petitionItems, standardsItems, electionItems, buildFeed, collapseBills, countByKind, dayLabel, groupByDay } from "../lib/thisWeek";
import TodayInParliament from "./story/TodayInParliament";
import { useEntryDialog } from "./story/useEntryDialog";
import "../thisweek.css";

// The Coming up part is the whole of the old Coming up in Parliament page, loaded only when it is asked for.
const Ahead = lazy(() => import("./explainers/upcoming"));

// Parliament's activity in three tenses: what changed (the past), what the calendar lists for today (the present) and what is coming up over the next four weeks (the future).
// What changed this week: bills that moved, votes held, interests declared, petitions answered, conduct reports and by-elections, newest first. Every
// item comes from the same database as the rest of the site, and links to the page (or Parliament's own page) where you can read more.

const TIMES = [
  { key: "past", title: "What changed", sub: "Votes, bills and money so far", colour: "#E0367A" },
  { key: "now", title: "Today", sub: "Who is sitting and what is on", colour: "#1F7A4D" },
  { key: "ahead", title: "Coming up", sub: "The next four weeks", colour: "#5A4FCF" },
];
const timeOf = (param) => (TIMES.some((t) => t.key === param) ? param : "past");
const WINDOWS = [{ days: 7, label: "7 days" }, { days: 14, label: "14 days" }, { days: 30, label: "30 days" }];
const MAX_DAYS = 30;
const DAY_COLOURS = ["#E0367A", "#1E4FB8", "#1FA97C", "#E8741A", "#7A5AF0", "#0E9AA7"];
const fmt = (n) => Math.round(n).toLocaleString("en-GB");

// One query that may fail without taking the others with it: a failed one is reported by name.
async function attempt(name, run, failures) {
  try { return await run(); } catch { failures.push(name); return []; }
}

export default function ThisWeek({ param = null }) {
  const [state, setState] = useState({ loading: true, raw: null, failed: [] });
  const [days, setDays] = useState(7);
  const [kind, setKind] = useState("all");
  const [time, setTime] = useState(() => timeOf(param));
  const [seenParam, setSeenParam] = useState(param);
  const [openEntry, entryDialog] = useEntryDialog();
  if (param !== seenParam) { setSeenParam(param); setTime(timeOf(param)); }
  const pick = (key) => {
    setTime(key);
    try { window.history.replaceState(null, "", key === "past" ? "/thisWeek" : `/thisWeek/${key}`); } catch { /* the address stays as it was */ }
  };

  useEffect(() => {
    let alive = true;
    const failures = [];
    const since = sinceDate(MAX_DAYS);
    const ok = ({ data, error }) => { if (error) throw error; return data ?? []; };
    (async () => {
      const [bills, votes, interests, politicians, petitions, standards, elections] = await Promise.all([
        attempt("bills", async () => ok(await supabase.from("bills").select("*").gte("last_updated", since).order("last_updated", { ascending: false }).limit(200)), failures),
        attempt("votes", () => fetchAllRows(() => supabase.from("voting_records").select("division_id, title, date, voted_aye").gte("date", since)), failures),
        attempt("declared money", () => fetchAllRows(() => supabase.from("financial_interests").select("id, politician_id, donor_name, value_amount, category, date_registered").gte("date_registered", since)), failures),
        attempt("MP names", () => fetchAllRows(() => supabase.from("politicians").select("id, name, party, party_colour")), failures),
        attempt("petitions", async () => ok(await supabase.from("petitions").select("*")), failures),
        attempt("conduct reports", async () => ok(await supabase.from("standards_reports").select("*").gte("publication_date", since)), failures),
        attempt("by-elections", async () => ok(await supabase.from("by_elections").select("*")), failures),
      ]);
      if (alive) setState({ loading: false, raw: { bills, votes, interests, politicians, petitions, standards, elections }, failed: failures });
    })();
    return () => { alive = false; };
  }, []);

  const since = sinceDate(days);
  const feed = useMemo(() => {
    const r = state.raw;
    if (!r) return [];
    const ahead = sinceDate(-30);
    return buildFeed([billItems(r.bills, since), voteItems(r.votes, since), moneyItems(r.interests, r.politicians, since), petitionItems(r.petitions, since), standardsItems(r.standards, since), electionItems(r.elections, since, ahead)]);
  }, [state.raw, since]);
  const counts = useMemo(() => countByKind(feed), [feed]);
  const shown = kind === "all" ? collapseBills(feed) : feed.filter((i) => i.kind === kind);
  const groups = useMemo(() => groupByDay(shown), [shown]);
  const allFailed = state.raw && state.failed.length >= 7;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconFeed}
        kicker="Understand it"
        title="What changed this week"
        subtitle="What Parliament has done, what it is doing today and what is coming up: new votes, bills that moved and money declared, then who is sitting today, then the next four weeks of business."
      />
      <div className="tw-time" role="tablist" aria-label="Past, present or future" style={{ "--k": TIMES.findIndex((t) => t.key === time) }}>
        {TIMES.map((t, i) => (
          <button key={t.key} type="button" role="tab" id={`tw-tab-${t.key}`} aria-selected={time === t.key} aria-controls="tw-panel" style={{ "--tc": t.colour, "--i": i }} onClick={() => pick(t.key)}>
            <i aria-hidden="true" />
            <b>{t.title}</b>
            <small>{t.sub}</small>
          </button>
        ))}
      </div>
      <div id="tw-panel" role="tabpanel" aria-labelledby={`tw-tab-${time}`} className="tw-panel" key={time}>
      {time === "now" && <TodayInParliament onAhead={() => pick("ahead")} />}
      {time === "ahead" && (
        <div className="st" data-look="vivid" style={{ paddingTop: 8 }}>
          <Suspense fallback={<Loading />}><Ahead /></Suspense>
        </div>
      )}
      {time === "past" && <>
      {state.loading && <Loading />}
      {allFailed && <div className="tw-note">We couldn't load the latest changes just now. Check your connection and try again in a minute.</div>}
      {state.raw && !allFailed && (
        <>
          <GlanceStrip items={[
            { value: fmt(counts.vote), label: "votes held", sub: `in the last ${days} days`, colour: KINDS.vote.colour },
            { value: fmt(counts.bill), label: "bills moved", sub: "a new stage or a change", colour: KINDS.bill.colour },
            { value: fmt(counts.money), label: "new declared interests", sub: "the biggest, with a value", colour: KINDS.money.colour },
            { value: fmt(counts.petition + counts.standards + counts.election), label: "other changes", sub: "petitions, conduct reports and by-elections", colour: KINDS.petition.colour },
          ]} />
          <div className="tw-window" role="group" aria-label="How far back" style={{ "--tw-accent": "#E0367A" }}>
            {WINDOWS.map((w) => <button key={w.days} type="button" aria-pressed={days === w.days} onClick={() => setDays(w.days)}>{w.label}</button>)}
          </div>
          <div className="tw-chips" role="group" aria-label="What to show">
            <button type="button" className="tw-chip" style={{ "--kc": COLORS.ink }} aria-pressed={kind === "all"} onClick={() => setKind("all")}>Everything <b>{fmt(feed.length)}</b></button>
            {Object.entries(KINDS).map(([k, v]) => (
              <button key={k} type="button" className="tw-chip" style={{ "--kc": v.colour }} aria-pressed={kind === k} onClick={() => setKind(kind === k ? "all" : k)}><i />{v.label} <b>{fmt(counts[k])}</b></button>
            ))}
          </div>
          {state.failed.length > 0 && <div className="tw-note">Some changes are missing because we couldn't load: {state.failed.join(", ")}.</div>}
          {groups.length === 0 ? (
            <div className="tw-empty">Nothing new in this window. Parliament may be in recess, or try a longer window.</div>
          ) : (
            <ol className="tw-feed" style={{ "--tw-accent": "#E0367A" }}>
              {groups.map((g, gi) => (
                <li key={g.date} className="tw-day" style={{ "--dc": DAY_COLOURS[gi % DAY_COLOURS.length] }}>
                  <h2>{dayLabel(g.date)}<span className="tw-n">{g.items.length} {g.items.length === 1 ? "change" : "changes"}</span></h2>
                  <ul className="tw-items">
                    {g.items.map((i) => {
                      const k = KINDS[i.kind];
                      const body = (<><span className="tw-kind">{k.verb}</span><b>{i.title}</b>{i.detail && <span className="tw-detail">{i.detail}</span>}</>);
                      return (
                        <li key={i.id}>
                          {i.id.startsWith("bills-more-")
                            ? <a className="tw-card" href={i.href} style={{ "--kc": i.colour ?? k.colour }}>{body}</a>
                            : <button type="button" className="tw-card" aria-haspopup="dialog" style={{ "--kc": i.colour ?? k.colour }} onClick={(ev) => openEntry({ ...i, past: true }, ev.currentTarget)}>{body}</button>}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 26, maxWidth: 760 }}>
            Votes count the MPs this site tracks. Declared interests are the largest new entries in the Commons register. Bills show their latest stage on Parliament's site. Updated by the daily data refresh, so something that happened today may not be here until tomorrow.
          </p>
        </>
      )}
      </>}
      </div>
      {entryDialog}
    </div>
  );
}
