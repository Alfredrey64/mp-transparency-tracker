import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildSlides } from "./slides";
import { SCENES } from "./sceneList";
import { LayersScene, HousesScene, RunScene, PartyIntroScene, PartyScene, NiScene, VoiceScene, VoteScene, QuizScene } from "./Stages";
import { MENU } from "../../data/siteMenu";
import { CHAPTERS, PARTIES, STORIES, QUIZ, VOTE, CHECKED } from "../../data/teacherMode";
import { PARTY_MANIFESTOS } from "../../data/partyManifestos";

// Each picture is drawn in pieces tagged with the step they arrive on. The words for a step and the pieces for it have to line up, or a step would
// show nothing new, or a piece would never appear.
const lastBeat = (markup) => Math.max(...[...markup.matchAll(/data-beat="(\d+)"/g)].map((m) => Number(m[1])));

describe("Teacher mode", () => {
  it("has a picture for every step of every story, and no picture left over", () => {
    for (const [key, story] of Object.entries(STORIES)) {
      const Scene = SCENES[key];
      expect(Scene, key).toBeTruthy();
      expect(lastBeat(renderToStaticMarkup(<svg><Scene /></svg>)), key).toBe(story.beats.length - 1);
    }
  });

  it("builds the other pictures to match their words", () => {
    const slides = buildSlides();
    const steps = (kind) => slides.find((s) => s.kind === kind).steps.length;
    const drawn = { layers: <LayersScene />, houses: <HousesScene />, run: <RunScene />, partyIntro: <PartyIntroScene />, party: <PartyScene party={PARTIES[0]} />, ni: <NiScene />, voice: <VoiceScene /> };
    for (const [kind, scene] of Object.entries(drawn)) expect(lastBeat(renderToStaticMarkup(<svg>{scene}</svg>)), kind).toBe(steps(kind) - 1);
  });

  it("starts every chapter with its own slide, in order", () => {
    const slides = buildSlides();
    expect(slides.filter((s) => s.kind === "chapter").map((s) => s.chapter)).toEqual(CHAPTERS.map((c) => c.key));
    expect(new Set(slides.map((s) => s.id)).size).toBe(slides.length);
    for (const s of slides) expect(s.steps.length, s.id).toBeGreaterThan(0);
  });

  it("gives every party a leader, a manifesto summary and three promises", () => {
    for (const p of PARTIES) {
      expect(p.leader, p.key).toBeTruthy();
      const m = PARTY_MANIFESTOS.find((x) => x.key === p.manifesto);
      expect(m, p.key).toBeTruthy();
      const slide = buildSlides().find((s) => s.party?.key === p.key);
      expect(slide.steps[2].list, p.key).toHaveLength(3);
    }
  });

  it("shows how many MPs a party has only when it is known, and says when leaders were checked", () => {
    const withSeats = buildSlides({ labour: 405 }).find((s) => s.party?.key === "labour");
    expect(withSeats.steps[0].fact).toContain("405");
    expect(buildSlides().find((s) => s.party?.key === "labour").steps[0].fact).toBeUndefined();
    expect(JSON.stringify(buildSlides().find((s) => s.kind === "partyIntro"))).toContain(CHECKED);
  });

  it("has a quiz whose answers exist and say why", () => {
    for (const q of QUIZ) {
      expect(q.options[q.answer], q.q).toBeTruthy();
      expect(q.why.length, q.q).toBeGreaterThan(10);
    }
  });

  it("never tells a child who to vote for", () => {
    const text = JSON.stringify([buildSlides(), STORIES]).toLowerCase();
    for (const phrase of ["you should vote", "vote for labour", "vote for the conservative", "vote conservative", "vote reform", "best party", "worst party"]) expect(text).not.toContain(phrase);
  });

  it("gives every chapter four words to learn, each with its meaning", () => {
    for (const c of CHAPTERS) {
      expect(c.words, c.key).toHaveLength(4);
      for (const w of c.words) expect(w, w).toMatch(/^[^:]+: .{12,}/);
    }
    const slide = buildSlides().find((s) => s.kind === "chapter");
    expect(slide.steps.map((x) => x.title)).toContain("Words you will meet");
  });

  it("has a class vote with two options, drawn as two columns that grow with the count", () => {
    const slide = buildSlides().find((s) => s.kind === "vote");
    expect(slide.chapter).toBe("voice");
    expect(VOTE.options).toHaveLength(2);
    const none = renderToStaticMarkup(<svg><VoteScene votes={[0, 0]} /></svg>);
    const some = renderToStaticMarkup(<svg><VoteScene votes={[8, 4]} /></svg>);
    expect(none).toContain("scaleY(0.012)");
    expect(some).toContain("scaleY(1)");
    expect(some).toContain("scaleY(0.5)");
  });

  it("only throws confetti at the end of the quiz", () => {
    expect(renderToStaticMarkup(<svg><QuizScene beat={0} /></svg>)).not.toContain("t-confetti");
    expect(renderToStaticMarkup(<svg><QuizScene beat={3} q={5} /></svg>)).toContain("t-confetti");
  });

  it("draws a party's seats out of 650 only when the number is known", () => {
    const withSeats = renderToStaticMarkup(<svg><PartyScene party={PARTIES[0]} seats={405} /></svg>);
    expect(withSeats).toContain("405");
    expect((withSeats.match(/class="t-seat"/g) ?? []).length).toBe(405);
    expect(renderToStaticMarkup(<svg><PartyScene party={PARTIES[0]} /></svg>)).not.toContain("t-seat");
  });

  it("sits in the foot of the menu, not in a menu group", () => {
    expect(MENU.flatMap((m) => m.groups.flatMap((g) => g.items.map((i) => i.key)))).not.toContain("teacher");
  });
});

