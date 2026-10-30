/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconSignal } from "../newIcons";

const PAGE = {
  look: "poster",
  icon: IconSignal,
  kicker: "Rules and rights",
  title: "Digital and online safety",
  subtitle: "Most homes can now get gigabit broadband, and the rules for what children see online are changing. This page sets out how well connected the UK is, what the Online Safety Act has done so far, what the government plans for children and social media, and where the law on artificial intelligence stands.",
  tiles: [
    { label: "UK homes that can get gigabit broadband", value: "89%", colour: "#6FB1FF", sub: "in January 2026, up from 87% six months earlier" },
    { label: "Homes that can get full fibre", value: "82%", colour: "#FFB45E", sub: "24.9 million of the UK's 30.5 million" },
    { label: "Planned under-16 social media ban", value: "Spring 2027", colour: "#FF7A8A", sub: "when the government expects it to take effect, if Parliament agrees" },
  ],
  why: { colour: "#5A4FCF", text: "Being online is part of getting a job, a doctor's appointment or a benefit, and children spend much of their lives on screens. The rules about connection, content and age are being written now, by Parliament and by Ofcom." },
  chapters: [
    {
      title: "How well connected the UK is",
      lede: "Ofcom, the regulator, measures how many homes can get each kind of connection. The latest update was published on 13 May 2026 and covers January 2026.",
      colour: "#5A4FCF",
      blocks: [
        { bars: { items: [
          { label: "Gigabit-capable broadband", value: 89, text: "89%", colour: "#5A4FCF" },
          { label: "Full fibre", value: 82, text: "82%", colour: "#3F7D5C" },
        ], max: 100, note: "Share of UK homes. Gigabit-capable means a connection that can deliver 1,000 megabits a second; full fibre means a fibre cable all the way to the property." } },
        { facts: [
          { label: "Gigabit homes", value: "27.1m", note: "Up from 26.4 million in July 2025." },
          { label: "Full fibre homes", value: "24.9m", note: "An extra 1.2 million homes in six months." },
          { label: "Without decent broadband", value: "39,000", note: "Premises that cannot get at least 10 Mbit/s down and 1 Mbit/s up from a fixed line or fixed wireless, down from 44,000. Counting satellite, Ofcom says only 4,000 cannot get affordable decent broadband." },
        ] },
      ],
    },
    {
      title: "The Online Safety Act, so far",
      lede: "The Online Safety Act 2023 gave Ofcom the job of making online services protect users, with a focus on children. Ofcom publishes what it does.",
      colour: "#B45A3C",
      blocks: [
        { text: ["Services that allow pornography must use \"highly effective\" age checks to stop children seeing it. Ofcom has fined providers that did not have checks and has opened investigations into others."] },
        { timeline: [
          { when: "19 June 2026", text: "Ofcom fines First Time Videos LLC £80,000 for having no age checks. The money goes to the Treasury." },
          { when: "July 2026", text: "Ofcom fines the provider of fapello.com £630,000, and opens an investigation into TikTok's duties to protect children from harmful content." },
          { when: "September 2026", text: "Ofcom fines the provider of Xgroovy.com £730,000, opens an investigation into Aylo (which runs Pornhub), and starts a programme of checks on how services stop intimate images being shared without consent." },
          { when: "October 2026", text: "Ofcom opens an investigation into Meta over whether it completed suitable risk assessments before launching Instants on Instagram." },
        ] },
        { note: "These are Ofcom's own published cases. They are a list of what it has announced, not a measure of how much harm online has fallen or how well services comply overall." },
      ],
    },
    {
      title: "Children and social media: the plan",
      lede: "On 15 June 2026 the government announced that it plans to stop social media services offering accounts to children under 16.",
      colour: "#7B5BD6",
      blocks: [
        { compare: [
          { title: "What the government plans", colour: "#7B5BD6", items: [
            "Social media platforms barred from offering services to under-16s, on the Australian model. Named examples are Snapchat, TikTok, YouTube, Instagram, Facebook and X.",
            "Livestreaming and contact from strangers blocked for under-16s on a wider range of services, including gaming sites, and switched on by default for 16 and 17 year olds.",
            "AI \"romantic companion\" chatbots would have to enforce a minimum age of 18.",
            "Messaging services such as WhatsApp and Signal are not intended to be covered. Exemptions are planned for education, online shops and music streaming.",
          ] },
          { title: "What is already in force", colour: "#B45A3C", items: [
            "The Online Safety Act's duties on services to protect children, enforced by Ofcom.",
            "Ofcom's statement in August 2026 that \"existing safety duties remain fully in force\" while the ban is prepared.",
          ] },
        ] },
        { timeline: [
          { when: "15 June 2026", text: "The government announces its plan. More than 116,000 people responded to its consultation, and it says nine in ten parents supported an under-16 ban." },
          { when: "Before Christmas 2026", text: "The government plans to bring the decision to Parliament, using secondary legislation under the Children's Wellbeing and Schools Act rather than a new Act." },
          { when: "Spring 2027", text: "The protections are expected to come into force." },
        ] },
        { note: "It is a plan, not yet law. Ofcom has been asked to study what highly effective age checks for over-16s would look like, and to review how it enforces. How well a ban can be enforced is argued over." },
      ],
    },
    {
      title: "Artificial intelligence",
      lede: "There is no single UK law on artificial intelligence. Existing laws and regulators apply to it case by case.",
      colour: "#2C7DA0",
      blocks: [
        { text: ["On 30 October 2026 the Parliament Bills database listed two bills with \"artificial intelligence\" in the title that were still before Parliament: the Artificial Intelligence (Regulation) Bill, in the House of Lords, at its first reading when last updated on 30 April 2026, and the Artificial Intelligence (Consent and Misuse) Bill, in the House of Commons, at its second reading when last updated on 21 October 2026. Both are at an early stage, and most bills of this kind do not become law."] },
        { cards: [
          { title: "How to check", text: "Search the Parliament Bills database at bills.parliament.uk for the current stage of any bill, and for who put it forward." },
          { title: "Why it matters", text: "Whether AI is regulated by new rules, by existing regulators or not at all is one of the questions Parliament has yet to settle. A government announcement is not a law until Parliament passes it." },
        ] },
      ],
    },
  ],
  sources: [
    { label: "Ofcom: Connected Nations update, Spring 2026", url: "https://www.ofcom.org.uk/phones-and-broadband/coverage-and-speeds/connected-nations-update-spring-2026", note: "Gigabit, full fibre and decent broadband, January 2026. Published 13 May 2026." },
    { label: "GOV.UK: Social media to be banned for under-16s", url: "https://www.gov.uk/government/news/social-media-to-be-banned-for-under-16s-in-landmark-government-move-to-givekids-their-childhood-back", note: "The plan, its measures, the timetable and what Ofcom has been asked to do. Published 15 June 2026." },
    { label: "Ofcom: Online Safety industry bulletin, October 2026", url: "https://www.ofcom.org.uk/online-safety/protecting-children/online-safety-industry-bulletin-october-2026", note: "The fines, investigations and statement that existing duties remain in force." },
    { label: "Ofcom: Ofcom fines porn site for failing to have age checks", url: "https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/ofcom-fines-porn-site-for-failing-to-have-age-checks", note: "The £80,000 fine of 19 June 2026." },
    { label: "UK Parliament: Bills", url: "https://bills.parliament.uk/", note: "The stage of each bill mentioned. Searched on 30 October 2026." },
  ],
  checked: "30 October 2026",
};

export default function Digital() {
  return <ExplainerPage {...PAGE} />;
}
