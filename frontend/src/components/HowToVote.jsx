import { useState } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconBallot } from "./icons";
import { canIVote } from "../lib/canIVote";
import { STEPS, DEADLINES, RESULT_LABEL, AFTER_LINKS } from "../data/voteSteps";
import { Reveal } from "./Motion";
import { useT } from "../lib/useLang";
import "../howtovote.css";

// How to vote: who can vote in what, then the four practical steps (register, choose how, get your ID, polling day), then what happens next.
// Plain steps with links to the official sites. Deadlines are given as "working days before polling day" so they never go out of date;
// anything that changes with the law points to gov.uk. Northern Ireland has its own register, so it is called out.


const REGISTER = "https://www.gov.uk/register-to-vote";
const HOW = "https://www.gov.uk/how-to-vote";
const POLLING = "https://www.wheredoivote.co.uk/";
const COMMISSION = "https://www.electoralcommission.org.uk/i-am-a/voter";
const NI = "https://www.eoni.org.uk/Register-To-Vote";

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 720 };



const Svg = ({ children, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICONS = {
  register: <Svg><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><path d="M8 8.5h8M8 12h8M8 15.5h4" /><path d="m14.5 18.5 1.6 1.6 3.2-3.4" /></Svg>,
  how: <Svg><path d="M12 3.5v6M12 9.5 6 19.5M12 9.5l6 10" /><circle cx="12" cy="3.5" r="1.4" /><circle cx="6" cy="19.5" r="1.4" /><circle cx="18" cy="19.5" r="1.4" /></Svg>,
  id: <Svg><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><circle cx="8.5" cy="11" r="2.1" /><path d="M5.7 16c.5-1.7 1.6-2.4 2.8-2.4s2.3.7 2.8 2.4M14 10h4.5M14 13.5h3" /></Svg>,
  day: <Svg><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.3l3.4 2" /></Svg>,
  person: <Svg><path d="M4 20.5V10l8-6.5 8 6.5v10.5z" /><path d="M9.5 20.5v-6h5v6" /></Svg>,
  post: <Svg><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7.5 7.5 6 7.5-6" /></Svg>,
  proxy: <Svg><circle cx="8" cy="8" r="2.8" /><circle cx="16.5" cy="9.5" r="2.3" /><path d="M3.5 19c.4-3 2.2-4.6 4.5-4.6s4.1 1.6 4.5 4.6M13.5 18.5c.3-2.2 1.6-3.4 3-3.4s2.7 1.2 3 3.4" /></Svg>,
  tick: <Svg size={18}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>,
  unsure: <Svg size={18}><circle cx="12" cy="12" r="8.5" /><path d="M9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.6M12 16.6h.01" /></Svg>,
  cross: <Svg size={18}><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" /></Svg>,
};

const RESULT = {
  yes: { colour: "#1F7F57", icon: "tick" },
  check: { colour: "#9A6A00", icon: "unsure" },
  no: { colour: "#B3382E", icon: "cross" },
};

// One question's answers as a stacked list of radio cards: every card the same width, the chosen one filled in.
function Choices({ label, value, onChange, options }) {
  return (
    <div className="v-choices" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className="v-choice" onClick={() => onChange(o.id)}>
          <span className="v-choice-dot" aria-hidden="true" />
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Question({ n, title, children }) {
  return (
    <div className="v-q">
      <div className="v-q-title"><span aria-hidden="true">{n}</span>{title}</div>
      {children}
    </div>
  );
}

function Checker() {
  const t = useT();
  const [age, setAge] = useState("adult");
  const [nation, setNation] = useState("england");
  const [citizenship, setCitizenship] = useState("british-irish");
  const rows = canIVote({ age, nation, citizenship });
  return (
    <Reveal as="section" aria-labelledby="h-can" className="v-can">
      <h2 id="h-can" className="v-h2">{t("Can I vote?")}</h2>
      <p style={para}>{t("Answer three quick questions to see which elections you can vote in. Nothing you pick is saved or sent anywhere.")}</p>
      <div className="v-qs">
        <Question n={1} title={t("How old are you?")}>
          <Choices label={t("How old are you")} value={age} onChange={setAge} options={[{ id: "adult", label: t("18 or over") }, { id: "teen", label: t("16 or 17") }, { id: "child", label: t("Under 16") }]} />
        </Question>
        <Question n={2} title={t("Where do you live?")}>
          <Choices label={t("Where do you live")} value={nation} onChange={setNation} options={[{ id: "england", label: t("England") }, { id: "scotland", label: t("Scotland") }, { id: "wales", label: t("Wales") }, { id: "ni", label: t("Northern Ireland") }]} />
        </Question>
        <Question n={3} title={t("Which best describes your citizenship?")}>
          <Choices label={t("Citizenship")} value={citizenship} onChange={setCitizenship} options={[{ id: "british-irish", label: t("British or Irish") }, { id: "commonwealth", label: t("Commonwealth") }, { id: "eu", label: t("EU") }, { id: "other", label: t("Other") }]} />
        </Question>
      </div>
      <ul aria-live="polite" className="v-tickets">
        {rows.map((r) => {
          const R = RESULT[r.result];
          return (
            <li key={r.key} className="v-ticket" style={{ "--rc": R.colour }}>
              <div className="v-ticket-stub" aria-hidden="true">{ICONS[R.icon]}</div>
              <div className="v-ticket-body">
                <div className="v-ticket-label">{t(r.label)}</div>
                <div className="v-ticket-result">{t(RESULT_LABEL[r.result])}</div>
                <p>{t(r.note)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="v-small">
        {t("This is a guide, not legal advice. The rules change, and some cases (such as EU citizens, or people living abroad) depend on details.")} <a href={HOW} target="_blank" rel="noreferrer">gov.uk</a> {t("has the final word.")}
      </p>
    </Reveal>
  );
}

// The road to polling day: the four steps in a row, each in its own colour, and each a link down to its card.
function Route() {
  const t = useT();
  return (
    <ol className="v-route" aria-label={t("The four steps, in order")}>
      {STEPS.map((s) => (
        <li key={s.id} style={{ "--sc": s.colour, "--i": s.n - 1 }}>
          <a href={`#v-${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`v-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            <span className="v-route-icon">{ICONS[s.id]}<b>{s.n}</b></span>
            <span className="v-route-title">{t(s.short)}</span>
            <span className="v-route-line">{t(s.line)}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}



function Deadlines() {
  const t = useT();
  return (
    <figure className="v-deadlines">
      <figcaption>{t("Last day to act, counted back from polling day")}</figcaption>
      <ul>
        {DEADLINES.map((d) => (
          <li key={d.label} style={{ "--dc": d.colour }}>
            <div className="v-dl-row"><span>{t(d.label)}</span><span className="v-dl-days"><strong>{d.days}</strong> {t("working days before")}</span></div>
            <div aria-hidden="true" className="v-dl-track"><span className="bar-grow-r" style={{ width: `${(d.days / 12) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="v-dl-end"><span>{t("Polling day")}</span></div>
    </figure>
  );
}

const Tick = ({ children }) => (
  <li><span aria-hidden="true">{ICONS.tick}</span><span>{children}</span></li>
);

function StepCard({ step, children }) {
  const t = useT();
  return (
    <Reveal as="section" id={`v-${step.id}`} className="v-step" style={{ "--sc": step.colour }} aria-labelledby={`h-${step.id}`}>
      <header className="v-step-head">
        <span className="v-step-n" aria-hidden="true">{step.n}</span>
        <h3 id={`h-${step.id}`}>{t(step.title)}</h3>
        <span className="v-step-icon" aria-hidden="true">{ICONS[step.id]}</span>
      </header>
      <div className="v-step-body">
        <div className="v-step-main">{children}</div>
        <aside className="v-step-fact" aria-label={t("Key fact")}>
          <b>{t(step.fact)}</b>
          <span>{t(step.unit)}</span>
        </aside>
      </div>
    </Reveal>
  );
}

const Link = ({ href, children }) => <a className="v-link" href={href} target="_blank" rel="noreferrer">{children}</a>;

// A ballot paper, drawn small: one box with a cross in it.
const Ballot = () => (
  <svg viewBox="0 0 120 150" className="v-ballot" aria-hidden="true">
    <rect x="6" y="6" width="108" height="138" rx="8" fill="#fff" stroke="currentColor" strokeWidth="3" />
    <path d="M22 28h60M22 40h36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    {[62, 90, 118].map((y, i) => (
      <g key={y}><rect x="22" y={y - 12} width="76" height="22" rx="4" fill="none" stroke="currentColor" strokeWidth="2.4" /><rect x="76" y={y - 8} width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2.4" />{i === 1 && <path className="v-ballot-x" d={`M78 ${y - 6}l12 10m0-10l-12 10`} stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" fill="none" />}</g>
    ))}
  </svg>
);

export default function HowToVote() {
  const t = useT();
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconBallot}
        kicker="Your say"
        title={t("How to vote")}
        subtitle={t("Who can vote, how to register, what to bring and what happens on the day, in plain steps with links to the official sites. If you only read one thing, read step 1: you can't vote unless you are registered.")}
      />

      <Route />
      <Checker />

      <section aria-labelledby="h-steps" className="v-steps">
        <h2 id="h-steps" className="v-h2 v-h2-centre">{t("Four steps to voting")}</h2>
        <Deadlines />

        <StepCard step={STEPS[0]}>
          <p style={para}>{t("It takes about five minutes online. You need your date of birth, your address and your National Insurance number (you can still register without one). Registering is separate from being on any other list, so do it even if you think you already have.")}</p>
          <ul className="v-ticks">
            <Tick>{t("The deadline is 12 working days before polling day. Register early, as the queue builds up just before an election.")}</Tick>
            <Tick>{t("If you move house, register again at your new address.")}</Tick>
            <Tick>{t("Students with two addresses can register at both, but may only vote once in the same election.")}</Tick>
            <Tick>{t("In Northern Ireland, you register with the Electoral Office for Northern Ireland, which is a separate system.")}</Tick>
          </ul>
          <p className="v-links"><Link href={REGISTER}>{t("Register on gov.uk")}</Link><Link href={NI}>{t("Northern Ireland")}</Link></p>
        </StepCard>

        <StepCard step={STEPS[1]}>
          <p style={para}>{t("Most people vote in person at a polling station, but there are two other ways.")}</p>
          <ul className="v-ways">
            <li style={{ "--wc": "#7A5AF0" }}>{ICONS.person}<b>{t("In person")}</b><span>{t("Your poll card says where. Nothing more to arrange.")}</span></li>
            <li style={{ "--wc": "#E0367A" }}>{ICONS.post}<b>{t("By post")}</b><span>{t("Apply at least 11 working days before polling day. Your ballot comes in the post and has to be back in time to be counted.")}</span></li>
            <li style={{ "--wc": "#0E9AA7" }}>{ICONS.proxy}<b>{t("By proxy")}</b><span>{t("A person you trust votes for you. Apply at least 6 working days before polling day, or ask for an emergency proxy if something unexpected happens.")}</span></li>
          </ul>
        </StepCard>

        <StepCard step={STEPS[2]}>
          <p style={para}>{t("In Great Britain you need photo ID to vote in person at UK general elections and at council elections in England. A passport or a driving licence is accepted, and so are several other kinds, including some older people's and disabled people's bus passes. Scottish and Welsh parliament and council elections do not need ID. Northern Ireland has its own photo ID rules.")}</p>
          <ul className="v-ticks">
            <Tick>{t("It does not have to be in date, as long as it still looks like you.")}</Tick>
            <Tick>{t("No photo ID? You can apply for a free Voter Authority Certificate, and you should do it well before polling day.")}</Tick>
          </ul>
          <p className="v-links"><Link href={HOW}>{t("Which ID is accepted, on gov.uk")}</Link></p>
        </StepCard>

        <StepCard step={STEPS[3]}>
          <div className="v-day">
            <div>
              <p style={para}>{t("Polling stations are open from 7am to 10pm. If you are in the queue at 10pm, you can still vote.")}</p>
              <ul className="v-ticks">
                <Tick>{t("Go to the polling station named on your poll card. You can look yours up with your postcode.")}</Tick>
                <Tick>{t("Give your name and address and show your ID if you need it.")}</Tick>
                <Tick>{t("You are handed a ballot paper. Mark an X in the box next to one candidate, fold it and put it in the ballot box.")}</Tick>
                <Tick>{t("It usually takes just a few minutes.")}</Tick>
              </ul>
              <p className="v-links"><Link href={POLLING}>{t("Find your polling station")}</Link></p>
            </div>
            <Ballot />
          </div>
        </StepCard>
      </section>

      <Reveal as="section" aria-labelledby="h-after" className="v-after">
        <h2 id="h-after" className="v-h2 v-h2-centre">{t("What happens after you vote")}</h2>
        <div className="v-after-grid">
          <div style={{ "--ac": "#7A5AF0" }}><b>650</b><span>{t("constituencies, each electing one MP")}</span></div>
          <div style={{ "--ac": "#0E9AA7" }}><b>{t("Overnight")}</b><span>{t("the votes are counted, and most results are known by morning")}</span></div>
          <div style={{ "--ac": "#E8741A" }}><b>326</b><span>{t("seats, more than half, is what a party needs to form the government")}</span></div>
        </div>
        <p style={{ ...para, marginInline: "auto", textAlign: "center" }}>{t("Whoever gets the most votes in a constituency wins it, even without more than half. This is called first past the post. If no party wins more than half the seats, it is a hung parliament, and parties have to work together or govern as a minority.")}</p>
        <div className="v-chips">
          {AFTER_LINKS.map(([href, label]) => (
            <a key={href} className="ons-tap" href={href}>{t(label)}</a>
          ))}
        </div>
      </Reveal>

      <p className="v-small" style={{ marginTop: 22, maxWidth: 760 }}>
        {t("This page is a plain guide to the usual rules. Deadlines and ID rules can change, so always check the official pages before an election:")}{" "}
        <a href={REGISTER} target="_blank" rel="noreferrer">gov.uk</a>,{" "}
        <a href={COMMISSION} target="_blank" rel="noreferrer">{t("the Electoral Commission")}</a> {t("and")}{" "}
        <a href={NI} target="_blank" rel="noreferrer">{t("the Electoral Office for Northern Ireland")}</a>.
      </p>
    </div>
  );
}
