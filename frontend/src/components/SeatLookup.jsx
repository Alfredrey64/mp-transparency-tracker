import { useEffect, useMemo, useState } from "react";
import { COLORS, FONT_BODY } from "../theme";
import { card, cardTitle, pillStyle } from "../lib/onsStyles";
import { loadSeatBook } from "../lib/electionData";
import { searchSeats } from "../lib/seatNames";
import SeatTimeline from "./SeatTimeline";
import { Reveal } from "./Motion";

// "Your seat": type a postcode or a seat name and see who has won it at every general election since 1950.

const para = { fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: COLORS.inkSoft, margin: "6px 0 0", maxWidth: 760 };
const field = { display: "block", width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 12, border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 15 };

export default function SeatLookup({ picked, initial = null }) {
  const [book, setBook] = useState(null);
  const [query, setQuery] = useState("");
  const [postcode, setPostcode] = useState("");
  const [chosen, setChosen] = useState({ name: initial, from: initial ? "link" : null });
  const [state, setState] = useState({ busy: false, error: null });

  useEffect(() => {
    let alive = true;
    loadSeatBook().then((b) => alive && setBook(b));
    return () => { alive = false; };
  }, []);

  // Arriving from a link or from search, bring the seat into view once the page has settled.
  useEffect(() => {
    if (!initial) return undefined;
    const t = setTimeout(() => document.getElementById("h-eh-seat")?.scrollIntoView({ behavior: "smooth", block: "start" }), 600);
    return () => clearTimeout(t);
  }, [initial]);

  const matches = useMemo(() => (book ? searchSeats(book, query, 8) : []), [book, query]);

  async function byPostcode(e) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setState({ busy: true, error: null });
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const json = await res.json();
      if (!res.ok || json.status !== 200 || !json.result?.parliamentary_constituency) throw new Error("not found");
      setChosen({ name: json.result.parliamentary_constituency, from: "postcode" });
      setState({ busy: false, error: null });
    } catch {
      setState({ busy: false, error: "That postcode could not be found. Check it, or search for the seat by name instead." });
    }
  }

  const name = picked ?? chosen.name;

  return (
    <Reveal as="section" aria-labelledby="h-eh-seat" style={{ ...card, marginTop: 18 }}>
      <h2 id="h-eh-seat" style={cardTitle}>Your seat, since 1950</h2>
      <p style={para}>Find your seat to see who has won it at every general election since 1950, how many times it has changed hands, and how close the contests were. You can also tap a seat on the map above. Nothing you type is stored.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 14 }}>
        <form onSubmit={byPostcode}>
          <label htmlFor="eh-postcode" style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Your postcode</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input id="eh-postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="For example SW1A 1AA" autoComplete="postal-code" style={field} />
            <button type="submit" disabled={state.busy} style={{ ...pillStyle(true), flexShrink: 0 }}>{state.busy ? "Finding" : "Find"}</button>
          </div>
        </form>
        <div>
          <label htmlFor="eh-seatname" style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Or a seat name</label>
          <input id="eh-seatname" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="For example Huddersfield" autoComplete="off" style={{ ...field, marginTop: 6 }} />
        </div>
      </div>
      {state.error && <p role="alert" style={{ ...para, color: COLORS.ink, fontWeight: 600 }}>{state.error}</p>}
      {matches.length > 0 && (
        <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {matches.map((m) => (
            <li key={m.i}><button type="button" onClick={() => { setChosen({ name: m.name, from: "name" }); setQuery(""); }} style={{ ...pillStyle(false), fontSize: 13 }}>{m.name}</button></li>
          ))}
        </ul>
      )}
      {name && <SeatTimeline key={name} name={name} />}
    </Reveal>
  );
}
