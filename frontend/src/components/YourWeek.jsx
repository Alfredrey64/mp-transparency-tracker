/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Card, Section } from "./AreaSections";
import { IconCalendar, IconVote } from "./icons";
import { loadWeek, WEEK_DAYS, INTEREST_DAYS } from "../lib/yourWeek";
import { explainDivision } from "../lib/divisionExplainer";
import { formatDate } from "../lib/format";

// "Your week" at the top of the My area page: what has been recorded for your MP in the last seven days (votes, and how many were against their own party, news mentions, and any
// new entry in the register of interests in the last fourteen) and which bills have moved in Parliament. It counts what the records show and does not say whether any of it is good
// or bad. Each part is looked up on its own, so one failing is said so and does not hide the others.
const money = (n) => `£${Math.round(n).toLocaleString("en-GB")}`;
const plural = (n, one, many = `${one}s`) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;
const today = () => new Date().toISOString().slice(0, 10);
const Skel = () => <div className="ma-skel" aria-hidden="true">{[92, 78, 64].map((w) => <i key={w} style={{ width: `${w}%` }} />)}</div>;
// "Housing Bill: Final Commons vote on the bill": the bill's name first, since the plain label alone does not say which bill.
function voteName(title) {
  const e = explainDivision(title);
  if (!e?.label) return title;
  return e.billName ? `${e.billName}: ${e.label}` : e.label;
}
const Down = ({ what }) => <p className="ma-sub">We could not load {what} just now. Try again in a little while.</p>;

function MpWeek({ mp, w, failed }) {
  const name = mp?.name ?? "Your MP";
  if (!mp) return <p className="ma-sub">We could not match this seat to a current MP, so there is nothing to count for them.</p>;
  return (
    <>
      <div className="ma-wk-figs">
        <div>
          <span>Votes in the last {WEEK_DAYS} days</span>
          <b>{failed.includes("votes") ? "Unknown" : w.votes.count}</b>
          <small>{failed.includes("votes") ? "The votes could not be loaded." : w.votes.count === 0 ? "None recorded. The Commons does not sit every day." : w.votes.against === 0 ? "All with the majority of their own party." : `${plural(w.votes.against, "was", "were")} against the majority of their own party.`}</small>
        </div>
        <div>
          <span>New in the register of interests</span>
          <b>{failed.includes("interests") ? "Unknown" : w.interests.length}</b>
          <small>{failed.includes("interests") ? "The register could not be loaded." : `Entries added in the last ${INTEREST_DAYS} days.`}</small>
        </div>
      </div>
      {w.votes && w.votes.latest.length > 0 && (
        <div>
          <h4>Their latest votes</h4>
          <ul className="ma-wk-list">
            {w.votes.latest.map((v, i) => (
              <li key={`${v.title}-${i}`}>
                <span>{voteName(v.title)}</span>
                <b data-aye={v.voted_aye ? "1" : "0"}>{v.voted_aye ? "Aye" : "No"}</b>
                <small>{formatDate(v.date)}{v.voted_with_party_majority === false ? ", against their party" : ""}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {w.interests && w.interests.length > 0 && (
        <div>
          <h4>Newly declared</h4>
          <ul className="ma-wk-list">
            {w.interests.slice(0, 3).map((it, i) => (
              <li key={`${it.donor_name}-${i}`}>
                <span>{it.donor_name ?? "An entry with no donor named"}{it.value_amount ? `, ${money(it.value_amount)}` : ""}</span>
                <small>{formatDate(it.date_registered)}</small>
              </li>
            ))}
          </ul>
          {w.interests.length > 3 && <p className="ma-sub">and {w.interests.length - 3} more on their page.</p>}
        </div>
      )}
      {w.news && w.news.length > 0 && (
        <div>
          <h4>In the news</h4>
          <ul className="ma-wk-list">
            {w.news.map((n, i) => (
              <li key={`${n.url}-${i}`}><a href={n.url} target="_blank" rel="noreferrer">{n.headline}<span className="sr-only"> (opens in a new tab)</span></a><small>{formatDate(n.published_date)}</small></li>
            ))}
          </ul>
        </div>
      )}
      {failed.includes("news") && <Down what="the news mentions" />}
      <a className="ma-link" href={`#/mp/${mp.id}`}>{name}'s full record</a>
    </>
  );
}

function BillsWeek({ w, failed }) {
  if (failed.includes("bills")) return <Down what="the bills" />;
  return (
    <>
      <div className="ma-wk-figs ma-wk-one">
        <div><span>Bills that moved in the last {WEEK_DAYS} days</span><b>{w.bills.count}</b><small>{w.bills.count === 0 ? "None have changed stage." : "Across both Houses, whoever the MP."}</small></div>
      </div>
      {w.bills.latest.length > 0 && (
        <ul className="ma-wk-list">
          {w.bills.latest.map((b) => (
            <li key={b.bill_id}>
              <span>{b.short_title}</span>
              <small>{b.is_act ? "Became law" : b.is_defeated ? "Defeated" : `${b.current_stage ?? "Stage not listed"}${b.current_house ? `, ${b.current_house}` : ""}`}</small>
            </li>
          ))}
        </ul>
      )}
      <a className="ma-link" href="#/thisWeek">Everything that changed this week</a>
    </>
  );
}

export function WeekSection({ mp, colour }) {
  const [state, setState] = useState({ loading: true, summary: null, failed: [] });
  const mpId = mp?.id ?? null;
  useEffect(() => {
    let alive = true;
    loadWeek(supabase, mpId, today())
      .then(({ summary, failed }) => { if (alive) setState({ loading: false, summary, failed }); })
      .catch(() => { if (alive) setState({ loading: false, summary: null, failed: ["votes", "interests", "news", "bills"] }); });
    return () => { alive = false; };
  }, [mpId]);
  const { loading, summary, failed } = state;
  const all = !loading && !summary;
  return (
    <Section id="ma-week" title="Your week" lede={`What has been recorded for ${mp?.name ?? "your MP"} and in Parliament over the last ${WEEK_DAYS} days. It counts what the official records show; it does not say whether any of it is good or bad.`} colour={colour}>
      <Card i={0} colour={colour} icon={<IconVote size={20} />} title={mp ? `${mp.name} this week` : "Your MP this week"} className="ma-wk-mp">
        {loading ? <Skel /> : all ? <Down what="this week's records" /> : <MpWeek mp={mp} w={summary} failed={failed} />}
      </Card>
      <Card i={1} colour="#7B5BD6" icon={<IconCalendar size={20} />} title="Bills on the move" className="ma-wk-bills">
        {loading ? <Skel /> : all ? <Down what="the bills" /> : <BillsWeek w={summary} failed={failed} />}
      </Card>
    </Section>
  );
}
