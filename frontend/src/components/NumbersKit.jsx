import { useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { partyColour } from "../lib/format";
import CountUp from "./CountUp";
import Reveal from "./Reveal";
import { fmt, pct1, EDGE, COLUMNS } from "../lib/numbersFormat";

// Pieces shared by the Commons and Lords halves of Parliament in Numbers.

// A tile of the grid: a coloured edge for what kind of fact it holds (people,
// careers, seats, change), a title, a one-line note, then the chart.

export function Tile({ span, edge = "people", title, note, children, delay = 0, style }) {
  return (
    <div className={span} style={{ minWidth: 0 }}>
      <Reveal delay={delay}>
        <section style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${EDGE[edge]}`, borderRadius: 18, padding: "18px 20px 20px", height: "100%", boxSizing: "border-box", ...style }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
          {note && <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.55, margin: "4px 0 0", maxWidth: 560 }}>{note}</p>}
          <div style={{ marginTop: 16 }}>{children}</div>
        </section>
      </Reveal>
    </div>
  );
}

export function Figure({ value, format, label, note, size = 38, onOpen }) {
  const body = (
    <>
      <div style={{ ...numeric, fontSize: size, fontWeight: 600, lineHeight: 1, color: COLORS.ink, letterSpacing: "-0.02em" }}>
        <CountUp value={value} format={format} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 6 }}>{label}</div>
      {note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 1, lineHeight: 1.45 }}>{note}</div>}
      {onOpen && <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: COLORS.accent, marginTop: 4 }}>See who ›</div>}
    </>
  );
  if (!onOpen) return <div>{body}</div>;
  return (
    <button type="button" className="nclick" onClick={onOpen} style={{ display: "block", textAlign: "left", background: "none", border: "none", padding: "6px 8px", margin: "-6px -8px", color: "inherit" }}>
      {body}
    </button>
  );
}

// ---- Seats by party, on one scale ----------------------------------------
// Every bar is drawn against the same 0 to 650 axis, labelled, with the
// majority line on it. Parties with only a seat or two are grouped, so the
// chart is about the parties that decide votes.


export function SeatsChart({ stats, onOpen }) {
  const reduce = useReducedMotion();
  const total = stats.total;
  const major = stats.majorityLine;
  const big = stats.seatsByParty.filter((r) => r.count >= 3);
  const small = stats.seatsByParty.filter((r) => r.count < 3);
  const rows = [
    ...big.map((r) => ({ parties: [r.party], key: r.party, label: r.coop ? `${r.party} (incl. Co-op)` : r.party, colour: partyColour(r.colour, COLORS.inkSoft), count: r.count, pct: r.pct, title: null })),
    ...(small.length ? [{ parties: small.map((r) => r.party), key: "others", label: `${small.length} smaller parties`, colour: COLORS.inkSoft, count: small.reduce((n, r) => n + r.count, 0), pct: (small.reduce((n, r) => n + r.count, 0) / total) * 100, title: small.map((r) => `${r.party} ${r.count}`).join(", ") }] : []),
  ];
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 12, marginBottom: 4 }}>
        <span />
        <div style={{ position: "relative", height: 18 }}>
          {ticks.map((t) => (
            <span key={t} style={{ position: "absolute", left: `${t * 100}%`, transform: t === 0 ? "none" : t === 1 ? "translateX(-100%)" : "translateX(-50%)", fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>
              {fmt(Math.round(total * t))}
            </span>
          ))}
        </div>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.inkSoft, textAlign: "right" }}>seats · share</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.key}
          role="button"
          tabIndex={0}
          className="nclick"
          aria-label={`${r.label}: ${r.count} seats. See the MPs`}
          onClick={(e) => onOpen(r, e)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(r, e);
            }
          }}
          title={r.title ?? `${r.label}: ${r.count} seats`}
          style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 12, alignItems: "center", padding: "5px 0" }}
        >
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
          <div style={{ position: "relative", height: 14, background: COLORS.paper, borderRadius: 4 }}>
            {[0.25, 0.75].map((t) => (
              <span key={t} aria-hidden="true" style={{ position: "absolute", left: `${t * 100}%`, top: 0, bottom: 0, borderLeft: `1px solid ${COLORS.hairline}` }} />
            ))}
            <motion.div
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${(r.count / total) * 100}%` }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.8, delay: Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: "100%", minWidth: 3, background: r.colour, borderRadius: "0 4px 4px 0" }}
            />
            <span aria-hidden="true" style={{ position: "absolute", left: `${(major / total) * 100}%`, top: -5, bottom: -5, borderLeft: `2px dashed ${COLORS.ink}`, opacity: 0.75 }} />
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <span style={{ ...numeric, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{fmt(r.count)}</span>
            <span style={{ ...numeric, fontSize: 12.5, color: COLORS.inkSoft }}> · {pct1(r.pct)}</span>
          </div>
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: COLUMNS, columnGap: 12, marginTop: 6 }}>
        <span />
        <div style={{ position: "relative", height: 16 }}>
          <span style={{ position: "absolute", left: `${(major / total) * 100}%`, transform: "translateX(-50%)", fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: COLORS.ink, whiteSpace: "nowrap" }}>{major} = majority</span>
        </div>
        <span />
      </div>
    </div>
  );
}

