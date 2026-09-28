import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { partyColour, formatDate } from "../lib/format";
import { getWatchlist, getLastChecked, setLastChecked } from "../lib/watchlist";
import { IconStar } from "./icons";

// First-ever visit has no "last checked" timestamp to compare against, so
// it falls back to a fixed lookback window rather than showing either
// nothing or an MP's entire history.
const DEFAULT_LOOKBACK_DAYS = 30;

function WatchlistEntryCard({ entry, onSelectPolitician }) {
  const { politician, interests, rebellions, news, changeCount } = entry;
  const color = partyColour(politician.party_colour, COLORS.inkSoft);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderTop: `4px solid ${color}`, borderRadius: 14, padding: 20 }}
    >
      <button
        onClick={() => onSelectPolitician?.(politician)}
        style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer", marginBottom: changeCount > 0 ? 14 : 6 }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.ink }}>{politician.name}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{politician.party}</span>
      </button>

      {changeCount === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>Nothing new since your last visit.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {interests.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                New declared interest{interests.length === 1 ? "" : "s"}
              </div>
              {interests.map((it, i) => (
                <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, marginBottom: 4, lineHeight: 1.5 }}>
                  {it.donor_name}
                  {it.value_amount ? <> — £{Math.round(it.value_amount).toLocaleString()}</> : ""}
                  <span style={{ color: COLORS.inkSoft, fontSize: 11.5 }}> · {formatDate(it.date_registered)}</span>
                </div>
              ))}
            </div>
          )}

          {rebellions.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: "#9C3B3B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Voted against their own party
              </div>
              {rebellions.map((v, i) => (
                <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, marginBottom: 4, lineHeight: 1.5 }}>
                  {v.title} <span style={{ color: COLORS.inkSoft, fontSize: 11.5 }}>· {formatDate(v.date)}</span>
                </div>
              ))}
            </div>
          )}

          {news.length > 0 && (
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                In the news
              </div>
              {news.map((n, i) => (
                <a
                  key={i}
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, marginBottom: 4, textDecoration: "none", lineHeight: 1.5 }}
                >
                  {n.headline} <span style={{ color: COLORS.accent, fontSize: 11.5 }}>↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function WatchlistDigest({ onSelectPolitician }) {
  const [watchlist] = useState(() => getWatchlist());
  const [previousCheck] = useState(() => getLastChecked());
  const [entries, setEntries] = useState(() => (watchlist.length === 0 ? [] : null));

  useEffect(() => {
    if (watchlist.length === 0) return;
    let cancelled = false;
    async function load() {
      const since = previousCheck ?? Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
      const sinceDate = new Date(since).toISOString().slice(0, 10);
      const ids = watchlist.map((p) => p.id);

      const [interestsRes, votesRes, newsRes] = await Promise.all([
        supabase
          .from("financial_interests")
          .select("politician_id, donor_name, value_amount, date_registered")
          .in("politician_id", ids)
          .not("value_amount", "is", null)
          .gte("date_registered", sinceDate),
        supabase
          .from("voting_records")
          .select("politician_id, title, date, voted_with_party_majority")
          .in("politician_id", ids)
          .eq("voted_with_party_majority", false)
          .gte("date", sinceDate),
        supabase
          .from("mp_news")
          .select("politician_id, headline, url, published_date")
          .in("politician_id", ids)
          .gte("published_date", sinceDate),
      ]);
      if (cancelled) return;

      const byId = new Map(watchlist.map((p) => [p.id, { politician: p, interests: [], rebellions: [], news: [] }]));
      for (const r of interestsRes.data ?? []) byId.get(r.politician_id)?.interests.push(r);
      for (const r of votesRes.data ?? []) byId.get(r.politician_id)?.rebellions.push(r);
      for (const r of newsRes.data ?? []) byId.get(r.politician_id)?.news.push(r);

      const list = [...byId.values()]
        .map((e) => ({ ...e, changeCount: e.interests.length + e.rebellions.length + e.news.length }))
        .sort((a, b) => b.changeCount - a.changeCount);

      setEntries(list);
      setLastChecked(Date.now());
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: PAGE_PADDING, maxWidth: 900, margin: "0 auto" }}>
      <PageHeader
        icon={IconStar}
        kicker="Public Record · Your Watchlist"
        title="What's changed for MPs you follow"
        subtitle={
          watchlist.length === 0
            ? "You're not following any MPs yet — tap the star on an MP's profile to add them here."
            : `New declared interests, votes against their own party, and news mentions since ${
                previousCheck ? formatDate(new Date(previousCheck).toISOString()) : "you started following them"
              }, for the ${watchlist.length} MP${watchlist.length === 1 ? "" : "s"} you follow.`
        }
      />

      {watchlist.length === 0 && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 20, lineHeight: 1.6, maxWidth: 560 }}>
          Nothing to show yet. Visit any MP's profile and tap the star next to their name to start following them —
          come back to this page any time to see what's changed since your last visit. This list lives only in this
          browser; there's no account and nothing is sent anywhere.
        </div>
      )}

      {watchlist.length > 0 && entries === null && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 20 }}>Checking for updates…</div>
      )}

      {entries && entries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
          {entries.map((e) => (
            <WatchlistEntryCard key={e.politician.id} entry={e} onSelectPolitician={onSelectPolitician} />
          ))}
        </div>
      )}
    </div>
  );
}
