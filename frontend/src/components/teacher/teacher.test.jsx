import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildSlides } from "./slides";
import { SCENES } from "./sceneList";
import { LayersScene, HousesScene, RunScene, PartyIntroScene, PartyScene, NiScene, VoiceScene } from "./Stages";
import { CHAPTERS, PARTIES, STORIES, QUIZ, CHECKED } from "../../data/teacherMode";
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
});
