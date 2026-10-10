import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { partyColour } from "../lib/format";
import { searchSeats } from "../lib/constituency";
import { readRememberedSeat, rememberSeat, forgetSeat } from "../lib/rememberedMp";
import { PageHeader } from "./shared";
import { IconRoute, IconSearch } from "./icons";

const ACCENT = "#1FA97C";

function ActionButton({ children, onClick, disabled, primary = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, padding: "9px 16px", borderRadius: 999, cursor: disabled ? "not-allowed" : "pointer",
        border: `1px solid ${disabled ? COLORS.hairline : ACCENT}`, background: disabled ? "transparent" : primary ? ACCENT : `${ACCENT}14`,
        color: disabled ? COLORS.inkSoft : primary ? "#fff" : ACCENT, opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

// One step on the path. The numbered rail is a real sequence (each step
// builds on the last), which is what earns the numbers. The line sits
// behind the circles, never through them.
function Step({ n, title, last, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "40px minmax(0, 1fr)", gap: 16, position: "relative" }}>
      {!last && <div style={{ position: "absolute", left: 19, top: 40, bottom: 0, width: 2, background: COLORS.hairline, zIndex: 0 }} />}
      <div
        style={{
          position: "relative", zIndex: 1, width: 40, height: 40, borderRadius: "50%", background: COLORS.paperCard, border: `2px solid ${ACCENT}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontSize: 18, color: ACCENT,
        }}
      >
        {n}
      </div>
      <div style={{ paddingBottom: last ? 0 : 30 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, margin: "6px 0 6px" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

const body = { fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "0 0 12px", maxWidth: 620 };

export default function StartHere({ onNavigate, onNavigateForMp, onViewProfile }) {
  const [seats, setSeats] = useState(null);
  const [query, setQuery] = useState("");
  // Restored from the browser, so returning from a bill, a vote or a profile
  // keeps the MP chosen earlier instead of starting over.
  const [picked, setPicked] = useState(() => readRememberedSeat());
  const [mp, setMp] = useState(null);
  const [mpFailed, setMpFailed] = useState(false);

  useEffect(() => {
    import("../data/constituencies.json").then((m) => setSeats(m.default.constituencies)).catch(() => setSeats({}));
  }, []);

  const matches = useMemo(() => (seats ? searchSeats(seats, query, 6) : []), [seats, query]);

  // The full MP record behind the remembered or chosen seat.
  const memberId = picked?.mp?.memberId;
  useEffect(() => {
    if (memberId == null) return;
    let cancelled = false;
    supabase
      .from("politicians")
      .select("*")
      .eq("parliament_member_id", memberId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setMp(data ?? null);
        setMpFailed(!data);
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  function pick(seat) {
    rememberSeat(seat);
    setPicked(seat);
    setQuery("");
    setMp(null);
    setMpFailed(false);
  }

  function change() {
    forgetSeat();
    setPicked(null);
    setMp(null);
    setMpFailed(false);
  }

  const name = picked?.mp?.name;
  const ready = Boolean(mp);
  const goSeat = (seatName) => {
    window.location.hash = seatName ? `#/constituency/${encodeURIComponent(seatName)}` : "#/constituency";
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconRoute}
        kicker="Start here"
        title="From “who's my MP?” to “what are they up to?”"
        subtitle="Five steps, about five minutes, no prior knowledge needed. Pick your MP first and every step after it opens on them."
      />

      <div style={{ marginTop: 32 }}>
        <Step n={1} title="Find your MP">
          <p style={body}>Search by your constituency (the area you vote in) or by your MP's name.</p>

          {!picked && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
                  <IconSearch size={15} />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Gainsborough, or your MP's surname"
                  aria-label="Search for your constituency or MP"
                  style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 36px", fontFamily: FONT_BODY, fontSize: 14, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink }}
                />
              </div>
              {query.trim().length >= 2 && (
                <div style={{ marginTop: 8, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, overflow: "hidden" }}>
                  {seats === null && <div style={{ padding: "10px 14px", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>Loading…</div>}
                  {seats !== null && matches.length === 0 && <div style={{ padding: "10px 14px", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>No constituency or MP matches that.</div>}
                  {matches.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => pick(m)}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${COLORS.hairline}`, padding: "10px 14px", cursor: "pointer" }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: partyColour(m.mp?.colour, COLORS.inkSoft), flexShrink: 0 }} />
                      <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{m.name}</span>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{m.mp?.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {picked && (
            <div style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: 10, background: `${ACCENT}12`, border: `1px solid ${ACCENT}40`, borderRadius: 12, padding: "10px 14px" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: partyColour(picked.mp.colour, COLORS.inkSoft) }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink }}>
                <strong>{name}</strong>{picked.mp.party ? `, ${picked.mp.party}` : ""} · {picked.name}
              </span>
              <button
                type="button"
                onClick={change}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: ACCENT }}
              >
                Change
              </button>
            </div>
          )}
          {mpFailed && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#9C3B3B", marginTop: 8 }}>Couldn't load that MP's record just now. The other steps still work from the menu.</div>}
        </Step>

        <Step n={2} title="See what they've declared">
          <p style={body}>
            MPs must publish outside jobs, gifts, donations, shareholdings and trips. Each profile opens with a plain-English summary of all of it, shows where the money
            came from, then lists every entry underneath. A declaration is what the rules require. It isn't a sign anything is wrong.
          </p>
          <ActionButton disabled={!ready} onClick={() => onViewProfile?.(mp)}>{ready ? `Open ${name}'s profile` : "Pick your MP in step 1"}</ActionButton>
        </Step>

        <Step n={3} title="See how they vote">
          <p style={body}>
            Every recorded vote is listed, each with a note on what it actually was and what voting Aye or No meant. “Against party” means they voted against
            the majority of their own party, which isn't the same as breaking a whip.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <ActionButton disabled={!ready} onClick={() => onNavigateForMp?.("voting", mp)}>{ready ? `See ${name}'s votes` : "Pick your MP in step 1"}</ActionButton>
            <ActionButton primary={false} onClick={() => onNavigate?.("voting")}>Browse every bill and vote</ActionButton>
          </div>
        </Step>

        <Step n={4} title="See what they're asking ministers">
          <p style={body}>
            MPs put written questions to ministers, and the answers are on the record. What an MP keeps asking about is a good clue to what they actually care about,
            whether or not it makes the news.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <ActionButton disabled={!ready} onClick={() => onNavigateForMp?.("writtenQuestions", mp)}>{ready ? `See ${name}'s questions` : "Pick your MP in step 1"}</ActionButton>
            <ActionButton primary={false} onClick={() => onNavigate?.("topics")}>Search by topic instead</ActionButton>
          </div>
        </Step>

        <Step n={5} title="Look at your area" last>
          <p style={body}>
            How your constituency voted at the last election, how close it was, which petitions people near you have been signing, and how the area is doing on deprivation, house prices, pay and jobs.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <ActionButton disabled={!picked} onClick={() => goSeat(picked.name)}>{picked ? `See ${picked.name}` : "Pick your MP in step 1"}</ActionButton>
            <ActionButton primary={false} onClick={() => goSeat(null)}>Look up any constituency</ActionButton>
          </div>
        </Step>
      </div>

      <div style={{ marginTop: 40, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "18px 20px" }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.ink, margin: "0 0 8px" }}>Before you draw conclusions</h2>
        <ul style={{ margin: 0, paddingLeft: 20, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.65, color: COLORS.inkSoft }}>
          <li>Everything here comes from official public records. The Data &amp; Methodology page lists every source.</li>
          <li>The records show what was declared, voted or asked. They can't show why, and they can't show what isn't declared.</li>
          <li>Words with a dotted underline are explained when you hover or tap them, and the Jargon buster has all of them in one place.</li>
        </ul>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", marginTop: 12 }}>
          {[["howitworks", "How Parliament works"], ["answers", "Ask a question"], ["glossary", "Jargon buster"], ["methodology", "Where the data comes from"]].map(([key, label]) => (
            <button key={key} type="button" onClick={() => onNavigate?.(key)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: ACCENT }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
