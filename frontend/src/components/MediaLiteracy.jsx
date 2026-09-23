import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconBroadcast } from "./icons";

function InfoCard({ title, color, children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      style={{
        background: COLORS.paperCard, borderLeft: `1px solid ${COLORS.hairline}`, borderRight: `1px solid ${COLORS.hairline}`,
        borderBottom: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${color}`, borderRadius: 16,
        padding: "22px clamp(16px, 4vw, 26px)", boxShadow: "0 2px 10px rgba(30,42,68,0.05)", marginBottom: 20,
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginTop: 0, marginBottom: 10 }}>{title}</h2>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.inkSoft, lineHeight: 1.7 }}>{children}</div>
    </motion.div>
  );
}

// A slow, looping "broadcast vs print" hero animation — concentric rings
// pulsing outward from a transmitter on one side, a static stack of pages
// on the other. Purely decorative, but it visualises the page's actual
// argument (one medium broadcasts under a legal duty, the other prints
// freely) rather than a generic banner.
function BroadcastHero() {
  const rings = [0, 1, 2];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(24px, 8vw, 64px)", padding: "8px 0 28px", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {rings.map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.75, ease: "easeOut" }}
            style={{ position: "absolute", width: 60, height: 60, borderRadius: "50%", border: `2px solid ${COLORS.brass}` }}
          />
        ))}
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: COLORS.brass, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 1 }}>
          <IconBroadcast size={20} />
        </div>
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>
        Legally impartial
        <div style={{ height: 1, width: 40, background: COLORS.hairline, margin: "10px auto" }} />
        Free to editorialise
      </div>

      <div style={{ position: "relative", width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ rotate: -6 + i * 4, y: 0 }}
            animate={{ rotate: [-6 + i * 4, 6 - i * 4, -6 + i * 4] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", width: 46, height: 58, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`,
              borderRadius: 3, top: 16 - i * 3, boxShadow: "0 2px 6px rgba(30,42,68,0.1)",
            }}
          >
            <div style={{ margin: "7px 6px 0", height: 3, background: COLORS.ink, opacity: 0.7, borderRadius: 1 }} />
            <div style={{ margin: "4px 6px 0", height: 2, background: COLORS.inkSoft, opacity: 0.5, borderRadius: 1 }} />
            <div style={{ margin: "3px 6px 0", height: 2, background: COLORS.inkSoft, opacity: 0.5, borderRadius: 1, width: "70%" }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const OUTLETS = [
  {
    name: "BBC",
    color: "#5A7FA6",
    funding: "The TV licence fee — a statutory charge on households, set by government but collected independently.",
    ownership: "A public corporation operating under a Royal Charter, not owned by shareholders or the state directly.",
    regulator: "Regulated by Ofcom for due impartiality since 2017 (previously self-regulated under its own Charter).",
  },
  {
    name: "ITV",
    color: "#9C6B30",
    funding: "Commercial advertising revenue.",
    ownership: "A publicly listed company (ITV plc) on the London Stock Exchange — owned by its shareholders.",
    regulator: "Regulated by Ofcom for due impartiality, like every UK broadcast news service.",
  },
  {
    name: "Channel 4",
    color: "#B5533C",
    funding: "Commercial advertising revenue, despite public ownership.",
    ownership: "Publicly owned (a state-owned corporation) — the government considered privatising it in 2022 but reversed that decision in January 2023.",
    regulator: "Regulated by Ofcom for due impartiality.",
  },
  {
    name: "Sky News",
    color: "#3F7D5C",
    funding: "Subscription and advertising revenue, cross-funded within the wider Sky/Comcast group.",
    ownership: "Owned by Sky Group, itself owned by Comcast — a US media conglomerate — since 2018.",
    regulator: "Regulated by Ofcom for due impartiality.",
  },
  {
    name: "GB News",
    color: "#6E4B6E",
    funding: "Commercial advertising and direct shareholder investment (it has reported significant losses since launch).",
    ownership: "Privately owned — per Companies House filings, majority-owned by the investment firm Legatum Ventures and the financier Sir Paul Marshall (roughly 41% each), with smaller stakes held by staff and other investors.",
    regulator: "Regulated by Ofcom for due impartiality — and has been found in breach of the Broadcasting Code on several occasions, including for sitting politicians hosting shows and interviewing ministers from their own party.",
  },
];

function OutletCard({ outlet, index, open, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: (index % 6) * 0.05 }}
      whileHover={{ y: -2, boxShadow: "0 10px 22px rgba(30,42,68,0.12)" }}
      style={{
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${outlet.color}`,
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
      }}
      onClick={onToggle}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 16, paddingBottom: open ? 10 : 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: outlet.color, flexShrink: 0, boxShadow: `0 0 0 3px ${outlet.color}2a` }} />
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink }}>{outlet.name}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ display: "flex", color: COLORS.inkSoft, flexShrink: 0 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </motion.span>
      </div>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color: outlet.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Ownership</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.55, marginBottom: 10 }}>{outlet.ownership}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color: outlet.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Funding</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.55, marginBottom: 10 }}>{outlet.funding}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color: outlet.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Regulation</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.55 }}>{outlet.regulator}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// A short, interactive sorting exercise reinforcing the one fact this whole
// page rests on: broadcasters have a legal impartiality duty, newspapers
// don't. Deliberately not a bias quiz — every item has one unambiguous,
// factual right answer about regulatory status, not an opinion about lean.
const QUIZ_ITEMS = [
  { name: "BBC News", answer: "broadcast" },
  { name: "The Guardian", answer: "print" },
  { name: "Sky News", answer: "broadcast" },
  { name: "The Daily Telegraph", answer: "print" },
  { name: "GB News", answer: "broadcast" },
  { name: "The Sun", answer: "print" },
  { name: "ITV News", answer: "broadcast" },
  { name: "The Daily Mail", answer: "print" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ImpartialityQuiz() {
  const [order] = useState(() => shuffle(QUIZ_ITEMS));
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [score, setScore] = useState(0);
  const current = order[step];
  const done = step >= order.length;

  function answer(choice) {
    if (feedback) return;
    const correct = choice === current.answer;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setFeedback(null);
      setStep((s) => s + 1);
    }, 900);
  }

  function restart() {
    setStep(0);
    setScore(0);
    setFeedback(null);
  }

  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid #A8456B`, borderRadius: 16, padding: "24px clamp(16px, 4vw, 30px)", marginBottom: 32 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>
        Quick check: broadcast or print?
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 20, maxWidth: 560 }}>
        Every one of these has a clear, factual regulatory status — no opinion required. Sort all eight to see if the
        broadcast/print divide is as intuitive as it sounds.
      </p>

      <div style={{ minHeight: 190 }}>
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
            >
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginBottom: 8 }}>
                {step + 1} of {order.length}
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY, fontSize: 26, color: COLORS.ink, textAlign: "center",
                  padding: "26px 20px", background: COLORS.paper, borderRadius: 14, marginBottom: 18,
                  border: feedback ? `2px solid ${feedback === "correct" ? "#3F7D5C" : "#9C3B3B"}` : `1px solid ${COLORS.hairline}`,
                  transition: "border-color 0.15s",
                }}
              >
                {current.name}
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, marginTop: 10, color: feedback === "correct" ? "#3F7D5C" : "#9C3B3B" }}
                  >
                    {feedback === "correct" ? "✓ Correct" : `✗ Actually ${current.answer === "broadcast" ? "a broadcaster — legally impartial" : "a newspaper — free to editorialise"}`}
                  </motion.div>
                )}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <motion.button
                  whileHover={{ scale: feedback ? 1 : 1.03 }}
                  whileTap={{ scale: feedback ? 1 : 0.97 }}
                  onClick={() => answer("broadcast")}
                  disabled={Boolean(feedback)}
                  style={{
                    fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: "#fff", background: COLORS.ink,
                    border: "none", borderRadius: 999, padding: "11px 22px", cursor: feedback ? "default" : "pointer", opacity: feedback ? 0.7 : 1,
                  }}
                >
                  Broadcaster — must be impartial
                </motion.button>
                <motion.button
                  whileHover={{ scale: feedback ? 1 : 1.03 }}
                  whileTap={{ scale: feedback ? 1 : 0.97 }}
                  onClick={() => answer("print")}
                  disabled={Boolean(feedback)}
                  style={{
                    fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: COLORS.ink, background: "transparent",
                    border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "11px 22px", cursor: feedback ? "default" : "pointer", opacity: feedback ? 0.7 : 1,
                  }}
                >
                  Newspaper — free to editorialise
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: COLORS.ink, marginBottom: 6 }}>{score} / {order.length}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 18, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                {score === order.length
                  ? "The regulatory line tracks the medium, not the outlet's reputation — every TV and radio news service sits on one side of it, every newspaper on the other, regardless of who owns them or what they're known for."
                  : "Ownership, funding, and popular reputation don't determine which side of the line an outlet sits on — only the medium does: broadcast, or print."}
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={restart}
                style={{
                  fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: COLORS.ink, background: "transparent",
                  border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "10px 22px", cursor: "pointer",
                }}
              >
                Try again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const CODE_REQUIREMENTS = [
  {
    title: "Due impartiality",
    color: "#5A7FA6",
    rule: "Broadcasting Code, Section 5",
    body: "An \"appropriately wide range of significant views\" must be included and given \"due weight\" on any matter of political or industrial controversy, or current public policy — and the programme itself, not just the channel's output over time, has to achieve this on major matters. A broadcaster can't simply balance things out across a whole week; a single one-sided programme on a big issue can breach the rule on its own.",
  },
  {
    title: "Due accuracy",
    color: "#4C7A6B",
    rule: "Broadcasting Code, Section 5",
    body: "Facts must be checked and significant errors corrected — \"due\" means accuracy appropriate to the subject and nature of the programme, so a throwaway aside is judged more lightly than a claim central to a news report. Material factual mistakes that could mislead audiences on matters of public importance have to be corrected, and correction has to be proportionate to how prominent the original error was.",
  },
  {
    title: "No politicians as newsreaders or interviewers",
    color: "#9C6B30",
    rule: "Broadcasting Code, Section 5.3",
    body: "A sitting politician cannot present, interview, or report in a news programme, and can only appear in other programming (chat shows, current affairs) if there's a clear editorial justification and — critically — their political allegiance is made clear to the audience. This is the rule GB News was found to have repeatedly breached by giving MPs their own shows.",
  },
  {
    title: "Fairness",
    color: "#B5533C",
    rule: "Broadcasting Code, Section 7",
    body: "Anyone who could be significantly criticised in a programme should normally be given a chance to respond before broadcast, and contributors shouldn't be treated unjustly through misleading editing or a lack of information about what they were contributing to. This protects the people and organisations covered, not just the audience.",
  },
  {
    title: "Extra care at elections and referendums",
    color: "#6E4B6E",
    rule: "Broadcasting Code, Section 6",
    body: "During an election or referendum period the impartiality duty tightens further — broadcasters must give due weight to all major parties and campaigns, and news coverage of constituency and electoral area campaigns comes with additional rules on candidate participation and airtime.",
  },
];

