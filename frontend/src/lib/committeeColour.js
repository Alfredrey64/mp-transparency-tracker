// A colour for what a committee looks into, so its reports are easy to tell apart at a glance. The first group whose words match the committee's name wins; the picture
// from committeeIcon.jsx is always shown with it, so the colour is never the only thing that says which subject it is.
const COLOUR_BY_WORD = [
  [/treasury|financial|economic affairs|estimate|public accounts|audit committee|business|industry|trade|science/i, "#B7791F"],
  [/health|autism|public services/i, "#D1495B"],
  [/environment|climate|energy|food and rural|farming|agriculture/i, "#3C8D40"],
  [/transport|housing|communities|local government|built environment|planning/i, "#2F7FB8"],
  [/defence|national security|foreign|international|european/i, "#38477F"],
  [/justice|home affairs|human rights|constitution|public administration|standards|privileges/i, "#7B4BA0"],
  [/education|numeracy|social mobility|work and pensions|women|equalities|culture|media|sport|digital|communications/i, "#D9731A"],
  [/northern ireland|scottish|welsh|scotland|wales/i, "#0E8A9A"],
];

export function committeeColour(name) {
  return COLOUR_BY_WORD.find(([re]) => re.test(name ?? ""))?.[1] ?? "#5B6784";
}
