import { COLORS, FONT_BODY, readable } from "../theme";
import { formatDate } from "../lib/format";
import { stagesFor, currentIndex, stageTerm, paceOf } from "../lib/billStagesView";
import { GlossaryTerm } from "./GlossaryTerm";

// A bill's real journey so far: each stage it has been through in each House with the days it was sat on, from Parliament's Bills API (data/billStages.json, kept up to date by the
// daily workflow). The stage it is at now is marked, and the ones after it are shown as still to come. Pictures of the route a bill takes in general are in "How a bill becomes
// law"; this is this bill's own.
const HOUSE = { Commons: COLORS.commonsGreen, Lords: COLORS.garnet };

const when = (dates) => {
  if (!dates.length) return null;
  if (dates.length === 1) return formatDate(dates[0]);
  return `${formatDate(dates[0])} to ${formatDate(dates.at(-1))}, ${dates.length} days`;
};

export default function BillStages({ bill }) {
  const stages = stagesFor(bill);
  if (!stages || !stages.length) return null;
  const now = currentIndex(stages, bill);
  const pace = paceOf(stages, bill, new Date().toISOString().slice(0, 10));
  return (
    <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: pace ? 4 : 8 }}>Its journey so far</div>
      {pace && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5, marginBottom: 10 }}>
          {pace.finished
            ? <>From {formatDate(pace.start)} to {formatDate(pace.last.date)}: <b style={{ color: COLORS.ink }}>{pace.days} {pace.days === 1 ? "day" : "days"}</b>.</>
            : <>First recorded {formatDate(pace.start)}, <b style={{ color: COLORS.ink }}>{pace.days} {pace.days === 1 ? "day" : "days"} ago</b>. Latest recorded day: {pace.last.stage}, {formatDate(pace.last.date)}.</>}
        </div>
      )}
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 0 }}>
        {stages.map((s, i) => {
          const state = now < 0 ? "done" : i < now ? "done" : i === now ? "now" : "next";
          const colour = HOUSE[s.house] ?? COLORS.inkSoft;
          const text = when(s.dates);
          return (
            <li key={`${s.house}-${s.stage}-${i}`} aria-current={state === "now" ? "step" : undefined} style={{ display: "grid", gridTemplateColumns: "20px minmax(0, 1fr)", gap: 10, position: "relative", paddingBottom: i === stages.length - 1 ? 0 : 10 }}>
              <span aria-hidden="true" style={{ display: "grid", justifyItems: "center", position: "relative" }}>
                <i style={{ width: 12, height: 12, marginTop: 3, borderRadius: "50%", boxSizing: "border-box", background: state === "done" ? colour : state === "now" ? COLORS.paperCard : "transparent", border: `2px ${state === "next" ? "dashed" : "solid"} ${colour}`, boxShadow: state === "now" ? `0 0 0 4px ${colour}33` : "none" }} />
                {i < stages.length - 1 && <u style={{ position: "absolute", top: 17, bottom: -13, width: 2, background: state === "done" ? `${colour}66` : COLORS.hairline, textDecoration: "none" }} />}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.45, color: state === "next" ? COLORS.inkSoft : COLORS.ink }}>
                <b style={{ fontWeight: 700 }}><GlossaryTerm term={stageTerm(s.stage)}>{s.stage}</GlossaryTerm></b>
                <span style={{ color: readable(colour), fontWeight: 600, marginLeft: 8, fontSize: 12 }}>{s.house}</span>
                {state === "now" && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, color: readable(colour), background: `${colour}1a`, padding: "1px 8px", borderRadius: 999 }}>Now</span>}
                <span style={{ display: "block", fontSize: 12.5, color: COLORS.inkSoft }}>
                  {text ?? (state === "next" ? "Still to come" : "No day recorded")}
                  <span className="sr-only">{state === "done" ? " (done)" : state === "now" ? " (where it is now)" : " (still to come)"}</span>
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
