import { CHAPTERS, STORIES, LAYERS, HOUSES, LAW_STEPS, WHO_RUNS, PARTIES, NI_PARTIES, VOICES, VOTE, CHECKED } from "../../data/teacherMode";
import { PARTY_MANIFESTOS } from "../../data/partyManifestos";
import { applyNamesDeep } from "./characters";

// The whole presentation as a flat list of slides. A slide has `steps`: what to say under the picture at each step of it (the picture builds up
// in step with them). `ask` is the question for the class that goes in the teacher's notes.

const chapterIndex = (key) => CHAPTERS.findIndex((c) => c.key === key);

export function buildSlides(seats = {}, names) {
  const out = [];
  const add = (chapter, slide) => out.push({ chapter, id: `${chapter}-${out.length}`, ...slide });

  for (const ch of CHAPTERS) {
    add(ch.key, {
      kind: "chapter",
      steps: [
        { kicker: `Chapter ${chapterIndex(ch.key) + 1} of ${CHAPTERS.length}, about ${ch.minutes} minutes`, title: ch.title, text: ch.blurb },
        { kicker: `Chapter ${chapterIndex(ch.key) + 1} of ${CHAPTERS.length}`, title: "By the end you will", list: ch.aims },
        { kicker: `Chapter ${chapterIndex(ch.key) + 1} of ${CHAPTERS.length}`, title: "Words you will meet", list: ch.words },
      ],
      ask: ch.ask,
    });

    if (ch.key === "why") {
      for (const key of ["shop", "hospital", "school", "bus"]) {
        const st = STORIES[key];
        add(ch.key, { kind: "story", scene: key, steps: st.beats.map((b, i) => ({ kicker: st.kicker, title: i === 0 ? st.title : undefined, ...b })), ask: st.ask });
      }
    }

    if (ch.key === "who") {
      add(ch.key, {
        kind: "layers",
        steps: [
          { kicker: "Who decides what?", text: "You live in a street, in a town, in one of the four nations of the UK. Several different groups of people make decisions that affect you. Let's meet them." },
          ...LAYERS.map((l) => ({ kicker: "Who decides what?", title: l.title, text: l.who + ".", chips: l.examples })),
        ],
        ask: ["Pick one thing from today. Which of these three groups looks after it?", "Why not have just one group decide everything?"],
      });
    }

    if (ch.key === "parliament") {
      add(ch.key, {
        kind: "houses",
        steps: [
          { kicker: "Parliament", text: "Parliament is where the UK's laws are made. It meets in the Palace of Westminster in London, and it has three parts." },
          ...HOUSES.map((h) => ({ kicker: "Parliament", title: h.title, text: h.text, chips: [h.who] })),
        ],
        ask: ["Why might it be good to have more than one group look at a law?", "Which part is elected, and which part is not?"],
      });
      add(ch.key, {
        kind: "law",
        steps: LAW_STEPS.map((s, i) => ({ kicker: `How a law is made, step ${i + 1} of ${LAW_STEPS.length}`, title: s.label, text: s.text })),
        ask: ["What could go wrong if a law were never checked?", "Can you put the five steps in order without looking?"],
      });
      add(ch.key, {
        kind: "run",
        steps: [
          { kicker: "Who runs the country?", text: "Parliament makes the laws, but it does not run the country day to day. Someone else does that. Let's see who." },
          { kicker: "Who runs the country?", title: WHO_RUNS[0].title, text: WHO_RUNS[0].text },
          { kicker: "Who runs the country?", title: WHO_RUNS[1].title, text: WHO_RUNS[1].text },
          { kicker: "Who runs the country?", title: WHO_RUNS[2].title, text: WHO_RUNS[2].text },
        ],
        ask: ["Why is it important to have an opposition?", "What is the difference between Parliament and the government?"],
      });
    }

    if (ch.key === "parties") {
      add(ch.key, {
        kind: "partyIntro",
        steps: [
          { kicker: "Political parties", title: "What is a party?", text: "A political party is a group of people who share ideas about how the country should be run." },
          { kicker: "Political parties", text: "Each party chooses a leader and tries to win seats in Parliament by persuading people to vote for it. The party with the most support usually forms the government." },
          { kicker: "Political parties", title: "A fair warning", text: "We are not telling anyone who to vote for. The next slides show what each party tends to believe, who leads it and what it promised in 2024.", fact: `Leaders and seat numbers change. They were last checked on ${CHECKED}.` },
        ],
        ask: ["Why do people join a party?", "Can two people who disagree still both want the best for the country?"],
      });
      for (const p of PARTIES) {
        const m = PARTY_MANIFESTOS.find((x) => x.key === p.manifesto);
        const mps = seats[p.key];
        add(ch.key, {
          kind: "party", party: p,
          steps: [
            { kicker: "The parties", title: p.name, text: `${p.leader} is the ${p.role.charAt(0).toLowerCase() + p.role.slice(1)}. ${p.status}`, fact: mps ? `${p.name} has ${mps} MPs in the House of Commons.` : undefined },
            { kicker: "The parties", title: "What it tends to believe", text: p.idea },
            { kicker: "The parties", title: "What it promised in 2024", list: m ? m.highlights.slice(0, 3) : undefined, text: m ? undefined : "See the party's own website." },
          ],
          ask: ["What question would you like to ask this party's leader?", "What would you check before believing a promise?"],
        });
      }
      add(ch.key, {
        kind: "ni",
        steps: [
          { kicker: "The parties", title: NI_PARTIES.title, text: NI_PARTIES.text },
          { kicker: "The parties", title: NI_PARTIES.groups[0].label, text: NI_PARTIES.groups[0].text },
          { kicker: "The parties", title: NI_PARTIES.groups[1].label, text: NI_PARTIES.groups[1].text },
          { kicker: "The parties", title: NI_PARTIES.groups[2].label, text: NI_PARTIES.groups[2].text, fact: NI_PARTIES.posts },
        ],
        ask: ["Why do you think some questions divide people more than others?"],
      });
    }

    if (ch.key === "voice") {
      add(ch.key, {
        kind: "voice",
        steps: [
          { kicker: "Your voice", text: "You don't have to wait until you're old enough to vote to be heard. Here are six ways to have a say." },
          ...[0, 1, 2].map((n) => ({ kicker: "Your voice", title: `${VOICES[n * 2].title} and ${VOICES[n * 2 + 1].title.toLowerCase()}`, list: [VOICES[n * 2].text, VOICES[n * 2 + 1].text] })),
        ],
        ask: ["What is one thing you would change in your school or town, and who would you tell?", "How do you tell a fact from an opinion?"],
      });
      add(ch.key, { kind: "vote", steps: [{ kicker: VOTE.kicker, title: VOTE.title, text: VOTE.text }], ask: VOTE.ask });
      add(ch.key, { kind: "quiz", steps: [{ kicker: "Quick quiz", text: "" }], ask: [] });
    }
  }
  // The class's own names for the children in the stories.
  return names ? out.map((sl) => (sl.kind === "story" ? { ...sl, steps: applyNamesDeep(sl.steps, names), ask: applyNamesDeep(sl.ask, names) } : sl)) : out;
}

