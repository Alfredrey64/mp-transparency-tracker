import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, numeric } from "../theme";
import { withScrollPreserved } from "../lib/preserveScroll";
import { NATIONS, TIERS, CONNECTORS, VOTE_FOR, CHECKS, WHO_TO_CONTACT, contactAnswer } from "../data/governmentTiers";

const SECTION_COLOR = "#B5533C";
const RAIL = 30;

function NationPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Where you live" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 22 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, fontWeight: 600, marginRight: 4 }}>Where do you live?</span>
      {NATIONS.map((n) => {
        const on = value === n.key;
        return (
          <button
            key={n.key}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(n.key)}
            style={{
              fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: on ? 700 : 500, padding: "7px 14px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${on ? COLORS.ink : COLORS.hairline}`, background: on ? COLORS.ink : "transparent",
              color: on ? COLORS.paper : COLORS.inkSoft, transition: "background 0.15s, color 0.15s",
            }}
          >
            {n.label}
          </button>
        );
      })}
    </div>
  );
}

function Heading({ children }) {
  return <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>{children}</div>;
}

function TierDetail({ tier, nation, nationLabel, exists }) {
  const note = tier.here[nation];
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ overflow: "hidden" }}
    >
      <div style={{ padding: "4px 0 6px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "18px 28px" }}>
        {!exists ? (
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: 0, gridColumn: "1 / -1", maxWidth: 560 }}>
            {tier.absentNote ?? `There is no ${tier.name.toLowerCase()} in ${nationLabel}.`}
          </p>
        ) : (
          <>
            <div>
              <Heading>What it does</Heading>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft }}>
                {tier.does.map((d) => <li key={d} style={{ marginBottom: 4 }}>{d}</li>)}
              </ul>
            </div>
            <div>
              <Heading>How you have a say</Heading>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "0 0 14px" }}>{tier.chosen}</p>
              {note && (
                <>
                  <Heading>In {nationLabel}</Heading>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "0 0 14px" }}>{note}</p>
                </>
              )}
              {tier.links.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                  {tier.links.map((l) => (
                    <a key={l.href + l.label} href={l.href} style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: tier.color }}>
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function Connector({ text, dim }) {
  return (
    <div style={{ position: "relative", padding: "2px 0 2px 0", minHeight: 38, opacity: dim ? 0.45 : 1 }}>
      <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true" style={{ position: "absolute", left: -RAIL + 1, top: "50%", marginTop: -8 }}>
        <path d="M6 1 V13 M1.5 8.5 L6 13.5 L10.5 8.5" fill="none" stroke={COLORS.inkSoft} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontStyle: "italic", lineHeight: 1.45, color: COLORS.inkSoft, maxWidth: 520, padding: "6px 0" }}>{text}</div>
    </div>
  );
}

function TierRow({ tier, open, onToggle, nation, nationLabel }) {
  const exists = tier.here[nation] !== undefined;
  const figure = tier.figureHere?.[nation] ?? tier.figure;
  return (
    <div style={{ position: "relative", opacity: exists ? 1 : 0.55, transition: "opacity 0.2s" }}>
      <span
        aria-hidden="true"
        style={{
          position: "absolute", left: -RAIL - 3, top: 15, width: 18, height: 18, borderRadius: 5,
          background: exists ? tier.color : COLORS.paperCard, border: `2px solid ${exists ? tier.color : COLORS.hairline}`,
          boxShadow: `0 0 0 4px ${COLORS.paperCard}`,
        }}
      />
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, width: "100%", textAlign: "left",
          background: "none", border: "none", padding: "10px 0", cursor: "pointer", font: "inherit",
        }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, lineHeight: 1.25 }}>{tier.name}</span>
          <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 2, lineHeight: 1.45 }}>{tier.short}</span>
        </span>
        <span style={{ flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
          {exists ? (
            <>
              <span style={{ display: "block", ...numeric, fontSize: 20, fontWeight: 600, color: tier.color, lineHeight: 1.2 }}>{figure.value}</span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>{figure.label}</span>
            </>
          ) : (
            <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Not in {nationLabel}</span>
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && <TierDetail key="detail" tier={tier} nation={nation} nationLabel={nationLabel} exists={exists} />}
      </AnimatePresence>
    </div>
  );
}

function VoterNode({ nation }) {
  return (
    <div style={{ position: "relative", paddingTop: 4 }}>
      <span
        aria-hidden="true"
        style={{ position: "absolute", left: -RAIL - 3, top: 9, width: 18, height: 18, borderRadius: "50%", background: COLORS.ink, boxShadow: `0 0 0 4px ${COLORS.paperCard}` }}
      />
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.ink, lineHeight: 1.25 }}>You</div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft, margin: "2px 0 0", maxWidth: 600 }}>
        Everything above rests on you. You vote for {VOTE_FOR[nation]}. The rest of the tiers answer to the people you elect.
      </p>
    </div>
  );
}

