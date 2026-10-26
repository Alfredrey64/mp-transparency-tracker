import { createContext } from "react";

// The four children in the chapter 1 stories. A teacher can rename them (and put pupils from the class into the stories); the new names then
// appear in the words under each picture and on small name tags in the pictures themselves.
export const DEFAULT_NAMES = { sam: "Sam", maya: "Maya", leo: "Leo", amira: "Amira" };
export const NAME_LIMIT = 12;
export const NamesContext = createContext(DEFAULT_NAMES);

export const CHARACTERS = [
  { key: "sam", story: "The weekly shop", role: "shops with Dad" },
  { key: "maya", story: "Waiting for the hospital", role: "worried about Grandad" },
  { key: "leo", story: "The school roof", role: "goes to a leaky school" },
  { key: "amira", story: "The bus that stopped", role: "waits for the bus with Nan" },
];

// What is safe to show: letters, spaces, hyphens and apostrophes, trimmed and cut short. Anything empty falls back to the original name.
export function cleanName(raw, fallback) {
  const t = String(raw ?? "").replace(/[^\p{L}\p{M}' -]/gu, "").replace(/\s+/g, " ").trim().slice(0, NAME_LIMIT).trim();
  return t || fallback;
}

export function cleanNames(names) {
  return Object.fromEntries(Object.entries(DEFAULT_NAMES).map(([k, d]) => [k, cleanName(names?.[k], d)]));
}

// Swap the original names in a piece of text for the chosen ones.
const PATTERN = new RegExp(`\\b(${Object.values(DEFAULT_NAMES).join("|")})\\b`, "g");
export function applyNames(text, names) {
  if (typeof text !== "string" || !names) return text;
  return text.replace(PATTERN, (m) => names[m.toLowerCase()] ?? m);
}

// The same, through every string in a slide's step (words, titles, chips and facts).
export function applyNamesDeep(value, names) {
  if (typeof value === "string") return applyNames(value, names);
  if (Array.isArray(value)) return value.map((v) => applyNamesDeep(v, names));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, applyNamesDeep(v, names)]));
  return value;
}

// A pool for the shuffle button: short, friendly and from many backgrounds.
const POOL = ["Ava", "Noah", "Zara", "Ollie", "Priya", "Mateo", "Ella", "Kai", "Amara", "Jack", "Mia", "Yusuf", "Chloe", "Ravi", "Isla", "Tom", "Layla", "Finn", "Nia", "Omar", "Ruby", "Jamal", "Freya", "Dev", "Hana", "Ben", "Esme", "Kofi", "Lucy", "Idris", "Poppy", "Arjun", "Rosa", "Callum", "Tia", "Sami", "Maeve", "Bilal", "Daisy", "Tariq"];

export function shuffleNames(rand = Math.random) {
  const pool = [...POOL];
  const pick = () => pool.splice(Math.floor(rand() * pool.length), 1)[0];
  return { sam: pick(), maya: pick(), leo: pick(), amira: pick() };
}

const KEY = "sp.teacher.names";
export function loadNames() {
  try { return cleanNames(JSON.parse(localStorage.getItem(KEY) ?? "{}")); } catch { return { ...DEFAULT_NAMES }; }
}
export function saveNames(names) {
  try { localStorage.setItem(KEY, JSON.stringify(names)); } catch { /* storage blocked: the names last until the page closes */ }
}
