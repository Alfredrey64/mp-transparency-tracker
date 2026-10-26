/** @jsxImportSource react */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { LoadFailedNote } from "./MpCards";
import { GlossaryTerm } from "./GlossaryTerm";
import { IconPetition } from "./icons";
import { Segmented } from "./DeprivationControls";
import "../petitions.css";
import { withScrollPreserved } from "../lib/preserveScroll";
import Loading from "./Loading";

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const FILTERS = [
  { key: "open", label: "Open now" },
  { key: "responded", label: "Got a government response", short: "Responded" },
  { key: "debated", label: "Debated in Parliament", short: "Debated" },
];

function SignatureBar({ count, threshold, label, color }) {
  const pct = Math.min(100, Math.round((count / threshold) * 100));
  const reached = count >= threshold;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: reached ? color : COLORS.inkSoft, fontWeight: reached ? 700 : 400 }}>
          {reached ? "Reached" : `${count.toLocaleString()} / ${threshold.toLocaleString()}`}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: COLORS.paper, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

const STATUS = {
  debate: { colour: "#7A5AF0", label: "Debated" },
  response: { colour: "#1FA97C", label: "Government responded" },
  open: { colour: "#E0367A", label: "Open" },
  closed: { colour: "#6B7A90", label: "Closed" },
};
const statusOf = (p) => (p.debate_outcome_summary || p.debate_scheduled_on ? STATUS.debate : p.government_responded_at ? STATUS.response : p.state === "open" ? STATUS.open : STATUS.closed);

// How far a petition has got: a bar to 100,000 signatures with a mark at 10,000, where the government has to respond.
function Ladder({ count }) {
  const pct = Math.min(100, (count / 100000) * 100);
  return (
    <div className="pet-ladder" aria-hidden="true">
      <div className="pet-ladder-bar"><span className="bar-grow" style={{ width: `${pct}%` }} /></div>
      <i className="pet-mark" style={{ left: "10%" }} data-hit={count >= 10000 ? "1" : "0"} />
      <i className="pet-mark" style={{ left: "calc(100% - 2px)" }} data-hit={count >= 100000 ? "1" : "0"} />
    </div>
  );
}

function PetitionRow({ petition, rank, isOpen, onToggle }) {
  const st = statusOf(petition);
  const isOpenState = petition.state === "open";
  const panelId = `pet-${petition.id}`;
  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pet-card" data-open={isOpen ? "1" : "0"} style={{ "--pc": st.colour }}
    >
      <button type="button" onClick={onToggle} aria-expanded={isOpen} aria-controls={panelId} className="pet-head">
        <span className="pet-rank" aria-hidden="true">{rank}</span>
        <span className="pet-main">
          <span className="pet-action">{petition.action}</span>
          <span className="pet-meta">
            <span className="pet-chip">{st.label}</span>
            {isOpenState && st !== STATUS.open && <span className="pet-chip pet-chip-soft">Still open</span>}
          </span>
          <Ladder count={petition.signature_count} />
        </span>
        <span className="pet-sigs"><b>{petition.signature_count.toLocaleString("en-GB")}</b><span>signatures</span></span>
        <motion.span aria-hidden="true" className="pet-chev" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>▾</motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div id={panelId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div className="pet-more">
              {petition.background && <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.65 }}>{petition.background}</div>}

              {isOpenState && (
                <div>
                  <SignatureBar count={petition.signature_count} threshold={10000} label="Threshold for a government response" color="#1FA97C" />
                  <SignatureBar count={petition.signature_count} threshold={100000} label="Threshold for a Commons debate" color="#7A5AF0" />
                </div>
              )}

              {petition.government_response_summary && (
                <div className="pet-note" style={{ "--nc": "#1FA97C" }}>
                  <b>Government response{petition.government_responded_at ? `, ${formatDate(petition.government_responded_at)}` : ""}</b>
                  <p>{petition.government_response_summary}</p>
                </div>
              )}

              {(petition.debate_outcome_summary || petition.debate_scheduled_on) && (
                <div className="pet-note" style={{ "--nc": "#7A5AF0" }}>
                  <b>{petition.debate_outcome_summary ? "Commons debate" : "Debate scheduled"}</b>
                  <p>{petition.debate_outcome_summary || `Scheduled for ${formatDate(petition.debate_scheduled_on)}`}</p>
                </div>
              )}

              <a className="pet-link" href={petition.url} target="_blank" rel="noreferrer">View the full petition on petitions.parliament.uk ↗</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

