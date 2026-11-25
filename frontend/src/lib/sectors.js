// A subject group for an item of Parliament's business (a bill, a debate, a committee, a question), so the same colour means the same subject on the Today clock, the Coming up lists and the
// What changed feed. The groups and their colours are the ones the committee reports already use (lib/committeeColour.js), so a colour means the same thing across the site.
//
// The group is worked out from the words of the item's own title (and, for a committee, the inquiry it is running), never from anything the site makes up. It is a guide, not a ruling: a
// title that matches none of these words is left "Not sorted" rather than guessed, and a title that touches two subjects goes to the first group below that it matches. The colour is never
// the only signal: every item shows the group's name in words as well.

import { SUBJECT_COLOUR as C } from "./subjectColours";

export const SECTORS = [
  { key: "health", label: "Health and care", colour: C.health, re: /\b(health|nhs|hospitals?|hospice\w*|medical|medicine|patients?|mental|autism|adhd|cancers?|breast|dementia|stroke|pulmonary|lung|nurs\w*|doctors?|disease|diagnos\w*|social care|care home|carers?|dental|gp\b|pharmac\w*|ambulance|maternity|screening|vaccin\w*|obesity|public health|folic)/i },
  { key: "defence", label: "Defence and foreign affairs", colour: C.defence, re: /\b(defence|armed forces|military|veterans?|army|navy|raf\b|national security|nuclear weapons|aukus|intelligence|investigatory powers|terror\w*|foreign|international|ukraine|russia|china|israel|gaza|middle east|sudan|rohingya|colombia\w*|afghan\w*|iran|syria|yemen|palestin\w*|hong kong|taiwan|peace agreement|summit|commonwealth|overseas|diplomatic|sanctions?|uk-eu|european|treaty|ambassador|cop\d+|global)/i },
  { key: "justice", label: "Justice, home affairs and democracy", colour: C.justice, re: /\b(justice|courts?|crimes?|criminal|police|policing|prisons?|probation|sentenc\w*|offenders?|home affairs|home office|immigration|asylum|border|migration|settlement|integration|citizenship|victims?|domestic abuse|violence|fraud|human rights|tribunal|extremism|knife|stalking|surveillance|drugs|illegal|litigation|legal|attorney|hate|islamophobia|antisemitism|discriminat\w*|accountability|lobbying|corruption|freedom of speech|public administration|constitution\w*|standards|privileges|elections?|electoral|representation of the people|referendum)/i },
  { key: "environment", label: "Environment, energy and farming", colour: C.environment, re: /\b(environment\w*|climate|energy|net zero|farming|farmers?|agricultur\w*|food|rural|water|flood\w*|wildlife|nature|fishing|carbon|green|waste|pollution|forest\w*|upland|marine|animals?|glue traps|fuel|electric\w*|nuclear power|hydrogen|wind\b|solar|saltend|chemicals)/i },
  { key: "transport", label: "Transport, housing and communities", colour: C.transport, re: /\b(transport|rail\w*|roads?|bridges|buses|bus\b|aviation|airports?|driverless|housing|planning|homes\b|homeless\w*|new towns|rents?|renters|building safety|cladding|leasehold|tenants?|infrastructure|local government|communities|council\w*|levelling|devolution|high streets?|cycling|ports?\b)/i },
  { key: "nations", label: "Scotland, Wales and Northern Ireland", colour: C.nations, re: /\b(northern ireland|scottish|scotland|welsh|wales|lord advocate)/i },
  { key: "economy", label: "Economy and business", colour: C.economy, re: /\b(treasury|financ\w*|tax\w*|levy|budget|econom\w*|business|trade|industr\w*|bank\w*|vat\b|spending|inflation|growth|consumers?|competition|retail\w*|investment|markets?|audit|estimates?|public accounts|insolvency|marketplace|subscription|supply chain|steel|manufactur\w*|post office|procurement|utilities)/i },
  { key: "learning", label: "Education, work and culture", colour: C.learning, re: /\b(education|schools?|children\w*|child|care leavers|universit\w*|students?|skills|teachers?|send\b|youth|young people|apprentice\w*|votes at 16|work and pensions|pensions?|benefits?|welfare|universal credit|employment|employers?|tips\b|jobs|unemploy\w*|poverty|disabilit\w*|wages?|workers?|welders?|culture|media|sport\w*|digital|online|internet|artificial intelligence|\bai\b|artificial superintelligence|broadcast\w*|bbc|science|innovation|data|cyber|arts\b|theatre|dance|museums?|libraries|cinema|film|heritage|gambling|television|\btv\b|music|communications|women|equalit\w*)/i },
];

export const NO_SECTOR = { key: "other", label: "Not sorted", colour: C.other };

const byKey = Object.fromEntries(SECTORS.map((s) => [s.key, s]));

// Words that look like a subject but are about how the House works, so they must not sort an item.
const HOUSEKEEPING = /backbench business|business of the house|business questions|business statement|delegated legislation committee/gi;

// The words to read: the title, and the inquiry or department when the entry has one.
const clean = (t) => (typeof t === "string" ? t.replace(HOUSEKEEPING, " ") : "");

// A debate, bill, question or committee, returns { key, label, colour }. With nothing matched it is NO_SECTOR.
export function sectorOf(e) {
  const title = clean(e?.title);
  const rest = [clean(e?.about), clean(e?.bill?.sponsoring_department)].filter(Boolean).join(" ");
  if (!title && !rest) return NO_SECTOR;
  // The title wins over the inquiry text: read the title alone first, then everything.
  return SECTORS.find((s) => s.re.test(title)) ?? SECTORS.find((s) => s.re.test(`${title} ${rest}`)) ?? NO_SECTOR;
}

export const sectorByKey = (key) => byKey[key] ?? NO_SECTOR;

// The groups that appear in a set of entries, in a steady order, with how many entries each holds. Used for the key under a chart.
export function sectorsIn(entries) {
  const n = new Map();
  for (const e of entries) {
    const s = sectorOf(e);
    n.set(s.key, (n.get(s.key) ?? 0) + 1);
  }
  return [...SECTORS, NO_SECTOR].filter((s) => n.has(s.key)).map((s) => ({ ...s, n: n.get(s.key) }));
}