import { applyNames, cleanNames, DEFAULT_NAMES, shuffleNames } from "./characters";
import { buildSlides as buildNamedSlides } from "./slides";

describe("naming the characters", () => {
  it("swaps the original names in the words, including possessives", () => {
    expect(applyNames("This is Sam and her dad. Leo's school.", { ...DEFAULT_NAMES, sam: "Priya", leo: "Kofi" })).toBe("This is Priya and her dad. Kofi's school.");
  });
  it("leaves other words alone", () => {
    expect(applyNames("Samuel and Leopold", { ...DEFAULT_NAMES, sam: "Priya" })).toBe("Samuel and Leopold");
  });
  it("tidies what is typed: letters only, cut short, never empty", () => {
    const n = cleanNames({ sam: "  <b>Alexandria-Mae</b> the Great  ", maya: "", leo: 42, amira: "D'Arcy" });
    expect(n.sam).toBe("bAlexandria-Mae".slice(0, 12).trim());
    expect(n.sam.length).toBeLessThanOrEqual(12);
    expect(n.maya).toBe("Maya");
    expect(n.leo).toBe("Leo");
    expect(n.amira).toBe("D'Arcy");
  });
  it("puts the chosen names into the story slides only", () => {
    const names = { sam: "Priya", maya: "Ava", leo: "Kofi", amira: "Zara" };
    const slides = buildNamedSlides({}, names);
    const text = (kind) => JSON.stringify(slides.filter((s) => s.kind === kind));
    expect(text("story")).toContain("Priya");
    expect(text("story")).toContain("Kofi");
    expect(text("story")).not.toMatch(/\bSam\b|\bLeo\b|\bMaya\b|\bAmira\b/);
    expect(JSON.stringify(slides)).toBe(JSON.stringify(buildNamedSlides({}, names)));
  });
  it("shuffles to four different names", () => {
    const n = shuffleNames();
    expect(new Set(Object.values(n)).size).toBe(4);
  });
});

import { LEADER_LOOKS, leaderLook, NEUTRAL_LOOK } from "./leaderLooks";
describe("leaders in the pictures", () => {
  it("every party leader has a look chosen for them, so nobody is drawn as someone else", () => {
    for (const p of PARTIES) expect(LEADER_LOOKS[p.leader], `${p.leader} needs an entry in leaderLooks.js`).toBeTruthy();
  });
  it("a leader with no entry is drawn neutrally", () => {
    expect(leaderLook("Somebody New")).toBe(NEUTRAL_LOOK);
  });
});
