/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconPolice } from "../newIcons";
import { IconVote, IconShield, IconCouncil } from "../icons";
import { Journey, Diverge } from "../story/StateArt";
import { Hero, Dots } from "../story/Vivid";

const PAGE = {
  look: "vivid",
  icon: IconPolice,
  kicker: "Your area & your say",
  title: "Police and crime commissioners",
  subtitle: "Since 2012 voters in England and Wales have elected a commissioner to hold their police force to account. In November 2025 the government announced that the role will end. This page sets out what the announcement says and what has not yet been decided.",
  lead: <Hero
    siren
    colours={["#0E1F4D", "#2F6FE0", "#C2253F"]}
    why="Someone is supposed to answer to the public for how a police force is run. Who that is, and whether you vote for them, is about to change."
    stops={[
      { icon: IconVote, title: "Voters elect", text: "A commissioner, since 2012", colour: "#5BA8FF" },
      { icon: IconPolice, title: "The commissioner", text: "Holds the police force to account", colour: "#FF6B7F" },
      { icon: IconShield, title: "Your police force", text: "Answers to the public through them", colour: "#FFD166" },
    ]}
    figures={[
      { value: "2012", label: "Commissioners elected since", sub: "To hold their police force to account" },
      { value: "2028", label: "Announced to end", sub: "At the end of the next electoral cycle, the Home Office says" },
      { value: "2 in 5", label: "People unaware the role exists", sub: "The Home Office's own figure" },
    ]}
  />,
  chapters: [
    {
      title: "What the government has announced",
      lede: "The Home Office announced on 13 November 2025 that police and crime commissioners will be abolished.",
      colour: "#2F7BD6",
      blocks: [
        { node: <Journey colour="#2F7BD6" items={[
          { when: "2012", text: "The first commissioners are elected to hold forces to account." },
          { when: "13 November 2025", text: "The Home Office announces that the role will be abolished. It says this will save the taxpayer at least £100 million." },
          { when: "Until 2028", text: "Current commissioners carry on until they have completed their terms." },
          { when: "2028", text: "The move to the new model happens at the end of the next electoral cycle." },
        ]} /> },
        { node: <Diverge
          root={{ title: "The role ends", text: "Who takes it on depends on where you live", colour: "#2F6FE0", icon: IconPolice }}
          items={[
            { title: "Where there is a mayor", colour: "#12A07A", icon: IconShield, list: [
              "The commissioner's role is absorbed by the regional mayor wherever possible.",
              "Crime is then considered alongside other public services such as education and health.",
            ] },
            { title: "Where there is no mayor", colour: "#E8801F", icon: IconCouncil, list: [
              "The role is taken on by an elected council leader.",
              "Wales is treated separately: the government says it will take account of devolved arrangements there.",
            ] },
          ]}
        /> },
      ],
    },
    {
      title: "The reasons given, and what is not settled",
      lede: "The government has given its reasons, and the detail of the change is not yet settled.",
      colour: "#E8801F",
      blocks: [
        { node: <Dots
          title="How well known the role is"
          items={[{ label: "People unaware the role exists", text: "2 in 5", value: 40, colour: "#2F6FE0", note: "The Home Office's own figure." }]}
          note="Each dot is 1 in 100 people. Forty of them are lit."
        /> },
        { cards: [
          { title: "The government's case", text: "It says low turnout and low awareness mean the role has not worked, that at least £20 million a year could be reinvested in neighbourhood policing, and that mayors and council leaders are better placed to join policing to other services." },
          { title: "How the role began", text: "Commissioners were created by the Police Reform and Social Responsibility Act 2011, which became law in November 2011. The first elections were held in 2012." },
          { title: "What is not settled", text: "The announcement says victim and witness support services run by commissioners will continue. When this page was checked, the Bills before Parliament did not include one making the change, so the detail may change." },
        ] },
        { note: "Policing in Scotland and Northern Ireland is run differently. Scotland has the Scottish Police Authority and Northern Ireland has its Policing Board." },
      ],
    },
    {
      title: "What to do now",
      lede: "Until the change happens your commissioner is still the person responsible.",
      colour: "#12A07A",
      blocks: [
        { text: [<>You can find your force's commissioner on the force's own website. To see the other elected bodies for your area, use <a href="#/myArea">your area</a> and <a href="#/mayors">mayors and regional authorities</a>.</>] },
      ],
    },
  ],
  sources: [
    { label: "GOV.UK: Police and crime commissioners to be scrapped (13 November 2025)", url: "https://www.gov.uk/government/news/police-and-crime-commissioners-to-be-scrapped", note: "The abolition, the 2028 timing, mayors and council leaders, the £100 million saving and the two in five figure." },
    { label: "UK Parliament Bills", url: "https://bills.parliament.uk/", note: "Where to check whether a bill making the change has been introduced." },
  ],
  checked: "28 October 2026",
};

export default function PoliceCommissioners() {
  return <ExplainerPage {...PAGE} />;
}
