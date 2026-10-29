// What an MP has been doing in Parliament lately, put together from records the site already holds: their recent debates and written questions (kept on their
// row by the daily refresh), their latest votes, the bills they sponsor and the committees they sit on. All of it comes from Parliament's own published records.
// Parliament publishes what a member has done and tabled; it does not publish what they intend, or their casework, so this says only what the record shows.

const day = (d) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null);

export function doingFromRows({ mp, votes, bills, committees }) {
  const activity = mp?.recent_activity ?? {};
  const debates = (activity.contributions ?? []).slice(0, 5).map((c) => ({
    title: c.title ?? "A debate", date: day(c.date), url: c.hansardUrl ?? null, section: c.section ?? null,
    said: Array.isArray(c.said) ? c.said[0] ?? null : (c.said ?? null), saidAll: Array.isArray(c.said) ? c.said : (c.said ? [c.said] : []),
    speeches: c.speechCount ?? 0, questions: c.questionCount ?? 0, interventions: c.interventionCount ?? 0,
  }));
  const questions = (activity.writtenQuestions ?? []).slice(0, 5).map((q) => ({
    heading: q.heading ?? "A written question", department: q.department ?? null, tabled: day(q.dateTabled), answered: day(q.dateAnswered), uin: q.uin ?? null,
    text: q.questionText ?? null, answer: q.answerText ?? null,
    url: q.uin && day(q.dateTabled) ? `https://questions-statements.parliament.uk/written-questions/detail/${day(q.dateTabled)}/${q.uin}` : null,
  }));
  const recentVotes = (votes ?? []).slice(0, 6).map((v) => ({ title: v.title, date: day(v.date), aye: v.voted_aye === true, withParty: v.voted_with_party_majority ?? null, url: v.source_url ?? null }));
  const sponsored = (bills ?? []).slice(0, 5).map((b) => ({ id: b.bill_id, title: b.short_title, stage: b.current_stage ?? null, isAct: b.is_act === true, defeated: b.is_defeated === true, url: b.source_url ?? null, longTitle: b.long_title ?? null, department: b.sponsoring_department ?? null, house: b.current_house ?? null, row: b }));
  const sits = (committees ?? []).filter((c) => (c.members ?? []).some((m) => Number(m.parliament_member_id) === Number(mp?.parliament_member_id))).map((c) => c.name);
  const counted = recentVotes.filter((v) => v.withParty !== null);
  return {
    debates, questions, votes: recentVotes, bills: sponsored, committees: sits, role: mp?.cabinet_role ?? null,
    withParty: counted.length ? { with: counted.filter((v) => v.withParty).length, of: counted.length } : null,
    total: debates.length + questions.length + recentVotes.length + sponsored.length + sits.length,
  };
}

// The tab to open first: the first with anything in it.
export function firstTab(doing) {
  if (!doing) return "debates";
  return ["debates", "questions", "votes", "proposed"].find((k) => (k === "proposed" ? doing.bills.length + doing.committees.length : doing[k].length) > 0) ?? "debates";
}