export function SeatsTable({ stats }) {
  const cell = { padding: "7px 10px", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.ink, borderBottom: `1px solid ${COLORS.hairline}`, textAlign: "right" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
        <thead>
          <tr>
            {["Party", "MPs", "Share of seats", "Women", "Share women"].map((h, i) => (
              <th key={h} style={{ ...cell, textAlign: i === 0 ? "left" : "right", fontWeight: 700, color: COLORS.inkSoft, fontSize: 11.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.seatsByParty.map((r) => (
            <tr key={r.party}>
              <td style={{ ...cell, textAlign: "left" }}>{r.party}</td>
              <td style={{ ...cell, ...numeric }}>{fmt(r.count)}</td>
              <td style={{ ...cell, ...numeric }}>{pct1(r.pct)}</td>
              <td style={{ ...cell, ...numeric }}>{fmt(r.women)}</td>
              <td style={{ ...cell, ...numeric }}>{pct1(r.womenPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Women: one dot per MP ------------------------------------------------
export function WomenWaffle({ women, total }) {
  const columns = 26;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} role="img" aria-label={`${women} of ${total} MPs are women`} style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 3.5 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={inView ? "waffle-dot" : undefined}
          style={{ aspectRatio: "1", borderRadius: "50%", background: i < women ? COLORS.accent : COLORS.hairline, opacity: inView ? undefined : 0, animationDelay: `${Math.floor(i / columns) * 22}ms` }}
        />
      ))}
    </div>
  );
}

// ---- Intakes: who arrived when, and for which party -----------------------
export function CohortChart({ cohorts, onOpen, note = "Coloured by the party each MP sits for today, not the one they arrived with." }) {
  const reduce = useReducedMotion();
  const totals = new Map();
  cohorts.forEach((c) => c.parties.forEach((p) => totals.set(p.party, (totals.get(p.party) ?? 0) + p.count)));
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p]) => p);
  const colourOf = new Map();
  cohorts.forEach((c) => c.parties.forEach((p) => colourOf.set(p.party, p.colour)));
  const max = Math.max(1, ...cohorts.map((c) => c.count));
  const HEIGHT = 190;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cohorts.length}, minmax(0, 1fr))`, gap: "0 10px", alignItems: "end" }}>
        {cohorts.map((c, ci) => {
          const segments = [...top.map((p) => ({ party: p, count: c.parties.find((x) => x.party === p)?.count ?? 0, colour: partyColour(colourOf.get(p), COLORS.inkSoft) })), { party: "Others", count: c.parties.filter((x) => !top.includes(x.party)).reduce((n, x) => n + x.count, 0), colour: COLORS.inkSoft }].filter((s) => s.count > 0);
          return (
            <button type="button" key={c.key} className="nclick" onClick={(e) => onOpen(c, e)} aria-label={`${c.label}: ${c.count} MPs. See the MPs`} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0, background: "none", border: "none", padding: "4px 0 6px", color: "inherit" }}>
              <div style={{ ...numeric, fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>{c.count}</div>
              <div style={{ height: HEIGHT, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <motion.div
                  initial={reduce ? false : { height: 0 }}
                  whileInView={{ height: `${(c.count / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: ci * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{ width: "100%", display: "flex", flexDirection: "column-reverse", gap: 1.5, borderRadius: "6px 6px 0 0", overflow: "hidden" }}
                >
                  {segments.map((s) => (
                    <div key={s.party} title={`${s.party}: ${s.count}`} style={{ flexGrow: s.count, flexBasis: 0, background: s.colour, minHeight: 2 }} />
                  ))}
                </motion.div>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.ink, marginTop: 8, textAlign: "center", lineHeight: 1.25 }}>{c.label}</div>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 16 }}>
        {[...top, "Others"].map((p) => (
          <span key={p} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p === "Others" ? COLORS.inkSoft : partyColour(colourOf.get(p), COLORS.inkSoft) }} />
            {p}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginTop: 8 }}>{note}</div>
    </div>
  );
}

export function Switches({ switchers, onOpen }) {
  if (switchers.transitions.length === 0) return <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No party changes recorded among current MPs.</div>;
  const max = Math.max(1, ...switchers.transitions.map((t) => t.count));
  return (
    <div>
      {switchers.transitions.map((t, i) => (
        <button type="button" className="nclick" onClick={(e) => onOpen(t, e)} key={`${t.from}-${t.to}`} title={t.names.join(", ")} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 90px", gap: 12, alignItems: "center", padding: "7px 4px", width: "100%", textAlign: "left", background: "none", color: "inherit", border: "none", borderRadius: 0, borderTop: i === 0 ? "none" : `1px solid ${COLORS.hairline}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>
              <strong>{t.from}</strong> <span style={{ color: COLORS.inkSoft }}>→</span> <strong>{t.to}</strong>
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.names.slice(0, 4).join(", ")}{t.names.length > 4 ? ` and ${t.names.length - 4} more` : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 7, background: COLORS.paper, borderRadius: 4 }}>
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${(t.count / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.06 }} style={{ height: "100%", background: "#E0367A", borderRadius: "0 4px 4px 0" }} />
            </div>
            <span style={{ ...numeric, fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{t.count}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

