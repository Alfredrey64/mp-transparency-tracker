// A colour for what a committee looks into, so its reports are easy to tell apart at a glance. The first group whose words match the committee's name wins; the picture
// from committeeIcon.jsx is always shown with it, so the colour is never the only thing that says which subject it is.
import { SUBJECT_COLOUR as C } from "./subjectColours";

const COLOUR_BY_WORD = [
  [/treasury|financial|economic affairs|estimate|public accounts|audit committee|business|industry|trade|science/i, C.economy],
  [/health|autism|public services/i, C.health],
  [/environment|climate|energy|food and rural|farming|agriculture/i, C.environment],
  [/transport|housing|communities|local government|built environment|planning/i, C.transport],
  [/defence|national security|foreign|international|european/i, C.defence],
  [/justice|home affairs|human rights|constitution|public administration|standards|privileges/i, C.justice],
  [/education|numeracy|social mobility|work and pensions|women|equalities|culture|media|sport|digital|communications/i, C.learning],
  [/northern ireland|scottish|welsh|scotland|wales/i, C.nations],
];

export function committeeColour(name) {
  return COLOUR_BY_WORD.find(([re]) => re.test(name ?? ""))?.[1] ?? C.other;
}
