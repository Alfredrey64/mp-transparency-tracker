// Finds which written answers fit a question typed in plain words ("why is housing so expensive").
//
// It is a keyword match, not an AI: the question is cut into its important words, similar words
// are treated as one ("houses", "homes" and "property" all mean housing), and each answer is scored
// on how many of them it covers. Anything that does not match is simply not answered.

const STOP = new Set([
  "why", "is", "are", "was", "were", "so", "the", "a", "an", "of", "to", "in", "on", "for", "do", "does", "did", "how", "what", "who", "when", "where", "which",
  "can", "could", "i", "my", "me", "we", "our", "us", "you", "your", "it", "its", "there", "this", "that", "about", "be", "been", "uk", "britain", "british",
  "england", "please", "tell", "explain", "much", "many", "with", "at", "by", "and", "or", "if", "than", "then", "going", "get", "getting", "has", "have", "had", "not",
  "no", "really", "actually", "seem", "seems", "feel", "feels", "everything", "all", "up", "down", "out", "from", "will", "would", "should", "now", "still",
]);

// Words that mean the same thing for this purpose.
const SAME = {
  house: "housing", houses: "housing", home: "housing", homes: "housing", flat: "housing", flats: "housing", property: "housing", properties: "housing",
  mortgages: "mortgage", remortgage: "mortgage", rents: "rent", renting: "rent", renters: "rent", tenant: "rent", tenants: "rent", landlords: "landlord",
  prices: "price", costs: "cost", expensive: "cost", pricey: "cost", dear: "cost", dearer: "cost", costly: "cost", afford: "cost", affordable: "cost", unaffordable: "cost",
  rising: "rise", rises: "rise", increase: "rise", increases: "rise", increasing: "rise", climbing: "rise", soaring: "rise", high: "rise", higher: "rise", rocketing: "rise",
  wages: "pay", wage: "pay", salary: "pay", salaries: "pay", earnings: "pay", income: "pay", incomes: "pay", paid: "pay",
  taxes: "tax", taxation: "tax", migrants: "migration", migrant: "migration", immigrants: "migration", immigrant: "migration", immigration: "migration", migrate: "migration",
  boats: "boat", crossings: "boat", crossing: "boat", jobs: "job", unemployed: "unemployment", sick: "sickness", ill: "sickness", illness: "sickness", disabled: "sickness",
  hospitals: "hospital", waits: "wait", waiting: "wait", queue: "wait", queues: "wait", ambulances: "ambulance", paramedic: "ambulance", paramedics: "ambulance",
  savings: "saving", savers: "saving", save: "saving", saver: "saving", crimes: "crime", criminal: "crime", murder: "homicide", murders: "homicide", stabbing: "knife", stabbings: "knife",
  energy: "energy", gas: "energy", electricity: "energy", heating: "energy", utilities: "energy", emissions: "emission", carbon: "emission", climate: "emission", greenhouse: "emission",
  borrowing: "debt", borrow: "debt", owe: "debt", owed: "debt", deficit: "debt", inflation: "inflation", wages_: "pay", economy: "economy", economic: "economy", gdp: "gdp",
  north: "north", northern: "north", regions: "region", regional: "region", london: "london", population: "population", people: "population", growing: "growth", grow: "growth",
  exports: "trade", imports: "trade", import: "trade", export: "trade", trade: "trade", asylum: "asylum", refugees: "asylum", refugee: "asylum", hotel: "asylum_hotel", hotels: "asylum_hotel",
  interest: "interest", rates: "interest", rate: "interest", bank: "bank", slow: "slow", slower: "slow", stagnant: "slow", stagnation: "slow", stuck: "slow",
};

export function normalise(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .replace(/[^a-z0-9£%& ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !STOP.has(w))
    .map((w) => SAME[w] ?? (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? (SAME[w.slice(0, -1)] ?? w.slice(0, -1)) : w));
}

const cache = new WeakMap();
function indexOf(answer) {
  if (!cache.has(answer)) {
    const phrases = answer.keywords.filter((k) => k.includes(" ")).map((k) => normalise(k).join(" ")).filter(Boolean);
    cache.set(answer, {
      keyword: new Set(answer.keywords.flatMap((k) => normalise(k))),
      question: new Set(normalise(answer.question)),
      phrases,
    });
  }
  return cache.get(answer);
}

// The answers that fit, best first. `limit` caps how many come back.
export function findAnswers(query, answers, limit = 4) {
  const q = normalise(query);
  if (!q.length) return [];
  const joined = q.join(" ");
  const scored = answers.map((answer, order) => {
    const ix = indexOf(answer);
    let score = 0;
    for (const word of new Set(q)) {
      if (ix.keyword.has(word)) score += 3;
      if (ix.question.has(word)) score += 2;
    }
    for (const phrase of ix.phrases) if (joined.includes(phrase)) score += 4;
    return { answer, score, order };
  });
  return scored
    .filter((s) => s.score >= 3)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((s) => s.answer);
}
