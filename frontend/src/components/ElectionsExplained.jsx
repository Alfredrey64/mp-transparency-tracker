import { useMemo, useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY, numeric } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { GROUPS, electionLabel } from "../lib/electionHistory";
import { ELECTIONS } from "../lib/electionSpecs";
import { dhondt } from "../lib/dhondt";
import { Reveal } from "./Motion";

// How general elections work, in plain steps: how votes turn into seats (with a small made-up example you can switch between systems), why the
// party with fewer votes sometimes wins more seats (with real examples from the data), and what happens after the votes are counted.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const h3 = { fontFamily: FONT_DISPLAY, fontSize: 18, margin: "20px 0 0", color: COLORS.ink };

// Five seats, three parties. The numbers are invented, chosen to show how the two ways of counting can differ.
const DEMO_PARTIES = [
  { key: "A", name: "Party A", colour: "#C93B55" },
  { key: "B", name: "Party B", colour: "#3F66A3" },
  { key: "C", name: "Party C", colour: "#B0601A" },
];
const DEMO_SEATS = [
  { name: "Seat 1", votes: [45, 35, 20] },
  { name: "Seat 2", votes: [40, 38, 22] },
  { name: "Seat 3", votes: [41, 33, 26] },
  { name: "Seat 4", votes: [39, 36, 25] },
  { name: "Seat 5", votes: [20, 34, 46] },
];