const REAL_CASES = [
  {
    outlet: "GB News",
    color: "#6E4B6E",
    date: "July 2023",
    programme: "The Live Desk",
    verdict: "Breach",
    rule: "Due impartiality",
    summary: "An episode endorsed and actively promoted a GB News-branded campaign — a petition to protect physical cash as legal tender until 2050 — including an on-screen QR code urging viewers to sign it. Ofcom found this crossed the line from reporting a story to campaigning on it, which due impartiality rules don't allow a broadcaster to do.",
  },
  {
    outlet: "GB News",
    color: "#6E4B6E",
    date: "May–June 2023",
    programme: "State of the Nation; Friday & Saturday Morning with Esther and Phil",
    verdict: "Breach",
    rule: "Politicians as presenters",
    summary: "Sitting Conservative MP Jacob Rees-Mogg presented his own show, and fellow Conservative MPs Esther McVey and Philip Davies co-hosted a weekend programme on which they interviewed Chancellor Jeremy Hunt — also Conservative — ahead of the spring budget, drawing 45 complaints. Ofcom ruled this breached the ban on politicians acting as newsreaders or interviewers, and put GB News on notice that further breaches could trigger a statutory sanction.",
  },
  {
    outlet: "GB News",
    color: "#6E4B6E",
    date: "2023–2024",
    programme: "State of the Nation",
    verdict: "Overturned",
    rule: "Due accuracy",
    summary: "Not every finding against a broadcaster survives scrutiny: the High Court ruled Ofcom had acted unlawfully in an earlier finding that a Rees-Mogg segment on Donald Trump breached accuracy rules, and quashed it. A useful reminder that Ofcom's own rulings go through a real appeals process, and don't always stand.",
  },
  {
    outlet: "BBC",
    color: "#5A7FA6",
    date: "February 2021",
    programme: "The World at One (BBC Radio 4)",
    verdict: "Breach",
    rule: "Due impartiality",
    summary: "Coverage of the dispute between Alex Salmond and the Scottish Government over harassment complaints included an interview with Baroness Ruth Davidson giving strongly critical views, without due weight given to alternative perspectives on a matter of intense, live political controversy. Ofcom found this a breach — a reminder that the impartiality duty applies to the BBC exactly as it does to any commercial broadcaster.",
  },
  {
    outlet: "BBC",
    color: "#5A7FA6",
    date: "November 2021",
    programme: "News coverage of a London antisemitic incident",
    verdict: "Fell short",
    rule: "Due accuracy",
    summary: "The BBC reported a disputed interpretation of an audio recording without making clear, promptly enough, that its meaning was contested. Ofcom identified \"significant editorial failings\" here — but, unlike the cases above, did not find an actual Code breach. It's a more nuanced example: coverage can fall short of best practice without crossing the regulatory line.",
  },
];

