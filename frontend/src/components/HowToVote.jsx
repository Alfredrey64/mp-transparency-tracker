import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING, readable, solid } from "../theme";
import { PageHeader } from "./shared";
import { IconBallot } from "./icons";
import { Segmented } from "./DeprivationControls";
import { canIVote } from "../lib/canIVote";
import { card, cardTitle } from "../lib/onsStyles";

// How to vote: who can vote in what, then the four practical steps (register, choose how, get your ID, polling day), then what happens next.
// Plain steps with links to the official sites. Deadlines are given as "working days before polling day" so they never go out of date;
// anything that changes with the law points to gov.uk. Northern Ireland has its own register, so it is called out.

const ACCENT = "#E0367A";
const ink = readable(ACCENT);

const REGISTER = "https://www.gov.uk/register-to-vote";
const HOW = "https://www.gov.uk/how-to-vote";
const POLLING = "https://www.wheredoivote.co.uk/";
const COMMISSION = "https://www.electoralcommission.org.uk/i-am-a/voter";
const NI = "https://www.eoni.org.uk/Register-To-Vote";

const para = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };
const linkStyle = { fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: ink };

const RESULT = {
  yes: { label: "You can vote", colour: "#1F7F57" },
  check: { label: "Check on gov.uk", colour: "#9A6A00" },
  no: { label: "You can't vote", colour: "#B3382E" },
};

function Checker() {
  const [age, setAge] = useState("adult");
  const [nation, setNation] = useState("england");
  const [citizenship, setCitizenship] = useState("british-irish");
  const rows = canIVote({ age, nation, citizenship });
  return (
    <section aria-labelledby="h-can" style={{ ...card, marginTop: 24 }}>
      <h2 id="h-can" style={cardTitle}>Can I vote?</h2>
      <p style={para}>Answer three quick questions to see which elections you can vote in. Nothing you pick is saved or sent anywhere.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "16px 22px", margin: "18px 0 20px" }}>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>How old are you?</div>
          <Segmented label="How old are you" value={age} onChange={setAge} accent={solid(ACCENT)} options={[{ id: "adult", label: "18 or over" }, { id: "teen", label: "16 or 17" }, { id: "child", label: "Under 16" }]} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Where do you live?</div>
          <Segmented label="Where do you live" value={nation} onChange={setNation} accent={solid(ACCENT)} options={[{ id: "england", label: "England" }, { id: "scotland", label: "Scotland" }, { id: "wales", label: "Wales" }, { id: "ni", label: "Northern Ireland" }]} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Which best describes your citizenship?</div>
          <Segmented label="Citizenship" value={citizenship} onChange={setCitizenship} accent={solid(ACCENT)} options={[{ id: "british-irish", label: "British or Irish" }, { id: "commonwealth", label: "Commonwealth" }, { id: "eu", label: "EU" }, { id: "other", label: "Other" }]} />
        </div>
      </div>
      <ul aria-live="polite" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 12 }}>
        {rows.map((r) => {
          const R = RESULT[r.result];
          return (
            <li key={r.key} style={{ padding: "14px 16px", borderRadius: 16, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${R.colour}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.inkSoft }}>{r.label}</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: R.colour, margin: "3px 0 6px" }}>{R.label}</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: COLORS.ink, margin: 0 }}>{r.note}</p>
            </li>
          );
        })}
      </ul>
      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.55, color: COLORS.inkSoft, margin: "14px 0 0" }}>
        This is a guide, not legal advice. The rules change, and some cases (such as EU citizens, or people living abroad) depend on details. <a href={HOW} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>gov.uk</a> has the final word.
      </p>
    </section>
  );
}

function Step({ n, title, last, children }) {
  return (
    <li style={{ display: "grid", gridTemplateColumns: "42px minmax(0, 1fr)", gap: 16, position: "relative" }}>
      {!last && <span aria-hidden="true" style={{ position: "absolute", left: 20, top: 42, bottom: -4, width: 2, background: COLORS.hairline }} />}
      <span aria-hidden="true" style={{ position: "relative", zIndex: 1, width: 42, height: 42, borderRadius: "50%", background: solid(ACCENT), color: "#fff", display: "grid", placeItems: "center", fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700 }}>{n}</span>
      <div style={{ paddingBottom: last ? 0 : 28, minWidth: 0 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 700, color: COLORS.ink, margin: "6px 0 2px" }}>{title}</h3>
        {children}
      </div>
    </li>
  );
}

const Tick = ({ children }) => (
  <li style={{ display: "grid", gridTemplateColumns: "20px minmax(0, 1fr)", gap: 8, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: COLORS.ink }}>
    <span aria-hidden="true" style={{ color: "#1F7F57", fontWeight: 800 }}>✓</span>
    <span>{children}</span>
  </li>
);

