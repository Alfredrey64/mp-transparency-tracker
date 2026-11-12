/** @jsxImportSource react */
import ExplainerPage from "../story/ExplainerPage";
import { IconGavel, IconGroup, IconRegister, IconBook, IconParliament, IconScales, IconVote, IconManifesto } from "../icons";
import { Diverge } from "../story/StateArt";
import { Hero } from "../story/Vivid";

// Facts here come only from sources read on 12 November 2026: the UK Parliament website (the Speaker's pages, the whips glossary entry, the urgent questions page), Erskine May
// (the Clerk and the duties of whips), Acts of Parliament on legislation.gov.uk and the GOV.UK page for the Chief Whip. No office-holder is named, so the page cannot go out of
// date when one changes. What is not here: what "one-, two- and three-line whip" mean and what withdrawing the whip does, as no page read in the session says.

const PAGE = {
  look: "vivid",
  narrow: true,
  icon: IconGavel,
  kicker: "Understand it",
  title: "The Speaker, whips and clerks",
  subtitle: "Three groups of people keep the House of Commons running without being ministers. The Speaker keeps order and has jobs written into Acts of Parliament. Whips organise each party's MPs. The Clerk and the clerks are permanent officials, not MPs. This page says what each does, from Parliament's own pages and the law.",
  lead: <Hero
    colours={["#1B2438", "#5E4B8B", "#A9701F"]}
    why="The front bench gets the headlines, but the Commons also depends on people who are meant to stay out of the argument, or who work the votes behind the scenes. Knowing who does what makes a news story about a vote, a rebellion or a ruling much easier to follow."
    stops={[
      { icon: IconGavel, title: "The Speaker", text: "A neutral referee in the Chamber, with jobs in many Acts of Parliament", colour: "#E2BE7A" },
      { icon: IconGroup, title: "The whips", text: "Appointed by each party to organise its MPs and their votes", colour: "#8DB7E8" },
      { icon: IconRegister, title: "The Clerk", text: "The House's chief permanent officer and its adviser on the rules", colour: "#8FD1A8" },
    ]}
    figures={[
      { value: "Over 50%", label: "Of MPs' votes a new Speaker needs", sub: "In a secret ballot, repeated until someone gets there" },
      { value: "4", label: "Boundary Commissions the Speaker chairs", sub: "England, Scotland, Wales and Northern Ireland" },
      { value: "7", label: "Most Assistant Whips in the Commons who can be paid a salary", sub: "The Opposition can pay at most 2" },
    ]}
  />,
  chapters: [
    {
      title: "The Speaker in the Chamber",
      lede: "The Speaker is a sitting MP who acts as a neutral referee between the sides of the Commons, making sure the rules are followed and order is kept.",
      colour: "#A9701F",
      blocks: [
        { cards: [
          { title: "Calls MPs to speak", icon: IconVote, colour: "#A9701F", text: "The Speaker calls MPs in turn. MPs show they want to speak by standing up, known as \"catching the Speaker's eye\", or by telling the Speaker in writing beforehand." },
          { title: "Keeps order", icon: IconScales, colour: "#2C5F9E", text: "The Speaker can direct an MP to withdraw remarks, ask for quiet so people can be heard, and suspend the sitting if there is serious disorder." },
          { title: "Can suspend an MP", icon: IconGavel, colour: "#9A3F55", text: "An MP who is deliberately disobedient can be suspended. This is called \"naming\" them." },
          { title: "Decides on urgent questions", icon: IconManifesto, colour: "#5E4B8B", text: "An MP can apply to the Speaker to make a minister come to the Chamber the same day. The Speaker grants it only if it is urgent and of public importance, and does not have to explain a decision." },
        ] },
        { text: ["Each morning before the House sits, the Speaker chairs a briefing with the Deputy Speakers and other advisers on the procedure, who go through the day's business."] },
        { text: ["Speakers must be politically impartial. A new Speaker resigns from their party on election and stays out of political issues even in retirement. They still represent a constituency and deal with their constituents' problems like any other MP."] },
        { text: ["At a general election the Speaker stands as \"the Speaker seeking re-election\", campaigns on no political issues, and is generally not opposed by the major parties, including the one they came from."] },
      ],
    },
    {
      title: "How a Speaker is chosen",
      lede: "A new Speaker must be elected after every general election, as the first business of the new Parliament and before MPs can be sworn in. One is also needed whenever the last Speaker has died or retired.",
      colour: "#5E4B8B",
      blocks: [
        { text: ["If the previous Speaker has been re-elected as an MP and wants to carry on, it is decided straight away. A motion is put to the House that they take the Chair, and if anyone challenges it, there is a vote. Only if there is no returning Speaker, or the House votes the former one down, does a contested election take place, and it is held the following day."] },
        { steps: [
          { title: "MPs put themselves forward", text: "A candidate needs between 12 and 15 MPs to nominate them, and at least three of those must come from a different party from the candidate's." },
          { title: "MPs vote in secret", text: "Each MP gets a list of candidates and puts an X next to their choice." },
          { title: "More than half wins", text: "If a candidate gets over 50 per cent of the votes, the House is asked to agree that they take the Chair." },
          { title: "If nobody does, the lowest drop out", text: "The candidate with the fewest votes, and anyone under 5 per cent, is eliminated. Any candidate can also withdraw within 10 minutes of the result." },
          { title: "The vote is repeated", text: "MPs vote again on the shorter list until one candidate has more than half." },
        ] },
        { note: "By tradition the winner is then dragged to the Chair by other MPs. The custom comes from the days when the Speaker carried the Commons' views to the monarch and might need persuading to take the job." },
        { compare: [
          { title: "Deputy Speakers", colour: "#2C5F9E", items: [
            "Elected by secret ballot since 2010, using the single transferable vote (Standing Orders 2 and 2A).",
            "Two come from the opposite side of the House to the Speaker. The one with more votes is the Chairman of Ways and Means, the other the Second Deputy Chairman.",
            "The third comes from the Speaker's side and is the First Deputy Chairman of Ways and Means.",
          ] },
          { title: "Across all four posts", colour: "#1F7A6E", items: [
            "There has to be at least one man and at least one woman among the Speaker and the three Deputies.",
          ] },
        ] },
      ],
    },
    {
      title: "The Speaker's jobs in law",
      lede: "Several Acts of Parliament name the Speaker too. They give the Speaker jobs well beyond the Chamber.",
      colour: "#2C5F9E",
      blocks: [
        { node: <Diverge
          root={{ title: "The Speaker of the House of Commons", text: "Jobs given by Acts of Parliament", colour: "#A9701F", icon: IconGavel }}
          items={[
            { title: "Making law", colour: "#5E4B8B", icon: IconBook, list: [
              "Certifies that a bill is a Money Bill (Parliament Act 1911)",
              "Certifies that the Parliament Act steps were followed when a bill goes for Royal Assent without the Lords' agreement",
              "Notifies the Commons when Royal Assent has been given (Royal Assent Act 1967)",
            ] },
            { title: "Elections and boundaries", colour: "#2C5F9E", icon: IconVote, list: [
              "Chairs each of the four Boundary Commissions",
              "Chairs the Speaker's Committee on the Electoral Commission",
              "Gives the notice that opens a recall petition against an MP",
            ] },
            { title: "Running the Commons", colour: "#1F7A6E", icon: IconParliament, list: [
              "Chairs the House of Commons Commission",
              "Must agree who is appointed to run IPSA, the body that sets MPs' pay and expenses",
              "Lays IPSA's budget and annual report before the Commons",
            ] },
          ]}
        /> },
        { pull: "The Speaker's certificate that a bill is a Money Bill is final: the Act says no court can question it.", colour: "#A9701F" },
        { text: ["Under the Parliament Act 1911, a Money Bill is a public bill which, in the Speaker's opinion, contains only certain money matters such as taxation and public spending. The Speaker's certificate is endorsed on it when it goes to the Lords and when it is presented for Royal Assent. Before giving it, the Speaker must consult, if practicable, two members chosen from the Chairmen's Panel."] },
      ],
    },
    {
      title: "The whips",
      lede: "Every party at Westminster has whips: MPs or peers it appoints to inform and organise its own members in Parliament.",
      colour: "#2C5F9E",
      blocks: [
        { cards: [
          { title: "Getting members to vote", icon: IconVote, colour: "#2C5F9E", text: "A whip's job includes making sure members turn up to vote in divisions, and vote in line with party policy." },
          { title: "Keeping members informed", icon: IconBook, colour: "#5E4B8B", text: "Whips keep their members supplied with information about the business of the House." },
          { title: "Counting the votes", icon: IconScales, colour: "#A9701F", text: "Whips frequently act as tellers: the people who count the votes in a division." },
          { title: "Arranging absences", icon: IconGroup, colour: "#1F7A6E", text: "Where they can, whips arrange for a member who cannot attend a division to be \"paired\" with someone on the other side, so neither vote is lost." },
        ] },
        { cards: [
          { title: "Suggesting committee members", icon: IconManifesto, colour: "#9A3F55", text: "Whips suggest which of their members should serve on general and certain select committees." },
          { title: "Go-betweens", icon: IconRegister, colour: "#2F4A6B", text: "They carry the views of the party leaders to their MPs, and the MPs' views back to the leaders." },
          { title: "Proxy votes", icon: IconVote, colour: "#1F7A6E", text: "Whips commonly hold proxy votes for members of their party who are entitled to one, though a member can choose someone else to hold it." },
        ] },
        { text: ["The most important duties fall to the Government Chief Whip. They map out the timetable for the session, apply the government's programme of business in detail, estimate how long each item will take and arrange each day's sitting. They answer directly to the Prime Minister and the Leader of the House, and advise the government on parliamentary business and procedure."] },
        { text: ["Behind the scenes, party whips and the Leaders and Shadow Leaders of each House negotiate the day-to-day business of Parliament. That process is known as \"the usual channels\"."] },
        { text: ["The Chief Whip's official title is Parliamentary Secretary to the Treasury (Chief Whip). It is a ministerial post."] },
        { compare: [
          { title: "Government whips", colour: "#2C5F9E", items: [
            "The Chief Whip, whose official title is Parliamentary Secretary to the Treasury.",
            "Assistant Whips in the House of Commons are a salaried post in law, but no more than 7 can be paid at the same time.",
          ] },
          { title: "Opposition whips", colour: "#9A3F55", items: [
            "The Chief Opposition Whip is a salaried post in law, in the House of Commons and in the House of Lords.",
            "Assistant Opposition Whips in the Commons can be paid, but no more than 2 at the same time.",
          ] },
        ] },
        { text: [<>To see how often MPs go against their party's whip, see <a href="#/rebels">MPs who defy their party</a>.</>] },
      ],
    },
    {
      title: "The Clerk and the clerks",
      lede: "Clerks are permanent officials of Parliament, not MPs. The most senior is the Clerk of the House of Commons.",
      colour: "#1F7A6E",
      blocks: [
        { cards: [
          { title: "Adviser on the rules", icon: IconBook, colour: "#1F7A6E", text: "The Clerk assists the Speaker and advises MPs on questions of order and on the House's proceedings." },
          { title: "Keeper of the record", icon: IconRegister, colour: "#2C5F9E", text: "The Clerk looks after the House's records and documents, and has promised to make true entries of what is done in the House." },
          { title: "Signs for the House", icon: IconGavel, colour: "#A9701F", text: "The Clerk signs the Addresses, votes of thanks and orders of the House, and endorses bills sent to or returned from the Lords." },
          { title: "Runs the House's administration", icon: IconParliament, colour: "#5E4B8B", text: "The Clerk leads the House of Commons administration, chairs its Executive Board and is responsible for delivering all House services." },
        ] },
        { text: ["The Clerk has two jobs at once: the House's chief adviser on its procedure, and the head of its administration. The Clerk is also the Commons' Accounting Officer, one of the two officials on the House of Commons Commission, and the \"Corporate Officer\" who can hold property and sign contracts for the House. The next Clerk's appointment will be for an initial three years, a rule the Commission agreed in April 2026."] },
        { text: ["The Clerk is not an employee. They are appointed by the Crown by letters patent, and could be removed only after an Address from the Commons to the King."] },
        { note: "If the Clerk thinks a Speaker's decision is a substantial breach of the Standing Orders, or a departure from long-established conventions without the House's permission, a statement of the Clerk's view can be placed in the Library of the House, and the Speaker tells the House." },
        { timeline: [
          { when: "Before 1856", text: "The Clerk of the House of Commons had the power to appoint all the clerks in the department, and to suspend and remove them." },
          { when: "1856", text: "The House of Commons Offices Act made the Clerk Assistant and the Second Clerk Assistant appointments of the Crown, by Warrant. Each can be removed only by the Crown, after an Address from the House of Commons." },
          { when: "1978", text: "The House of Commons (Administration) Act says the House of Commons Commission appoints the staff of the House Departments. That power does not cover the Clerk of the House, any Clerk Assistant, the Serjeant at Arms or the Speaker's personal staff." },
          { when: "2015", text: "Changes made that year set the Commission's make-up at seven MPs, two outside members and two officials, and made it responsible for setting strategic priorities for the House's services." },
        ] },
        { text: ["The Commission has to produce a report on its work to the House after each financial year, and the House prints it."] },
      ],
    },
  ],
  sources: [
    { label: "UK Parliament: Speaker and the Chamber", url: "https://www.parliament.uk/business/commons/the-speaker/speaker-and-the-chamber/", note: "The Speaker as neutral referee and impartiality." },
    { label: "UK Parliament: Chairing debates in the House of Commons", url: "https://www.parliament.uk/business/commons/the-speaker/speaker-and-the-chamber/chairing-debates-in-the-house-of-commons/", note: "Calling MPs, keeping order, naming and the daily briefing." },
    { label: "UK Parliament: Election of the House of Commons Speaker", url: "https://www.parliament.uk/business/commons/the-speaker/speaker-and-the-chamber/election-of-speaker/", note: "How a Speaker and the Deputy Speakers are chosen." },
    { label: "UK Parliament: Urgent Questions", url: "https://www.parliament.uk/about/how/business/urgent-questions/", note: "How an MP applies and how the Speaker decides." },
    { label: "UK Parliament glossary: Whips", url: "https://www.parliament.uk/site-information/glossary/whips/", note: "What whips are and the usual channels." },
    { label: "Erskine May 4.9: Duties of Whips", url: "https://erskinemay.parliament.uk/section/5989/duties-of-whips/", note: "The Chief Whip's duties and duties common to all whips." },
    { label: "Erskine May 6.7: Clerk of the House of Commons", url: "https://erskinemay.parliament.uk/section/6384/clerk-of-the-house-of-commons", note: "The Clerk's roles, appointment and duties." },
    { label: "GOV.UK: Parliamentary Secretary to the Treasury (Chief Whip)", url: "https://www.gov.uk/government/ministers/parliamentary-secretary-to-the-treasury-and-chief-whip", note: "The Chief Whip's official title and role." },
    { label: "Parliament Act 1911, sections 1 to 3: the Speaker's certificate", url: "https://www.legislation.gov.uk/ukpga/Geo5/1-2/13/section/1", note: "Money Bills, the certificate, consulting two members of the Chairmen's Panel, and the certificate being final." },
    { label: "Royal Assent Act 1967, section 1", url: "https://www.legislation.gov.uk/ukpga/1967/23/section/1", note: "Royal Assent notified to each House by its Speaker." },
    { label: "Parliamentary Constituencies Act 1986, Schedule 1", url: "https://www.legislation.gov.uk/ukpga/1986/56/schedule/1", note: "The Speaker chairs each of the four Boundary Commissions." },
    { label: "Political Parties, Elections and Referendums Act 2000, section 2", url: "https://www.legislation.gov.uk/ukpga/2000/41/section/2", note: "The Speaker's Committee, chaired by the Speaker." },
    { label: "Recall of MPs Act 2015, section 1", url: "https://www.legislation.gov.uk/ukpga/2015/25/section/1", note: "A recall petition process starts once a recall condition is met and the Speaker gives notice." },
    { label: "Parliamentary Standards Act 2009, Schedule 1", url: "https://www.legislation.gov.uk/ukpga/2009/13/schedule/1", note: "The Speaker's part in appointing IPSA's members and laying its budget and annual report." },
    { label: "House of Commons (Administration) Act 1978, sections 1 and 2", url: "https://www.legislation.gov.uk/ukpga/1978/36/contents", note: "The House of Commons Commission, who sits on it, and staff appointments." },
    { label: "House of Commons Offices Act 1856", url: "https://www.legislation.gov.uk/ukpga/Vict/19-20/1/enacted/data.html", note: "Appointment and removal of the Clerk Assistant and Second Clerk Assistant." },
    { label: "Ministerial and other Salaries Act 1975, Schedules 1 and 2", url: "https://www.legislation.gov.uk/ukpga/1975/27/schedule/1", note: "Salaried whips' posts and the limits on how many can be paid." },
  ],
  checked: "12 November 2026",
};

export default function SpeakerWhipsClerks() {
  return <ExplainerPage {...PAGE} />;
}
