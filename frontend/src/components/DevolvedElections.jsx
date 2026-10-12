import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle } from "../lib/onsStyles";
import { scrollRegion } from "../lib/a11y";
import { NATIONS, PARTIES, devolvedFacts } from "../data/devolvedElections";
import Hemicycle from "./Hemicycle";
import ShareButton from "./ShareButton";
import { CountUp, Reveal } from "./Motion";
import { devolvedShareSpec } from "../lib/shareSpecs";

// Elections to the Scottish Parliament, the Senedd and the Northern Ireland Assembly since each began: seats by party, turnout and who led the
// government. The three bodies elect their members in different ways, which is why each has its own short explanation.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const dateText = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const nameOf = (k) => PARTIES[k].short ?? PARTIES[k].label;

function Strip({ nation, selected, onPick }) {
  return (
    <div {...scrollRegion("Elections, pick one")} role="group" aria-label={`Choose a ${nation.body} election`} style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 4px 8px", marginTop: 6 }}>
      {nation.elections.map((x, i) => {
        const on = x.id === selected;
        const total = x.total ?? nation.seats;
        const f = devolvedFacts(nation, x);
        const colour = PARTIES[f.leader].colour;
        return (
          <button
            key={x.id}
            type="button"
            aria-pressed={on}
            aria-label={`${x.id}: ${PARTIES[f.leader].label} largest with ${f.leaderSeats} seats`}
            onClick={() => onPick(x.id)}
            className="ge-col ge-fadein"
            style={{ animationDelay: `${i * 45}ms`, flex: "1 0 52px", maxWidth: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "7px 4px 8px", borderRadius: 12, cursor: "pointer", background: on ? `color-mix(in srgb, ${colour} 14%, ${COLORS.paperCard})` : "transparent", border: `1.5px solid ${on ? colour : "transparent"}`, color: COLORS.ink }}
          >
            <span aria-hidden="true" style={{ display: "flex", flexDirection: "column-reverse", width: 26, height: 74, borderRadius: 6, overflow: "hidden", background: COLORS.paper }}>
              {nation.parties.filter((k) => x.seats[k]).map((k) => <span key={k} style={{ height: `${(x.seats[k] / total) * 100}%`, background: PARTIES[k].colour, minHeight: 1 }} />)}
            </span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: on ? 700 : 500 }}>{x.id}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function DevolvedElections({ item, onPick }) {
  const [nationKey, electionId] = String(item ?? "").split("/");
  const nation = NATIONS.find((n) => n.key === nationKey) ?? NATIONS[0];
  const e = nation.elections.find((x) => x.id === electionId) ?? nation.elections[nation.elections.length - 1];
  const f = devolvedFacts(nation, e);
  const ni = nation.key === "ni";
  const parties = nation.parties.filter((k) => e.seats[k]).map((k) => ({ key: k, colour: PARTIES[k].colour, count: e.seats[k], name: nameOf(k) }));
  const lead = PARTIES[f.leader];
  const rows = Object.entries(e.seats).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div role="group" aria-label="Choose a nation" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 10, marginTop: 10 }}>
        {NATIONS.map((n) => {
          const on = n.key === nation.key;
          return (
            <button
              key={n.key}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(`${n.key}/${n.elections[n.elections.length - 1].id}`)}
              className="ge-tab"
              style={{ textAlign: "left", cursor: "pointer", padding: "13px 16px", borderRadius: 16, border: `1.5px solid ${on ? n.colour : COLORS.hairline}`, background: on ? n.colour : COLORS.paperCard, color: on ? "#fff" : COLORS.ink }}
            >
              <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700 }}>{n.name}</span>
              <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, marginTop: 2, opacity: on ? 0.95 : 1, color: on ? "#fff" : COLORS.inkSoft }}>{n.body}, {n.elections.length} elections</span>
            </button>
          );
        })}
      </div>

      <Strip nation={nation} selected={e.id} onPick={(id) => onPick(`${nation.key}/${id}`)} />

      <Reveal key={`${nation.key}${e.id}`} as="section" aria-labelledby="h-dv-result" style={{ ...card, marginTop: 8, borderTop: `5px solid ${lead.colour}`, background: `linear-gradient(155deg, color-mix(in srgb, ${lead.colour} 13%, ${COLORS.paperCard}) 0%, ${COLORS.paperCard} 58%)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, margin: 0 }}>{dateText(e.date)}</p>
          <ShareButton filename={`${nation.key}-${e.id}-election`} getSpec={() => devolvedShareSpec({ nation, e, facts: f, parties: rows.map(([k, n]) => ({ label: PARTIES[k].label, seats: n, colour: PARTIES[k].colour })), link: window.location.href })} />
        </div>
        <h2 id="h-dv-result" style={{ ...cardTitle, fontSize: "clamp(22px, 4.2vw, 32px)", lineHeight: 1.2, marginTop: 4 }}>
          {nation.body} {e.id}: {ni ? `${lead.label} was the largest party` : f.majority ? `${lead.label} won a majority` : `no party won a majority`}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 16 }}>
          {[
            [f.leaderSeats, "", `${lead.short ?? lead.label} seats`, lead.colour, true],
            [f.total, "", ni ? "seats in all" : `seats, ${f.needed} for a majority`, "#7A5AF0", false],
            [e.turnout, "%", "turnout", "#0E9AA7", false],
          ].map(([n, suffix, label, c, solid]) => (
            <div key={label} style={{ padding: "12px 15px", borderRadius: 15, background: solid ? c : COLORS.paper, border: solid ? "none" : `1px solid ${COLORS.hairline}`, borderLeft: solid ? "none" : `4px solid ${c}`, color: solid ? "#fff" : COLORS.ink }}>
              <div style={{ ...numeric, fontSize: "clamp(28px, 7vw, 40px)", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em" }}><CountUp value={n} decimals={suffix === "%" ? 1 : 0} suffix={suffix} /></div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 5, color: solid ? "#fff" : COLORS.inkSoft }}>{label}</div>
            </div>
          ))}
        </div>
        <p style={para}>
          {!ni && (f.majority ? `${lead.label} won ${f.leaderSeats} of the ${f.total} seats. ` : `${lead.label} came first with ${f.leaderSeats} of the ${f.total} seats, ${f.shortBy} short of a majority. `)}
          <strong style={{ color: COLORS.ink }}>Led by: </strong>{e.led}.{e.note ? ` ${e.note}` : ""}
        </p>
        <div style={{ marginTop: 14 }}>
          <Hemicycle replayKey={`${nation.key}${e.id}`} parties={parties} label={`The ${f.total} seats after the ${e.id} ${nation.body} election: ${parties.map((p) => `${PARTIES[p.key].label} ${p.count}`).join(", ")}`} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14, marginTop: 14 }}>
          <caption style={{ position: "absolute", left: -9999 }}>Seats by party, {nation.body} {e.id}</caption>
          <thead>
            <tr style={{ color: COLORS.inkSoft, textAlign: "right", fontSize: 12.5 }}>
              <th scope="col" style={{ textAlign: "left", fontWeight: 600, padding: "6px 0" }}>Party</th>
              <th scope="col" style={{ fontWeight: 600, padding: "6px 0" }}>Seats</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, n]) => (
              <tr key={k} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                <th scope="row" style={{ textAlign: "left", fontWeight: 600, color: COLORS.ink, padding: "8px 0" }}>
                  <span aria-hidden="true" style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: PARTIES[k].colour, marginRight: 8 }} />
                  {PARTIES[k].label}
                </th>
                <td style={{ ...numeric, textAlign: "right", color: COLORS.ink, fontWeight: 700 }}>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {e.newSystem && <p style={{ ...para, marginTop: 14 }}>2026 was the first Senedd election under the new system, with 96 members instead of 60, so seat numbers are not directly comparable with earlier years.</p>}
        {ni && e.id === "2003" && <p style={{ ...para, marginTop: 14 }}>The Assembly was suspended from October 2002, and the 2003 election was held while it was suspended.</p>}
        <p style={{ ...para, fontSize: 12.5, marginTop: 12 }}>
          Seats are as won at the election. Turnout is for the constituency vote where there are two votes, and sources differ by a few tenths of a point in places. Independents are shown together. Source: each parliament's published results, as listed by Wikipedia; seat totals checked to add up to the size of the chamber.
        </p>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-dv-system" style={{ ...card, marginTop: 18 }}>
        <h2 id="h-dv-system" style={cardTitle}>How {nation.name} elects its {nation.body === "Senedd" ? "Senedd" : nation.body === "Scottish Parliament" ? "Parliament" : "Assembly"}</h2>
        <p style={para}>{nation.system}</p>
        <p style={para}>These systems differ from the one used for the House of Commons, where the candidate with the most votes in each seat wins. Under first past the post a party can win many more seats than its share of the votes. The systems used here are designed to bring seats closer to votes.</p>
      </Reveal>
    </div>
  );
}
