// Class codes: a short code a teacher can write on the board (BINGO-12, QUIZ-4-5-99) that names a game and fixes how it is set up, so every device in the room
// opens the same game the same way. There is no server and no list of classes: the code is the game's name and its setup written out, and anyone who types it
// (or opens the same address, or scans its QR code) gets that game. Pure and tested.

// Every game and activity a code can open, by the key the hub uses for it. A test keeps this in step with the hub.
export const GAME_KEYS = ["decide", "spot", "law", "pingpong", "majority", "coalition", "role", "day", "letter", "ten", "bingo", "jargon", "quiz", "election", "budget", "petition"];

// The setup a game can be given by a code, in order. Anything a code leaves out, or gets wrong, falls back to the default, so a mistyped code never breaks a game.
export const SETUP = {
  quiz: [
    { name: "teams", min: 2, max: 4, def: 3 },
    { name: "rounds", allowed: [5, 10, 15], def: 10 },
    { name: "seed", min: 1, max: 999, def: 11 },
  ],
  bingo: [{ name: "seed", min: 1, max: 999, def: 3 }],
};

const fit = (spec, raw) => {
  const n = Number(raw);
  if (raw === undefined || raw === "" || !Number.isInteger(n)) return spec.def;
  if (spec.allowed) return spec.allowed.includes(n) ? n : spec.def;
  return n >= spec.min && n <= spec.max ? n : spec.def;
};

export const defaultsFor = (key) => Object.fromEntries((SETUP[key] ?? []).map((s) => [s.name, s.def]));

// A game's setup with every setting present and inside its limits.
export function settingsFor(key, given = {}) {
  return Object.fromEntries((SETUP[key] ?? []).map((s) => [s.name, fit(s, given?.[s.name])]));
}

// The code for a game and its setup: just the game's name when nothing has been changed, otherwise the name followed by each setting.
export function encode(key, settings) {
  const specs = SETUP[key] ?? [];
  const full = settingsFor(key, settings);
  const changed = specs.some((s) => full[s.name] !== s.def);
  return [String(key).toUpperCase(), ...(changed ? specs.map((s) => String(full[s.name])) : [])].join("-");
}

// The game and setup a code stands for, or null if the game is not one of `keys`. Case, spaces and the separator do not matter.
export function decode(text, keys) {
  const parts = String(text ?? "").trim().split(/[\s\-_.,/]+/).filter(Boolean);
  if (!parts.length) return null;
  const key = keys.find((k) => k.toLowerCase() === parts[0].toLowerCase());
  if (!key) return null;
  const specs = SETUP[key] ?? [];
  const settings = Object.fromEntries(specs.map((s, i) => [s.name, fit(s, parts[i + 1])]));
  return { key, settings, code: encode(key, settings) };
}

export const gamePath = (code) => `#/teacher/activities/${encodeURIComponent(code)}`;
export const gameLink = (origin, code) => `${origin.replace(/\/$/, "")}/teacher/activities/${encodeURIComponent(code)}`;
