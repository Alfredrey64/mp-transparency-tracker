// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { chunk, collectBlocks, createReader, pickVoice, langOf } from "./readAloud";

describe("chunk", () => {
  it("keeps short text whole and splits at the ends of sentences", () => {
    expect(chunk("One short line.")).toEqual(["One short line."]);
    const parts = chunk("First sentence here. Second sentence here. Third one.", 30);
    expect(parts.every((p) => p.length <= 30)).toBe(true);
    expect(parts.join(" ")).toBe("First sentence here. Second sentence here. Third one.");
  });
  it("breaks a very long sentence at commas or spaces, never in the middle of a word", () => {
    const text = "alpha, beta, gamma, delta, epsilon, zeta, eta, theta, iota, kappa, lambda, mu, nu, xi, omicron, pi, rho, sigma, tau, upsilon";
    const parts = chunk(text, 40);
    expect(parts.every((p) => p.length <= 40)).toBe(true);
    expect(parts.join(" ").replace(/\s+/g, " ")).toBe(text);
  });
  it("returns nothing for empty text", () => { expect(chunk("   ")).toEqual([]); });
});

describe("collectBlocks", () => {
  it("reads headings, paragraphs and list items, and skips menus, buttons and hidden things", () => {
    document.body.innerHTML = `<main><nav><p>Menu text</p></nav><h2>A heading</h2><p>First paragraph.<button>Click</button></p><ul><li>Item one<ul><li>Nested</li></ul></li></ul><p aria-hidden="true">Hidden</p><div class="gm"><p>A game</p></div></main>`;
    const blocks = collectBlocks(document.querySelector("main")).map((b) => b.text);
    expect(blocks).toEqual(["A heading", "First paragraph.", "Item one", "Nested"]);
  });
});

describe("pickVoice", () => {
  it("prefers a British voice", () => {
    expect(pickVoice([{ lang: "en-US", name: "a" }, { lang: "en-GB", name: "b" }]).name).toBe("b");
    expect(pickVoice([{ lang: "fr-FR" }])).toBe(null);
  });
});

describe("the reader", () => {
  const fake = () => {
    const spoken = [];
    const synth = { speak: (u) => { spoken.push(u); }, cancel: () => {}, pause: () => {}, resume: () => {}, getVoices: () => [] };
    function Utterance(text) { this.text = text; }
    return { synth, Utterance, spoken };
  };
  const finish = (u) => u.onend();

  it("speaks block after block, and says which one it is on", () => {
    const f = fake();
    const seen = [];
    const r = createReader({ ...f, onBlock: (i) => seen.push(i) });
    r.play([{ text: "One." }, { text: "Two." }]);
    expect(f.spoken).toHaveLength(1);
    finish(f.spoken[0]);
    expect(f.spoken[1].text).toBe("Two.");
    finish(f.spoken[1]);
    expect(seen).toEqual([0, 1, -1]);
    expect(r.state).toBe("idle");
  });
  it("pauses, resumes and stops", () => {
    const f = fake();
    const r = createReader(f);
    r.play([{ text: "One." }, { text: "Two." }]);
    r.pause(); expect(r.state).toBe("paused");
    r.resume(); expect(r.state).toBe("playing");
    r.stop(); expect(r.state).toBe("idle");
    finish(f.spoken[0]);
    expect(f.spoken).toHaveLength(1);
  });
  it("skips forward and back, and changes the speed of what is being read", () => {
    const f = fake();
    const r = createReader(f);
    r.play([{ text: "One." }, { text: "Two." }, { text: "Three." }]);
    r.skip(1); expect(f.spoken.at(-1).text).toBe("Two.");
    r.skip(1); r.skip(1); expect(f.spoken.at(-1).text).toBe("Three.");
    r.skip(-2); expect(f.spoken.at(-1).text).toBe("One.");
    r.setRate(1.5); expect(f.spoken.at(-1).rate).toBe(1.5);
  });
});

describe("reading in Welsh", () => {
  it("only picks a Welsh voice for Welsh, and none if the device has none", () => {
    expect(pickVoice([{ lang: "en-GB", name: "a" }, { lang: "cy-GB", name: "w" }], "cy").name).toBe("w");
    expect(pickVoice([{ lang: "en-GB", name: "a" }], "cy")).toBe(null);
    expect(pickVoice([{ lang: "cy-GB", name: "w" }])).toBe(null);
  });
  it("finds the language of an element from the nearest lang attribute", () => {
    const root = { lang: "cy" };
    const el = (lang) => ({ closest: () => ({ getAttribute: () => lang }) });
    expect(langOf(el("en"), root)).toBe("en");
    expect(langOf(el("cy"), root)).toBe("cy");
    expect(langOf({ closest: () => null }, root)).toBe("cy");
    expect(langOf(undefined, { lang: "en" })).toBe("en");
  });
  it("speaks in the chosen language", () => {
    const spoken = [];
    class U { constructor(t) { this.text = t; } }
    const synth = { cancel() {}, speak(u) { spoken.push(u); }, getVoices: () => [{ lang: "cy-GB", name: "w" }, { lang: "en-GB", name: "e" }] };
    const r = createReader({ synth, Utterance: U, lang: "cy" });
    r.play([{ el: null, text: "Helo byd." }]);
    expect(spoken[0].lang).toBe("cy-GB");
    expect(spoken[0].voice.name).toBe("w");
  });
});