const VERDICT_STYLES = {
  Breach: { label: "Ruled a breach", color: "#9C3B3B" },
  Overturned: { label: "Overturned on appeal", color: "#4C7A6B" },
  "Fell short": { label: "Fell short — not a breach", color: "#9C6B30" },
};

function CaseCard({ item, index }) {
  const verdict = VERDICT_STYLES[item.verdict];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: (index % 6) * 0.05 }}
      whileHover={{ y: -2, boxShadow: "0 10px 22px rgba(30,42,68,0.12)" }}
      style={{
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${item.color}`,
        borderRadius: 14, padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase",
              color: item.color, background: `${item.color}1A`, padding: "3px 9px", borderRadius: 999,
            }}
          >
            {item.outlet}
          </span>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink }}>{item.programme}</span>
        </div>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, flexShrink: 0 }}>{item.date}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase",
            color: verdict.color, background: `${verdict.color}1A`, border: `1px solid ${verdict.color}33`, padding: "3px 9px", borderRadius: 999,
          }}
        >
          {verdict.label}
        </span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, fontStyle: "italic" }}>{item.rule}</span>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>{item.summary}</div>
    </motion.div>
  );
}

export default function MediaLiteracy() {
  const [openOutlet, setOpenOutlet] = useState(null);
  const outletOrder = useMemo(() => OUTLETS, []);

  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconBroadcast}
        title="How broadcast impartiality actually works"
        subtitle="This site doesn't rate broadcasters for bias — that's a subjective judgement call, not a matter of public record like everything else here. What follows instead is how UK broadcast regulation actually works, what it requires in practice, who owns what, and real, independently adjudicated cases of it playing out."
        maxWidth={900}
      />

      <BroadcastHero />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        style={{
          display: "flex", alignItems: "center", gap: 14, maxWidth: 900, marginBottom: 28,
          background: "linear-gradient(135deg, #5A7FA61A, #B5533C14)", border: `1px solid ${COLORS.hairline}`,
          borderRadius: 14, padding: "16px 20px",
        }}
      >
        <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "50%", background: COLORS.brass, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <IconBroadcast size={17} />
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>
          <strong>Why this matters:</strong> what you watch shapes what you think is normal, urgent, or true — and
          most people can't name which outlets are legally required to be impartial and which are free to campaign.
          Knowing the difference is the first step to reading any story with the right amount of trust.
        </div>
      </motion.div>

      <InfoCard title="The legal difference between broadcasters and newspapers" color="#5A7FA6" index={0}>
        <p style={{ marginTop: 0 }}>
          UK television and radio news is legally required to be impartial. Ofcom's Broadcasting Code sets out a "due
          impartiality" rule: broadcasters must give an appropriately wide range of significant views due weight on
          matters of political controversy, and can't take an editorial side. This applies equally to the BBC, ITV, Sky
          News, Channel 4, and GB News — public or private, licence-fee-funded or commercial makes no difference.
        </p>
        <p style={{ marginBottom: 0 }}>
          Newspapers and news websites have no equivalent legal duty. They're free to editorialise, endorse a party at
          an election, and run an openly partisan front page — which is exactly why a paper's political lean is
          common knowledge in a way a broadcaster's legally isn't supposed to be.
        </p>
      </InfoCard>

      <div style={{ marginBottom: 32, maxWidth: 900 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          What the Broadcasting Code actually requires
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
          "Due impartiality" isn't just a slogan — it's a specific set of rules Ofcom enforces, with real cases
          testing where the line falls. Here's what it breaks down into.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {CODE_REQUIREMENTS.map((req, i) => (
            <motion.div
              key={req.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: (i % 6) * 0.05 }}
              style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${req.color}`, borderRadius: 14, padding: 16 }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: COLORS.ink, marginBottom: 4 }}>{req.title}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color: req.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                {req.rule}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6 }}>{req.body}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <ImpartialityQuiz />

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>Who owns and funds each broadcaster</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16, maxWidth: 760 }}>
          Ownership and funding model are matters of public record, not opinion — worth knowing before you judge a
          broadcaster's coverage of anything, including its own owners' interests. Tap a card for the detail.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {outletOrder.map((o, i) => (
            <OutletCard
              key={o.name}
              outlet={o}
              index={i}
              open={openOutlet === o.name}
              onToggle={() => setOpenOutlet(openOutlet === o.name ? null : o.name)}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 32, maxWidth: 900 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          When broadcasters have fallen short — and when they haven't
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
          Five real, published Ofcom cases — chosen to show what a genuine breach looks like, what falls just short of
          one, and that Ofcom's own rulings can themselves be successfully challenged.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {REAL_CASES.map((item, i) => (
            <CaseCard key={`${item.outlet}-${item.programme}-${item.date}`} item={item} index={i} />
          ))}
        </div>
      </div>

      <InfoCard title="Where to find real, adjudicated findings" color="#3F7D5C" index={2}>
        <p style={{ marginTop: 0 }}>
          Rather than trust anyone's scorecard — including any you find elsewhere — Ofcom itself publishes every
          impartiality complaint it upholds, with its full written reasoning, in its weekly Broadcast and On Demand
          Bulletin. It's slower and less satisfying than a single number, but it's the actual adjudication, not a guess.
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>
            <a href="https://www.ofcom.org.uk/tv-radio-and-on-demand/broadcast-standards/section-five-due-impartiality-accuracy" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              Ofcom's due impartiality rules, explained ↗
            </a>
          </li>
          <li style={{ marginBottom: 8 }}>
            <a href="https://www.ofcom.org.uk/tv-radio-and-on-demand/broadcast-standards/broadcast-decisions" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              Ofcom's published broadcast standards decisions ↗
            </a>
          </li>
          <li>
            <a href="https://www.lboro.ac.uk/research/crcc/" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              Loughborough University's Centre for Research in Communication and Culture ↗
            </a>{" "}
            — independent academics who quantitatively track UK election TV and press coverage, rather than assert a verdict.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Reading any outlet critically" color="#9C6B30" index={3}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>Separate news reporting from opinion/comment sections — outlets label these differently, and the impartiality rules above apply far more strictly to the former.</li>
          <li style={{ marginBottom: 8 }}>Check who's speaking, not just what's said — a guest's job title or affiliation (a think tank, a trade body, a party) tells you their starting position.</li>
          <li style={{ marginBottom: 8 }}>A single outlet's framing of a story is one angle — cross-checking a second, differently-owned outlet is the cheapest way to spot what's been left out.</li>
          <li>For anything on this site specifically — donations, votes, interests — you don't need to trust anyone's framing at all: every figure links to the original official document.</li>
        </ul>
      </InfoCard>
    </div>
  );
}