const PAGE = 25;

export default function Petitions() {
  const [petitions, setPetitions] = useState(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("open");
  const [openId, setOpenId] = useState(null);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("petitions").select("*").order("signature_count", { ascending: false });
      setFailed(Boolean(error));
      setPetitions(data ?? []);
    }
    load();
  }, []);

  const counts = useMemo(() => {
    const list = petitions ?? [];
    return {
      open: list.filter((p) => p.state === "open").length,
      responded: list.filter((p) => p.government_responded_at).length,
      debated: list.filter((p) => p.debate_outcome_summary || p.debate_scheduled_on).length,
      signatures: list.filter((p) => p.state === "open").reduce((t, p) => t + (p.signature_count ?? 0), 0),
    };
  }, [petitions]);

  const filtered = useMemo(() => {
    if (!petitions) return [];
    if (filter === "open") return petitions.filter((p) => p.state === "open");
    if (filter === "responded") return petitions.filter((p) => p.government_responded_at);
    if (filter === "debated") return petitions.filter((p) => p.debate_outcome_summary || p.debate_scheduled_on);
    return petitions;
  }, [petitions, filter]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconPetition}
        kicker="Petitions"
        title="Public petitions to Parliament"
        subtitle="The most-signed petitions that are open now, plus recent ones that got a government response or a Commons debate. They come straight from petitions.parliament.uk, with no picking and choosing from us."
      />

      <section className="pet-how" aria-label="How petitions work">
        <p>Any UK citizen or resident can create or sign a <GlossaryTerm term="Petition">petition</GlossaryTerm> to Parliament. Petitions run for six months from opening, and each one is moderated before publication.</p>
        <ol>
          <li style={{ "--hc": "#1FA97C" }}><b>10,000</b><span>signatures, and the government must respond in writing</span></li>
          <li style={{ "--hc": "#7A5AF0" }}><b>100,000</b><span>signatures, and it is considered for a Commons debate</span></li>
          <li style={{ "--hc": "#E8741A" }}><b>No promise</b><span>A debate isn't guaranteed, and neither a response nor a debate changes the law by itself</span></li>
        </ol>
      </section>

      {petitions !== null && !failed && (
        <div className="pet-stats">
          <div style={{ "--sc": "#E0367A" }}><b>{counts.open.toLocaleString("en-GB")}</b><span>petitions open</span></div>
          <div style={{ "--sc": "#C7871A" }}><b>{counts.signatures.toLocaleString("en-GB")}</b><span>signatures on them</span></div>
          <div style={{ "--sc": "#1FA97C" }}><b>{counts.responded.toLocaleString("en-GB")}</b><span>got a response</span></div>
          <div style={{ "--sc": "#7A5AF0" }}><b>{counts.debated.toLocaleString("en-GB")}</b><span>debated</span></div>
        </div>
      )}

      <div style={{ margin: "22px 0 18px" }}>
        <Segmented
          label="Which petitions" value={filter} accent="#E0367A"
          onChange={(k) => withScrollPreserved(() => { setFilter(k); setShown(PAGE); setOpenId(null); })}
          options={FILTERS.map((f) => ({ id: f.key, label: f.label, short: f.short }))}
        />
      </div>

      {petitions === null && <Loading compact />}
      {petitions !== null && failed && <LoadFailedNote item="the petitions list" />}
      {petitions !== null && !failed && filtered.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, padding: "20px 0" }}>No petitions match this filter right now.</div>
      )}

      <div className="pet-list">
        {filtered.slice(0, shown).map((p, i) => (
          <PetitionRow key={p.id} petition={p} rank={i + 1} isOpen={openId === p.id} onToggle={() => withScrollPreserved(() => setOpenId(openId === p.id ? null : p.id))} />
        ))}
      </div>
      {filtered.length > shown && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => withScrollPreserved(() => setShown((n) => n + PAGE))}>
            Show {Math.min(PAGE, filtered.length - shown)} more of {filtered.length - shown} left
          </button>
        </div>
      )}
    </div>
  );
}
