// Reading a page aloud with the browser's own speech (the Web Speech API). Nothing is sent to any server: the voice is the one on the visitor's device.
// A page is split into its headings, paragraphs and list items, and each is spoken in short pieces, because some browsers stop a long sentence part way.

const BLOCKS = "h1, h2, h3, h4, p, li, dt, dd, figcaption, blockquote, summary, caption";
const SKIP = "nav, button, [role='button'], [role='dialog'], [aria-hidden='true'], [hidden], svg, script, style, noscript, select, input, textarea, .sr-only, .pt-tools, .listen-bar, .site-footer, .tabfoot, .gm, .t-root";

export const supported = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

// The text of an element without the text of any heading, paragraph or item nested inside it, which is read on its own.
function ownText(el) {
  const copy = el.cloneNode(true);
  copy.querySelectorAll(BLOCKS).forEach((n) => n.remove());
  copy.querySelectorAll("svg, script, style, [aria-hidden='true'], .sr-only, button").forEach((n) => n.remove());
  return copy.textContent.replace(/\s+/g, " ").trim();
}

export function collectBlocks(root) {
  const out = [];
  for (const el of root.querySelectorAll(BLOCKS)) {
    if (el.closest(SKIP)) continue;
    if (el.getClientRects && el.getClientRects().length === 0 && typeof navigator !== "undefined" && !/jsdom/i.test(navigator.userAgent)) continue;
    const text = ownText(el);
    if (text.length < 2 || !/[a-z0-9]/i.test(text)) continue;
    out.push({ el, text });
  }
  return out;
}

// Pieces of about `max` characters that break at the ends of sentences, then at commas, and only then at spaces.
export function chunk(text, max = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const pieces = clean.split(/(?<=[.!?:;])\s+/);
  const out = [];
  let line = "";
  const push = (s) => { if (s) out.push(s); };
  for (const piece of pieces) {
    if (piece.length > max) {
      push(line);
      let rest = piece;
      while (rest.length > max) {
        let cut = rest.lastIndexOf(", ", max - 1) + 1;
        if (cut < max * 0.4) cut = rest.lastIndexOf(" ", max);
        if (cut < 1) cut = max;
        push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      line = rest;
    } else if ((line + " " + piece).trim().length > max) {
      push(line); line = piece;
    } else {
      line = (line + " " + piece).trim();
    }
  }
  push(line);
  return out;
}

// A British voice if the device has one, otherwise any English voice, otherwise the device's own.
export function pickVoice(voices) {
  const list = voices ?? [];
  return list.find((v) => /^en[-_]GB$/i.test(v.lang)) ?? list.find((v) => /^en/i.test(v.lang)) ?? null;
}

export function createReader({ synth, Utterance, onBlock = () => {}, onState = () => {} } = {}) {
  const S = synth ?? window.speechSynthesis;
  const U = Utterance ?? window.SpeechSynthesisUtterance;
  let blocks = [];
  let bi = 0;
  let pieces = [];
  let pi = 0;
  let rate = 1;
  let token = 0;
  let state = "idle";
  const set = (s) => { state = s; onState(s); };

  const speak = () => {
    const mine = ++token;
    if (pi >= pieces.length) {
      bi += 1;
      if (bi >= blocks.length) { set("idle"); onBlock(-1); return; }
      pieces = chunk(blocks[bi].text); pi = 0;
      if (!pieces.length) { speak(); return; }
    }
    if (pi === 0) onBlock(bi);
    const u = new U(pieces[pi]);
    u.rate = rate; u.lang = "en-GB";
    const voice = pickVoice(S.getVoices?.());
    if (voice) u.voice = voice;
    u.onend = () => { if (mine !== token) return; pi += 1; speak(); };
    u.onerror = (e) => { if (mine !== token) return; if (e?.error === "canceled" || e?.error === "interrupted") return; set("idle"); onBlock(-1); };
    S.speak(u);
  };

  return {
    get state() { return state; },
    get index() { return bi; },
    get count() { return blocks.length; },
    play(list, from = 0) {
      S.cancel();
      blocks = list; bi = Math.max(0, Math.min(from, list.length - 1)); pieces = list[bi] ? chunk(list[bi].text) : []; pi = 0;
      if (!list.length) { set("idle"); return; }
      set("playing"); speak();
    },
    pause() { if (state !== "playing") return; S.pause(); set("paused"); },
    resume() { if (state !== "paused") return; S.resume(); set("playing"); },
    stop() { token += 1; S.cancel(); set("idle"); onBlock(-1); },
    // A different block: before or after the one being read.
    skip(by) {
      if (!blocks.length) return;
      const next = Math.max(0, Math.min(blocks.length - 1, bi + by));
      token += 1; S.cancel();
      bi = next; pieces = chunk(blocks[bi].text); pi = 0;
      set("playing"); speak();
    },
    setRate(r) {
      rate = r;
      if (state === "playing") { token += 1; S.cancel(); speak(); }
    },
  };
}
