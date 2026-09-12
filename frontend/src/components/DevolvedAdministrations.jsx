import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { PageHeader } from "./shared";
import { IconDevolved } from "./icons";

const ADMINISTRATIONS = [
  {
    name: "Scottish Parliament",
    place: "Holyrood, Edinburgh",
    accent: "#5A7FA6",
    established: "1999, following a 1997 referendum (74% in favour)",
    members: "129 MSPs, elected by the Additional Member System (a mix of constituency and regional-list seats)",
    led: "First Minister",
    powers: "Health, education, justice, policing, local government, and some tax-varying powers. Further powers, including parts of the welfare system, followed the 2014 independence referendum.",
    reserved: "Defence, foreign affairs, immigration, most of the constitution, and monetary policy stay with Westminster.",
    process: "Bills pass through three stages of scrutiny in a single, unicameral chamber — there's no upper house to send legislation back, unlike Westminster's Commons and Lords.",
    relationship: "Funded mainly by a block grant from the UK Treasury, calculated using the Barnett formula, topped up by its own tax powers — including setting Scottish Income Tax rates and bands since 2017. Under the \"Sewel Convention\", Westminster normally won't legislate on devolved matters without Holyrood's consent, given through a legislative consent motion — though Westminster legally retains the power to overrule this, a tension that came to a head repeatedly during Brexit.",
    url: "https://www.parliament.scot/",
  },
  {
    name: "Senedd Cymru — Welsh Parliament",
    place: "Cardiff Bay",
    accent: "#9C6B30",
    established: "1999 as the National Assembly for Wales; renamed the Senedd in 2020",
    members: "60 Members currently, rising to 96 from the next election, elected by proportional representation",
    led: "First Minister of Wales",
    powers: "Powers have expanded steadily since 1999. Since the Wales Act 2017, it works on a \"reserved powers\" model like Scotland's — devolved by default, with only specific matters held back for Westminster.",
    reserved: "As with Scotland: defence, foreign affairs, immigration, and the core constitution remain reserved.",
    process: "Passes \"Acts of Senedd Cymru\" through a similar three-stage process in its own single, unicameral chamber.",
    relationship: "Also funded through a Barnett-formula block grant, with more limited tax-varying powers of its own since 2019 (Welsh Rates of Income Tax). As in Scotland, legislative consent from the Senedd is conventionally sought before Westminster legislates on matters that are otherwise devolved.",
    url: "https://senedd.wales/",
  },
  {
    name: "Northern Ireland Assembly",
    place: "Stormont, Belfast",
    accent: "#6E4B6E",
    established: "1998, under the Good Friday (Belfast) Agreement that ended the Troubles",
    members: "90 MLAs, elected by Single Transferable Vote",
    led: "A First Minister and deputy First Minister, jointly, from the two largest parties by designation — with equal status in law",
    powers: "Health, education, justice, policing, and agriculture, among others.",
    reserved: "Defence, foreign affairs, immigration, and national security remain with Westminster. Unlike Scotland and Wales, the Assembly's power-sharing structure has led to several extended suspensions over the years, most recently 2022–2024.",
    process: "Passes \"Acts of the Northern Ireland Assembly\". Votes on the most sensitive issues need \"cross-community support\" — backing from both designated unionist and nationalist members, not just a simple majority — a safeguard built into the Good Friday Agreement specifically to protect power-sharing.",
    relationship: "Also funded via a Westminster block grant. Its Executive is jointly led by the largest unionist and largest nationalist parties with equal legal status — if either side withdraws, the whole Executive, and often the Assembly itself, can collapse, triggering periods of direct rule from Westminster, as happened in 2017–2020 and 2022–2024.",
    url: "https://www.niassembly.gov.uk/",
  },
];

export default function DevolvedAdministrations() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconDevolved}
        kicker="Public Record · Devolved Administrations"
        title="Beyond Westminster"
        subtitle="This site otherwise covers the UK Parliament at Westminster — but Scotland, Wales, and Northern Ireland each have their own devolved legislature with real law-making power. Click any of the three below for how they actually work, and how they relate to Westminster."
      />

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        {ADMINISTRATIONS.map((a, i) => {
          const open = openIndex === i;
          return (
            <motion.div
              key={a.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
              whileHover={{ y: -2, boxShadow: "0 10px 24px rgba(20,30,32,0.10)", transition: { duration: 0.15, delay: 0 } }}
              style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `4px solid ${a.accent}`, borderRadius: 14, boxShadow: "0 1px 4px rgba(20,30,32,0.05)" }}
            >
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                style={{ display: "block", width: "100%", background: "none", border: "none", padding: "22px 24px", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, marginBottom: 2 }}>{a.name}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft }}>{a.place}</div>
                  </div>
                  <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: COLORS.inkSoft, fontSize: 13, marginTop: 6 }}>▾</motion.span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 14, marginBottom: 14 }}>
                  <Field label="Established">{a.established}</Field>
                  <Field label="Members">{a.members}</Field>
                  <Field label="Led by">{a.led}</Field>
                </div>

                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.65, marginBottom: 8 }}>{a.powers}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6 }}>{a.reserved}</div>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 24px 24px" }}>
                      <div style={{ paddingTop: 18, borderTop: `1px solid ${COLORS.hairline}`, display: "flex", flexDirection: "column", gap: 16 }}>
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05, duration: 0.25 }}>
                          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: a.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                            How its laws actually get made
                          </div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.65 }}>{a.process}</div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.25 }}>
                          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 10.5, color: a.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                            How it works with Westminster
                          </div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, lineHeight: 1.65 }}>{a.relationship}</div>
                        </motion.div>
                        <motion.a
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.18, duration: 0.25 }}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: a.accent }}
                        >
                          Visit official site ↗
                        </motion.a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
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
