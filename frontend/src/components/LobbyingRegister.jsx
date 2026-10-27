import { useState, useMemo } from "react";
import { Board, Why, Chapter, Split, Pull, Cards } from "./story/Kit";
import { TwoRoutes, Iceberg } from "./story/LobbyArt";
import { COLORS, FONT_BODY, PAGE_PADDING, readable } from "../theme";
import { PageHeader } from "./shared";
import { GlossaryTerm } from "./GlossaryTerm";
import { formatDate } from "../lib/format";
import { IconRegister, IconShield, IconGavel, IconSearch } from "./icons";
import LOBBYISTS from "../data/consultantLobbyists.json";

const CASES = [
  {
    name: "Tony Blair Institute",
    color: readable("#5A7FA6"),
    period: "Investigated October–December 2025",
    detail: "Investigated over whether it had carried out unregistered consultant lobbying. The Registrar concluded it had not, in relation to the matter under investigation.",
  },
  {
    name: "Chamber Group",
    color: readable("#9C6B30"),
    period: "Investigated December 2025–February 2026",
    detail: "Also investigated for possible unregistered consultant lobbying, and also cleared: the Registrar found no breach in relation to the matter examined.",
  },
  {
    name: "George Freeman MP",
    color: readable("#3F7D5C"),
    period: "Investigated July–October 2025",
    detail: "Investigated after leaked emails reported by The Times appeared to show him discussing parliamentary questions with the director of GHGSat, a firm paying him as an adviser after he'd been explicitly advised by ACOBA not to lobby on its behalf. Cleared on the narrow lobbying-registration question. See the Revolving Door page for the fuller story.",
  },
];


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
  const [shown, setShown] = useState(24);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LOBBYISTS;
    return LOBBYISTS.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);
  return (
    <div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.65, margin: "0 0 16px", maxWidth: 760 }}>
        A snapshot taken by hand from the official register (see Data & Methodology for when). It shows who's registered, not who they lobbied for or when. Where a
        firm's general practice area is well-established public knowledge it is shown under the name: a broad category only, not a claim about a client or issue.
        Most firms are smaller consultancies this site can't confidently categorise, so they're left unlabelled rather than guessed at.
      </p>
      <div style={{ position: "relative", maxWidth: 440, marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}><IconSearch size={16} /></span>
        <input
          value={query} onChange={(e) => { setQuery(e.target.value); setShown(24); }} placeholder="Search by firm name" aria-label="Search the register"
          style={{ width: "100%", boxSizing: "border-box", padding: "0 14px 0 40px", minHeight: 50, fontFamily: FONT_BODY, fontSize: 16, border: `1.5px solid ${COLORS.hairline}`, borderRadius: 14, background: COLORS.paperCard, color: COLORS.ink }}
        />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 12 }} aria-live="polite">
        {filtered.length === 0 ? "No matches." : filtered.length === LOBBYISTS.length ? `All ${LOBBYISTS.length} registered firms` : `${filtered.length} of ${LOBBYISTS.length} firms match`}
      </div>
      <ul className="st-firms">
        {filtered.slice(0, shown).map((firm) => {
          const focus = LOBBYIST_FOCUS[firm.name];
          return (
            <li key={firm.name} className="st-firm">
              <b>{firm.name}</b>
              <span>{focus ?? "Practice area not stated here"}</span>
              <small>On the register since {formatDate(firm.registeredSince)}</small>
            </li>
          );
        })}
      </ul>
      {filtered.length > shown && <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}><button type="button" className="btn btn-secondary btn-lg" onClick={() => setShown((n) => n + 24)}>Show {Math.min(24, filtered.length - shown)} more of {filtered.length - shown} left</button></div>}
    </div>
  );
}

