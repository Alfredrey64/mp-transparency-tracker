/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Card, Section } from "./AreaSections";
import { IconCalendar, IconVote } from "./icons";
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
// new entry in the register of interests in the last fourteen) and which bills have moved in Parliament. It counts what the records show and does not say whether any of it is good
// or bad. Each part is looked up on its own, so one failing is said so and does not hide the others. Every vote, bill and register entry opens to say in plain English what it is.
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

function MpWeek({ mp, w, failed }) {
  const name = mp?.name ?? "Your MP";
  const [open, setOpen] = useState(null);
  const toggle = (k) => setOpen((o) => (o === k ? null : k));
  const titles = useBillTitles(open != null && String(open).startsWith("v"));
  if (!mp) return <p className="ma-sub">We could not match this seat to a current MP, so there is nothing to count for them.</p>;
  const voteFail = failed.includes("votes");
  const intFail = failed.includes("interests");
  return (
    <>
      <div className="ma-wk-figs">
        <div style={{ "--n": 0 }}>
          <span>Votes in the last {WEEK_DAYS} days</span>
          <b>{voteFail ? "Unknown" : <CountUp value={w.votes.count} />}</b>
          <small>{voteFail ? "The votes could not be loaded." : w.votes.count === 0 ? "None recorded. The Commons does not sit every day." : w.votes.against === 0 ? "All with the majority of their own party." : `${plural(w.votes.against, "was", "were")} against the majority of their own party.`}</small>
        </div>
        <div style={{ "--n": 1 }}>
          <span>New in the register of interests</span>
          <b>{intFail ? "Unknown" : <CountUp value={w.interests.length} />}</b>
          <small>{intFail ? "The register could not be loaded." : `Entries added in the last ${INTEREST_DAYS} days.`}</small>
        </div>
      </div>
      {w.votes && w.votes.latest.length > 0 && (
        <div>
          <h4>Their latest votes <small>Press one to see what it was</small></h4>
          <ul className="ma-wk-list">
            {w.votes.latest.map((v, i) => <VoteEntry key={`${v.title}-${i}`} v={v} i={i} titles={titles} open={open === `v${i}`} onToggle={() => toggle(`v${i}`)} />)}
          </ul>
        </div>
      )}
      {w.interests && w.interests.length > 0 && (
        <div>
          <h4>Newly declared <small>Press one to see what it is</small></h4>
          <ul className="ma-wk-list">
            {w.interests.slice(0, 3).map((it, i) => <InterestEntry key={`${it.donor_name}-${i}`} it={it} mp={mp} i={i} open={open === `i${i}`} onToggle={() => toggle(`i${i}`)} />)}
          </ul>
          {w.interests.length > 3 && <p className="ma-sub">and {w.interests.length - 3} more on their page.</p>}
        </div>
      )}
      {w.news && w.news.length > 0 && (
        <div>
          <h4>In the news</h4>
          <ul className="ma-wk-list ma-wk-news">
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

function BillEntry({ b, i, open, onToggle }) {
  const blurb = getBillDescription(b.short_title, b.long_title ? plainSentence(b.long_title) ?? b.long_title : null);
  const status = b.is_act ? "Became law" : b.is_defeated ? "Defeated" : `${b.current_stage ?? "Stage not listed"}${b.current_house ? `, ${b.current_house}` : ""}`;
  return (
    <Entry i={i} open={open} onToggle={onToggle} title={b.short_title} note={status} pill={b.is_act ? "Law" : b.is_defeated ? "Defeated" : null} pillOn={b.is_act}>
      {blurb && <p><b>What it is for.</b> {blurb}</p>}
      <BillMore bill={b} bare />
      <p><b>Where it stands.</b> {status}. Last change recorded {formatDate(b.last_updated)}.</p>
      {b.source_url && <a className="ma-wk-src" href={b.source_url} target="_blank" rel="noreferrer">The bill on Parliament's site<span className="sr-only"> (opens in a new tab)</span></a>}
    </Entry>
  );
}

function BillsWeek({ w, failed }) {
  const [open, setOpen] = useState(null);
  if (failed.includes("bills")) return <Down what="the bills" />;
  return (
    <>
      <div className="ma-wk-figs ma-wk-one">
        <div><span>Bills that moved in the last {WEEK_DAYS} days</span><b><CountUp value={w.bills.count} /></b><small>{w.bills.count === 0 ? "None have changed stage." : "Across both Houses, whoever the MP."}</small></div>
      </div>
      {w.bills.latest.length > 0 && (
        <div>
          <h4>The latest to move <small>Press one to see what it proposes</small></h4>
          <ul className="ma-wk-list">
            {w.bills.latest.map((b, i) => <BillEntry key={b.bill_id} b={b} i={i} open={open === b.bill_id} onToggle={() => setOpen(open === b.bill_id ? null : b.bill_id)} />)}
          </ul>
        </div>
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
