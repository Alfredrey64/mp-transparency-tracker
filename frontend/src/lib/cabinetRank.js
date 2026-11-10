// How senior a cabinet role is, so each department can show who leads it and who works for them.

// 0 is the Prime Minister, 1 a head of a department (a Secretary of State or an equivalent), 2 a Minister of State, 3 a junior minister, 4 anything else.
export function rankOf(role) {
  const r = String(role ?? "");
  if (/^prime minister/i.test(r)) return 0;
  if (/deputy prime minister|^secretary of state|chancellor of the exchequer|^home secretary|^foreign secretary|lord chancellor|chancellor of the duchy|leader of the house|chief whip|attorney general|chief secretary to the treasury/i.test(r)) return 1;
  if (/minister of state/i.test(r)) return 2;
  if (/parliamentary under|parliamentary secretary|assistant whip|lord[s]? in waiting|lord commissioner|vice-chamberlain|solicitor general|treasurer of hm household|comptroller/i.test(r)) return 3;
  return 4;
}

// Several people can sit at rank 1 in one department: the Chancellor and the Chief Secretary at the Treasury, the Home Secretary and the Lord Chancellor in Home Office & Justice. The
// department's head is the one whose job is the department's own, so within a rank the lower number here leads. Without it, whoever came first in the list led.
function within(role) {
  const r = String(role ?? "");
  if (/chief secretary to the treasury|attorney general|chief whip|leader of the house/i.test(r)) return 5;
  if (/lord chancellor|chancellor of the duchy/i.test(r)) return 2;
  return 0;
}

const order = (x, y) => rankOf(x.cabinet_role) - rankOf(y.cabinet_role) || within(x.cabinet_role) - within(y.cabinet_role);

// People in a department, most senior first (ties keep the order they came in).
export const bySeniority = (people) => [...people].sort(order);

// The person who leads a department, or null for an empty one.
export const headOf = (people) => bySeniority(people)[0] ?? null;
