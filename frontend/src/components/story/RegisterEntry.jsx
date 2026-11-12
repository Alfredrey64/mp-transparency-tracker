/** @jsxImportSource react */
import { useGo } from "./useGo";
import "../../foreign.css";

// How an entry on the public register is laid out: what is published and what the Home Office keeps. It is a list of kinds of detail, from the Home Office's "registration and public
// register" guidance (chapters 2 to 5), not a real registration, and it says so.

const Tick = () => <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.16" /><path d="M5.5 10.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Lock = () => <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.16" /><rect x="5.8" y="9" width="8.4" height="6" rx="1.4" fill="currentColor" /><path d="M7.6 9V7.4a2.4 2.4 0 014.8 0V9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;

const PUBLISHED = [
  ["Who registered", "Their name. For a company, its company number, country and registered address. For a person, their year of birth and only the town, city, region and country they live in."],
  ["Which foreign power", "The name of the foreign power the arrangement is with."],
  ["What the arrangement is", "Whether it is a contract, an understanding or something informal, and the date the direction was given."],
  ["Who carries out the work", "The people or companies doing it, their role and their link to the registrant."],
  ["When", "When the activity starts, whether it is one-off or repeated, and the expected end date."],
  ["Who it is aimed at", "The role of the person contacted, or a category such as Member of Parliament. For public communications, the audience."],
  ["What it is for", "The form it takes (for example emails or a newspaper article), its purpose and the outcome sought. For money, goods or services, what they are and their value."],
];
const PRIVATE = [
  ["Personal details", "Day and month of birth, nationality, phone numbers and email addresses."],
  ["Identity documents", "The copy of a passport, driving licence or other ID used to check who they are."],
  ["Street addresses", "Home and correspondence addresses (only the town, city, region and country appear)."],
  ["The company's officer", "The director or other officer named on the form, and all their details."],
  ["Who filled it in", "Details of a law firm or other representative who completed the form for someone."],
  ["Names of those contacted", "The names of the individual people approached, where known. Only their role or category is shown."],
  ["Most enhanced tier entries", "Registrations under the enhanced tier are not published, except for the part that concerns political influence activities."],
];

function Col({ kind, title, lead, rows }) {
  const Icon = kind === "pub" ? Tick : Lock;
  return (
    <section className={`fr-entry-col fr-${kind}`} aria-label={title}>
      <h3><Icon />{title}</h3>
      <p>{lead}</p>
      <ul>
        {rows.map(([t, d], i) => (
          <li key={t} style={{ "--i": i }}><b>{t}</b><span>{d}</span></li>
        ))}
      </ul>
    </section>
  );
}

export default function RegisterEntry({ colour = "#3F7D5C" }) {
  const [ref, go] = useGo(0.15);
  return (
    <figure ref={ref} className="fr-entry" data-go={go} style={{ "--tc": colour }}>
      <div className="fr-entry-grid">
        <Col kind="pub" title="On the public register" lead="Most of what a political influence registration says is published, unless an exception applies." rows={PUBLISHED} />
        <Col kind="priv" title="Kept by the Home Office" lead="The caseworkers see all of it. The public sees none of this." rows={PRIVATE} />
      </div>
      <figcaption>An illustration of which kinds of detail are published, from the Home Office's guidance. It is not a real registration.</figcaption>
    </figure>
  );
}
