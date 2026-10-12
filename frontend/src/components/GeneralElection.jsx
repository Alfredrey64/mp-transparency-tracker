import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconCabinet, IconHexMap, IconVote } from "./icons";
import GeneralElection2024 from "./GeneralElection2024";
import ElectionHistory from "./ElectionHistory";
import GovernmentsTab from "./GovernmentsTab";

// General elections: the 2024 result, every election since 1945, and the governments that followed them. The address carries the tab and the
// item picked (#/generalElection/history/1997, #/generalElection/governments/thatcher) so any view can be shared.

const TABS = [
  { key: "2024", label: "2024 result", blurb: "Seats, votes and the map", icon: IconVote, colour: "#7A5AF0" },
  { key: "history", label: "Past elections", blurb: "Every result since 1945", icon: IconHexMap, colour: "#0E9AA7" },
  { key: "governments", label: "Governments", blurb: "Promises, changes, figures", icon: IconCabinet, colour: "#C7871A" },
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
      <div role="tablist" aria-label="General elections sections" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 168px), 1fr))", gap: 10, margin: "24px 0 6px" }}>
        {TABS.map((t, i) => {
          const active = nav.tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              id={`ge-tab-${t.key}`}
              aria-selected={active}
              aria-controls="ge-panel"
              type="button"
              className="ge-tab ge-pop"
              onClick={() => go(t.key)}
              style={{
                animationDelay: `${i * 70}ms`,
                display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", padding: "13px 16px", borderRadius: 16,
                border: `1.5px solid ${active ? t.colour : COLORS.hairline}`,
                background: active ? `color-mix(in srgb, ${t.colour} 13%, ${COLORS.paperCard})` : COLORS.paperCard,
                boxShadow: active ? `0 10px 24px -14px ${t.colour}` : "none",
                color: COLORS.ink,
              }}
            >
              <span aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: active ? t.colour : `color-mix(in srgb, ${t.colour} 16%, transparent)`, color: active ? "#fff" : `color-mix(in srgb, ${t.colour} 70%, ${COLORS.ink})`, transition: "background 0.25s, color 0.25s" }}>
                <Icon size={19} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 700, lineHeight: 1.2 }}>{t.label}</span>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{t.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div key={nav.tab} className="ge-fade" role="tabpanel" id="ge-panel" aria-labelledby={`ge-tab-${nav.tab}`} style={{ fontFamily: FONT_BODY }}>
        {nav.tab === "2024" && <GeneralElection2024 />}
        {nav.tab === "history" && <ElectionHistory electionId={nav.item} onPick={(id) => go("history", id)} />}
        {nav.tab === "governments" && <GovernmentsTab id={nav.item} onSelect={(id) => go("governments", id)} onOpenElection={(id) => { go("history", id); window.scrollTo({ top: 0 }); }} />}
      </div>
    </div>
  );
}
