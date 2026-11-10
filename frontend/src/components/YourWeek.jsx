/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Card, Section } from "./AreaSections";
import { IconVote } from "./icons";
import CountUp from "./CountUp";
import Unfold from "./Unfold";
import BillMore from "./BillMore";
import { loadWeek, WEEK_DAYS, INTEREST_DAYS } from "../lib/yourWeek";
import { explainDivision, describeVote } from "../lib/divisionExplainer";
import { matchBillForVote } from "../lib/bills";
import { getBillDescription } from "../lib/billDescriptions";
import { plainSentence } from "../lib/billPlain";
import { formatDate, shortCategory, stripTrailingAmount } from "../lib/format";

// "Your week" at the top of the My area page: what has been recorded for your MP in the last seven days (votes, and how many were against their own party, news mentions, and any
// new entry in the register of interests in the last fourteen). It counts what the records show and does not say whether any of it is good or bad. Each part is looked up on its
// own, so one failing is said so and does not hide the others. Every vote and register entry opens to say in plain English what it is. Which bills moved is not here: it has
// nothing to do with where you live, and lives on "What changed this week".
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

// Every bill's short and long title, fetched once the first time a vote is opened, so a vote can be matched back to the bill it was on and say what that bill proposes.
let titlesPromise = null;
function useBillTitles(wanted) {
  const [titles, setTitles] = useState(null);
  useEffect(() => {
    if (!wanted) return undefined;
    let alive = true;
    titlesPromise ??= Promise.resolve(supabase.from("bills").select("short_title, long_title")).then((r) => r.data ?? []).catch(() => { titlesPromise = null; return []; });
    titlesPromise.then((t) => { if (alive) setTitles(t); });
    return () => { alive = false; };
  }, [wanted]);
  return titles;
}

// One line that opens: a button with a chevron, and under it the plain-English explanation.
function Entry({ title, note, pill, pillOn, children, open, onToggle, i = 0 }) {
  return (
    <li className="ma-wk-item" data-open={open ? "1" : "0"} style={{ "--k": i }}>
      <button type="button" aria-expanded={open} onClick={onToggle}>
        <span className="ma-wk-main"><b>{title}</b>{note && <small>{note}</small>}</span>
        {pill && <span className="ma-wk-pill" data-on={pillOn ? "1" : "0"}>{pill}</span>}
        <span className="ma-wk-chev" aria-hidden="true" />
      </button>
      <Unfold open={open}><div className="ma-wk-more">{children}</div></Unfold>
    </li>
  );
}

function VoteEntry({ v, i, open, onToggle, titles }) {
  const e = explainDivision(v.title);
  const bill = titles && matchBillForVote(v.title, titles);
  const said = e && describeVote(e, v.voted_aye);
  const blurb = bill ? getBillDescription(bill.short_title, plainSentence(bill.long_title) ?? bill.long_title) : null;
  return (
    <Entry i={i} open={open} onToggle={onToggle} title={voteName(v.title)} note={`${formatDate(v.date)}${v.voted_with_party_majority === false ? ", against their party" : ""}`} pill={v.voted_aye ? "Aye" : "No"} pillOn={v.voted_aye}>
      {e && <p><b>What this vote was.</b> {e.plain}</p>}
      {said && <p><b>{v.voted_aye ? "Aye means" : "No means"}.</b> {said}</p>}
      {blurb && <p><b>What the bill is for.</b> {blurb}</p>}
      {bill && <BillMore bill={bill} bare />}
      {open && !titles && <p className="ma-sub">Looking up the bill…</p>}
      {v.voted_with_party_majority === false && <p className="ma-wk-flag">They voted against the way most of their own party voted.</p>}
      {v.source_url && <a className="ma-wk-src" href={v.source_url} target="_blank" rel="noreferrer">The official record of this vote<span className="sr-only"> (opens in a new tab)</span></a>}
    </Entry>
  );
}

const REGISTER = "https://www.parliament.uk/mps-lords-and-offices/standards-and-financial-interests/parliamentary-commissioner-for-standards/registers-of-interests/register-of-members-financial-interests/";
function InterestEntry({ it, mp, i, open, onToggle }) {
  const what = stripTrailingAmount(it.summary ?? "");
  return (
    <Entry i={i} open={open} onToggle={onToggle} title={`${it.donor_name ?? "An entry with no donor named"}${it.value_amount ? `, ${money(it.value_amount)}` : ""}`} note={`Registered ${formatDate(it.date_registered)}`} pill={it.category ? shortCategory(it.category) : null}>
      <p><b>What this is.</b> An entry in the Register of Members' Financial Interests, where MPs must declare gifts, jobs, donations and other outside income. It records that something was declared, not that anything was wrong.</p>
      {what && <p><b>As entered in the register.</b> {what}</p>}
      <a className="ma-wk-src" href={mp?.parliament_member_id ? `https://members.parliament.uk/member/${mp.parliament_member_id}/registeredinterests` : REGISTER} target="_blank" rel="noreferrer">{mp?.parliament_member_id ? "Their full register on Parliament's site" : "The register on Parliament's site"}<span className="sr-only"> (opens in a new tab)</span></a>
    </Entry>
  );
}

