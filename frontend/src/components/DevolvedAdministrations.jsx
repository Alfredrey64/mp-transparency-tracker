import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconDevolved } from "./icons";

const ADMINISTRATIONS = [
  {
    name: "Scottish Parliament",
    place: "Holyrood, Edinburgh",
    established: "1999, following a 1997 referendum (74% in favour)",
    members: "129 MSPs, elected by the Additional Member System (a mix of constituency and regional-list seats)",
    led: "First Minister",
    powers: "Health, education, justice, policing, local government, and some tax-varying powers. Further powers, including parts of the welfare system, followed the 2014 independence referendum.",
    reserved: "Defence, foreign affairs, immigration, most of the constitution, and monetary policy stay with Westminster.",
    url: "https://www.parliament.scot/",
  },
  {
    name: "Senedd Cymru — Welsh Parliament",
    place: "Cardiff Bay",
    established: "1999 as the National Assembly for Wales; renamed the Senedd in 2020",
    members: "60 Members currently, rising to 96 from the next election, elected by proportional representation",
    led: "First Minister of Wales",
    powers: "Powers have expanded steadily since 1999. Since the Wales Act 2017, it works on a \"reserved powers\" model like Scotland's — devolved by default, with only specific matters held back for Westminster.",
    reserved: "As with Scotland: defence, foreign affairs, immigration, and the core constitution remain reserved.",
    url: "https://senedd.wales/",
  },
  {
    name: "Northern Ireland Assembly",
    place: "Stormont, Belfast",
    established: "1998, under the Good Friday (Belfast) Agreement that ended the Troubles",
    members: "90 MLAs, elected by Single Transferable Vote",
    led: "A First Minister and deputy First Minister, jointly, from the two largest parties by designation — with equal status in law",
    powers: "Health, education, justice, policing, and agriculture, among others.",
    reserved: "Defence, foreign affairs, immigration, and national security remain with Westminster. Unlike Scotland and Wales, the Assembly's power-sharing structure has led to several extended suspensions over the years, most recently 2022–2024.",
    url: "https://www.niassembly.gov.uk/",
  },
];

export default function DevolvedAdministrations() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconDevolved}
        kicker="Public Record · Devolved Administrations"
        title="Beyond Westminster"
        subtitle="This site otherwise covers the UK Parliament at Westminster — but Scotland, Wales, and Northern Ireland each have their own devolved legislature with real law-making power. Here's a brief primer on each."
      />

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        {ADMINISTRATIONS.map((a) => (
          <div key={a.name} style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: "22px 24px" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginBottom: 2 }}>{a.name}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 14 }}>{a.place}</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
              <Field label="Established">{a.established}</Field>
              <Field label="Members">{a.members}</Field>
              <Field label="Led by">{a.led}</Field>
            </div>

            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.65, marginBottom: 8 }}>{a.powers}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 14 }}>{a.reserved}</div>

            <a href={a.url} target="_blank" rel="noreferrer" style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: COLORS.brass }}>
              Visit official site ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.inkSoft, marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}
