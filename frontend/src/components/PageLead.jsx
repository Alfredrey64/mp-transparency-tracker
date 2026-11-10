import CountValue from "./CountValue";
import "../pagelead.css";

// The top of a data page: one headline figure that says what the page is about, the few facts that go with it beside it (each with a bar when it is a share of the whole),
// and a short three-step "how to read this page" as a line of steps. Used where a row of four equal boxes would shout. Figures count up when they first scroll into view.
//
// `figure`: { value: "£61m", label: "given to parties", sub: "in the last 12 months" }
// `facts`:  [{ value: "12", label: "parties received money", sub: "optional", share: 0.42 }]   (share is 0 to 1 and draws a bar)
// `steps`:  [{ title, text }]
export default function PageLead({ colour = "#E8741A", figure, facts = [], steps = [], stepsTitle = "How to read this page", label = "At a glance" }) {
  const shown = facts.filter((f) => f && f.value != null && f.value !== "");
  return (
    <div className="pl" style={{ "--pc": colour }}>
      <section className="pl-card" aria-label={label}>
        <div className="pl-main">
          <span className="pl-rings" aria-hidden="true"><i /><i /><i /></span>
          <b className="pl-fig"><CountValue>{String(figure.value)}</CountValue></b>
          <span className="pl-label">{figure.label}</span>
          {figure.sub && <small className="pl-sub">{figure.sub}</small>}
        </div>
        {shown.length > 0 && (
          <ul className="pl-facts">
            {shown.map((f, i) => (
              <li key={f.label} style={{ "--i": i }}>
                <b><CountValue>{String(f.value)}</CountValue></b>
                <div>
                  <span>{f.label}</span>
                  {f.sub && <small>{f.sub}</small>}
                  {typeof f.share === "number" && <i className="pl-bar" aria-hidden="true"><u style={{ "--w": Math.max(0.02, Math.min(1, f.share)) }} /></i>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {steps.length > 0 && (
        <section className="pl-read" aria-label={stepsTitle}>
          <h2>{stepsTitle}</h2>
          <ol>
            {steps.map((s, i) => (
              <li key={s.title} style={{ "--i": i }}>
                <span aria-hidden="true">{i + 1}</span>
                <div><b>{s.title}</b><p>{s.text}</p></div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
