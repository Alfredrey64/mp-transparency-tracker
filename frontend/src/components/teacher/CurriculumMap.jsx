/** @jsxImportSource react */
import { CHAPTERS } from "../../data/teacherMode";
import { ENGLAND, OTHER_NATIONS } from "../../data/teacherExtras";
import "../../classroom.css";

// Where each chapter and classroom activity meets the curriculum. England's wording is quoted from the national curriculum programmes of study for
// citizenship; Scotland, Wales and Northern Ireland are named by curriculum area with a link to their own site, because their outcomes are set there.
export default function CurriculumMap() {
  const titleOf = (k) => (k === "classroom" ? { title: "Classroom activities", colour: "#7A5AF0" } : CHAPTERS.find((c) => c.key === k));
  return (
    <section className="cm" aria-labelledby="h-tm-fit">
      <h2 id="h-tm-fit">Where it fits the curriculum</h2>
      <p className="cm-lede">{ENGLAND.note}</p>
      <ul className="cm-rows">
        {ENGLAND.rows.map((r, i) => {
          const c = titleOf(r.chapter);
          return (
            <li key={i} style={{ "--c": c.colour }}>
              <span className="cm-tag">{c.title}</span>
              <span className="cm-ks">{r.ks === "KS3" ? "Key stage 3, ages 11 to 14" : "Key stage 4, ages 14 to 16"}</span>
              <p>"{r.text}"</p>
            </li>
          );
        })}
      </ul>
      <p className="cm-src">England: quoted from <a href={ENGLAND.source.href} target="_blank" rel="noreferrer">{ENGLAND.source.label}</a> (GOV.UK, Open Government Licence v3.0). Check it against the current document.</p>
      <h3>Scotland, Wales and Northern Ireland</h3>
      <p className="cm-lede">These nations set their own curricula. How decisions are made, Parliament, parties, voting and having a say belong in these areas, but read the detailed outcomes on each site before you match them.</p>
      <ul className="cm-nations">
        {OTHER_NATIONS.map((n) => <li key={n.nation}><b>{n.nation}</b><a href={n.href} target="_blank" rel="noreferrer">{n.area}</a></li>)}
      </ul>
    </section>
  );
}