// How the week's votes went, one dot each, oldest first: green Aye, red No, and a ring round the ones cast against the MP's own party.
function VoteDots({ dots }) {
  if (!dots?.length) return null;
  return (
    <span className="ma-wk-dots" aria-hidden="true">
      {dots.map((d, n) => <i key={n} data-aye={d.aye ? "1" : "0"} data-rebel={d.rebel ? "1" : "0"} style={{ "--n": n }} />)}
    </span>
  );
}

function Fig({ n, label, value, note, children }) {
  return (
    <div className="ma-wk-fig" style={{ "--n": n }}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{note}</small>
      {children}
    </div>
  );
}

function MpWeek({ mp, w, failed }) {
  const name = mp?.name ?? "Your MP";
  const [open, setOpen] = useState(null);
  const toggle = (k) => setOpen((o) => (o === k ? null : k));
  const titles = useBillTitles(open != null && String(open).startsWith("v"));
  if (!mp) return <p className="ma-sub">We could not match this seat to a current MP, so there is nothing to count for them.</p>;
  const voteFail = failed.includes("votes");
  const intFail = failed.includes("interests");
  const newsFail = failed.includes("news");
  const v = w.votes;
  const noes = v ? v.count - v.ayes : 0;
  const hasLeft = v && v.latest.length > 0;
  const hasInterests = w.interests && w.interests.length > 0;
  const hasNews = w.news && w.news.latest.length > 0;
  return (
    <>
      <div className="ma-wk-figs">
        <Fig n={0} label={`Votes in the last ${WEEK_DAYS} days`} value={voteFail ? "Unknown" : <CountUp value={v.count} />}
          note={voteFail ? "The votes could not be loaded." : v.count === 0 ? "None recorded. The Commons does not sit every day." : `${v.ayes} Aye, ${noes} No. ${v.against === 0 ? "All with the majority of their own party." : `${plural(v.against, "was", "were")} against the majority of their own party.`}`}>
          {!voteFail && <VoteDots dots={v.dots} />}
        </Fig>
        <Fig n={1} label="New in the register of interests" value={intFail ? "Unknown" : <CountUp value={w.interests.length} />}
          note={intFail ? "The register could not be loaded." : `Entries added in the last ${INTEREST_DAYS} days.`} />
        <Fig n={2} label="Mentioned in the news" value={newsFail ? "Unknown" : <CountUp value={w.news.count} />}
          note={newsFail ? "The news mentions could not be loaded." : w.news.count === 0 ? "No stories matched this week." : `Stories naming them in the last ${WEEK_DAYS} days.`} />
      </div>
      {(hasLeft || hasInterests || hasNews) && (
        <div className="ma-wk-cols" data-solo={hasInterests || hasNews ? "0" : "1"}>
          {hasLeft && (
            <div>
              <h4>Their latest votes <small>Press one to see what it was</small></h4>
              <ul className="ma-wk-list">
                {v.latest.map((x, i) => <VoteEntry key={`${x.title}-${i}`} v={x} i={i} titles={titles} open={open === `v${i}`} onToggle={() => toggle(`v${i}`)} />)}
              </ul>
            </div>
          )}
          {(hasInterests || hasNews) && (
            <div className="ma-wk-stack">
              {hasInterests && (
                <div>
                  <h4>Newly declared <small>Press one to see what it is</small></h4>
                  <ul className="ma-wk-list">
                    {w.interests.slice(0, 3).map((it, i) => <InterestEntry key={`${it.donor_name}-${i}`} it={it} mp={mp} i={i} open={open === `i${i}`} onToggle={() => toggle(`i${i}`)} />)}
                  </ul>
                  {w.interests.length > 3 && <p className="ma-sub">and {w.interests.length - 3} more on their page.</p>}
                </div>
              )}
              {hasNews && (
                <div>
                  <h4>In the news</h4>
                  <ul className="ma-wk-list ma-wk-news">
                    {w.news.latest.map((n, i) => (
                      <li key={`${n.url}-${i}`}><a href={n.url} target="_blank" rel="noreferrer">{n.headline}<span className="sr-only"> (opens in a new tab)</span></a><small>{formatDate(n.published_date)}</small></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <a className="ma-link" href={`#/mp/${mp.id}`}>{name}'s full record</a>
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
      .catch(() => { if (alive) setState({ loading: false, summary: null, failed: ["votes", "interests", "news"] }); });
    return () => { alive = false; };
  }, [mpId]);
  const { loading, summary, failed } = state;
  const all = !loading && !summary;
  return (
    <Section id="ma-week" title="Your week" lede={`What has been recorded for ${mp?.name ?? "your MP"} over the last ${WEEK_DAYS} days. It counts what the official records show; it does not say whether any of it is good or bad.`} colour={colour}>
      <Card i={0} colour={colour} icon={<IconVote size={20} />} title={mp ? `${mp.name} this week` : "Your MP this week"} className="ma-wk-mp">
        {loading ? <Skel /> : all ? <Down what="this week's records" /> : <MpWeek mp={mp} w={summary} failed={failed} />}
      </Card>
    </Section>
  );
}
