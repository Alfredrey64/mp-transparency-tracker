/** @jsxImportSource react */
import { PageHeader } from "../shared";
import { Board, Why, Chapter, Pull, Cards, Steps, Disclose } from "./Kit";

// One page of plain explanation, laid out from a description of its content, so the pages added in October 2026 read as one family with the "What's hidden"
// pages. A page says what it holds as data (the figures at the top, why it matters, its chapters, where each fact comes from); this decides how it looks.
//
// A chapter's `blocks` are drawn in order. Each block is an object with one of these keys:
//   text      a list of paragraphs            pull      one highlighted statement (with `colour`)
//   cards     [{ title, text, colour }]        steps     [{ title, text }] in order
//   bars      { items: [{ label, value, text, colour }], max, note }   bars drawn to the same scale, from 0 to `max` (the biggest value if left out)
//   facts     [{ label, value, note }]         big figures, each with a line under it
//   compare   [{ title, colour, items: [] }]   two or more columns side by side
//   timeline  [{ when, text }]                 dated events down a line
//   more      { title, text: [] }              a fold-out for the longer version of a point
//   chips     { items: [], note }              a wrapped set of short labels, numbered in order
//   note      a small italic line

function Block({ b, colour }) {
  if (b.text) return <div className="st-prose" style={{ "--tc": colour }}>{b.text.map((p, i) => <p key={i}>{p}</p>)}</div>;
  if (b.pull) return <Pull colour={b.colour ?? colour}>{b.pull}</Pull>;
  if (b.cards) return <Cards items={b.cards.map((c) => ({ colour: colour, ...c }))} />;
  if (b.steps) return <Steps steps={b.steps.map((s) => ({ colour, ...s }))} />;
  if (b.chips) {
    return (
      <figure className="st-chips-fig" style={{ "--tc": colour }}>
        <ol className="st-chips">{b.chips.items.map((c, i) => <li key={c}><b aria-hidden="true">{i + 1}</b>{c}</li>)}</ol>
        {b.chips.note && <figcaption>{b.chips.note}</figcaption>}
      </figure>
    );
  }
  if (b.note) return <p className="st-note">{b.note}</p>;
  if (b.more) return <Disclose title={b.more.title}>{b.more.text.map((p, i) => <p key={i}>{p}</p>)}</Disclose>;
  if (b.bars) {
    const top = b.bars.max ?? Math.max(...b.bars.items.map((i) => i.value));
    return (
      <figure className="st-bars-fig">
        <ul className="st-bars">
          {b.bars.items.map((it) => (
            <li key={it.label} style={{ "--tc": it.colour ?? colour }}>
              <span className="st-bars-label">{it.label}</span>
              <span className="st-bars-track" aria-hidden="true"><i style={{ width: `${Math.max(2, (it.value / top) * 100)}%` }} /></span>
              <b>{it.text}</b>
            </li>
          ))}
        </ul>
        {b.bars.note && <figcaption>{b.bars.note}</figcaption>}
      </figure>
    );
  }
  if (b.facts) {
    return (
      <dl className="st-facts">
        {b.facts.map((f) => (
          <div key={f.label} style={{ "--tc": f.colour ?? colour }}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
            {f.note && <p>{f.note}</p>}
          </div>
        ))}
      </dl>
    );
  }
  if (b.compare) {
    return (
      <div className="st-compare" style={{ "--n": b.compare.length }}>
        {b.compare.map((c) => (
          <section key={c.title} style={{ "--tc": c.colour ?? colour }}>
            <h3>{c.title}</h3>
            <ul>{c.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
          </section>
        ))}
      </div>
    );
  }
  if (b.timeline) {
    return (
      <ol className="st-timeline" style={{ "--tc": colour }}>
        {b.timeline.map((t) => <li key={t.when}><b>{t.when}</b><span>{t.text}</span></li>)}
      </ol>
    );
  }
  return null;
}

// `narrow` matches the width of the older pages that sit in the same menu group (Election results, Your council), so moving between tabs does not shift the page.
export default function ExplainerPage({ icon, kicker, title, subtitle, tiles, tileVariant, why, chapters, sources, checked, narrow = false }) {
  return (
    <div className="st" style={{ paddingTop: "clamp(20px, 5vw, 40px)", ...(narrow ? { maxWidth: 1084 } : null) }}>
      <PageHeader icon={icon} kicker={kicker} title={title} subtitle={subtitle} />
      {tiles && <Board tiles={tiles} variant={tileVariant} />}
      {why && <Why icon={icon} colour={why.colour}>{why.text}</Why>}
      {chapters.map((c, i) => (
        <Chapter key={c.title} n={i + 1} title={c.title} lede={c.lede} colour={c.colour}>
          {c.blocks.map((b, j) => <Block key={j} b={b} colour={c.colour} />)}
        </Chapter>
      ))}
      <Chapter n={chapters.length + 1} title="Where this comes from" colour="#5B6784" lede={checked ? `Every figure was checked against these sources on ${checked}.` : undefined}>
        <ul className="st-sources">
          {sources.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>{s.note && <span>{s.note}</span>}</li>
          ))}
        </ul>
      </Chapter>
    </div>
  );
}
