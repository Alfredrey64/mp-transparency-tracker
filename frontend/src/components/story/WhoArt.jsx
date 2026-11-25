/** @jsxImportSource react */
import { useMemo } from "react";
import { useGo } from "./useGo";
import AnimatedValue from "./AnimatedValue";
import "../../whoart.css";

// The pictures on the "Who they are" tab of Parliament in numbers. The three headline figures each get their own picture (a half-circle of 650 dots, a hundred squares, seven people), and the two
// charts below them are rings and a ribbon. Every number is one the tab already states; nothing is estimated here. The pictures draw themselves once, when they scroll into view.

const WOMEN = "#E8741A";
const PRIVATE = "#3F6EA8";
const ETHNIC = "#C63D55";

// 650 seats laid out in rows of a half-circle, the seats counted from left to right; the first `lit` are drawn in colour.
function seats(total, rows = 11) {
  const radii = Array.from({ length: rows }, (_, r) => 86 + r * 10.2);
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((total * r) / sum));
  counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);
  const out = [];
  radii.forEach((r, row) => {
    const n = counts[row];
    for (let k = 0; k < n; k++) {
      const a = Math.PI - (Math.PI * k) / (n - 1);
      out.push({ x: 210 + r * Math.cos(a), y: 206 - r * Math.sin(a), a });
    }
  });
  out.sort((p, q) => q.a - p.a);
  return out;
}

function Hemicycle({ total, lit, colour }) {
  const dots = useMemo(() => seats(total), [total]);
  return (
    <svg className="wta-hemi" viewBox="0 0 420 214" aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} className={i < lit ? "wta-seat wta-on" : "wta-seat"} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r="3.1" style={{ "--i": i, "--c": colour }} />
      ))}
    </svg>
  );
}

function Grid100({ lit, colour }) {
  return (
    <div className="wta-g100" aria-hidden="true">
      {Array.from({ length: 100 }, (_, i) => <i key={i} className={i < lit ? "wta-on" : undefined} style={{ "--i": i, "--c": colour }} />)}
    </div>
  );
}

function Person({ on, colour, i }) {
  return (
    <svg className={on ? "wta-per wta-on" : "wta-per"} viewBox="0 0 40 72" style={{ "--c": colour, "--i": i }} aria-hidden="true">
      <circle cx="20" cy="13" r="10" />
      <path d="M4 70v-24c0-10 7-17 16-17s16 7 16 17v24z" />
    </svg>
  );
}

// The three headline figures at the top of the tab.
export function WhoHeadlines({ items }) {
  const [ref, go] = useGo(0.2);
  const [a, b, c] = items;
  return (
    <section ref={ref} className="wta-top" data-go={go} aria-label="Three headline figures">
      <article className="wta-card wta-a" style={{ "--c": WOMEN }}>
        <div className="wta-pic"><Hemicycle total={650} lit={267} colour={WOMEN} /></div>
        <div className="wta-tx"><b className="wta-num"><AnimatedValue text={a.value} /></b><h3>{a.label}</h3><p>{a.sub}</p></div>
      </article>
      <article className="wta-card wta-b" style={{ "--c": PRIVATE }}>
        <div className="wta-pic"><Grid100 lit={23} colour={PRIVATE} /></div>
        <div className="wta-tx"><b className="wta-num"><AnimatedValue text={b.value} /></b><h3>{b.label}</h3><p>{b.sub}</p></div>
      </article>
      <article className="wta-card wta-c" style={{ "--c": ETHNIC }}>
        <div className="wta-pic">
          <div className="wta-seven" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => <Person key={i} on={i === 0} colour={ETHNIC} i={i} />)}
          </div>
        </div>
        <div className="wta-tx"><b className="wta-num"><AnimatedValue text={c.value} /></b><h3>{c.label}</h3><p>{c.sub}</p></div>
      </article>
    </section>
  );
}

// Women as a share of each group: a ring for each, drawn round from the top.
export function GenderRings({ items, note }) {
  const [ref, go] = useGo(0.25);
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <figure ref={ref} className="wta-rings-fig" data-go={go}>
      <ul className="wta-rings">
        {items.map((it, k) => (
          <li key={it.label} style={{ "--c": it.colour, "--k": k }}>
            <span className="wta-ringbox">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="wta-track" cx="50" cy="50" r={R} />
                <circle className="wta-arc" cx="50" cy="50" r={R} strokeDasharray={`${(C * it.value) / 100} ${C}`} transform="rotate(-90 50 50)" />
              </svg>
              <b><AnimatedValue text={`${Math.round(it.value)}%`} /></b>
            </span>
            <span className="wta-lab">{it.label}</span>
            <span className="wta-sub">{it.text}</span>
          </li>
        ))}
      </ul>
      {note && <figcaption>{note}</figcaption>}
    </figure>
  );
}

// School type as one ribbon cut in three, with the share under each cut.
export function SchoolRibbon({ items, note }) {
  const [ref, go] = useGo(0.25);
  return (
    <figure ref={ref} className="wta-rib-fig" data-go={go}>
      <div className="wta-rib" aria-hidden="true">
        {items.map((it, k) => (
          <i key={it.label} style={{ "--c": it.colour, "--k": k, flexGrow: it.value }}><span>{it.text}</span></i>
        ))}
      </div>
      <ul className="wta-rib-key">
        {items.map((it, k) => (
          <li key={it.label} style={{ "--c": it.colour, "--k": k }}><b>{it.text}</b><span>{it.label}</span></li>
        ))}
      </ul>
      {note && <figcaption>{note}</figcaption>}
    </figure>
  );
}
