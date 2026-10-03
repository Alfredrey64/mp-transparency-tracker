import { lazy, Suspense } from "react";
import { COLORS, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconChartBars } from "./icons";
import CommonsNumbers from "./CommonsNumbers";

// Parliament in Numbers has one tab for each House. The tab is part of the
// address (#/numbers and #/numbers/lords), so each can be linked to and the
// browser's back button moves between them. The Lords half loads only when
// its tab is opened.
const LordsNumbers = lazy(() => import("./LordsNumbers"));

const HOUSES = {
  commons: {
    label: "House of Commons",
    title: "The House of Commons, by the numbers",
    subtitle: "Who sits in the Commons right now, where they came from, and how safe their seats are. All worked out from live parliamentary records.",
    hash: "#/numbers",
  },
  lords: {
    label: "House of Lords",
    title: "The House of Lords, by the numbers",
    subtitle: "Who sits in the Lords right now, how they got there, and where they came from. All worked out from live parliamentary records.",
    hash: "#/numbers/lords",
  },
};

function HouseTabs({ active }) {
  return (
    <nav aria-label="Choose a House" style={{ display: "inline-flex", gap: 4, padding: 4, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 999, marginTop: 20 }}>
      {Object.entries(HOUSES).map(([key, h]) => {
        const on = key === active;
        return (
          <a
            key={key}
            href={h.hash}
            aria-current={on ? "page" : undefined}
            style={{
              fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, textDecoration: "none", padding: "8px 20px", borderRadius: 999,
              background: on ? COLORS.accent : "transparent", color: on ? "#fff" : COLORS.inkSoft, transition: "background-color 0.15s, color 0.15s",
            }}
          >
            {h.label}
          </a>
        );
      })}
    </nav>
  );
}

export default function ParliamentNumbers({ house, onNavigate }) {
  const active = house === "lords" ? "lords" : "commons";
  const h = HOUSES[active];
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconChartBars} kicker={`Public Record · Parliament in Numbers`} title={h.title} subtitle={h.subtitle} />
      <HouseTabs active={active} />
      <div style={{ marginTop: 18 }}>
        {active === "lords" ? (
          <Suspense fallback={<div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft }}>Loading…</div>}>
            <LordsNumbers onNavigate={onNavigate} />
          </Suspense>
        ) : (
          <CommonsNumbers onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}
