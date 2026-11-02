/** @jsxImportSource react */
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";

// The charts on the Civil Service page. Each plays once, when it scrolls into view, and shows its final state at once for anyone who has asked for calmer motion.

// Small charts of the workforce, each drawn from a figure on the page.
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
      <section className="cs-card cs-age" style={{ "--tc": "#A9701F" }}>
        <h3>Median age</h3>
        <b><AnimatedValue text="43" /></b>
        <p>One year younger than in 2025.</p>
      </section>
      <section className="cs-card" style={{ "--tc": "#1F7A6E" }}>
        <h3>Joining and leaving, 2025 to 2026</h3>
        <Rows rows={[
          { label: "Joined", value: <AnimatedValue text="42,855" />, pct: 100, colour: "#1F7A6E" },
          { label: "Left", value: <AnimatedValue text="37,945" />, pct: (37945 / 42855) * 100, colour: "#9A3F55" },
        ]} />
      </section>
      <section className="cs-card" style={{ "--tc": "#2C5F9E" }}>
        <h3>At Executive Officer grade or above</h3>
        <Rows rows={[
          { label: "In 2016", value: "About 3 in 5", pct: 60, colour: "#8A98B0" },
          { label: "Now", value: "More than 3 in 4", pct: 75, colour: "#4A6E99" },
        ]} />
      </section>
    </figure>
  );
}
