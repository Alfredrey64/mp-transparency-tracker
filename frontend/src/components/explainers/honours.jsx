/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconPeerage } from "../newIcons";

const PAGE = {
  icon: IconPeerage,
  kicker: "Money & influence",
  title: "Peerages and honours",
  subtitle: "Nobody is elected to the House of Lords. This page shows who sits there, how a person gets in, what the law says about buying a title, and where to look if you want to follow the money.",
  tiles: [
    { label: "Members of the House of Lords", value: "816", colour: "#C9A6E8", sub: "on 28 October 2026, from the Parliament members list" },
    { label: "Hereditary peers still sitting", value: "0", colour: "#FFB45E", sub: "a 2026 Act ended their right to sit" },
    { label: "Women in the Lords", value: "35%", colour: "#6FB1FF", sub: "289 of 816, against 41% in the Commons" },
  ],
  why: { colour: "#6E4B6E", text: "A peerage is a seat in Parliament for life, handed out by the Prime Minister and the party leaders. It is one of the few places in politics where patronage still decides who takes part in making laws." },
  chapters: [
    {
      title: "Who is in the House of Lords today",
      lede: "A chamber of 816 members, none of them chosen by voters.",
      colour: "#6E4B6E",
      blocks: [
        { bars: { items: [
          { label: "Conservative", value: 247, text: "247", colour: "#1E4FB8" },
          { label: "Labour", value: 234, text: "234", colour: "#C13A4E" },
          { label: "Crossbench (no party)", value: 161, text: "161", colour: "#6E4B6E" },
          { label: "Liberal Democrat", value: 80, text: "80", colour: "#E8741A" },
          { label: "Non-affiliated", value: 53, text: "53", colour: "#5B6784" },
          { label: "Bishops", value: 25, text: "25", colour: "#3F7D5C" },
          { label: "Other", value: 16, text: "16", colour: "#9C6B30" },
        ], note: "Members by group on 28 October 2026. \"Other\" is the smaller parties (the DUP, Ulster Unionists, Greens and Plaid Cymru), the Lord Speaker and two peers listed as independent members of a party." } },
        { facts: [
          { label: "Life peers", value: "785", note: "Appointed for life. They cannot pass the title on." },
          { label: "Bishops", value: "25", note: "Senior Church of England bishops, who sit while they hold office." },
          { label: "Judicial life peers", value: "6", note: "Life peers who were appointed as senior judges (the Law Lords)." },
        ] },
        { text: ["The House of Lords (Hereditary Peers) Act 2026 removed the last hereditary peers, who used to sit because of who their ancestors were. The Parliament members list shows none among the 816."] },
      ],
    },
    {
      title: "How a person becomes a peer",
      lede: "The King makes the appointment, but on the advice of the Prime Minister.",
      colour: "#5A7FA6",
      blocks: [
        { steps: [
          { title: "Party leaders put names forward", text: "The leader of each party can nominate people to sit for that party. The Prime Minister decides which names go to the King." },
          { title: "An independent commission checks them", text: "The House of Lords Appointments Commission vets nominations for life peers, to make sure they meet high standards of propriety." },
          { title: "It also picks non-party peers", text: "The same Commission recommends people to sit as non-party-political life peers." },
          { title: "The Commission advises, it does not decide", text: "It is an advisory body sponsored by the Cabinet Office, so the final say on political nominations rests with the Prime Minister." },
        ] },
        { text: ["An outgoing Prime Minister can also submit a resignation honours list, by convention, which often includes peerages."] },
      ],
    },
    {
      title: "What the law says about buying a title",
      lede: "It has been a crime for a century.",
      colour: "#9C3B3B",
      blocks: [
        { pull: "Under the Honours (Prevention of Abuses) Act 1925 it is an offence to give or receive money in connection with the grant of a title of honour. The maximum penalty is two years in prison, a fine, or both." },
        { text: [
          "Giving money to a party is lawful, and so is being made a peer. The offence is a payment tied to the title. Showing that the two were linked is difficult, which is why open records of both the donations and the nominations matter.",
        ] },
      ],
    },
    {
      title: "Where to follow the money yourself",
      lede: "Three records, each on its own, and none that joins them up.",
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "Donations to parties", text: "The Electoral Commission register lists every donation above the reporting threshold. This site shows the party totals on the Who funds the parties page." },
          { title: "The peers' own interests", text: "Peers register their financial interests and Parliament publishes the register." },
          { title: "How peers vote", text: "The Lords votes page shows how loyal each peer is to their party and how often they rebel." },
        ] },
        { text: [<>You can read the pages on <a href="#/lords">the peers</a>, <a href="#/lordsVotes">how peers vote</a> and <a href="#/partyFinances">who funds the parties</a>. This page does not say which peers gave money, because a gift to a party and a peerage appearing in the same year is not evidence of a link, and the register does not show intent.</>] },
      ],
    },
  ],
  sources: [
    { label: "UK Parliament members list: House of Lords", url: "https://members.parliament.uk/members/lords", note: "The 816 members, their groups and gender on 28 October 2026, counted from the Parliament members API." },
    { label: "House of Lords (Hereditary Peers) Act 2026", url: "https://www.legislation.gov.uk/ukpga/2026/12/contents", note: "The Act that excluded the remaining hereditary peers." },
    { label: "GOV.UK: House of Lords Appointments Commission", url: "https://www.gov.uk/government/organisations/house-of-lords-appointments-commission", note: "What the Commission recommends and vets, and that it is advisory." },
    { label: "Honours (Prevention of Abuses) Act 1925", url: "https://www.legislation.gov.uk/ukpga/Geo5/15-16/72", note: "The offence and the two-year maximum penalty." },
  ],
  checked: "28 October 2026",
};

export default function Honours() {
  return <ExplainerPage {...PAGE} />;
}
