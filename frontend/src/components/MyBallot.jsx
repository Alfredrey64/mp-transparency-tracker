/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING, readable, solid } from "../theme";
import { PageHeader } from "./shared";
import { IconWhoStands } from "./icons";
import { card, cardTitle } from "../lib/onsStyles";
import { lookUpBallots, cleanPostcode, howToMarkParts, daysTo, prettyDate, shortDate, BALLOT_ERRORS } from "../lib/ballots";
import { councilsForCodes } from "../lib/councils";
import { nextVote } from "../lib/localElections";
import { dateLocale } from "../lib/i18n";
import { useT } from "../lib/useLang";
import "../myballot.css";

// Who is on my ballot: a postcode in, the contests it votes in that are coming up, and the people standing in each. The lists come from Democracy Club's open
// data, which volunteers build from the official notices of who has been nominated. People are listed by surname and nothing else, with no colours, no ranking
// and no comment on who they are, so the page cannot lean on anyone. The postcode goes to Democracy Club and postcodes.io to be looked up and is not kept.

const ACCENT = "#7A5AF0";
const ink = readable(ACCENT);
const field = { fontFamily: FONT_BODY, fontSize: 16, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, width: "100%", boxSizing: "border-box" };
const para = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };
const initials = (name) => {
  const w = String(name).split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
};
const safeId = (id) => /^[a-z0-9._:-]+$/i.test(id);

function Days({ iso }) {
  const t = useT();
  const n = daysTo(iso);
  const text = n < 0 ? t("Finished") : n === 0 ? t("Today") : n === 1 ? t("Tomorrow") : t("{n} days to go", { n });
  return <span className="mb-days" data-soon={n >= 0 && n <= 7 ? "1" : "0"}>{text}</span>;
}

function People({ c }) {
  const t = useT();
  const q = c.candidates;
  if (c.kind === "ref") return <p style={para}>{t("This is a vote on a question, not a choice between people.")}</p>;
  if (c.error || !q) {
    return (
      <p style={para}>
        {t("We couldn't load the list of people for this contest.")}{" "}
        {safeId(c.id) && <a href={`https://whocanivotefor.co.uk/elections/${c.id}/`} target="_blank" rel="noopener noreferrer" style={{ color: ink }}>{t("See it on WhoCanIVoteFor")}</a>}
      </p>
    );
  }
  if (q.list.length === 0) {
    return (
      <p style={para}>
        {c.closes && daysTo(c.closes) >= 0
          ? t("Nobody has been added yet. Nominations close on {date}, and the list is usually final a few days after.", { date: shortDate(c.closes, dateLocale()) })
          : t("Nobody has been added yet. The official list usually appears a few weeks before polling day.")}
      </p>
    );
  }
  return (
    <>
      <ul className="mb-people" aria-label={t("People standing, listed by surname")}>
        {q.list.map((p) => (
          <li key={`${p.id ?? p.name}`}>
            <span className="mb-av" aria-hidden="true">{initials(p.name)}</span>
            <span className="mb-who">
              <strong>{p.name}</strong>
              <span>{p.party}</span>
              {p.profile && <a className="mb-more" href={p.profile} target="_blank" rel="noopener noreferrer" aria-label={t("More about {name}, on WhoCanIVoteFor", { name: p.name })}>{t("More about them")}</a>}
            </span>
          </li>
        ))}
      </ul>
      {!q.locked && <p className="mb-note">{t("This list may not be final. People can still be added or removed until nominations close.")}</p>}
      {q.uncontested && <p className="mb-note">{t("Only one person is standing for this seat, so they may be elected without a vote.")}</p>}
    </>
  );
}

