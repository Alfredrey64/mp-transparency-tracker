/** @jsxImportSource react */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CATEGORIES } from "../../data/publicSpending";
import { count, seatsFptp, seatsProportional, story, cleanName, PALETTE, MIN_PARTIES, MAX_PARTIES, MAX_AREAS } from "../../lib/mockElection";
import { realBudget, totalOf, LOCKED, TAX_RANGE, potFor, leftToSpend, perHousehold, shift, changes, describeChange, CHALLENGES } from "../../lib/budgetGame";
import { PETITION_STEPS } from "../../data/teacherExtras";
import "../../classroom.css";

// Classroom activities for Teacher mode: a mock election the class can run in a few minutes, and a budget game that makes the trade-offs of public
// spending real. Both are made to be shown on a big screen. Nothing is stored or sent anywhere: close the tab and it is gone.

const pctText = (x) => `${Math.round(x * 100)}%`;
const SAMPLE = ["The Sunshine Party", "The Book Club Party", "The Pizza Party"];

// ---- The mock election ----------------------------------------------------------------------------------------------------------------------

const emptyVotes = (areas, parties) => Array.from({ length: areas }, () => Array.from({ length: parties }, () => 0));

export function MockElection() {
  const [step, setStep] = useState("setup");
  const [title, setTitle] = useState("Our class election");
  const [names, setNames] = useState(SAMPLE);
  const [areas, setAreas] = useState(3);
  const [votes, setVotes] = useState(() => emptyVotes(3, SAMPLE.length));
  const [sheet, setSheet] = useState(false);

  const labels = names.map((n, i) => cleanName(n, `Party ${i + 1}`));
  const result = useMemo(() => count(votes, labels.length), [votes, labels.length]);
  const fptp = seatsFptp(result, labels.length);
  const prop = seatsProportional(result, labels.length);
  const winner = fptp.indexOf(Math.max(...fptp));
  const hasWinner = result.cast > 0 && fptp[winner] > 0 && fptp.filter((s) => s === fptp[winner]).length === 1;

  useEffect(() => {
    if (!sheet) return undefined;
    document.body.classList.add("tm-printing");
    const done = () => setSheet(false);
    window.addEventListener("afterprint", done);
    const id = setTimeout(() => window.print(), 80);
    return () => { clearTimeout(id); window.removeEventListener("afterprint", done); document.body.classList.remove("tm-printing"); };
  }, [sheet]);

  const start = () => { setVotes(emptyVotes(areas, labels.length)); setStep("vote"); };
  const bump = (a, p, d) => setVotes((v) => v.map((row, i) => (i === a ? row.map((n, j) => (j === p ? Math.max(0, n + d) : n)) : row)));
  const setName = (i, value) => setNames((n) => n.map((x, j) => (j === i ? value : x)));
  const addParty = () => setNames((n) => (n.length < MAX_PARTIES ? [...n, ""] : n));
  const removeParty = (i) => setNames((n) => (n.length > MIN_PARTIES ? n.filter((_, j) => j !== i) : n));
  const stepIndex = { setup: 0, vote: 1, night: 2, results: 2 }[step];
  const [declared, setDeclared] = useState(0);

  return (
    <div className="cr-panel">
      <ol className="cr-steps" aria-label="Steps">
        {["Set it up", "Vote", "Results"].map((s, i) => <li key={s} aria-current={i === stepIndex ? "step" : undefined}><span>{i + 1}</span>{s}</li>)}
      </ol>

      {step === "setup" && (
        <>
          <label className="cr-field"><span>What is the election for?</span><input type="text" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} /></label>
          <div className="cr-field"><span>The parties, up to {MAX_PARTIES}. Make them up, or let pupils invent them.</span></div>
          <ul className="cr-parties">
            {names.map((n, i) => (
              <li key={i} className="cr-party" style={{ "--pc": PALETTE[i % PALETTE.length] }}>
                <i aria-hidden="true" />
                <input type="text" value={n} maxLength={28} placeholder={`Party ${i + 1}`} aria-label={`Name of party ${i + 1}`} onChange={(e) => setName(i, e.target.value)} />
                <button type="button" className="btn btn-secondary" onClick={() => removeParty(i)} disabled={names.length <= MIN_PARTIES} aria-label={`Remove party ${i + 1}`}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="cr-row">
            <button type="button" className="btn btn-secondary" onClick={addParty} disabled={names.length >= MAX_PARTIES}>Add a party</button>
            <label className="cr-field" style={{ margin: 0, minWidth: 220 }}><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>How many areas</span>
              <select value={areas} onChange={(e) => setAreas(Number(e.target.value))} aria-label="How many areas">
                {Array.from({ length: MAX_AREAS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? "area" : "areas"}</option>)}
              </select>
            </label>
          </div>
          <p className="cr-hint">An area is like a constituency: a group of voters, such as a table or a row of desks. Each area elects one winner, the party with the most votes there. Using three or more areas shows why the party with the most votes overall does not always win the most areas.</p>
          <div className="cr-row" style={{ marginTop: 18 }}><button type="button" className="btn btn-primary btn-lg" onClick={start}>Start voting</button></div>
        </>
      )}

      {step === "vote" && (
        <>
          <p className="cr-hint" style={{ margin: "0 0 14px" }}>Each pupil votes once, in their own area. Tap a party for every vote, and use the minus button to fix a mistake.</p>
          <div className="cr-areas">
            {votes.map((row, a) => (
              <section key={a} className="cr-area" aria-label={`Area ${a + 1}`}>
                <h3>Area {a + 1}<small>{row.reduce((x, y) => x + y, 0)} votes</small></h3>
                {labels.map((l, p) => (
                  <div key={p} className="cr-vote" style={{ "--pc": PALETTE[p % PALETTE.length] }}>
                    <button type="button" className="cr-add" onClick={() => bump(a, p, 1)} aria-label={`Add a vote for ${l} in area ${a + 1}`}><i /><span>{l}</span></button>
                    <span className="cr-count" aria-live="polite">{row[p]}</span>
                    <button type="button" className="cr-undo" onClick={() => bump(a, p, -1)} disabled={row[p] === 0} aria-label={`Take a vote off ${l} in area ${a + 1}`}>&minus;</button>
                  </div>
                ))}
              </section>
            ))}
          </div>
          <div className="cr-row" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => { setDeclared(0); setStep("night"); }} disabled={result.cast === 0}>Election night: announce the results</button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep("results")} disabled={result.cast === 0}>Show all the results at once</button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep("setup")}>Back to set up</button>
          </div>
        </>
      )}

      {step === "night" && (
        <Night title={title} labels={labels} result={result} declared={declared} onDeclare={() => setDeclared((n) => Math.min(n + 1, result.areas.length))} onAll={() => setDeclared(result.areas.length)} onDone={() => setStep("results")} onBack={() => setStep("vote")} />
      )}

      {step === "results" && (
        <>
          <h3 className="cr-h" style={{ marginTop: 0 }}>{title || "Our class election"}: {result.cast} {result.cast === 1 ? "vote" : "votes"}</h3>
          <div className="cr-bars" role="list" aria-label="Share of the votes">
            {labels.map((l, p) => (
              <div key={p} className="cr-bar" role="listitem" style={{ "--pc": PALETTE[p % PALETTE.length] }}>
                <b>{l}</b>
                <span className="cr-track"><i style={{ "--w": result.share[p] }} /></span>
                <span>{pctText(result.share[p])} <small style={{ fontWeight: 600, fontSize: 13 }}>({result.total[p]})</small></span>
              </div>
            ))}
          </div>
          <h3 className="cr-h">Areas won (first past the post)</h3>
          {labels.map((l, p) => (
            <div key={p} className="cr-seats" style={{ "--pc": PALETTE[p % PALETTE.length] }}>
              <b>{l}</b>
              {fptp[p] === 0 ? <span className="cr-seat cr-seat-none" aria-label="none" /> : Array.from({ length: fptp[p] }, (_, n) => <span key={n} className="cr-seat" style={{ "--n": n }} />)}
              <span style={{ font: "700 15px 'Public Sans', system-ui, sans-serif" }}>{fptp[p]}</span>
            </div>
          ))}
          <h3 className="cr-h">If areas matched the votes exactly (proportional)</h3>
          {labels.map((l, p) => (
            <div key={p} className="cr-seats" style={{ "--pc": PALETTE[p % PALETTE.length] }}>
              <b>{l}</b>
              {prop[p] === 0 ? <span className="cr-seat cr-seat-none" aria-label="none" /> : Array.from({ length: prop[p] }, (_, n) => <span key={n} className="cr-seat" style={{ "--n": n }} />)}
              <span style={{ font: "700 15px 'Public Sans', system-ui, sans-serif" }}>{prop[p]}</span>
            </div>
          ))}
          <p className="cr-story">{story(result, labels)}</p>
          <ul className="cr-winners" aria-label="Winner of each area">
            {result.areas.map((a) => <li key={a.area} style={a.winner !== null ? { "--pc": PALETTE[a.winner % PALETTE.length] } : undefined}>Area {a.area + 1}: {a.winner !== null ? labels[a.winner] : a.tied ? "tied" : "no votes"}</li>)}
          </ul>
          <div className="cr-row" style={{ marginTop: 20 }}>
            {hasWinner && <button type="button" className="btn btn-primary btn-lg" onClick={() => setSheet(true)}>Print the certificate</button>}
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep("vote")}>Back to voting</button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => { setVotes(emptyVotes(areas, labels.length)); setStep("setup"); }}>Hold another election</button>
          </div>
        </>
      )}

      {sheet && createPortal(
        <div className="tm-sheet" aria-hidden="true">
          <div className="tm-page tm-cert">
            <h1>{title || "Our class election"}</h1>
            <p>The winner, by areas won, is</p>
            <div className="tm-cert-winner">{labels[winner]}</div>
            <p>with {fptp[winner]} of {result.areas.length} {result.areas.length === 1 ? "area" : "areas"} and {pctText(result.share[winner])} of the votes.</p>
            <table>
              <thead><tr><th>Party</th><th>Votes</th><th>Areas</th></tr></thead>
              <tbody>{labels.map((l, p) => <tr key={p}><td>{l}</td><td>{result.total[p]}</td><td>{fptp[p]}</td></tr>)}</tbody>
            </table>
            <p style={{ marginTop: 18, fontSize: 13 }}>Simple Politics &middot; Teacher mode</p>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ---- Election night ---------------------------------------------------------------------------------------------------------------------------

// The count, one area at a time, like a real election night: each area is declared with a flourish, the seats board fills in, and a line shows how
// close any party is to a majority. It is shown on a big screen, so everything is large.
function Night({ title, labels, result, declared, onDeclare, onAll, onDone, onBack }) {
  const n = result.areas.length;
  const majority = Math.floor(n / 2) + 1;
  const seats = labels.map(() => 0);
  result.areas.slice(0, declared).forEach((a) => { if (a.winner !== null) seats[a.winner] += 1; });
  const lead = seats.indexOf(Math.max(...seats));
  const finished = declared >= n;
  const won = seats[lead] >= majority ? lead : null;
  return (
    <div className="cn">
      <div className="cn-head">
        <div><h3>{title || "Our class election"}</h3><p>{finished ? "All areas declared" : `${declared} of ${n} ${n === 1 ? "area" : "areas"} declared`}</p></div>
        <div className="cn-need"><b>{majority}</b><span>{majority === 1 ? "area" : "areas"} needed to win overall</span></div>
      </div>
      <div className="cn-board" role="list" aria-label="Seats won so far">
        {labels.map((l, p) => (
          <div key={p} className="cn-row" role="listitem" style={{ "--pc": PALETTE[p % PALETTE.length] }}>
            <b>{l}</b>
            <span className="cn-track">{Array.from({ length: n }, (_, k) => <i key={k} data-on={k < seats[p] ? "1" : "0"} />)}<u style={{ left: `${(majority / n) * 100}%` }} aria-hidden="true" /></span>
            <strong>{seats[p]}</strong>
          </div>
        ))}
      </div>
      <ul className="cn-areas">
        {result.areas.map((a, k) => {
          const shown = k < declared;
          const fresh = k === declared - 1;
          return (
            <li key={k} data-shown={shown ? "1" : "0"} data-fresh={fresh ? "1" : "0"} style={shown && a.winner !== null ? { "--pc": PALETTE[a.winner % PALETTE.length] } : undefined}>
              <span>Area {k + 1}</span>
              {shown ? (
                <>
                  <b>{a.winner !== null ? `${labels[a.winner]} wins` : a.tied ? "Tied: a recount" : "No votes"}</b>
                  <small>{a.votes} {a.votes === 1 ? "vote" : "votes"}{a.winner !== null ? `, ${a.counts[a.winner]} for the winner` : ""}</small>
                </>
              ) : <b className="cn-wait">Counting…</b>}
            </li>
          );
        })}
      </ul>
      <p className="cn-banner" data-on={won !== null ? "1" : "0"} aria-live="polite">{won !== null ? `${labels[won]} has won enough areas to win overall.` : finished ? "No party won enough areas. In a real election this is called a hung parliament, and parties might need to work together." : "Nobody has won yet."}</p>
      <div className="cr-row">
        {!finished && <button type="button" className="btn btn-primary btn-lg" onClick={onDeclare}>Declare the next area</button>}
        {!finished && <button type="button" className="btn btn-secondary btn-lg" onClick={onAll}>Declare them all</button>}
        {finished && <button type="button" className="btn btn-primary btn-lg" onClick={onDone}>See the full results</button>}
        <button type="button" className="btn btn-secondary btn-lg" onClick={onBack}>Back to voting</button>
      </div>
    </div>
  );
}

// ---- A class petition --------------------------------------------------------------------------------------------------------------------------

const GROUPS = [["One pupil", 1], ["A table of 5", 5], ["A class of 30", 30], ["A year group of 120", 120], ["The whole community", 1000], ["The whole town", 20000]];
const pnum = (n) => Math.round(n).toLocaleString("en-GB");

// Run a petition: the class chooses what to ask for, then signatures are added and the ladder shows what each milestone would really do in Parliament.
export function PetitionGame() {
  const [ask, setAsk] = useState("More trees in our town centre");
  const [count, setCount] = useState(0);
  const pct = Math.min(100, (count / 100000) * 100);
  const supporters = Math.min(count, 5);
  return (
    <div className="cr-panel">
      <label className="cr-field"><span>What does the petition ask Parliament to do?</span><input type="text" value={ask} maxLength={80} onChange={(e) => setAsk(e.target.value)} /></label>
      <div className="cp-card">
        <p className="cp-label">Petition</p>
        <h3>{ask.trim() || "Our petition"}</h3>
        <b className="cp-count">{pnum(count)}</b><span className="cp-of">signatures{supporters < 5 ? `, ${5 - supporters} more ${5 - supporters === 1 ? "supporter" : "supporters"} to be checked` : ""}</span>
        <div className="cp-ladder" role="img" aria-label={`${pnum(count)} of 100,000 signatures`}>
          <span className="cp-track"><i style={{ width: `${pct}%` }} /></span>
          {PETITION_STEPS.slice(1).map((m) => (
            <span key={m.at} className="cp-mark" data-hit={count >= m.at ? "1" : "0"} style={{ left: `${(m.at / 100000) * 100}%`, "--pc": m.colour }}><i /><small>{m.title.split(" ")[0]}</small></span>
          ))}
        </div>
      </div>
      <div className="cr-row" role="group" aria-label="Add signatures">
        {GROUPS.map(([label, n]) => <button key={label} type="button" className="btn btn-primary btn-lg" onClick={() => setCount((c) => Math.min(100000, c + n))}>{label} signs <small style={{ opacity: 0.85 }}>(+{pnum(n)})</small></button>)}
        <button type="button" className="btn btn-secondary btn-lg" onClick={() => setCount(0)} disabled={count === 0}>Start again</button>
      </div>
      <ol className="cp-steps">
        {PETITION_STEPS.map((m) => {
          const hit = m.at === 5 ? supporters >= 5 : count >= m.at;
          return (
            <li key={m.at} data-hit={hit ? "1" : "0"} style={{ "--pc": m.colour }}>
              <span aria-hidden="true">{hit ? "\u2713" : ""}</span>
              <div><b>{m.title}</b><p>{m.text}</p></div>
            </li>
          );
        })}
      </ol>
      <p className="cr-note">This is a pretend petition and nothing is sent anywhere. Real petitions run for six months, are checked before they are published, and anyone living in the UK can sign one. A response or a debate does not change the law by itself. <a href="https://petition.parliament.uk/" target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>Start a real petition</a>.</p>
    </div>
  );
}

// ---- The budget game ------------------------------------------------------------------------------------------------------------------------

export function BudgetGame() {
  const [alloc, setAlloc] = useState(realBudget);
  const [tax, setTax] = useState(0);
  const [card, setCard] = useState(0);
  const [note, setNote] = useState("");
  const left = leftToSpend(alloc, tax);
  const moved = changes(alloc);
  const real = realBudget();
  const label = (k) => CATEGORIES.find((c) => c.key === k)?.label ?? k;

  // A slider (or a plus or minus button) sets one category; money that is not free comes off the others in proportion, so it always moves.
  const move = (key, v) => {
    const out = shift(alloc, key, v, tax);
    setAlloc(out.alloc);
    setNote(out.took.length ? `The extra came from ${out.took.map(([k, n]) => `${label(k)} (£${n}bn)`).join(", ")}.` : "");
  };
  // Lowering the tax pot below what is already spent takes the shortfall off the biggest categories that can move.
  const changeTax = (v) => {
    setTax(v);
    setNote("");
    setAlloc((a) => {
      let next = { ...a };
      let over = Math.round(totalOf(next) - potFor(v));
      for (const c of [...CATEGORIES].sort((p, q) => next[q.key] - next[p.key])) {
        if (over <= 0) break;
        if (LOCKED.has(c.key)) continue;
        const take = Math.min(next[c.key], over);
        next = { ...next, [c.key]: next[c.key] - take };
        over -= take;
      }
      return next;
    });
  };
  const reset = () => { setAlloc(realBudget()); setTax(0); setNote(""); };

  return (
    <div className="cr-panel">
      <div className="cr-sticky">
        <div className="cr-meters">
          <div className="cr-meter"><b>£{potFor(tax).toLocaleString("en-GB")}bn</b><span>in the pot</span></div>
          <div className="cr-meter" data-done={left === 0 ? "1" : "0"} data-warn={left !== 0 ? "1" : "0"}><b>£{left}bn</b><span>{left === 0 ? "all shared out" : "still to place"}</span></div>
          <div className="cr-meter"><b>£{moved.reduce((t, c) => t + Math.max(0, c.diff), 0)}bn</b><span>moved so far</span></div>
        </div>
        <p className="cr-flash" aria-live="polite">{note || "Move a slider, or press plus and minus. If the pot is full, the money comes from the other categories."}</p>
      </div>
      <div className="cr-tax">
        <label htmlFor="cr-tax"><span>{tax === 0 ? "Tax as it is now" : tax > 0 ? `Raise tax by £${tax}bn` : `Cut tax by £${-tax}bn`}</span><em>{tax === 0 ? "No change for households" : `About £${Math.abs(perHousehold(tax)).toLocaleString("en-GB")} a year ${tax > 0 ? "more" : "less"} for the average household`}</em></label>
        <input id="cr-tax" className="cr-range" type="range" min={-TAX_RANGE} max={TAX_RANGE} step={5} value={tax} onChange={(e) => changeTax(Number(e.target.value))} />
      </div>
      <ul className="cr-cats">
        {CATEGORIES.map((c) => {
          const locked = LOCKED.has(c.key);
          const max = Math.ceil((real[c.key] * 1.8 + 40) / 10) * 10;
          return (
            <li key={c.key} className="cr-cat" style={{ "--pc": c.color }} data-locked={locked ? "1" : "0"}>
              <div className="cr-cat-top"><b>{c.label}</b><strong>£{alloc[c.key]}bn</strong></div>
              {locked ? <small>Fixed. The interest on the national debt has to be paid, whatever anyone decides.</small> : (
                <>
                  <div className="cr-slide">
                    <button type="button" className="cr-step" onClick={() => move(c.key, alloc[c.key] - 5)} aria-label={`Take £5bn off ${c.label}`}>&minus;</button>
                    <input className="cr-range" type="range" min={0} max={max} step={1} value={alloc[c.key]} onChange={(e) => move(c.key, Number(e.target.value))} aria-label={`${c.label}, in billions of pounds`} />
                    <button type="button" className="cr-step" onClick={() => move(c.key, alloc[c.key] + 5)} aria-label={`Add £5bn to ${c.label}`}>+</button>
                  </div>
                  <small>Real budget: £{real[c.key]}bn. {c.summary}</small>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <div className="cr-changed">
        <h3 className="cr-h" style={{ marginTop: 0 }}>What the class changed</h3>
        {moved.length > 0 ? (
          <ul className="cr-changes">{moved.map((c) => <li key={c.key} style={{ "--pc": c.color }}>{describeChange(c)}</li>)}</ul>
        ) : <p className="cr-hint" style={{ margin: 0 }}>Nothing yet: this is the real budget for 2025 to 2026.</p>}
      </div>
      <div className="cr-card" aria-live="polite">
        <p>{CHALLENGES[card]}</p>
        <div className="cr-row" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={() => setCard((n) => (n + 1) % CHALLENGES.length)}>Another question</button>
          <button type="button" className="btn btn-secondary" onClick={reset}>Back to the real budget</button>
        </div>
      </div>
      <p className="cr-note">These are headline totals for 2025 to 2026 from the Office for Budget Responsibility, in billions of pounds, shown in a simplified way: the real budget has thousands of lines and many cannot be moved. The tax slider shares the change out equally between the country's households, about £48,000 of public spending each a year. There is no right answer: the aim is to see that every choice has a cost. <a href="#/taxRates/where" style={{ fontWeight: 700 }}>See where the money really goes</a>.</p>
    </div>
  );
}
