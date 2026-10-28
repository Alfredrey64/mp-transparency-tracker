/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconAudit } from "../newIcons";

const PAGE = {
  icon: IconAudit,
  kicker: "Understand it",
  title: "Watchdogs and inquiries",
  subtitle: "Three kinds of body check what the government says and does with public money. One audits the accounts, one forecasts whether the sums add up, and a public inquiry can be set up after something has gone wrong. This page explains each and what it can and cannot do.",
  tiles: [
    { label: "Accounts the National Audit Office audits each year", value: "about 400", colour: "#6FB1FF", sub: "plus about 60 value-for-money reports" },
    { label: "Forecasts the Office for Budget Responsibility must make", value: "2 a year", colour: "#FFB45E", sub: "at least, by law" },
    { label: "Refusing to hand over evidence to an inquiry", value: "A crime", colour: "#FF7A8A", sub: "if there is no reasonable excuse" },
  ],
  why: { colour: "#5A7FA6", text: "Ministers answer to Parliament, but Parliament cannot check every account or sum. These bodies exist to do that, and each is deliberately kept at a distance from the government of the day." },
  chapters: [
    {
      title: "The National Audit Office",
      lede: "The public spending watchdog, which reports to Parliament rather than to ministers.",
      colour: "#5A7FA6",
      blocks: [
        { facts: [
          { label: "Audit opinions each year", value: "about 400", note: "Accounts of all government departments, executive agencies, arm's-length bodies and some companies and charities." },
          { label: "Value-for-money reports", value: "about 60", note: "Each one asks whether government is delivering value for money." },
        ] },
        { text: [
          "The NAO says it is independent of government and the civil service. A committee of MPs, the Public Accounts Commission, oversees its work. It supports the Public Accounts Committee and other select committees in holding government to account.",
          "It examines how government spends money delivering its policies, but says its role is not to question the objectives of those policies.",
        ] },
        { text: [<>An example of its work is the audit of emergency contracts in 2020, on the <a href="#/govContracts">government contracts</a> page.</>] },
      ],
    },
    {
      title: "The Office for Budget Responsibility",
      lede: "An official forecaster, set up by law so that the Budget's sums are checked by someone other than the Treasury.",
      colour: "#9C6B30",
      blocks: [
        { cards: [
          { title: "Its duty", text: "To examine and report on the sustainability of the public finances." },
          { title: "At least twice a year", text: "It must prepare fiscal and economic forecasts on at least two occasions each financial year." },
          { title: "It checks itself", text: "At least once a year it must assess how accurate its own earlier forecasts were, and analyse the sustainability of the public finances." },
        ] },
        { text: ["Its reports must say what assumptions it made and what main risks it considered. The Budget Responsibility Act 2024 and the Finance Act 2026 have amended the original law of 2011, so check the legislation for the current duties."] },
      ],
    },
    {
      title: "Public inquiries",
      lede: "When events cause public concern, a minister can set up an inquiry with legal powers.",
      colour: "#9C3B3B",
      blocks: [
        { steps: [
          { title: "A minister sets it up", text: "Under the Inquiries Act 2005 a UK, Scottish, Welsh or Northern Ireland minister can cause an inquiry to be held when events have caused, or could cause, public concern." },
          { title: "The chair can demand evidence", text: "The chair can require a person to attend to give evidence and to produce documents relating to the inquiry's work." },
          { title: "Refusing is an offence", text: "Failing without reasonable excuse to do what a notice requires is a criminal offence, as is altering or preventing evidence." },
          { title: "The report is made public", text: "What the Act requires to be published must be laid before Parliament by the minister, at the time of publication or as soon as is reasonably practicable." },
        ] },
        { note: "An inquiry makes findings and recommendations. It does not punish anyone: that is for the courts, regulators and employers." },
      ],
    },
  ],
  sources: [
    { label: "National Audit Office: About us", url: "https://www.nao.org.uk/about-us/", note: "Independence, the Public Accounts Commission, about 400 accounts and about 60 value-for-money reports a year." },
    { label: "Budget Responsibility and National Audit Act 2011, section 4: main duty of the OBR", url: "https://www.legislation.gov.uk/ukpga/2011/4/section/4", note: "The duty, the two forecasts a year and the yearly accuracy check." },
    { label: "Inquiries Act 2005, section 1: power to establish inquiry", url: "https://www.legislation.gov.uk/ukpga/2005/12/section/1" },
    { label: "Inquiries Act 2005, section 21: powers to require evidence", url: "https://www.legislation.gov.uk/ukpga/2005/12/section/21" },
    { label: "Inquiries Act 2005, section 35: offences", url: "https://www.legislation.gov.uk/ukpga/2005/12/section/35" },
    { label: "Inquiries Act 2005, section 26: laying of reports", url: "https://www.legislation.gov.uk/ukpga/2005/12/section/26" },
  ],
  checked: "28 October 2026",
};

export default function Watchdogs() {
  return <ExplainerPage {...PAGE} />;
}
