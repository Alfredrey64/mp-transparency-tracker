import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { formatDate } from "../lib/format";
import { IconPulse, IconCoin, IconBills, IconInfluence, IconPetition } from "./icons";

const FEED_TYPES = {
  donation: { icon: IconCoin, color: "#B5533C", label: "Declared interest" },
  bill: { icon: IconBills, color: "#9C6B30", label: "Bill update" },
  gift: { icon: IconInfluence, color: "#6E4B6E", label: "Ministerial gift" },
  petition: { icon: IconPetition, color: "#3F7D5C", label: "Petition response" },
};

function FeedItem({ item, index }) {
  const meta = FEED_TYPES[item.type];
  const Icon = meta.icon;
  const clickable = item.onClick != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03 }}
      onClick={item.onClick}
      style={{
        display: "flex", gap: 12, padding: "14px 16px", borderRadius: 12,
        background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${meta.color}`,
        cursor: clickable ? "pointer" : "default",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: 32, height: 32, borderRadius: 9, background: `${meta.color}14`, color: meta.color }}>
        <Icon size={16} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: meta.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {meta.label}
          </span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.inkSoft, flexShrink: 0 }}>{formatDate(item.date)}</span>
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, color: COLORS.ink, lineHeight: 1.35 }}>{item.title}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{item.detail}</div>
      </div>
    </motion.div>
  );
}

export default function RecentActivity({ onSelectPolitician }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    async function load() {
      const [donationsRes, billsRes, giftsRes, petitionsRes] = await Promise.all([
        supabase
          .from("financial_interests")
          .select("id, summary, value_amount, date_registered, donor_name, politicians(id, name, party_colour, constituency, thumbnail_url, party, cabinet_role)")
          .not("value_amount", "is", null)
          .order("date_registered", { ascending: false })
          .order("id", { ascending: false })
          .limit(10),
        supabase
          .from("bills")
          .select("bill_id, short_title, current_stage, last_updated, sponsoring_department")
          .not("last_updated", "is", null)
          .order("last_updated", { ascending: false })
          .limit(8),
        supabase
          .from("ministerial_gifts")
          .select("id, department, kind, date_or_period, description, value_amount, politicians(id, name, party_colour, constituency, thumbnail_url, party, cabinet_role)")
          .order("date_or_period", { ascending: false })
          .limit(8),
        supabase
          .from("petitions")
          .select("id, action, government_responded_at, signature_count, url")
          .not("government_responded_at", "is", null)
          .order("government_responded_at", { ascending: false })
          .limit(6),
      ]);

      const donations = (donationsRes.data ?? []).map((d) => ({
        type: "donation",
        date: d.date_registered,
        title: d.politicians?.name ?? "Unknown MP",
        detail: `${d.donor_name ?? d.summary}${d.value_amount ? ` · £${Number(d.value_amount).toLocaleString()}` : ""}`,
        onClick: d.politicians ? () => onSelectPolitician?.(d.politicians) : null,
      }));
      const bills = (billsRes.data ?? []).map((b) => ({
        type: "bill",
        date: b.last_updated,
        title: b.short_title,
        detail: `${b.current_stage ?? "Stage update"}${b.sponsoring_department ? ` · ${b.sponsoring_department}` : ""}`,
      }));
      const gifts = (giftsRes.data ?? []).map((g) => ({
        type: "gift",
        date: g.date_or_period,
        title: g.politicians?.name ?? "Minister",
        detail: `${g.description ?? g.kind}${g.department ? ` · ${g.department}` : ""}`,
        onClick: g.politicians ? () => onSelectPolitician?.(g.politicians) : null,
      }));
      const petitions = (petitionsRes.data ?? []).map((p) => ({
        type: "petition",
        date: p.government_responded_at,
        title: p.action,
        detail: `Government responded · ${p.signature_count?.toLocaleString() ?? "?"} signatures`,
      }));

      const all = [...donations, ...bills, ...gifts, ...petitions]
        .filter((i) => i.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setItems(all);
    }
    load();
  }, [onSelectPolitician]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconPulse}
        kicker="Public Record · What's Changed"
        title="What's changed recently"
        subtitle="The most recent declared interests, bill stage changes, ministerial gifts, and government petition responses on this site, newest first."
      />

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        {items === null && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>
        )}
        {items?.length === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Nothing to show yet.</div>
        )}
        {items?.map((item, i) => (
          <FeedItem key={`${item.type}-${i}`} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}