function Checks() {
  return (
    <div style={{ marginTop: 30 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, margin: "0 0 4px" }}>Who checks all of them</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, margin: "0 0 12px", maxWidth: 620 }}>
        Voting happens every few years. In between, independent bodies watch every tier.
      </p>
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 32px" }}>
        {CHECKS.map((c) => (
          <div key={c.name} style={{ padding: "9px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
            <dt style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{c.name}</dt>
            <dd style={{ margin: "1px 0 0", fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.5, color: COLORS.inkSoft }}>{c.what}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WhoToContact({ nation, nationLabel }) {
  const byKey = Object.fromEntries(TIERS.map((t) => [t.key, t]));
  const devolvedNation = nation !== "england";
  return (
    <div style={{ marginTop: 30 }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: COLORS.ink, margin: "0 0 4px" }}>Who do I contact?</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, margin: "0 0 12px", maxWidth: 620 }}>
        Where to start with common problems{devolvedNation ? `, for ${nationLabel}` : ""}. If you pick the wrong tier, most will point you to the right one.
      </p>
      <div>
        {WHO_TO_CONTACT.map((r) => {
          const tier = byKey[r.tier];
          const answer = contactAnswer(r, nation);
          return (
            <div
              key={r.issue}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2px 24px", padding: "10px 0 10px 12px", borderTop: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${tier.color}` }}
            >
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, lineHeight: 1.5 }}>{r.issue}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.5 }}>{answer}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GovernmentTiers() {
  const [nation, setNation] = useState("england");
  const [open, setOpen] = useState("parliament");
  const nationLabel = NATIONS.find((n) => n.key === nation).label;

  return (
    <motion.div
      id="tiers"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      style={{
        marginBottom: 32, background: COLORS.paperCard, borderLeft: `1px solid ${COLORS.hairline}`, borderRight: `1px solid ${COLORS.hairline}`,
        borderBottom: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${SECTION_COLOR}`, borderRadius: 16, padding: "24px clamp(16px, 4vw, 28px)",
      }}
    >
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.ink, marginTop: 0, marginBottom: 6 }}>Who Does What? The Tiers of Government</h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, marginTop: 0, marginBottom: 20, maxWidth: 780, lineHeight: 1.6 }}>
        Power in the UK is shared between several tiers, from Parliament down to your village. Each one has its own job and its own voters. This is a map
        of how they connect, not a chain of command: a minister can't tell a councillor what to decide, though they do hold the purse strings.
      </p>

      <NationPicker value={nation} onChange={setNation} />

      <div style={{ position: "relative", marginLeft: RAIL, paddingLeft: 0 }}>
        <span aria-hidden="true" style={{ position: "absolute", left: -RAIL + 6, top: 24, bottom: 24, width: 2, background: COLORS.hairline }} />
        {TIERS.map((tier, i) => (
          <div key={tier.key}>
            <TierRow
              tier={tier}
              open={open === tier.key}
              onToggle={() => withScrollPreserved(() => setOpen(open === tier.key ? null : tier.key))}
              nation={nation}
              nationLabel={nationLabel}
            />
            <Connector text={CONNECTORS[i] ?? "Everyone in these tiers answers to voters at the next election"} dim={tier.here[nation] === undefined || (TIERS[i + 1] !== undefined && TIERS[i + 1].here[nation] === undefined)} />
          </div>
        ))}
        <VoterNode nation={nation} />
      </div>

      <Checks />
      <WhoToContact nation={nation} nationLabel={nationLabel} />
    </motion.div>
  );
}
