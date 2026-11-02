// The questions for two classroom games drawn from the pages How to get something done and Spending by department. Each question has its answers in the order they
// are shown, the right one, and a line saying why. Nothing here is scored against a pupil.
import { DEPARTMENT_ROWS } from "../data/departmentSpending";

// Who handles it? Where to go first for a problem. The routes are the ones the How to get something done page sets out.
export const ROUTES = {
  service: "The council service itself",
  lgo: "The Local Government and Social Care Ombudsman",
  mp: "Your MP",
  police: "The police force",
  phso: "The Parliamentary and Health Service Ombudsman",
  ico: "The Information Commissioner",
  foi: "A freedom of information request",
  parish: "The parish council",
  hospital: "The hospital's own complaints team",
};

export const ROUTE_QUESTIONS = [
  { id: "bins", text: "The bins in your street have been missed three weeks in a row.", options: ["service", "lgo", "mp", "ico"], right: "service", why: "Start with the council service that did it. The Ombudsman only looks once the council has had its chance." },
  { id: "final", text: "You complained to your council, it gave its final answer, and you are still not happy.", options: ["police", "lgo", "foi", "parish"], right: "lgo", why: "The Local Government and Social Care Ombudsman looks at complaints about councils in England once the council has finished. It is free." },
  { id: "dept", text: "A government department treated you unfairly and you want the Ombudsman to look into it.", options: ["mp", "lgo", "police", "service"], right: "mp", why: "For a government department, an MP has to refer the complaint to the Parliamentary Ombudsman." },
  { id: "police", text: "You want to complain about how a police officer treated you.", options: ["ico", "police", "mp", "lgo"], right: "police", why: "Contact the police force involved, or call 101. The police complaints body only investigates the most serious matters itself." },
  { id: "foi", text: "You want to know how much a council spent on consultants last year. It is not on its website.", options: ["foi", "phso", "lgo", "parish"], right: "foi", why: "You have the right to ask a public body for recorded information. It usually has to reply within 20 working days." },
  { id: "ico", text: "A body refused your information request, then refused again after an internal review.", options: ["ico", "police", "service", "phso"], right: "ico", why: "You can complain to the Information Commissioner within six weeks of the review outcome." },
  { id: "hospital", text: "You are unhappy with your care at a hospital in England and have not complained yet.", options: ["hospital", "phso", "ico", "lgo"], right: "hospital", why: "The hospital should get the chance to look into it first. After that you can go to the Parliamentary and Health Service Ombudsman." },
  { id: "swing", text: "The swing in the village play area, which the parish council looks after, is broken.", options: ["parish", "phso", "ico", "police"], right: "parish", why: "Parish, community and town councils look after things like play areas, allotments and bus shelters." },
];

// Which budget is bigger? Pairs from the Spending Review 2025 plans for 2028-29, day-to-day plus investment. Chosen so each pair is close enough to be a fair question.
const PAIRS = [
  ["Health and Social Care", "Education"],
  ["Defence", "Home Office"],
  ["Scottish Government", "Transport"],
  ["Housing, Communities and Local Government", "Welsh Government"],
  ["Justice", "Science, Innovation and Technology"],
  ["Foreign, Commonwealth and Development Office", "Environment, Food and Rural Affairs"],
  ["Work and Pensions", "HM Revenue and Customs"],
  ["Energy Security and Net Zero", "Northern Ireland Executive"],
];

export function budgetQuestions(rows = DEPARTMENT_ROWS) {
  const by = new Map(rows.map((d) => [d.name, d]));
  return PAIRS.map(([a, b], i) => {
    const x = by.get(a);
    const y = by.get(b);
    // Alternate which side the bigger one is on, so the answer is not always the same side.
    const [left, right] = i % 2 ? [y, x] : [x, y];
    const bigger = left.later >= right.later ? left : right;
    return { id: `p${i}`, left, right, bigger: bigger.name, gap: Math.abs(left.later - right.later) };
  });
}
