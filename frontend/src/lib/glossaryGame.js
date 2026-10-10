// Small helpers that make the Jargon buster playful: a word for each day, and "which term is this?" questions.

import { keysFor } from "../data/glossaryTerms";

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The same word all day for everyone, a new one tomorrow.
export function wordOfTheDay(terms, date = new Date()) {
  if (!terms.length) return null;
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return terms[h % terms.length];
}

// A definition with the term itself blanked out, so it does not give the answer away.
export function hideTerm(def, entry) {
  const keys = keysFor(entry).filter((k) => k.length >= 3).sort((a, b) => b.length - a.length);
  if (!keys.length) return def;
  const re = new RegExp(`(?<![\\w-])(${keys.map(escape).join("|")})(?:s|es)?(?![\\w-])`, "gi");
  return def.replace(re, "_____");
}

function shuffle(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// One question: a clue and three terms to pick from, one of them right. `rand` can be swapped for a fixed one in tests.
export function makeQuestion(terms, rand = Math.random) {
  const pool = terms.filter((t) => t.def.length >= 50 && t.def.length <= 260);
  if (pool.length < 1 || terms.length < 3) return null;
  const answer = pool[Math.floor(rand() * pool.length)];
  // Two other terms, picked by shuffling the rest, so a fixed random source can never get stuck.
  const others = shuffle(terms.filter((t) => t.term !== answer.term), rand);
  const picks = others.slice(0, 2);
  const options = [answer, ...picks];
  const shuffled = shuffle(options, rand);
  return { answer: answer.term, options: shuffled.map((o) => o.term), clue: hideTerm(answer.def, answer), example: answer.example ?? null };
}
