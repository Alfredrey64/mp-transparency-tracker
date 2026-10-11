import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable } from "../theme";
import { PageHeader } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import {
  IconCompass, IconEconomy, IconHealth, IconMigration, IconLeaf, IconHome, IconGlobe, IconGavel,
  IconGlossary, IconHeart, IconVote, IconDevolved, IconShield, IconFactory, IconInfluence, IconHardHat,
  IconDoor, IconStar, IconPin,
} from "./icons";
import { QUESTIONS, ISSUES, ANSWER_SCALE, QUIZ_PARTIES, NATIONS, QUESTION_ANSWER, scoreQuiz } from "../data/partyMatchQuiz";
import { explainMatch, STANCE, YOU } from "../lib/quizInsights";

const MAX_PRIORITIES = 5;

const ISSUE_ICONS = {
  economy: IconEconomy,
  nhs: IconHealth,
  immigration: IconMigration,
  climate: IconLeaf,
  housing: IconHome,
  europe: IconGlobe,
  crime: IconGavel,
  education: IconGlossary,
  welfare: IconHeart,
  voting: IconVote,
  devolution: IconDevolved,
  defence: IconShield,
  ownership: IconFactory,
  aid: IconInfluence,
  workers: IconHardHat,
  asylum: IconDoor,
};

function issueLabel(key) {
  return ISSUES.find((i) => i.key === key)?.label ?? key;
}

// Short display initials for a party's avatar chip — special-cased so
// already-short acronyms like "SNP" aren't chopped down to one letter.
function partyInitials(name) {
  if (name.length <= 4) return name.toUpperCase();
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 3);
}

function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

// A slowly orbiting ring of party-coloured dots around a central "you" —
// a small decorative diagram that stands in for the abstract idea of
// "matching" without pretending to plot anyone on a literal political
// map. With a highlightKey, the matched party's dot brightens and the
// rest fade, like a compass settling on an answer.
function MatchOrbitDiagram({ highlightKey, size = 160 }) {
  const center = size / 2;
  const radius = size * 0.36;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={center} cy={center} r={radius + 20} fill="none" stroke={COLORS.hairline} strokeWidth="1" />
      <circle cx={center} cy={center} r={radius - 12} fill="none" stroke={COLORS.hairline} strokeWidth="1" strokeDasharray="1.5 5" />
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      >
        {QUIZ_PARTIES.map((p, i) => {
          const angle = (i / QUIZ_PARTIES.length) * Math.PI * 2 - Math.PI / 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          const active = p.key === highlightKey;
          const dim = highlightKey && !active;
          return <circle key={p.key} cx={x} cy={y} r={active ? 7.5 : 4.5} fill={p.color} opacity={dim ? 0.25 : 1} />;
        })}
      </motion.g>
      <motion.circle
        cx={center}
        cy={center}
        r={8}
        fill={COLORS.ink}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      />
      <circle cx={center} cy={center} r={8} fill="none" stroke={COLORS.accent} strokeWidth="2" />
    </svg>
  );
}

