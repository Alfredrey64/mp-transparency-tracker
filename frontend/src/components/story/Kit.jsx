/** @jsxImportSource react */
import CountUp from "../CountUp";
import "../../story.css";

// The building blocks of the "What's hidden" pages, so the four of them read as one family: a dark scoreboard of headline figures, numbered chapters
// each with its own colour, pull quotes, myth-and-fact cards and a fold-out for the long version of a point. Pages bring their own diagrams.

// `variant` changes how the figures are laid out, so the four pages do not all open with the same row of tiles: "lead" gives the first figure the space and
// stacks the rest as a ladder (each tile's `w` is how far along its rung is), "rail" strings them on one line like stops on a route.
export function Board({ tiles, variant }) {
  return (
    <section className="st-board" data-n={tiles.length} data-variant={variant} aria-label="At a glance">
      {tiles.map((t, i) => (
        <article key={t.label} className="st-tile" style={{ "--tc": t.colour, "--i": i, "--w": t.w }}>
          <span className="st-tile-label">{t.label}</span>
          <b>{typeof t.value === "number" ? <CountUp value={t.value} format={t.format} /> : t.value}</b>
          {t.visual && <div className="st-tile-visual" aria-hidden="true">{t.visual}</div>}
          {t.sub && <span className="st-tile-sub">{t.sub}</span>}
        </article>
      ))}
    </section>
  );
}

export function Why({ icon: Icon, colour, children }) {
  return (
    <aside className="st-why" style={{ "--tc": colour }}>
      <span className="st-why-icon" aria-hidden="true">{Icon && <Icon size={26} />}</span>
      <p><strong>Why it matters.</strong> {children}</p>
    </aside>
  );
}

export function Chapter({ n, title, lede, colour, children, wide = false }) {
  return (
    <section className="st-chapter" style={{ "--tc": colour }} aria-labelledby={`st-h-${n}`}>
      <header>
        <span className="st-n" aria-hidden="true">{n}</span>
        <div>
          <h2 id={`st-h-${n}`}>{title}</h2>
          {lede && <p className="st-lede">{lede}</p>}
        </div>
      </header>
      <div className="st-body" data-wide={wide ? "1" : "0"}>{children}</div>
    </section>
  );
}

// Text beside a picture: the picture first on a phone, side by side on a wide screen.
export function Split({ visual, children, flip = false }) {
  return (
    <div className="st-split" data-flip={flip ? "1" : "0"}>
      <figure className="st-visual">{visual}</figure>
      <div className="st-prose">{children}</div>
    </div>
  );
}

export function Pull({ colour, children }) {
  return <blockquote className="st-pull" style={{ "--tc": colour }}>{children}</blockquote>;
}

export function Disclose({ title, children, open = false }) {
  return (
    <details className="st-more" open={open}>
      <summary>{title}</summary>
      <div className="st-prose">{children}</div>
    </details>
  );
}

// Cards with a coloured top, an icon and a short line each: for "what this does not mean" and similar.
export function Cards({ items, min = 260 }) {
  return (
    <ul className="st-cards" style={{ "--min": `${min}px` }}>
      {items.map((c, i) => {
        const Icon = c.icon;
        return (
          <li key={c.title} style={{ "--tc": c.colour, "--i": i }}>
            <span className="st-card-icon" aria-hidden="true">{Icon && <Icon size={22} />}</span>
            <b>{c.title}</b>
            <p>{c.text}</p>
          </li>
        );
      })}
    </ul>
  );
}

// A vertical run of steps joined by a line that draws itself as the page scrolls into view.
export function Steps({ steps }) {
  return (
    <ol className="st-steps">
      {steps.map((s, i) => (
        <li key={s.title} style={{ "--tc": s.colour, "--i": i }}>
          <span className="st-step-n" aria-hidden="true">{i + 1}</span>
          <div><b>{s.title}</b><p>{s.text}</p></div>
        </li>
      ))}
    </ol>
  );
}