function Demo() {
  const [system, setSystem] = useState("fptp");
  const totals = DEMO_PARTIES.map((_, k) => DEMO_SEATS.reduce((n, s) => n + s.votes[k], 0) / DEMO_SEATS.length);
  const winners = DEMO_SEATS.map((s) => s.votes.indexOf(Math.max(...s.votes)));
  const fptp = DEMO_PARTIES.map((_, k) => winners.filter((w) => w === k).length);
  const pr = useMemo(() => dhondt(totals, DEMO_SEATS.length), [totals]);
  const seats = system === "fptp" ? fptp : pr;
  return (
    <div style={{ marginTop: 14 }}>
      <div role="group" aria-label="How the seats are decided" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" aria-pressed={system === "fptp"} onClick={() => setSystem("fptp")} style={pillStyle(system === "fptp")}>First past the post</button>
        <button type="button" aria-pressed={system === "pr"} onClick={() => setSystem("pr")} style={pillStyle(system === "pr")}>Seats in proportion to votes</button>
      </div>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ width: "100%", minWidth: 380, borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 14 }}>
          <caption style={{ position: "absolute", left: -9999 }}>An example with five seats and three parties: share of the vote in each seat</caption>
          <thead>
            <tr style={{ color: COLORS.inkSoft, fontSize: 12.5, textAlign: "right" }}>
              <th scope="col" style={{ textAlign: "left", fontWeight: 600, padding: "6px 0" }}>Votes in each seat</th>
              {DEMO_PARTIES.map((p) => <th key={p.key} scope="col" style={{ fontWeight: 600, padding: "6px 0 6px 12px" }}>{p.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {DEMO_SEATS.map((s, i) => (
              <tr key={s.name} style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
                <th scope="row" style={{ textAlign: "left", fontWeight: 600, color: COLORS.ink, padding: "8px 0" }}>{s.name}</th>
                {s.votes.map((v, k) => (
                  <td key={k} style={{ ...numeric, textAlign: "right", padding: "8px 0 8px 12px", color: winners[i] === k && system === "fptp" ? DEMO_PARTIES[k].colour : COLORS.inkSoft, fontWeight: winners[i] === k && system === "fptp" ? 800 : 500 }}>
                    {v}%{winners[i] === k && system === "fptp" ? " ✓" : ""}
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${COLORS.hairline}` }}>
              <th scope="row" style={{ textAlign: "left", fontWeight: 700, color: COLORS.ink, padding: "9px 0" }}>Share of all votes</th>
              {totals.map((t, k) => <td key={k} style={{ ...numeric, textAlign: "right", padding: "9px 0 9px 12px", fontWeight: 700, color: COLORS.ink }}>{t.toFixed(0)}%</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <div aria-live="polite" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 14 }}>
        {DEMO_PARTIES.map((p, k) => (
          <div key={p.key + system} style={{ padding: "12px 14px", borderRadius: 14, background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${p.colour}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft }}>{p.name}: {totals[k].toFixed(0)}% of votes</div>
            <div style={{ display: "flex", gap: 5, marginTop: 8, minHeight: 22 }} aria-hidden="true">
              {Array.from({ length: seats[k] }, (_, i) => <span key={i} className="ge-pop" style={{ animationDelay: `${i * 70}ms`, width: 20, height: 20, borderRadius: 6, background: p.colour }} />)}
            </div>
            <div style={{ ...numeric, fontSize: 24, fontWeight: 600, color: COLORS.ink, marginTop: 6 }}>{seats[k]} {seats[k] === 1 ? "seat" : "seats"}</div>
          </div>
        ))}
      </div>
      <p style={{ ...para, fontSize: 13.5, marginTop: 10 }}>
        {system === "fptp"
          ? "Each seat goes to the party with the most votes there, even without half the votes. Party B has 35% of the vote across the five seats but comes second in four of them, so it wins none."
          : "Seats are shared out so that each party gets close to its share of the votes, here using the D'Hondt method. Party B's 35% of the vote now earns two seats of the five."}
        {" "}This is an invented example to show the difference. It is not a real election.
      </p>
    </div>
  );
}

const pctOf = (e, k) => Math.round(e.voteShare[k] ?? 0);
const byId = (id) => ELECTIONS.find((e) => e.id === id);

function Examples() {
  const rows = [
    { id: "1951", text: (e) => `${GROUPS.c.label} won ${e.seatsWon.c} seats on ${pctOf(e, "c")}% of the votes, and ${GROUPS.l.label} won ${e.seatsWon.l} seats on ${pctOf(e, "l")}%. Labour had the most votes but the Conservatives formed the government.` },
    { id: "1974a", text: (e) => `${GROUPS.l.label} won ${e.seatsWon.l} seats on ${pctOf(e, "l")}% of the votes, and the ${GROUPS.c.label} won slightly fewer seats on ${pctOf(e, "c")}%. The Conservatives had more votes but Labour had more seats, and no party had a majority.` },
    { id: "2015", text: (e) => `UKIP won ${e.voteShare.u.toFixed(0)}% of the votes and one seat. The SNP won ${e.voteShare.s.toFixed(0)}% of the votes and ${e.seatsWon.s} seats, because its voters were all in Scotland.` },
    { id: "2024", text: (e) => `Reform UK won ${e.voteShare.u.toFixed(0)}% of the votes and ${e.seatsWon.u} seats. The Liberal Democrats won ${e.voteShare.d.toFixed(0)}% and ${e.seatsWon.d} seats. Labour won ${e.seatsWon.l} of ${e.seats} seats on ${e.voteShare.l.toFixed(0)}% of the votes.` },
  ];
  return (
    <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
      {rows.map((r) => {
        const e = byId(r.id);
        return (
          <li key={r.id} style={{ padding: "12px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
            <strong style={{ fontFamily: FONT_DISPLAY, color: COLORS.ink, fontSize: 16 }}>{electionLabel(e)}</strong>
            <div style={{ ...para, marginTop: 2 }}>{r.text(e)}</div>
          </li>
        );
      })}
    </ul>
  );
}

const STEPS = [
  ["The count", "Votes are counted overnight in each of the 650 seats. The candidate with the most votes in a seat becomes its MP, even without half the votes."],
  ["The waiting game", "The Prime Minister stays in office until it is clear who can form a government. There is no separate vote for Prime Minister."],
  ["A clear winner", "If one party has more than half the seats, the King invites its leader to be Prime Minister. A majority is 326 of 650, though in practice a bit fewer are needed, because the Speaker does not normally vote and Sinn Féin MPs do not take their seats."],
  ["No clear winner", "This is called a hung parliament. By convention the sitting Prime Minister gets the first chance to form a government. The person the King appoints must be able to win the confidence of the Commons, which means winning its votes on the big questions."],
];

const FAQ = [
  ["What is a safe seat?", "A seat where one party has won by a wide margin for a long time, so it is very unlikely to change hands. The opposite is a marginal seat, won by a few points. The Marginal seats page shows which are which."],
  ["What is a swing?", "A measure of how far votes moved between two parties. The usual two-party swing is half the change in the gap between them. The compare tool on the Past elections tab uses it to compare any two elections."],
  ["What is a by-election?", "An election held in one seat between general elections, when its MP resigns, dies or is disqualified. See By-elections for what has happened since 2024."],
  ["Who draws the seat boundaries?", "Independent boundary commissions, one for each part of the UK. They redraw the map from time to time so that seats have similar numbers of voters. The most recent review took effect for the 2024 election, which is why some seats have new names."],
  ["How long can a Parliament last?", "Up to five years from when it first meets. The Prime Minister can ask the King for an election earlier. Between 2011 and 2022 a law set fixed five-year terms, but it was repealed."],
];

export default function ElectionsExplained({ onOpen }) {
  return (
    <div>
      <Reveal as="section" aria-labelledby="h-ex-votes" style={{ ...card, marginTop: 8 }}>
        <h2 id="h-ex-votes" style={cardTitle}>From votes to seats</h2>
        <p style={para}>General elections use first past the post. The country is split into 650 seats, each electing one MP, and a party's number of seats can be quite different from its share of the votes. Switch between the two ways of counting in this example to see how.</p>
        <Demo />
        <h3 style={h3}>It has happened in real elections</h3>
        <Examples />
        <p style={{ ...para, fontSize: 13.5, marginTop: 10 }}>
          Supporters of first past the post say it gives clear results and one local MP for each area. Critics say it leaves many votes without a voice. Scotland, Wales and Northern Ireland elect their own parliaments in other ways: see <button type="button" onClick={() => onOpen("devolved")} style={{ all: "unset", cursor: "pointer", color: COLORS.ink, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>Devolved elections</button>.
        </p>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-ex-after" style={{ ...card, marginTop: 18 }}>
        <h2 id="h-ex-after" style={cardTitle}>After the votes are counted</h2>
        <ol style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "grid", gap: 12 }}>
          {STEPS.map(([title, text], i) => (
            <li key={title} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "start" }}>
              <span aria-hidden="true" style={{ ...numeric, width: 34, height: 34, borderRadius: 11, background: "#7A5AF0", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{i + 1}</span>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.ink }}>{title}</div>
                <div style={{ ...para, marginTop: 2 }}>{text}</div>
              </div>
            </li>
          ))}
        </ol>
        <h3 style={h3}>Three ways a hung parliament has been settled</h3>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 8, fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: COLORS.ink, maxWidth: 760 }}>
          <li><strong>February 1974.</strong> No party had a majority. Talks between Edward Heath's Conservatives and the Liberals failed, Harold Wilson formed a minority Labour government, and a second election in October gave Labour a majority of three.</li>
          <li><strong>2010.</strong> The Conservatives were the largest party, 20 seats short. They formed a coalition with the Liberal Democrats, the first since the Second World War.</li>
          <li><strong>2017.</strong> The Conservatives lost their majority. They stayed in government as a minority, with a deal under which the DUP's ten MPs backed them on key votes.</li>
        </ul>
        <p style={{ ...para, fontSize: 13.5, marginTop: 10 }}>See <button type="button" onClick={() => onOpen("history", "1974a")} style={{ all: "unset", cursor: "pointer", color: COLORS.ink, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>February 1974</button>, <button type="button" onClick={() => onOpen("history", "2010")} style={{ all: "unset", cursor: "pointer", color: COLORS.ink, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>2010</button> and <button type="button" onClick={() => onOpen("history", "2017")} style={{ all: "unset", cursor: "pointer", color: COLORS.ink, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>2017</button> in Past elections.</p>
      </Reveal>

      <Reveal as="section" aria-labelledby="h-ex-faq" style={{ ...card, marginTop: 18 }}>
        <h2 id="h-ex-faq" style={cardTitle}>Quick questions</h2>
        <div style={{ marginTop: 10 }}>
          {FAQ.map(([q, a]) => (
            <details key={q} style={{ borderTop: `1px solid ${COLORS.hairline}`, padding: "12px 0" }}>
              <summary style={{ cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15.5, fontWeight: 700, color: COLORS.ink }}>{q}</summary>
              <p style={{ ...para, marginTop: 8 }}>{a}</p>
            </details>
          ))}
        </div>
        <p style={{ ...para, fontSize: 13.5, marginTop: 10 }}>More on taking part: <a href="#/howtovote" style={{ color: COLORS.ink, fontWeight: 700 }}>How to vote</a> and <a href="#/localElections" style={{ color: COLORS.ink, fontWeight: 700 }}>Local elections</a>.</p>
      </Reveal>
    </div>
  );
}