function Contest({ c, index }) {
  const t = useT();
  const loc = dateLocale();
  const how = howToMarkParts(c.system, c.seats);
  const heading = c.role ? `${t(c.role)}${c.seats && c.seats > 1 ? ` · ${t("{n} seats", { n: c.seats })}` : ""}` : null;
  return (
    <li className="mb-card" style={{ "--i": Math.min(index, 6) }}>
      <header className="mb-head">
        <div className="mb-when">
          <span>{prettyDate(c.date, loc)}</span>
          <Days iso={c.date} />
        </div>
        <h3 className="mb-title">{c.title}</h3>
        {heading && <p className="mb-role">{heading}</p>}
        {c.byElection && <p className="mb-role">{t(c.byElection)}</p>}
      </header>
      {c.cancelled ? (
        <p className="mb-note" role="status">{t("This election has been cancelled.")}{c.reason ? ` ${c.reason}` : ""}</p>
      ) : (
        <>
          <h4 className="mb-sub">{t("Who is standing")}</h4>
          <People c={c} />
          {(how || c.voterId) && (
            <div className="mb-how">
              {how && <p><strong>{t("How you vote")}.</strong> {t(how.text, how.vars)}</p>}
              {c.voterId && <p><strong>{t("Photo ID")}.</strong> {t("You need to show photo ID to vote in person at this election.")}</p>}
            </div>
          )}
          {c.deadlines.length > 0 && (
            <details className="mb-dates">
              <summary className="ons-tap">{t("Key dates")}</summary>
              <ul>
                {c.deadlines.map((d) => (
                  <li key={d.key} data-passed={d.passed ? "1" : "0"}>
                    <span>{t(d.label)}</span>
                    <strong>{prettyDate(d.date, loc)}{d.passed ? ` (${t("passed")})` : ""}</strong>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </li>
  );
}

// Nothing is coming up for this postcode: say when the council next votes instead, so the visitor is never left with a blank.
function NothingYet({ council }) {
  const t = useT();
  const v = council ? nextVote(council) : null;
  return (
    <div className="mb-empty" role="status">
      <h3 style={{ ...cardTitle, fontSize: 20 }}>{t("No election is scheduled for this postcode yet")}</h3>
      <p style={para}>{t("Contests only appear here once they have been officially announced, which is usually a few weeks before polling day.")}</p>
      {v && (
        <p style={{ ...para, color: COLORS.ink }}>
          {v.all
            ? t("{council} next votes on {date}, when all {n} seats are up.", { council: council.name, date: prettyDate(v.date, dateLocale()), n: v.total })
            : t("{council} next votes on {date}, when {up} of {n} seats are up.", { council: council.name, date: prettyDate(v.date, dateLocale()), up: v.seatsUp, n: v.total })}
        </p>
      )}
      <p style={para}>{t("There is no general election called at the moment. If one is announced, it will appear here.")}</p>
      <div className="mb-links">
        <a className="ons-tap" href="#/localElections">{t("When councils vote")}</a>
        <a className="ons-tap" href="#/howtovote">{t("How to vote")}</a>
      </div>
    </div>
  );
}

export default function MyBallot() {
  const t = useT();
  const [postcode, setPostcode] = useState("");
  const [state, setState] = useState({ phase: "idle" });
  const run = useRef(0);
  const ctl = useRef(null);
  const heading = useRef(null);
  useEffect(() => () => ctl.current?.abort(), []);
  useEffect(() => { if (state.phase === "done") heading.current?.focus(); }, [state.phase]);

  async function submit(e) {
    e.preventDefault();
    const pc = cleanPostcode(postcode);
    if (!pc) { setState({ phase: "error", kind: "shape" }); return; }
    ctl.current?.abort();
    ctl.current = new AbortController();
    const mine = ++run.current;
    setState({ phase: "busy" });
    try {
      const { contests, more } = await lookUpBallots(pc, { signal: ctl.current.signal });
      if (mine !== run.current) return;
      let council = null;
      if (contests.length === 0) {
        try {
          const res = await fetch(`https://api.postcodes.io/postcodes/${pc}`, { signal: ctl.current.signal });
          const json = await res.json();
          if (res.ok && json.status === 200) {
            const data = (await import("../data/councilsIndex.json")).default;
            const { district, county } = councilsForCodes(data.index, json.result.codes);
            council = district ?? county ?? null;
          }
        } catch { /* The council line is a nicety; the page works without it. */ }
        if (mine !== run.current) return;
      }
      setState({ phase: "done", pc, contests, more, council });
    } catch (err) {
      if (mine !== run.current || err?.name === "AbortError") return;
      setState({ phase: "error", kind: err?.status === 400 ? "notfound" : "down" });
    }
  }

  const pcText = state.pc ? `${state.pc.slice(0, -3)} ${state.pc.slice(-3)}` : "";
  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconWhoStands} kicker="Your say" title={t("Who is on my ballot")} subtitle={t("Put in a postcode to see the elections coming up where you live and the people standing in them.")} />

      <section aria-labelledby="h-mb-find" style={{ ...card, marginTop: 24 }}>
        <h2 id="h-mb-find" style={cardTitle}>{t("Find your ballot")}</h2>
        <p style={para}>{t("Nothing you type is stored. Your postcode is sent once to Democracy Club and postcodes.io to look it up.")}</p>
        <form onSubmit={submit} noValidate style={{ marginTop: 14, maxWidth: 460 }}>
          <label htmlFor="mb-pc" style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>{t("Your postcode")}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="mb-pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder={t("For example SW1A 1AA")} autoComplete="postal-code" aria-describedby={state.phase === "error" ? "mb-err" : undefined} aria-invalid={state.phase === "error" ? "true" : undefined} style={field} />
            <button type="submit" disabled={state.phase === "busy"} className="ons-chip" style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: "#fff", background: solid(ACCENT), border: "none", borderRadius: 12, padding: "0 20px", cursor: "pointer", flexShrink: 0 }}>{state.phase === "busy" ? t("Looking…") : t("Find")}</button>
          </div>
          {state.phase === "error" && <div id="mb-err" role="alert" style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: readable("#B3382E"), marginTop: 8 }}>{t(BALLOT_ERRORS[state.kind])}</div>}
        </form>
      </section>

      <div>
        {state.phase === "busy" && <p role="status" style={{ ...para, marginTop: 20 }}>{t("Looking up your ballot…")}</p>}
        {state.phase === "done" && (
          <section aria-labelledby="h-mb-res" style={{ marginTop: 26 }}>
            <h2 id="h-mb-res" ref={heading} tabIndex={-1} style={{ ...cardTitle, fontSize: 24, outline: "none" }}>
              {state.contests.length === 0 ? t("Nothing coming up for {pc}", { pc: pcText }) : state.contests.length === 1 ? t("1 contest coming up for {pc}", { pc: pcText }) : t("{n} contests coming up for {pc}", { n: state.contests.length, pc: pcText })}
            </h2>
            {state.contests.length === 0 ? (
              <NothingYet council={state.council} />
            ) : (
              <>
                <p style={para}>{t("People are listed by surname, as on a ballot paper. The order means nothing, and we don't rank or comment on anyone.")}</p>
                <ol className="mb-list">
                  {state.contests.map((c, i) => <Contest key={c.id} c={c} index={i} />)}
                </ol>
                {state.more > 0 && <p style={para}>{t("{n} more contests are not shown here.", { n: state.more })} <a href={`https://whocanivotefor.co.uk/?postcode=${state.pc}`} target="_blank" rel="noopener noreferrer" style={{ color: ink }}>{t("See them all on WhoCanIVoteFor")}</a></p>}
              </>
            )}
          </section>
        )}
      </div>

      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 28, maxWidth: 780 }}>
        {t("Lists come from Democracy Club's open data, built by volunteers from the official notices of who has been nominated, and they can lag behind those notices. Check the notice on your council's website before polling day.")}{" "}
        {t("To vote, you need to be registered:")} <a href="#/howtovote" style={{ color: COLORS.inkSoft }}>{t("How to vote")}</a>.
      </p>
    </div>
  );
}