function ProgressBar({ current, total }) {
  const pct = (current / total) * 100;
  return (
    <div style={{ height: 5, borderRadius: 999, background: COLORS.hairline, overflow: "hidden", marginBottom: 28 }}>
      <motion.div
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ height: "100%", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`, borderRadius: 999 }}
      />
    </div>
  );
}

const cardStyle = {
  background: COLORS.paperCard,
  border: `1px solid ${COLORS.hairline}`,
  borderTop: `4px solid ${COLORS.accent}`,
  borderRadius: 16,
  padding: "28px clamp(18px, 4vw, 32px)",
};

const primaryButtonStyle = {
  fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: "#fff", background: COLORS.accent,
  border: "none", borderRadius: 999, padding: "12px 26px", cursor: "pointer",
};

function IntroScreen({ onStart }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <MatchOrbitDiagram />
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.7, marginTop: 0 }}>
          Pick which issues matter most to you, then say how much you agree or disagree with {QUESTIONS.length} policy
          statements. We'll match your answers against each major party's actual 2024 manifesto commitments (and,
          where a manifesto was silent, their clearly and consistently stated public position since) to see who lines
          up with you best.
        </p>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, padding: "14px 16px", margin: "18px 0", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>Before you start:</strong> this is a simplification by nature. A single number can't fully capture a party's position on a complex issue, and stated
          positions can shift once a party is in office. The scoring is our own independent, good-faith reading of
          public material, not an official rating from any party. Treat your result as a conversation-starter, not a
          verdict, and nothing you answer here is saved or sent anywhere; it only exists in your browser for this
          session.
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onStart} style={primaryButtonStyle}>
          Start
        </motion.button>
      </div>
    </motion.div>
  );
}

function PrioritiesScreen({ selected, onToggle, onContinue }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={cardStyle}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>
          Which issues matter most to you?
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 0, marginBottom: 20 }}>
          Pick up to {MAX_PRIORITIES}. Questions on these issues will count double toward your result. You can also pick none and weight everything equally.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {ISSUES.map((issue) => {
            const active = selected.includes(issue.key);
            const disabled = !active && selected.length >= MAX_PRIORITIES;
            const Icon = ISSUE_ICONS[issue.key] ?? IconCompass;
            return (
              <motion.button
                key={issue.key}
                onClick={() => !disabled && onToggle(issue.key)}
                disabled={disabled}
                whileHover={disabled ? {} : { y: -2 }}
                whileTap={disabled ? {} : { scale: 0.96 }}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: "6px 14px 6px 6px", borderRadius: 999,
                  border: `1px solid ${active ? COLORS.accent : COLORS.hairline}`, background: active ? COLORS.accent : "transparent",
                  color: active ? "#fff" : disabled ? `${COLORS.inkSoft}80` : COLORS.inkSoft,
                  cursor: disabled ? "not-allowed" : "pointer", transition: "border-color 0.15s, background 0.15s, color 0.15s",
                }}
              >
                <span
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    width: 22, height: 22, borderRadius: 7,
                    background: active ? "rgba(255,255,255,0.18)" : `${COLORS.accent}14`,
                    color: active ? "#fff" : COLORS.accent,
                  }}
                >
                  <Icon size={12} />
                </span>
                {issue.label}
              </motion.button>
            );
          })}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 16 }}>
          {selected.length} of {MAX_PRIORITIES} selected
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onContinue} style={primaryButtonStyle}>
          Continue
        </motion.button>
      </div>
    </motion.div>
  );
}

// SNP and Plaid Cymru only stand candidates in Scotland and Wales — without
// this question the quiz can (and did) match a resident of, say,
// Manchester with Plaid Cymru purely on policy alignment, which is a real
// answer to "who thinks like you" but a useless one for "who could you
// actually vote for". A little pin drops onto whichever card is picked, the
// nearest thing to "cute" that still does real work: it's the same visual
// language as a map pin marking where you are.
function NationScreen({ selected, onSelect, onContinue, onSkip }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={cardStyle}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>
          Where do you live?
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>
          A couple of parties in this quiz only stand candidates in one nation, telling us keeps your result to
          parties you could actually vote for. Nothing here is saved; it only shapes which parties appear in your
          results.
        </p>
        {/* Square cards, and enough clearance above the whole grid (not
            just above each card's own border) for the pin's full travel:
            the pin used to only clear its own card's edge, which still
            left it poking up into the paragraph above (row 1) or the row
            above it (row 2+) once the drop-and-bounce animation was
            accounted for. rowGap alone now carries that clearance, so it
            doesn't depend on which row is selected. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(130px, 100%), 1fr))", columnGap: 12, rowGap: 32, marginTop: 26, marginBottom: 22 }}>
          {NATIONS.map((n) => {
            const active = selected === n.key;
            return (
              <motion.button
                key={n.key}
                onClick={() => onSelect(n.key)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
                  aspectRatio: "1 / 1", borderRadius: 14, cursor: "pointer",
                  border: `2px solid ${active ? COLORS.accent : COLORS.hairline}`,
                  background: active ? `${COLORS.accent}10` : COLORS.paper,
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <AnimatePresence>
                  {active && (
                    <motion.span
                      key="pin"
                      initial={{ y: -18, opacity: 0, scale: 0.5 }}
                      animate={{ y: [-18, 1, -1, 0], opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ position: "absolute", top: -24, color: COLORS.accent, display: "flex" }}
                    >
                      <IconPin size={20} />
                    </motion.span>
                  )}
                </AnimatePresence>
                {n.flagIcon ? (
                  <n.flagIcon size={24} />
                ) : (
                  <span style={{ fontSize: 32, lineHeight: 1 }} aria-hidden>{n.flag}</span>
                )}
                <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.ink, textAlign: "center" }}>
                  {n.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <motion.button
            whileHover={selected ? { scale: 1.03 } : {}}
            whileTap={selected ? { scale: 0.97 } : {}}
            onClick={() => selected && onContinue()}
            style={{ ...primaryButtonStyle, opacity: selected ? 1 : 0.45, cursor: selected ? "pointer" : "default" }}
          >
            Continue
          </motion.button>
          <button
            onClick={onSkip}
            style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Prefer not to say
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ExplainerToggle({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 22 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700,
          color: COLORS.accent, background: "transparent", border: "none", cursor: "pointer", padding: 0,
        }}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </motion.span>
        What does this mean?
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.65,
                background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderRadius: 10,
                padding: "12px 14px", marginTop: 10, marginBottom: 0,
              }}
            >
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionScreen({ question, index, total, value, onAnswer, onBack }) {
  const Icon = ISSUE_ICONS[question.issue] ?? IconCompass;
  return (
    <motion.div key={question.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25, ease: "easeOut" }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              width: 32, height: 32, borderRadius: 10, background: `${COLORS.accent}14`, color: COLORS.accent,
            }}
          >
            <Icon size={17} />
          </span>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {issueLabel(question.issue)}
            <div style={{ fontWeight: 600, color: COLORS.inkSoft, textTransform: "none", letterSpacing: "normal", marginTop: 2 }}>
              Question {index + 1} of {total}
            </div>
          </div>
        </div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginTop: 0, marginBottom: 10, lineHeight: 1.4 }}>
          {question.statement}
        </h2>
        <ExplainerToggle text={question.explainer} />
        {QUESTION_ANSWER[question.id] && (
          <p style={{ margin: "-10px 0 18px", fontFamily: FONT_BODY, fontSize: 12.5 }}>
            <a href={`#/answers/${QUESTION_ANSWER[question.id]}`} target="_blank" rel="noreferrer" style={{ color: readable(COLORS.accent), fontWeight: 700 }}>See what each party said about this</a>
            <span style={{ color: COLORS.inkSoft }}> (opens in a new tab, so you keep your place)</span>
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {ANSWER_SCALE.map((opt) => {
            const active = value === opt.value;
            return (
              <motion.button
                key={opt.value}
                onClick={() => onAnswer(question.id, opt.value)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.985 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
                  padding: "12px 16px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                  border: `1px solid ${active ? COLORS.accent : COLORS.hairline}`, background: active ? `${COLORS.accent}14` : "transparent",
                  color: COLORS.ink, transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <span style={{ position: "relative", width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `2px solid ${active ? COLORS.accent : COLORS.hairline}` }}>
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        style={{ position: "absolute", inset: 2, borderRadius: "50%", background: COLORS.accent }}
                      />
                    )}
                  </AnimatePresence>
                </span>
                {opt.label}
              </motion.button>
            );
          })}
        </div>
        {index > 0 && (
          <button
            onClick={onBack}
            style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ← Back
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Why one party scored as it did: where you agree most strongly, and where you are furthest apart, each with a link to what the parties said.
export function Breakdown({ party, answers }) {
  const { agree, differ, answered } = useMemo(() => explainMatch(answers, party.key, QUESTIONS), [answers, party.key]);
  if (!answered) return null;
  const Row = ({ r }) => (
    <li style={{ padding: "10px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.45 }}>{r.statement}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>
        You {YOU[r.user]}. {party.name} {STANCE[r.party]}.
        {QUESTION_ANSWER[r.id] && <> <a href={`#/answers/${QUESTION_ANSWER[r.id]}`} target="_blank" rel="noreferrer" style={{ color: readable(COLORS.accent), fontWeight: 700 }}>What the parties said</a></>}
      </div>
    </li>
  );
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${party.color}`, borderRadius: 16, padding: "20px clamp(18px, 4vw, 28px)", marginBottom: 20 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: COLORS.ink }}>Why {party.name}?</div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.55, margin: "4px 0 10px" }}>These are the statements where you and {party.name} are closest and furthest apart. Tap another party in the ranking above to see its breakdown.</p>
      {agree.length > 0 && (<>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginTop: 8 }}>Where you agree</div>
        <ul style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>{agree.map((r) => <Row key={r.id} r={r} />)}</ul>
      </>)}
      {differ.length > 0 && (<>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.ink, marginTop: 14 }}>Where you differ</div>
        <ul style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>{differ.map((r) => <Row key={r.id} r={r} />)}</ul>
      </>)}
      {agree.length === 0 && differ.length === 0 && <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: "6px 0 0" }}>Your answers sit somewhere in the middle, with no strong agreements or clear disagreements.</p>}
    </div>
  );
}

function ResultsScreen({ results, answers, nation, onRetake }) {
  const top = results[0];
  const [pickedKey, setPickedKey] = useState(null);
  const shown = results.find((r) => r.key === pickedKey) ?? top;
  const animatedPct = useCountUp(top.pct, true);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {nation === "northern-ireland" && (
        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>A note for Northern Ireland:</strong> this quiz scores against parties
          with a comparable UK-wide or devolved-nation platform. Northern Ireland's own parties campaign on a
          fundamentally different axis, the constitutional question, that this scale doesn't fit, so they're left
          out rather than force-fitted. The ranking below is the closest match among the parties it does cover, not a
          full picture of your options on the ballot.
        </div>
      )}
      <div style={{ ...cardStyle, borderTopColor: top.color, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Your closest match
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <MatchOrbitDiagram highlightKey={top.key} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.15 }}
            style={{ color: top.color, display: "flex" }}
          >
            <IconStar size={20} filled />
          </motion.span>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: top.color }}>{top.name}</span>
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.inkSoft, marginBottom: 4 }}>{animatedPct}%</div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 0, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
          See the Party Policies tab for {top.name}'s fuller manifesto summary, and Political History for how the party got here.
        </p>
      </div>

      <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 16, padding: "24px clamp(18px, 4vw, 32px)", marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
          Full ranking
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {results.map((r, i) => (
            <motion.button
              type="button"
              key={r.key}
              onClick={() => setPickedKey(r.key)}
              aria-pressed={shown.key === r.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ x: 2 }}
              style={{ display: "block", width: "100%", textAlign: "left", background: shown.key === r.key ? `${r.color}14` : "transparent", border: `1px solid ${shown.key === r.key ? `${r.color}66` : "transparent"}`, borderRadius: 12, padding: "8px 10px", margin: "-8px -10px", cursor: "pointer", font: "inherit", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      width: 24, height: 24, borderRadius: "50%", background: `${r.color}22`, color: r.color,
                      border: `1.5px solid ${r.color}55`, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 11,
                    }}
                  >
                    {partyInitials(r.name)}
                  </span>
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {i + 1}. {r.name}
                  </span>
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, flexShrink: 0 }}>{r.pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${r.pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                  style={{ height: "100%", background: r.color, borderRadius: 999 }}
                />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <Breakdown party={shown} answers={answers} />

      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 20 }}>
        This is a simplified, independent tool, not a personalised recommendation, and not a substitute for reading
        the parties' own manifestos yourself. Positions can and do change; see the Party Policies tab for the full
        picture on any party above.
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onRetake}
        style={{
          fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: COLORS.ink, background: "transparent",
          border: `1px solid ${COLORS.hairline}`, borderRadius: 999, padding: "11px 24px", cursor: "pointer",
        }}
      >
        Retake the quiz
      </motion.button>
    </motion.div>
  );
}

export default function PartyMatch() {
  const [stage, setStage] = useState("intro"); // "intro" | "nation" | "priorities" | number | "results"
  const [nation, setNation] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [answers, setAnswers] = useState({});

  function togglePriority(key) {
    setPriorities((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function answerQuestion(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    const index = QUESTIONS.findIndex((q) => q.id === id);
    setTimeout(() => {
      setStage(index + 1 < QUESTIONS.length ? index + 1 : "results");
    }, 220);
  }

  function retake() {
    setNation(null);
    setPriorities([]);
    setAnswers({});
    setStage("intro");
  }

  const results = useMemo(() => (stage === "results" ? scoreQuiz(answers, priorities, nation) : null), [stage, answers, priorities, nation]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCompass}
        kicker="Find Your Party"
        title="Which party matches you?"
        subtitle={
          <>
            Answer a short set of policy questions and see which party's stated positions line up closest with your
            own. It is based on their 2024 <GlossaryTerm term="Manifesto">manifestos</GlossaryTerm>, not our opinions.
          </>
        }
      />

      {typeof stage === "number" && <ProgressBar current={stage} total={QUESTIONS.length} />}

      <AnimatePresence mode="wait">
        {stage === "intro" && <IntroScreen key="intro" onStart={() => setStage("nation")} />}
        {stage === "nation" && (
          <NationScreen
            key="nation"
            selected={nation}
            onSelect={setNation}
            onContinue={() => setStage("priorities")}
            onSkip={() => { setNation(null); setStage("priorities"); }}
          />
        )}
        {stage === "priorities" && (
          <PrioritiesScreen key="priorities" selected={priorities} onToggle={togglePriority} onContinue={() => setStage(0)} />
        )}
        {typeof stage === "number" && (
          <QuestionScreen
            key={stage}
            question={QUESTIONS[stage]}
            index={stage}
            total={QUESTIONS.length}
            value={answers[QUESTIONS[stage].id]}
            onAnswer={answerQuestion}
            onBack={() => setStage(stage - 1)}
          />
        )}
        {stage === "results" && results && <ResultsScreen key="results" results={results} answers={answers} nation={nation} onRetake={retake} />}
      </AnimatePresence>
    </div>
  );
}