export default function LobbyingRegister() {
  return (
    <div className="st" style={{ paddingTop: PAGE_PADDING }}>
      <PageHeader
        icon={IconRegister}
        kicker="Transparency Gaps"
        title="The register of consultant lobbyists"
        subtitle="The UK's one statutory, public list of who is paid to lobby ministers on someone else's behalf. It is useful, but much narrower than most people assume."
        maxWidth={900}
      />

      <Board tiles={[
        { label: "Firms on the register", value: LOBBYISTS.length, colour: "#6FB1FF", sub: "paid to lobby ministers for someone else" },
        { label: "The year the register was created", value: "2014", colour: "#FF7A8A", sub: "by the Transparency of Lobbying Act" },
        { label: "Investigations explained below", value: CASES.length, colour: "#FFB45E", sub: "all of them cleared" },
      ]} />

      <Why icon={IconRegister} colour="#5A7FA6">
        This register makes one narrow slice of professional persuasion visible, but most real-world lobbying, done in-house by a company's own staff, leaves no
        public trace at all. Knowing exactly what this register does and doesn't cover is the only way to read it without being misled by its silences.
      </Why>

      <Chapter n={1} title={<>What '<GlossaryTerm term="Lobbying">lobbying</GlossaryTerm>' actually means</>} colour="#5A7FA6" lede="Trying to persuade someone in government to make a particular decision, support a bill, change a regulation, award a contract.">
        <Split visual={<TwoRoutes firms={LOBBYISTS.length} />}>
          <p>
            It isn't inherently improper: charities, trade unions, patient groups and residents' associations all lobby government too, not only corporations. The
            concern isn't that persuasion happens. It's whether the public can see who's doing it, for whom, and why, so a minister's eventual decision can be judged
            with that context in mind.
          </p>
          <p>This particular register only captures one specific slice of that activity: the top route in the picture.</p>
        </Split>
      </Chapter>

      <Chapter n={2} title="What has to be registered" colour="#3F7D5C" lede="One specific, narrow activity.">
        <Pull colour="#3F7D5C">
          A <strong>consultant lobbyist</strong>: a firm or individual paid by a client to lobby on their behalf, as opposed to lobbying for their own organisation, communicating <strong>directly and personally with a government minister or a department's permanent secretary</strong>. Every firm on the register files a quarterly return naming every client they lobbied for in that way, or confirms they had none.
        </Pull>
        <p className="st-note">The Transparency of Lobbying, Non-Party Campaigning and Trade Union Administration Act 2014 created this duty. A permanent secretary is the most senior civil servant in a department, who runs it day to day.</p>
      </Chapter>

      <Chapter n={3} title="Search the register yourself" colour="#5A7FA6" lede="Every firm currently registered as a consultant lobbyist.">
        <RegisterSearch />
      </Chapter>

      <Chapter n={4} title="The big gap: in-house lobbyists aren't covered at all" colour="#9C3B3B" lede="The rule only catches lobbying-for-hire.">
        <Split visual={<Iceberg firms={LOBBYISTS.length} />} flip>
          <p>
            A company's own government-affairs team, lobbying ministers directly on their employer's behalf, isn't "consultant" lobbying at all, and doesn't have to
            register or disclose anything. In-house teams are estimated to account for a larger share of all lobbying activity than the consultancies that actually
            appear on this register.
          </p>
          <p>
            This isn't a settled question: a <GlossaryTerm term="Private Member's Bill">private member's bill</GlossaryTerm>, the Lobbying Transparency (In-house Lobbyists) Bill, was introduced
            in the House of Lords in 2026 specifically to close this gap. The government has so far resisted widening the register to cover it.
          </p>
        </Split>
      </Chapter>

      <Chapter n={5} title="The register in action: real recent investigations" colour="#E8741A" lede="The Registrar can and does open investigations into whether lobbying should have been registered and wasn't. Three recent examples: all ultimately cleared, which is itself informative about how narrow the legal definition is.">
        <ul className="st-case-grid">
          {CASES.map((c) => (
            <li key={c.name} className="st-case" style={{ "--tc": c.color }}>
              <header><span className="st-avatar" aria-hidden="true">{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span><div><h3>{c.name}</h3><p>{c.period}</p></div></header>
              <section><h4>What the Registrar looked at</h4><p>{c.detail}</p></section>
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter n={6} title="Where this leaves you as a reader" colour="#9C6B30" lede="Three things to take away.">
        <Cards items={[
          { icon: IconShield, colour: "#3F7D5C", title: "On the register is a real signal", text: "If a firm appears on this register, that's a genuine, useful signal. It's telling you a client paid someone specifically to approach the very top of government." },
          { icon: IconSearch, colour: "#9C3B3B", title: "Absent tells you nothing", text: "If a company isn't on it, that tells you nothing either way: the vast majority of real-world lobbying, done in-house or aimed at officials below permanent secretary level, simply never has to appear here." },
          { icon: IconGavel, colour: "#5A7FA6", title: "A snapshot, not a live feed", text: "The list above was taken from the live register in September 2026 and is refreshed periodically by hand, not daily. For current, quarter-by-quarter client lists per firm, search the official register at registrarofconsultantlobbyists.org.uk." },
        ]} />
        <p className="st-note"><a href="https://registrarofconsultantlobbyists.org.uk/" target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>Open the official register</a></p>
      </Chapter>
    </div>
  );
}
