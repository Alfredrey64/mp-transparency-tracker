import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING, readable, chip } from "../theme";
import { partyColour } from "../lib/format";
import { PageHeader } from "./shared";
import { BiographyBox, ContactBox, CabinetRoleBox, VotingSummaryBox, RebellionRateBox, RecentActivityBox, NewsBox } from "./MpCards";
import { IconPin, IconSearch } from "./icons";

const STORAGE_KEY = "mp-transparency-my-postcode";

function Avatar({ url, name, color, size = 84 }) {
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          ...chip(color), fontFamily: FONT_DISPLAY, fontSize: size * 0.34, fontWeight: 600,
        }}
      >
        {name?.split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
      </div>
    );
  }
  return (
    <img loading="lazy" decoding="async"
      src={url}
      alt=""
      onError={() => setErrored(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", background: COLORS.paperCard, border: `2px solid ${COLORS.paperCard}`, boxShadow: `0 0 0 2px ${color}55` }}
    />
  );
}

function PostcodeForm({ onFound, initialError }) {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ?? null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const data = await res.json();
      if (!res.ok || data.status !== 200) {
        setError("Couldn't find that postcode. Please check that it is a valid UK postcode.");
        setLoading(false);
        return;
      }
      const constituency = data.result.parliamentary_constituency;
      const { data: matches } = await supabase.from("politicians").select("*").eq("constituency", constituency).limit(1);
      if (!matches?.[0]) {
        setError(`Found the constituency (${constituency}) but couldn't match it to a current MP. Try Browse MPs instead.`);
        setLoading(false);
        return;
      }
      localStorage.setItem(STORAGE_KEY, postcode.trim());
      onFound(matches[0]);
    } catch {
      setError("Something went wrong looking that up. Try again in a moment.");
    }
    setLoading(false);
  }

  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, boxShadow: `var(--shadow-1), inset 0 4px 0 ${COLORS.accent}`, borderRadius: 16, padding: "28px clamp(18px, 4vw, 32px)", maxWidth: 480, margin: "24px auto 0" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${COLORS.accent}14`, color: COLORS.accentText, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconPin size={22} />
        </div>
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, textAlign: "center", lineHeight: 1.6, marginTop: 0 }}>
        Enter your postcode to pull everything this site tracks about your own MP into one place.
      </p>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
            <IconSearch size={14} />
          </span>
          <input
            value={postcode}
            aria-label="Your postcode"
            autoComplete="postal-code"
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. SW1A 0AA"
            style={{
              width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 34px", fontFamily: FONT_BODY, fontSize: 14,
              border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paper, color: COLORS.ink,
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: "#fff", background: COLORS.accent,
            border: "none", borderRadius: 10, padding: "11px 20px", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, flexShrink: 0,
          }}
        >
          {loading ? "Searching…" : "Find my MP"}
        </button>
      </form>
      {error && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: readable("#9C3B3B"), marginTop: 12, textAlign: "center" }}>{error}</div>
      )}
      <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.inkSoft, textAlign: "center", marginTop: 14, marginBottom: 0 }}>
        Only saved in your own browser, to skip this step next time, never sent anywhere or seen by us. See Privacy Policy.
      </p>
    </div>
  );
}

function MPDashboard({ politician, onForget, onViewFullProfile }) {
  const color = partyColour(politician.party_colour, COLORS.inkSoft);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <section className="my-mp-card glow" aria-label="Your MP" style={{ "--k": color }}>
        <span aria-hidden="true" className="my-mp-bar" />
        <Avatar url={politician.thumbnail_url} name={politician.name} color={color} size={112} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.inkSoft }}>Your MP</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700, letterSpacing: "-0.02em", color: COLORS.ink, lineHeight: 1.1, margin: "2px 0 0" }}>{politician.name}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", marginTop: 10, fontFamily: FONT_BODY, fontSize: 16, color: COLORS.ink }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 999, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              {politician.party}
            </span>
            <span style={{ color: COLORS.inkSoft }}>{politician.constituency}</span>
          </div>
          {politician.cabinet_role && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 700, color: COLORS.accentText, marginTop: 10 }}>{politician.cabinet_role}</div>
          )}
        </div>
        <div className="my-mp-actions">
          <button type="button" className="btn btn-primary" onClick={() => onViewFullProfile(politician)}>Full profile</button>
          <button type="button" className="btn btn-secondary" onClick={onForget}>Not your MP?</button>
        </div>
      </section>

      <div className="my-mp-cols">
        <div className="my-mp-col">
          <RebellionRateBox politician={politician} />
          <CabinetRoleBox politician={politician} />
          <BiographyBox politician={politician} />
          <ContactBox politician={politician} />
        </div>
        <div className="my-mp-col">
          <VotingSummaryBox politician={politician} />
          <RecentActivityBox politician={politician} />
          <NewsBox politician={politician} />
        </div>
      </div>
    </motion.div>
  );
}

export default function MyMP({ onViewProfile }) {
  const [politician, setPolitician] = useState(null);
  const [checkingSaved, setCheckingSaved] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setCheckingSaved(false);
        return;
      }
      try {
        const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(saved)}`);
        const data = await res.json();
        if (res.ok && data.status === 200) {
          const { data: matches } = await supabase.from("politicians").select("*").eq("constituency", data.result.parliamentary_constituency).limit(1);
          if (matches?.[0]) setPolitician(matches[0]);
        }
      } catch {
        // Silently fall through to the postcode form — a stale save shouldn't be a hard error.
      }
      setCheckingSaved(false);
    })();
  }, []);

  function forget() {
    localStorage.removeItem(STORAGE_KEY);
    setPolitician(null);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconPin}
        kicker="My MP"
        title="Your MP in one place"
        subtitle="Declared interests, voting record, rebellion rate and recent activity for whoever represents you. Found by postcode and remembered only on this device."
      />

      <AnimatePresence mode="wait">
        {checkingSaved ? (
          <div key="checking" style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, textAlign: "center", marginTop: 40 }}>Loading…</div>
        ) : politician ? (
          <MPDashboard key="dashboard" politician={politician} onForget={forget} onViewFullProfile={onViewProfile} />
        ) : (
          <PostcodeForm key="form" onFound={setPolitician} />
        )}
      </AnimatePresence>
    </div>
  );
}
