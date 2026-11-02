/** @jsxImportSource react */
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";

// The pictures on the Civil Service page. Each plays once, when it scrolls into view, and shows its final state at once for anyone who has asked for calmer motion.

// Who leaves and who stays when a government changes: three lanes crossing the same line. The wording is the page's own, shortened.
const LANES = [
  { name: "Ministers", tc: "#9C3B3B", before: "Chosen by the Prime Minister", after: "A new set, chosen by the new Prime Minister", ends: true },
  { name: "Special advisers", tc: "#E8741A", before: "Chosen by a minister", after: "A new set, chosen by the new ministers", ends: true },
  { name: "Civil servants", tc: "#5A7FA6", before: "Appointed on merit", after: "Still there, serving the new ministers", ends: false },
];

export function ChangeOfGovernment() {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="cs-flip" data-go={go}>
      <figcaption className="cs-flip-head">What happens to each when the government changes</figcaption>
      <div className="cs-axis" aria-hidden="true"><span>Before the change</span><span>After the change</span></div>
      <ul className="cs-lanes">
        {LANES.map((l, i) => (
          <li key={l.name} className="cs-lane" data-ends={l.ends ? "1" : "0"} style={{ "--tc": l.tc, "--i": i }}>
            <b className="cs-lane-name">{l.name}</b>
            <div className="cs-track">
              <div className="cs-half cs-before"><i className="cs-fill" /><span className="cs-t">{l.before}</span></div>
              <div className="cs-half cs-after"><i className="cs-fill" /><span className="cs-t">{l.after}</span></div>
            </div>
          </li>
        ))}
      </ul>
      <p className="cs-when" aria-hidden="true"><b>The government changes</b></p>
    </figure>
  );
}

// Three small charts of the workforce, each drawn from a figure on the page.
export function Rows({ rows }) {
  return (
    <ul className="cs-rows">
      {rows.map((r, i) => (
        <li key={r.label} style={{ "--tc": r.colour, "--k": i }}>
          <span className="cs-row-line"><span className="cs-row-label">{r.label}</span><b>{r.value}</b></span>
          <span className="cs-row-bar" aria-hidden="true"><i style={{ width: `${r.pct}%` }} /></span>
        </li>
      ))}
    </ul>
  );
}

export function Workforce() {
  const [ref, go] = useGo(0.2);
  return (
    <figure ref={ref} className="cs-work" data-go={go}>
      <section className="cs-card" style={{ "--tc": "#B8741A" }}>
        <h3>Where they work</h3>
        <div className="cs-stack" role="img" aria-label="The five biggest departments employ 67.8% of civil servants and all the others 32.2%">
          <i style={{ width: "67.8%", background: "var(--tc)" }} />
          <i style={{ width: "32.2%", background: "color-mix(in srgb, var(--tc) 22%, var(--c-hairline))" }} />
        </div>
        <ul className="cs-key">
          <li><i style={{ background: "var(--tc)" }} /><span>The five biggest departments</span><b><AnimatedValue text="67.8%" /></b></li>
          <li><i style={{ background: "color-mix(in srgb, var(--tc) 22%, var(--c-hairline))" }} /><span>All the others</span><b><AnimatedValue text="32.2%" /></b></li>
        </ul>
      </section>
      <section className="cs-card" style={{ "--tc": "#3F7D5C" }}>
        <h3>Joining and leaving, 2025 to 2026</h3>
        <Rows rows={[
          { label: "Joined", value: <AnimatedValue text="42,855" />, pct: 100, colour: "#3F7D5C" },
          { label: "Left", value: <AnimatedValue text="37,945" />, pct: (37945 / 42855) * 100, colour: "#9C3B3B" },
        ]} />
      </section>
      <section className="cs-card" style={{ "--tc": "#5A7FA6" }}>
        <h3>At Executive Officer grade or above</h3>
        <Rows rows={[
          { label: "In 2016", value: "About 3 in 5", pct: 60, colour: "#8A98B0" },
          { label: "Now", value: "More than 3 in 4", pct: 75, colour: "#5A7FA6" },
        ]} />
      </section>
    </figure>
  );
}
