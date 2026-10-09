import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";
import { PageHeader, InfoCard, WhyItMattersBand, ScaleComparison } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { formatDate } from "../lib/format";
import { IconRegister, IconGroup, IconShield, IconGavel, IconSearch } from "./icons";
import LOBBYISTS from "../data/consultantLobbyists.json";

// The whole point of the page, as a picture: a small, fully-counted sliver
// that's actually visible, next to a much larger amount of lobbying that
// simply isn't measured at all. The second bar is hatched rather than
// solid on purpose — its size is illustrative of "bigger and unknown", not
// a real figure, since nobody actually counts in-house lobbying.
const VISIBILITY_BARS = [
  { label: "Registered consultant lobbying", caption: `${LOBBYISTS.length} firms, fully visible`, color: "#5A7FA6", width: 14 },
  { label: "In-house lobbying by companies' own staff", caption: "Unmeasured: no register covers it", color: "#9C3B3B", width: 94, hatched: true },
];

const CASES = [
  {
    name: "Tony Blair Institute",
    color: "#5A7FA6",
    period: "Investigated October–December 2025",
    detail: "Investigated over whether it had carried out unregistered consultant lobbying. The Registrar concluded it had not, in relation to the matter under investigation.",
  },
  {
    name: "Chamber Group",
    color: "#9C6B30",
    period: "Investigated December 2025–February 2026",
    detail: "Also investigated for possible unregistered consultant lobbying, and also cleared: the Registrar found no breach in relation to the matter examined.",
  },
  {
    name: "George Freeman MP",
    color: "#3F7D5C",
    period: "Investigated July–October 2025",
    detail: "Investigated after leaked emails reported by The Times appeared to show him discussing parliamentary questions with the director of GHGSat, a firm paying him as an adviser after he'd been explicitly advised by ACOBA not to lobby on its behalf. Cleared on the narrow lobbying-registration question. See the Revolving Door page for the fuller story.",
  },
];

const DISPLAY_CAP = 60;

// This register itself doesn't say what a firm lobbies about or for whom
// — only that they're registered at all (see the intro paragraph below).
// Rather than guess at a specific focus for all 257 firms, many of which
// are small or boutique consultancies with no public track record this
// site can verify, this only tags the subset whose general practice area
// is genuinely, confidently public knowledge — a broad category (the kind
// of thing the firm's own website states), never a specific client or
// issue. The great majority of firms are deliberately left untagged
// rather than assigned a guessed specialism.
const LOBBYIST_FOCUS = {
  "APCO Worldwide Ltd": "Global public affairs & corporate communications",
  "Brunswick Group Advisory Ltd": "Financial & corporate communications",
  "Cavendish Consulting Limited": "General public affairs",
  "Charlotte Street Partners Limited": "Scotland-focused public affairs",
  "Chelgate Limited": "Corporate & public affairs",
  "Cicero Consulting Limited": "Financial & corporate public affairs",
  "CMS Cameron McKenna Nabarro Olswang LLP": "Law firm, regulatory & public policy",
  "Cooley (UK) LLP": "Law firm, technology & life sciences",
  "Covington & Burling LLP": "Law firm, regulatory & international trade",
  "Daniel J Edelman Limited": "Global PR & communications",
  "Deloitte LLP": "Big Four, tax, audit & policy advisory",
  "DLA Piper UK LLP": "Law firm, regulatory & public policy",
  "Ernst & Young LLP (EY)": "Big Four, tax, audit & policy advisory",
  "FGS Global (UK) Limited": "Financial & corporate communications",
  "Fleishman-Hillard Group Limited": "Global PR & public affairs",
  "Fragomen LLP": "Immigration law & policy",
  "FTI Consulting LLP": "Business advisory & strategic communications",
  "Grayling Communications Limited": "Global PR & public affairs",
  "Hanbury Strategy and Communications Limited": "General public affairs & polling",
  "Hanover Communications International Limited": "Corporate & public affairs",
  "Headland Consultancy Limited": "Financial & corporate communications",
  "Hume Brophy Communications (UK) Ltd": "EU & UK public affairs",
  "Incisive Health Ltd": "Health & life sciences policy",
  "Independent Automotive Aftermarket Federation": "Automotive aftermarket trade body",
  "iNHouse Communications Limited": "Health & life sciences PR",
  "KPMG LLP": "Big Four, tax, audit & policy advisory",
  "Kreab Limited": "Financial & corporate communications",
  "Lexington Communications Limited": "Financial & corporate communications",
  "MAP Patient Access Limited": "Pharmaceutical patient-access policy",
  "MHP Communications": "Corporate & public affairs",
  "Milltown Partners GBR Limited": "Technology & reputation advisory",
  "Mishcon de Reya LLP": "Law firm, regulatory & public policy",
  "Norton Rose Fulbright LLP": "Law firm, regulatory & public policy",
  "Pinsent Masons LLP": "Law firm, regulatory & public policy",
  "Policy Connect Limited": "Cross-party policy & research forum",
  "Portland PR Limited": "Corporate & public affairs",
  "Powerscourt Limited": "Financial & corporate communications",
  "PricewaterhouseCoopers LLP (PWC)": "Big Four, tax, audit & policy advisory",
  "Public First Limited": "Polling & public affairs",
  "Red Flag Consulting Limited": "Corporate & reputation advisory",
  "SEC Newgate UK Limited": "Corporate & public affairs",
  "Shoosmiths LLP": "Law firm, regulatory & public policy",
  "SME4Labour Limited": "Small-business advocacy (Labour-affiliated)",
  "Tavistock Communications Limited": "Financial & corporate communications",
  "Teneo Strategy Limited": "Corporate advisory & communications",
  "The Green Alliance Trust": "Environmental policy",
  "WPP Brands (UK) Limited": "Marketing, advertising & communications group",
};

