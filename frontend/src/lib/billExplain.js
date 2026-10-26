// "Explain this bill": what its stage means and what happens next, and who a bill from its department usually affects. Plain wording written from how
// Parliament's stages work; nothing here is a prediction about a particular bill, and the "who it affects" lines are about the area, not a promise.

const STAGES = [
  [/1st reading|first reading/i, { means: "The bill has just been introduced. Nothing is debated yet: this stage only reads out its title.", next: "A second reading, where the main idea is debated and voted on." }],
  [/2nd reading|second reading/i, { means: "MPs or peers are debating the main idea of the bill and voting on whether it should go any further.", next: "If it passes, a smaller group goes through it line by line at committee stage." }],
  [/committee/i, { means: "A smaller group is going through the bill line by line and can change the wording.", next: "Report stage, where the whole House looks at the changes and can vote on more." }],
  [/report/i, { means: "The whole House is looking at the changes made in committee and can vote on further ones.", next: "Third reading, the final vote in this House." }],
  [/3rd reading|third reading/i, { means: "This is the final debate and vote in this House.", next: "If it passes, it goes to the other House, or back to the first House to agree any changes." }],
  [/consideration of .*amendments|ping pong|amendments/i, { means: "The two Houses are settling their differences over changes to the bill.", next: "It goes back and forth until both Houses agree, then to the King for Royal Assent." }],
  [/royal assent/i, { means: "The King has agreed to the bill. It is now a law, called an Act of Parliament.", next: "It starts to apply on the date the Act sets, which is sometimes later." }],
];

export function explainStage(stage, { isAct = false, isDefeated = false } = {}) {
  if (isDefeated) return { means: "The bill was voted down, so it will not become law in this form.", next: "The government could bring back a changed version." };
  if (isAct) return STAGES[STAGES.length - 1][1];
  const s = String(stage ?? "");
  for (const [re, text] of STAGES) if (re.test(s)) return text;
  return null;
}

const AFFECTS = {
  Health: "People who use or work in the NHS and social care.",
  Defence: "Members of the armed forces, veterans and their families, and the defence industry.",
  "Economy & Finance": "Taxpayers, savers, businesses and anyone who pays or claims money from the government.",
  Transport: "People who travel by road, rail, bus, air or sea, and the companies that run them.",
  "Science & Tech": "Internet and device users, and companies that build or run digital services.",
  "Justice & Home Affairs": "People in the courts, police, prisons, immigration and border system, and victims of crime.",
  "Environment & Energy": "Households and businesses that use energy, farmers, and anyone affected by pollution or climate rules.",
  Education: "Pupils, parents, teachers, schools, colleges and universities.",
  "Work & Pensions": "Workers, jobseekers, benefit claimants and pensioners.",
  "Housing & Communities": "Renters, homeowners, councils and people looking for a home.",
  "Foreign Affairs": "People and organisations dealing with other countries, such as travellers and exporters.",
  "Culture & Media": "Broadcasters, sport and the arts, and the people who use them.",
};

export const whoItAffects = (categoryLabel) => AFFECTS[categoryLabel] ?? "It depends on the detail. The plain-English points above say who the rules apply to.";
