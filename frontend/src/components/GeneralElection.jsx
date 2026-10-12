import { useState } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconVote } from "./icons";
import GeneralElection2024 from "./GeneralElection2024";
import ElectionHistory from "./ElectionHistory";
import GovernmentsTab from "./GovernmentsTab";

// General elections: the 2024 result, every election since 1945, and the governments that followed them. The address carries the tab and the
// item picked (#/generalElection/history/1997, #/generalElection/governments/thatcher) so any view can be shared.

const TABS = [
  { key: "2024", label: "2024 result" },
  { key: "history", label: "Past elections" },
  { key: "governments", label: "Governments since 1945" },
];

function parse(param) {
  const [tab, item] = String(param ?? "").split("/");
  return { tab: TABS.some((t) => t.key === tab) ? tab : "2024", item: item || null };
}

export default function GeneralElection({ param }) {
  const [nav, setNav] = useState(() => parse(param));
  const [seen, setSeen] = useState(param);
  if (param !== seen) {
    setSeen(param);
    setNav(parse(param));
  }

  function go(tab, item = null) {
    setNav({ tab, item });
    window.history.replaceState(null, "", `#/generalElection${tab === "2024" ? "" : `/${tab}${item ? `/${item}` : ""}`}`);
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconVote}
        kicker="Elections"
        title="General elections"
        subtitle="Who won in 2024 and why, how every election since 1945 went, and what the governments that followed promised and changed."
      />

      <div role="tablist" aria-label="General elections sections" style={{ display: "flex", gap: 2, margin: "22px 0 4px", borderBottom: `1px solid ${COLORS.hairline}`, overflowX: "auto" }}>
        {TABS.map((t) => {
          const active = nav.tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              id={`ge-tab-${t.key}`}
              aria-selected={active}
              aria-controls="ge-panel"
              type="button"
              className="seat-tab"
              onClick={() => go(t.key)}
              style={{ position: "relative", background: "none", border: "none", padding: "11px 14px", flexShrink: 0, cursor: "pointer", fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: active ? COLORS.ink : COLORS.inkSoft }}
            >
              {t.label}
              {active && <motion.span layoutId="ge-tab" style={{ position: "absolute", left: 10, right: 10, bottom: -1, height: 3, borderRadius: 3, background: COLORS.accent }} />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="ge-panel" aria-labelledby={`ge-tab-${nav.tab}`} style={{ fontFamily: FONT_BODY }}>
        {nav.tab === "2024" && <GeneralElection2024 />}
        {nav.tab === "history" && <ElectionHistory electionId={nav.item} onPick={(id) => go("history", id)} />}
        {nav.tab === "governments" && <GovernmentsTab id={nav.item} onSelect={(id) => go("governments", id)} onOpenElection={(id) => { go("history", id); window.scrollTo({ top: 0 }); }} />}
      </div>
    </div>
  );
}