function RegisterSearch() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LOBBYISTS;
    return LOBBYISTS.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  const shown = filtered.slice(0, DISPLAY_CAP);

  return (
    <div style={{ marginBottom: 32, maxWidth: "none" }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
        Search the register yourself
      </h2>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
        Every firm currently registered as a consultant lobbyist: a snapshot taken by hand from the official
        register (see Data & Methodology for exactly when). This list shows who's registered, not who they
        lobbied for or when; tap "official register" on any Data & Methodology source row for a firm's live,
        quarter-by-quarter client list. Where a firm's general practice area is well-established public knowledge,
        it's shown alongside their name: a broad category only, not a claim about a specific client or issue (the
        register itself doesn't disclose that, and most firms below are smaller consultancies this site can't
        confidently categorise, so they're left unlabelled rather than guessed at).
      </p>

      <div style={{ position: "relative", maxWidth: 420, marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
          <IconSearch size={15} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by firm name…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 36px", fontFamily: FONT_BODY, fontSize: 13.5,
            border: `1px solid ${COLORS.hairline}`, borderRadius: 10, background: COLORS.paperCard, color: COLORS.ink,
          }}
        />
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginBottom: 10 }}>
        {filtered.length === 0
          ? "No matches."
          : `Showing ${shown.length} of ${filtered.length}${filtered.length !== LOBBYISTS.length ? ` matching firms (${LOBBYISTS.length} total)` : " registered firms"}.`}
      </div>

      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 440px), 1fr))", alignContent: "start", gap: 0, maxHeight: 420, overflowY: "auto",
          border: `1px solid ${COLORS.hairline}`, borderRadius: 12, background: COLORS.paperCard,
        }}
      >
        {shown.map((firm, i) => {
          const focus = LOBBYIST_FOCUS[firm.name];
          return (
            <div
              key={firm.name}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 16px",
                borderBottom: i < shown.length - 1 ? `1px solid ${COLORS.hairline}` : "none",
              }}
            >
              <span style={{ minWidth: 0, overflow: "hidden" }}>
                <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {firm.name}
                </span>
                {focus && (
                  <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 11, color: "#5A7FA6", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {focus}
                  </span>
                )}
              </span>
              <span style={{ flexShrink: 0, fontFamily: FONT_MONO, fontSize: 11, color: COLORS.inkSoft }}>
                since {formatDate(firm.registeredSince)}
              </span>
            </div>
          );
        })}
      </div>

      {filtered.length > DISPLAY_CAP && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, marginTop: 10 }}>
          Showing the first {DISPLAY_CAP} matches. Narrow your search to see a specific firm.
        </div>
      )}
    </div>
  );
}

