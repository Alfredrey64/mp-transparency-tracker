/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconCourt } from "../newIcons";
import { IconBook, IconGavel, IconScales, IconShield, IconManifesto } from "../icons";
import { Converge, Flow, Seats } from "../story/StateArt";

const PAGE = {
  look: "poster",
  icon: IconCourt,
  kicker: "Understand it",
  title: "Courts and the constitution",
  subtitle: "The United Kingdom has no single written constitution. What stands in for one is a set of Acts, court decisions and conventions. This page covers what judges can and cannot do to an Act of Parliament, and the rules that protect them from pressure.",
  tiles: [
    { label: "Most judges the Supreme Court can have", value: "12", colour: "#6FB1FF", sub: "counted in full-time equivalent terms, set by law" },
    { label: "Acts of Parliament a court can strike down", value: "0", colour: "#FF7A8A", sub: "it can only declare one incompatible with human rights" },
    { label: "Ministers must uphold judicial independence", value: "By law", colour: "#3F7D5C", sub: "Constitutional Reform Act 2005, section 3" },
  ],
  why: { colour: "#5A7FA6", text: "When the courts rule against the government, it can look like judges are overruling voters. Knowing what the courts can actually do explains why, and why ministers are barred from leaning on them." },
  chapters: [
    {
      title: "No single document",
      lede: "The rules about who holds power are spread over many places.",
      colour: "#5A7FA6",
      blocks: [
        { node: <Converge
          sources={[
            { title: "Acts of Parliament", text: "Ordinary laws that set up the courts, the Supreme Court, devolved parliaments and how the Civil Service is run.", colour: "#5A7FA6", icon: IconBook },
            { title: "Court decisions", text: "Judgments by the highest courts explain how those laws apply, and sometimes what the limits of government power are.", colour: "#9C6B30", icon: IconGavel },
            { title: "Conventions", text: "Habits that are followed but not written as law, such as the King giving Royal Assent to laws Parliament has passed.", colour: "#6E4B6E", icon: IconManifesto },
          ]}
          result={{ title: "The rules about who holds power", text: "There is no single document", colour: "#2F4A6B" }}
        /> },
        { text: ["Because any ordinary Act can change the rest, Parliament is described as sovereign: it can make or unmake any law. The courts apply the laws Parliament passes."] },
      ],
    },
    {
      title: "What judges can do about an Act",
      lede: "The Human Rights Act 1998 gives senior courts one tool, and it is deliberately limited.",
      colour: "#9C3B3B",
      blocks: [
        { node: <Flow items={[
          { title: "A court finds a clash", text: "A provision in an Act cannot be read in a way that fits human rights.", colour: "#5A7FA6", icon: IconScales },
          { title: "It makes a declaration", text: "A declaration of incompatibility. It cannot strike the Act down.", colour: "#9C6B30", icon: IconGavel },
          { title: "The law carries on", text: "The declaration does not affect the validity, continuing operation or enforcement of the provision.", colour: "#9C3B3B", icon: IconShield },
          { title: "Parliament decides", text: "The declaration is not binding on the parties. It is for Parliament and ministers to decide what happens next.", colour: "#3F7D5C", icon: IconBook },
        ]} /> },
        { compare: [
          { title: "What a court can do", colour: "#3F7D5C", items: [
            "Decide whether a government decision or a minister's regulation is lawful.",
            "Where a provision in an Act cannot be read in a way that fits human rights, make a declaration of incompatibility.",
          ] },
          { title: "What it cannot do", colour: "#9C3B3B", items: [
            "Strike down an Act of Parliament.",
            "Stop the law being applied: a declaration of incompatibility does not affect the validity, continuing operation or enforcement of the provision.",
            "Bind the parties: the declaration is not binding on them. It is for Parliament and ministers to decide what happens next.",
          ] },
        ] },
        { note: "The courts that can make a declaration include the Supreme Court, the Court of Appeal and the High Court in England and Wales and Northern Ireland, and the Court of Session in Scotland." },
      ],
    },
    {
      title: "Keeping judges independent",
      lede: "The Constitutional Reform Act 2005 put the rule into law, and set up a separate Supreme Court.",
      colour: "#6E4B6E",
      blocks: [
        { pull: "The Lord Chancellor, other ministers and everyone with responsibility for the courts or the administration of justice must uphold the independence of the judiciary. Ministers must not try to influence particular judicial decisions through any special access to judges." },
        { node: <Seats count={12} label="The most judges the Supreme Court can have, counted in full-time equivalent terms" /> },
        { text: ["The Supreme Court of the United Kingdom is the final court of appeal. Its judges are appointed by the King, and the law caps the court at 12 judges in full-time equivalent terms, though that number can be raised by an Order in Council if both Houses of Parliament approve."] },
      ],
    },
  ],
  sources: [
    { label: "Human Rights Act 1998, section 4: declaration of incompatibility", url: "https://www.legislation.gov.uk/ukpga/1998/42/section/4", note: "Which courts can make one, and that it does not affect the validity of the law or bind the parties." },
    { label: "Constitutional Reform Act 2005, section 3: guarantee of continued judicial independence", url: "https://www.legislation.gov.uk/ukpga/2005/4/section/3" },
    { label: "Constitutional Reform Act 2005, section 23: the Supreme Court", url: "https://www.legislation.gov.uk/ukpga/2005/4/section/23", note: "The maximum of 12 full-time equivalent judges and how it can be changed." },
  ],
  checked: "28 October 2026",
};

export default function Constitution() {
  return <ExplainerPage {...PAGE} />;
}