export default function HowToVote() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconBallot}
        kicker="Your say"
        title="How to vote"
        subtitle="Who can vote, how to register, what to bring and what happens on the day, in plain steps with links to the official sites. If you only read one thing, read step 1: you can't vote unless you are registered."
      />

      <Checker />

      <section aria-labelledby="h-steps" style={{ ...card, marginTop: 20 }}>
        <h2 id="h-steps" style={cardTitle}>Four steps to voting</h2>
        <ol style={{ listStyle: "none", margin: "22px 0 0", padding: 0, display: "grid", gap: 4 }}>
          <Step n={1} title="Register to vote">
            <p style={para}>It takes about five minutes online. You need your date of birth, your address and your National Insurance number (you can still register without one). Registering is separate from being on any other list, so do it even if you think you already have.</p>
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
              <Tick>The deadline is 12 working days before polling day. Register early, as the queue builds up just before an election.</Tick>
              <Tick>If you move house, register again at your new address.</Tick>
              <Tick>Students with two addresses can register at both, but may only vote once in the same election.</Tick>
              <Tick>In Northern Ireland, you register with the Electoral Office for Northern Ireland, which is a separate system.</Tick>
            </ul>
            <p style={{ margin: "12px 0 0" }}>
              <a href={REGISTER} target="_blank" rel="noreferrer" style={linkStyle}>Register on gov.uk</a>
              <span style={{ color: COLORS.inkSoft }}>{"  ·  "}</span>
              <a href={NI} target="_blank" rel="noreferrer" style={linkStyle}>Northern Ireland</a>
            </p>
          </Step>
          <Step n={2} title="Choose how you will vote">
            <p style={para}>Most people vote in person at a polling station, but there are two other ways.</p>
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
              <Tick><strong>In person.</strong> Your poll card says where. Nothing more to arrange.</Tick>
              <Tick><strong>By post.</strong> Apply at least 11 working days before polling day. Your ballot comes in the post and has to be back in time to be counted.</Tick>
              <Tick><strong>By proxy.</strong> A person you trust votes for you. Apply at least 6 working days before polling day, or ask for an emergency proxy if something unexpected happens.</Tick>
            </ul>
          </Step>
          <Step n={3} title="Get your photo ID ready">
            <p style={para}>In Great Britain you need photo ID to vote in person at UK general elections and at council elections in England. A passport or a driving licence is accepted, and so are several other kinds, including some older people's and disabled people's bus passes. Scottish and Welsh parliament and council elections do not need ID. Northern Ireland has its own photo ID rules.</p>
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
              <Tick>It does not have to be in date, as long as it still looks like you.</Tick>
              <Tick>No photo ID? You can apply for a free Voter Authority Certificate, and you should do it well before polling day.</Tick>
            </ul>
            <p style={{ margin: "12px 0 0" }}><a href={HOW} target="_blank" rel="noreferrer" style={linkStyle}>Which ID is accepted, on gov.uk</a></p>
          </Step>
          <Step n={4} title="Polling day" last>
            <p style={para}>Polling stations are open from 7am to 10pm. If you are in the queue at 10pm, you can still vote.</p>
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
              <Tick>Go to the polling station named on your poll card. You can look yours up with your postcode.</Tick>
              <Tick>Give your name and address and show your ID if you need it.</Tick>
              <Tick>You are handed a ballot paper. Mark an X in the box next to one candidate, fold it and put it in the ballot box.</Tick>
              <Tick>It usually takes just a few minutes.</Tick>
            </ul>
            <p style={{ margin: "12px 0 0" }}><a href={POLLING} target="_blank" rel="noreferrer" style={linkStyle}>Find your polling station</a></p>
          </Step>
        </ol>
      </section>

      <section aria-labelledby="h-after" style={{ ...card, marginTop: 20 }}>
        <h2 id="h-after" style={cardTitle}>What happens after you vote</h2>
        <p style={para}>The UK is split into 650 constituencies, and each elects one MP. Whoever gets the most votes in a constituency wins it, even without more than half. This is called first past the post.</p>
        <p style={para}>The votes are counted overnight, and most results are known by the next morning. The party that wins more than half the seats, which means at least 326, forms the government. If no party does, it is a hung parliament, and parties have to work together or govern as a minority.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {[["#/marginals", "Which seats are close"], ["#/constituency", "Look up your seat"], ["#/partymatch", "Which party suits me?"], ["#/howitworks", "How Parliament works"]].map(([href, label]) => (
            <a key={href} className="ons-tap" href={href} style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: ink, textDecoration: "none", padding: "9px 16px", borderRadius: 999, border: `1px solid ${ACCENT}66`, background: `${ACCENT}10` }}>{label}</a>
          ))}
        </div>
      </section>

      <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.6, color: COLORS.inkSoft, marginTop: 22, maxWidth: 760 }}>
        This page is a plain guide to the usual rules. Deadlines and ID rules can change, so always check the official pages before an election:{" "}
        <a href={REGISTER} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>gov.uk</a>,{" "}
        <a href={COMMISSION} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>the Electoral Commission</a> and{" "}
        <a href={NI} target="_blank" rel="noreferrer" style={{ color: COLORS.inkSoft }}>the Electoral Office for Northern Ireland</a>.
      </p>
    </div>
  );
}