export default function LobbyingRegister() {
  return (
    <div className="editorial" style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconRegister}
        kicker="Transparency Gaps"
        title="The register of consultant lobbyists"
        subtitle="The UK's one statutory, public list of who is paid to lobby ministers on someone else's behalf. It is useful, but much narrower than most people assume."
        maxWidth={900}
      />

      <div className="editorial-body">

      <WhyItMattersBand icon={IconRegister} color="#5A7FA6">
        this register makes one narrow slice of professional persuasion visible, but most real-world lobbying,
        done in-house by a company's own staff, leaves no public trace at all. Knowing exactly what this register
        does and doesn't cover is the only way to read it without being misled by its silences.
      </WhyItMattersBand>

      <ScaleComparison bars={VISIBILITY_BARS} />

      <InfoCard title={<>What '<GlossaryTerm term="Lobbying">lobbying</GlossaryTerm>' actually means</>} color="#5A7FA6" icon={IconGroup} index={0}>
        <p style={{ marginTop: 0 }}>
          Lobbying just means trying to persuade someone in government to make a particular decision, support a
          bill, change a regulation, award a contract. It isn't inherently improper: charities, trade unions,
          patient groups and residents' associations all lobby government too, not only corporations. The concern
          isn't that persuasion happens. It's whether the public can see who's doing it, for whom, and why, so a
          minister's eventual decision can be judged with that context in mind.
        </p>
        <p style={{ marginBottom: 0 }}>
          This particular register only captures one specific slice of that activity. Read on for exactly which.
        </p>
      </InfoCard>

      <InfoCard title="What has to be registered" color="#3F7D5C" icon={IconRegister} index={1}>
        The Transparency of Lobbying, Non-Party Campaigning and Trade Union Administration Act 2014 created a
        statutory duty for one specific, narrow activity: a{" "}
        <strong style={{ color: COLORS.ink }}>consultant lobbyist</strong>: a firm or individual paid by a client to
        lobby on their behalf, as opposed to lobbying for their own organisation, communicating{" "}
        <strong style={{ color: COLORS.ink }}>directly and personally with a government minister or a department's
        permanent secretary</strong> (the most senior civil servant in that department, who runs it day to day).
        Every firm on the register has to file a quarterly return naming every client they lobbied for in that way,
        or confirm they had none.
      </InfoCard>

      <RegisterSearch />

      <InfoCard title="The big gap: in-house lobbyists aren't covered at all" color="#9C3B3B" icon={IconGavel} index={2} wide>
        <p style={{ marginTop: 0 }}>
          The rule only catches lobbying-for-hire. A company's own government-affairs team, lobbying ministers
          directly on their employer's behalf, isn't "consultant" lobbying at all, and doesn't have to register or
          disclose anything. In-house teams are estimated to account for a larger share of all lobbying activity
          than the consultancies that actually appear on this register.
        </p>
        <p style={{ marginBottom: 0 }}>
          This isn't a settled question: a <GlossaryTerm term="Private Member's Bill">private member's bill</GlossaryTerm>, the Lobbying Transparency (In-house Lobbyists)
          Bill, was introduced in the House of Lords in 2026 specifically to close this gap. The government has so
          far resisted widening the register to cover it.
        </p>
      </InfoCard>

      <div style={{ marginBottom: 24, maxWidth: "none" }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 4 }}>
          The register in action: real recent investigations
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 0, marginBottom: 16 }}>
          The Registrar can and does open investigations into whether lobbying should have been registered and
          wasn't. Three recent examples: all ultimately cleared, which is itself informative about how narrow the
          legal definition is.
        </p>
        <div className="ed-list">
          {CASES.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderLeft: `3px solid ${item.color}`, borderRadius: 12, padding: "16px 20px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink }}>{item.name}</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: item.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {item.period}
                </span>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6 }}>{item.detail}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <InfoCard title="Where this leaves you as a reader" color="#9C6B30" icon={IconShield} index={3} wide>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 8 }}>
            If a firm appears on this register, that's a genuine, useful signal. It's telling you a client paid
            someone specifically to approach the very top of government.
          </li>
          <li style={{ marginBottom: 8 }}>
            If a company <em>isn't</em> on it, that tells you nothing either way: the vast majority of real-world
            lobbying, done in-house or aimed at officials below permanent secretary level, simply never has to
            appear here.
          </li>
          <li>
            The list above was taken from the live register in September 2026 and is refreshed periodically by
            hand, not daily, for current, quarter-by-quarter client lists per firm, search the{" "}
            <a href="https://registrarofconsultantlobbyists.org.uk/" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              official register itself ↗
            </a>
            .
          </li>
        </ul>
      </InfoCard>
      </div>
    </div>
  );
}
