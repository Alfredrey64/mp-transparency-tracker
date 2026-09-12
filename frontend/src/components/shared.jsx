import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { supabase } from "../supabaseClient";
import { stripHtml, formatDate } from "../lib/format";

export function PageHeader({ kicker = "Public Record · UK Parliament", title, subtitle, align = "left", size = "lg", maxWidth, icon: Icon }) {
  const isHero = size === "xl";
  return (
    <div style={{ marginBottom: isHero ? 0 : 28, maxWidth, textAlign: align }}>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <EyebrowLabel>{kicker}</EyebrowLabel>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.02, ease: "easeOut" }}
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: isHero ? "clamp(32px, 6vw, 56px)" : "clamp(26px, 4vw, 34px)",
          color: COLORS.ink,
          margin: "12px 0 0",
          lineHeight: 1.15,
          display: "flex",
          alignItems: "center",
          justifyContent: align === "center" ? "center" : "flex-start",
          gap: 14,
        }}
      >
        {Icon && (
          <motion.span
            initial={{ scale: 0.75, rotate: -6, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.04, ease: "backOut" }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: isHero ? 56 : 44,
              height: isHero ? 56 : 44,
              borderRadius: "50%",
              background: `${COLORS.brass}1c`,
              color: COLORS.brass,
              flexShrink: 0,
            }}
          >
            <Icon size={isHero ? 28 : 22} />
          </motion.span>
        )}
        <span>{title}</span>
      </motion.h1>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
        style={{
          transformOrigin: align === "center" ? "center" : "left",
          height: 3,
          width: isHero ? 72 : 52,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${COLORS.brass}, ${COLORS.brass}00)`,
          margin: align === "center" ? "14px auto 0" : "12px 0 0",
        }}
      />
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            fontFamily: FONT_BODY,
            fontSize: isHero ? 18 : 15,
            color: COLORS.inkSoft,
            marginTop: isHero ? 22 : 8,
            lineHeight: 1.6,
            maxWidth: isHero ? 620 : undefined,
            marginLeft: align === "center" ? "auto" : undefined,
            marginRight: align === "center" ? "auto" : undefined,
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

export function EyebrowLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.brass,
        fontVariant: "small-caps",
      }}
    >
      {children}
    </div>
  );
}

export function ParliamentSilhouette({ width = 200, opacity = 1, color = COLORS.ink }) {
  return (
    <svg width={width} viewBox="0 0 240 120" fill="none" style={{ opacity }}>
      <line x1="0" y1="112" x2="240" y2="112" stroke={color} strokeWidth="1.5" />
      <rect x="18" y="70" width="120" height="42" fill={color} />
      {[18, 30, 42, 54, 66, 78, 90, 102, 114, 126].map((x) => (
        <rect key={x} x={x} y="64" width="6" height="8" fill={color} />
      ))}
      <rect x="10" y="58" width="10" height="54" fill={color} />
      <polygon points="10,58 15,46 20,58" fill={color} />
      <rect x="150" y="30" width="26" height="82" fill={color} />
      <rect x="146" y="24" width="34" height="8" fill={color} />
      <polygon points="150,24 163,4 176,24" fill={color} />
      <circle cx="163" cy="46" r="7" fill={COLORS.paper} stroke={color} strokeWidth="2" />
      <line x1="163" y1="4" x2="163" y2="-6" stroke={color} strokeWidth="2" />
      <rect x="190" y="80" width="14" height="32" fill={color} />
      <polygon points="190,80 197,66 204,80" fill={color} />
    </svg>
  );
}

// Shared across the "Parliament" and "Government" stage panels on How
// Parliament Works — same layoutId, same fixed size in both places, so the
// FLIP transition is a clean translate/scale, not a stretch of mismatched content.
export function CommonsBadge({ size = 36 }) {
  return (
    <motion.div
      layout
      layoutId="commons-badge"
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: COLORS.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      }}
    >
      <ParliamentSilhouette width={size * 0.55} color="#fff" />
    </motion.div>
  );
}

export function SectionDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "14px 0" }}>
      <span style={{ width: 24, height: 1, background: COLORS.hairline }} />
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.brass }} />
      <span style={{ width: 24, height: 1, background: COLORS.hairline }} />
    </div>
  );
}

export function CardShell({ title, children }) {
  return (
    <div style={{ background: COLORS.paperCard, borderLeft: `1px solid ${COLORS.hairline}`, borderRight: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.brass}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(30,42,68,0.05)" }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function BiographyBox({ politician }) {
  const bio = stripHtml(politician.biography);
  return (
    <CardShell title="Biography">
      {bio ? (
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.ink, lineHeight: 1.65 }}>
          {bio}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No official biography published for this MP yet.
        </div>
      )}
    </CardShell>
  );
}

export function ContactRow({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 10.5, color: COLORS.brass, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink }}>{children}</div>
    </div>
  );
}

export function ContactBox({ politician }) {
  const hasContact = politician.parliamentary_address || politician.parliamentary_phone || politician.parliamentary_email;
  return (
    <CardShell title="Parliamentary Contact">
      {hasContact ? (
        <div>
          {politician.parliamentary_address && <ContactRow label="Address">{politician.parliamentary_address}</ContactRow>}
          {politician.parliamentary_phone && <ContactRow label="Phone">{politician.parliamentary_phone}</ContactRow>}
          {politician.parliamentary_email && (
            <ContactRow label="Email">
              <a href={`mailto:${politician.parliamentary_email}`} style={{ color: COLORS.ink }}>
                {politician.parliamentary_email}
              </a>
            </ContactRow>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No parliamentary contact details published for this MP yet.
        </div>
      )}
    </CardShell>
  );
}

export function CabinetRoleBox({ politician }) {
  return (
    <CardShell title="Cabinet Role">
      {politician.cabinet_role ? (
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: COLORS.ink }}>
            {politician.cabinet_role}
          </div>
          {politician.cabinet_role_start_date && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>
              Since {formatDate(politician.cabinet_role_start_date)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No current government post — this MP is a backbencher.
        </div>
      )}
    </CardShell>
  );
}

export function StandardsBox({ politician }) {
  const encodedName = encodeURIComponent(politician.name);
  return (
    <CardShell title="Standards & Investigations">
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 10 }}>
        To find out more click the following links
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <a
          href={`https://committees.parliament.uk/committee/62/standards/publications/`}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, fontWeight: 600 }}
        >
          Committee on Standards — published findings ↗
        </a>
        <a
          href={`https://www.parliament.uk/site-information/search/?q=${encodedName}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, fontWeight: 600 }}
        >
          Search parliament.uk for "{politician.name}" ↗
        </a>
      </div>
    </CardShell>
  );
}

// MPs sitting under these labels don't belong to a whipped party, so "voted
// with their own party's majority" isn't a meaningful comparison for them.
const NO_PARTY_MAJORITY_CONCEPT = ["independent", "speaker"];

export function VotingSummaryBox({ politician }) {
  const [votes, setVotes] = useState(null);
  const hasPartyMajorityConcept = !NO_PARTY_MAJORITY_CONCEPT.includes((politician.party ?? "").toLowerCase());

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("voting_records")
        .select("title, date, voted_aye, voted_with_party_majority, source_url")
        .eq("politician_id", politician.id)
        .order("date", { ascending: false })
        .limit(4);
      setVotes(data ?? []);
    }
    load();
  }, [politician.id]);

  if (votes === null) {
    return (
      <CardShell title="Voting Record">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>
      </CardShell>
    );
  }

  if (votes.length === 0) {
    return (
      <CardShell title="Voting Record">
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No recorded votes found for this MP in the tracked period.
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell title="Voting Record">
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 10 }}>
        Their {votes.length} most recent recorded vote{votes.length === 1 ? "" : "s"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {votes.map((v, i) => {
          const againstParty = hasPartyMajorityConcept && v.voted_with_party_majority === false;
          return (
            <div
              key={i}
              style={{
                borderLeft: `3px solid ${againstParty ? "#9C3B3B" : COLORS.hairline}`,
                paddingLeft: 10,
                paddingBottom: i < votes.length - 1 ? 8 : 0,
                borderBottom: i < votes.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
              }}
            >
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.4 }}>{v.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                <span
                  style={{
                    fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                    padding: "2px 7px", borderRadius: 999,
                    background: v.voted_aye ? "#E4EEE7" : "#F3E4E2",
                    color: v.voted_aye ? "#2F6F4E" : "#9C3B3B",
                  }}
                >
                  {v.voted_aye ? "Aye" : "No"}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft }}>{formatDate(v.date)}</span>
                {againstParty && (
                  <span
                    style={{
                      fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10, textTransform: "uppercase",
                      letterSpacing: "0.04em", padding: "2px 7px", borderRadius: 999,
                      background: "#F3E4E2", color: "#9C3B3B",
                    }}
                  >
                    Against party
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: COLORS.inkSoft }}>
        See the "Voting Records" tab in the sidebar for their full history.
      </div>
    </CardShell>
  );
}

export function NewsBox({ politician }) {
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("mp_news")
        .select("headline, source, url, published_date")
        .eq("politician_id", politician.id)
        .order("published_date", { ascending: false });
      setArticles(data ?? []);
    }
    load();
  }, [politician.id]);

  return (
    <CardShell title="In the News">
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, opacity: 0.8, marginBottom: 10, lineHeight: 1.5 }}>
        A daily headline skim for this MP's name, not a verified fact-check — a same-named person or a passing mention can
        occasionally slip through.
      </div>
      {articles === null && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}
      {articles?.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>
          No recent news coverage found for this MP in the last two weeks.
        </div>
      )}
      {articles && articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {articles.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block", textDecoration: "none", paddingBottom: i < articles.length - 1 ? 10 : 0,
                borderBottom: i < articles.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
              }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14.5, color: COLORS.ink, lineHeight: 1.35 }}>{a.headline}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.brass, marginTop: 3, fontWeight: 600 }}>
                {a.source} · {formatDate(a.published_date)} ↗
              </div>
            </a>
          ))}
        </div>
      )}
    </CardShell>
  );
}

export function PlaceholderBox({ title, note }) {
  return (
    <div style={{ background: COLORS.paperCard, borderLeft: `1px solid ${COLORS.hairline}`, borderRight: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}`, borderTop: `3px solid ${COLORS.brass}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(30,42,68,0.05)" }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 15, color: COLORS.ink, marginBottom: 5 }}>
        {title}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>{note}</div>
    </div>
  );
}

export { FONT_DISPLAY, FONT_BODY, FONT_MONO, COLORS };
