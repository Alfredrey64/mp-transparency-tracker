import STAGES from "../data/billStages.json";

export function stagesFor(bill) {
  return STAGES[String(bill.bill_id)] ?? null;
}

// Which stage is "now": the last listed stage that matches where the bill is. A bill that has become law or fallen has finished its journey, so nothing is marked as current.
export function currentIndex(stages, bill) {
  if (bill.is_act || bill.is_defeated) return stages.length;
  let at = -1;
  stages.forEach((s, i) => { if (s.stage === bill.current_stage && s.house === bill.current_house) at = i; });
  return at;
}

