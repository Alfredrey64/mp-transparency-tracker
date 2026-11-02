/** @jsxImportSource react */
import { glanceGroups } from "../lib/careerGlance";
import { useGo } from "./story/useGo";
import AnimatedValue from "./story/AnimatedValue";
import { IconLords, IconGroup, IconBallot, IconCabinet, IconMeeting, IconCommittee, IconSplit } from "./icons";
import "../career.css";

// The "at a glance" panel on the Career tab: the career's headline figures as coloured tiles in three groups. Each tile has an icon, a number that counts up and, for lengths of
// time, a bar showing what share of the whole career it was. They rise in one after another when the panel scrolls into view.
const ICONS = { lords: IconLords, commons: IconGroup, ballot: IconBallot, cabinet: IconCabinet, meeting: IconMeeting, committee: IconCommittee, split: IconSplit };

export default function CareerGlance({ summary, now }) {
  const [ref, go] = useGo(0.15);
  const groups = glanceGroups(summary, now);
  let n = 0;
  return (
    <section ref={ref} className="cg" data-go={go} aria-label="The career at a glance">
      {groups.map((g) => (
        <div key={g.title} className="cg-group">
          <h3>{g.title}</h3>
          <ul style={{ "--cols": g.tiles.length }}>
            {g.tiles.map((t) => {
              const Icon = ICONS[t.icon];
              const i = n++;
              return (
                <li key={t.key} className="cg-tile" data-empty={t.empty ? "1" : "0"} style={{ "--tc": t.colour, "--i": i }}>
                  <span className="cg-ico" aria-hidden="true">{Icon && <Icon size={20} />}</span>
                  <b className="cg-num"><AnimatedValue text={t.value} />{t.unit && <small>{t.unit}</small>}</b>
                  <span className="cg-label">{t.label}</span>
                  <span className="cg-note">{t.note}</span>
                  {t.share !== null && (
                    <span className="cg-share" role="img" aria-label={`${Math.round(t.share * 100)}% of the career`}>
                      <i style={{ "--w": `${Math.max(3, Math.round(t.share * 100))}%` }} />
                      <em>{Math.round(t.share * 100)}% of the career</em>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
