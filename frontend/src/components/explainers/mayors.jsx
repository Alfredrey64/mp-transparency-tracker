/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconMayor } from "../newIcons";

const PAGE = {
  icon: IconMayor,
  kicker: "Your area & your say",
  title: "Mayors and regional authorities",
  subtitle: "Between your council and Parliament there is now a third layer in much of England: a regional authority, often led by a directly elected mayor. This page explains what the law says they are for and where to check whether your area has one.",
  tiles: [
    { label: "Areas of responsibility named in the 2026 Act", value: "9", colour: "#6FB1FF", sub: "from transport to public safety and culture" },
    { label: "The law that sets them up", value: "2026", colour: "#FFB45E", sub: "English Devolution and Community Empowerment Act" },
    { label: "Time an MP who wins has to choose", value: "8 days", colour: "#FF7A8A", sub: "elected UK legislators can't hold a combined authority mayoralty" },
  ],
  why: { colour: "#5A7FA6", text: "Decisions on buses, housing, skills and soon policing are moving from Whitehall and from individual councils to regional mayors. Many people could not name theirs." },
  chapters: [
    {
      title: "What a strategic authority is",
      lede: "The 2026 Act gives the regional tier one name: strategic authorities.",
      colour: "#5A7FA6",
      blocks: [
        { text: [
          "A strategic authority is a single foundation strategic authority, a combined foundation strategic authority, or a mayoral strategic authority. Mayoral ones are the combined authorities and combined county authorities led by a mayor, and London's Greater London Authority.",
          "A combined authority is set up by two or more local councils. It does not replace them: the councils carry on, and the authority takes on powers and funding the government hands to the area.",
        ] },
        { chips: { items: [
          "Transport and local infrastructure",
          "Skills and employment support",
          "Housing and strategic planning",
          "Economic development and regeneration",
          "The environment and climate change",
          "Health, well-being and public service reform",
          "Public safety",
          "Culture",
          "Rural affairs and coastal communities",
        ], note: "The nine \"areas of competence\" listed in section 2 of the Act." } },

      ],
    },
    {
      title: "What a mayor can do",
      lede: "The mayor is the one person who answers for these areas, and the one you vote for.",
      colour: "#3F7D5C",
      blocks: [
        { cards: [
          { title: "Convene local partners", text: "A mayor has the power to call meetings of local partners, and a duty to work with other bodies in the area." },
          { title: "Appoint commissioners", text: "Mayors can appoint commissioners to lead on particular areas of work, with guidance on allowances for the roles." },
          { title: "Planning of strategic importance", text: "The Act gives mayors a say on planning applications of potential strategic importance. That part was not in force when it became law, and the government was still consulting on how it should work in August 2026." },
          { title: "Money", text: "The Act includes powers over precepts, which are a charge added to the council tax bill, and over borrowing." },
        ] },
        { note: "The Act also bans a member of any UK legislature, such as an MP, from being mayor of a combined authority, with a short period of grace of eight days for someone elected to both." },
      ],
    },
    {
      title: "London is the model",
      lede: "The Mayor of London has had these kinds of powers for longer than anyone.",
      colour: "#9C6B30",
      blocks: [
        { text: ["London's Greater London Authority provides London-wide government, including special responsibility for police, fire, strategic planning and transport. The 32 London boroughs provide nearly all the other services in their areas."] },
        { text: [<>Outside London, the picture changes as new authorities are set up and new mayors are elected, so any list written today can be out of date within months. The government's local government guidance and the Electoral Commission's election pages are the places to check which authority and mayor cover your area. To see who runs your council, use <a href="#/councils">your council</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "English Devolution and Community Empowerment Act 2026 (c. 23)", url: "https://www.legislation.gov.uk/ukpga/2026/23/contents", note: "The meaning of strategic authority (section 1), the nine areas (section 2), mayors' powers and the rule on legislators (section 17)." },
    { label: "GOV.UK: local government structure and elections", url: "https://www.gov.uk/guidance/local-government-structure-and-elections", note: "How combined authorities work, and the Greater London Authority's responsibilities. Its list of combined authorities was last updated in 2023." },
    { label: "GOV.UK: planning powers for mayors in England (consultation, August 2026)", url: "https://www.gov.uk/government/consultations/planning-powers-for-mayors-in-england" },
  ],
  checked: "28 October 2026",
};

export default function Mayors() {
  return <ExplainerPage {...PAGE} />;
}
