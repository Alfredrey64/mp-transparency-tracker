/** @jsxImportSource react */
import { useGo } from "./useGo";
import { IconHealth, IconMortarboard, IconTransport, IconShield, IconHouse } from "../icons";
import "../../chainart.css";

// Animated chains for the tops of pages (they take the place of the plain row of round badges). Each is a row of stations drawn from the page's own steps, with a belt under it that something
// travels along, so the idea is seen as well as read:
//   civil   Ministers change with every government while the civil servants stay; decisions flow on to the public services.
//   news    Many events happen, newsrooms pick a few, the telling shapes them, and that is what we end up believing and acting on.
//   stats   The same data passes three choices (what to compare, which average, where to start) and comes out looking different each time.
// The belt plays on a loop while the picture is on screen. Calmer motion shows the stations only, with a still belt. The steps' words are passed in as `nodes`.

const SERVICES = [IconHealth, IconMortarboard, IconTransport, IconShield, IconHouse];

export default function ChainArt({ kind, nodes, label }) {
  const [ref, go] = useGo(0.25);
  const n = nodes.length;
  return (
    <section ref={ref} className="cha" data-go={go} data-kind={kind} style={{ "--n": n }} aria-label={label}>
      <ol className="cha-nodes">
        {nodes.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title} className="cha-node" style={{ "--tc": s.colour, "--i": i }} data-i={i}>
              <span className="cha-badge" aria-hidden="true">{Icon && <Icon size={26} />}</span>
              <b>{s.title}</b>
              {s.text && <small>{s.text}</small>}
              {kind === "civil" && i === 0 && <em className="cha-chip cha-new" aria-hidden="true">A new government</em>}
              {kind === "civil" && i === 1 && <em className="cha-chip cha-stay" aria-hidden="true">Still here</em>}
              {kind === "civil" && i === 2 && (
                <span className="cha-svc" aria-hidden="true">{SERVICES.map((S, k) => <i key={k} style={{ "--k": k }}><S size={15} /></i>)}</span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="cha-belt" aria-hidden="true">
        <i className="cha-line" />
        {kind === "civil" && [0, 1, 2, 3].map((k) => <b key={k} className="cha-pk cha-civil" style={{ "--k": k }} />)}
        {kind === "news" && [0, 1, 2, 3, 4, 5].map((k) => <b key={k} className={`cha-pk cha-news ${k % 3 === 0 ? "cha-pass" : "cha-drop"}`} style={{ "--k": k }} />)}
        {kind === "stats" && [0, 1, 2].map((k) => <b key={k} className="cha-pk cha-stat" style={{ "--k": k }} />)}
      </div>
    </section>
  );
}
