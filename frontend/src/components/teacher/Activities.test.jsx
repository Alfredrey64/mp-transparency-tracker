// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import Activities from "./Activities";
import { GAME_KEYS, decode, encode } from "../../lib/classCode";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let host;
afterEach(() => { act(() => root?.unmount()); host?.remove(); });
async function draw(element) {
  host = document.createElement("main");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(element); });
  return host;
}

describe("class codes on the activities hub", () => {
  it("shows a code on every card, and the codes are exactly the games the library knows", async () => {
    const node = await draw(<Activities />);
    const codes = [...node.querySelectorAll(".act-code code")].map((c) => c.textContent);
    expect(codes).toEqual(GAME_KEYS.map((k) => k.toUpperCase()));
    for (const c of codes) expect(decode(c, GAME_KEYS)?.code).toBe(c);
  });
  it("opens the game a code names, with its setup, and shows the code for it", async () => {
    const node = await draw(<Activities code="QUIZ-4-5-99" />);
    expect(node.querySelector("h2").textContent).toBe("Team quiz");
    expect(node.querySelector(".cc-code").textContent).toBe(encode("quiz", { teams: 4, rounds: 5, seed: 99 }));
    expect(node.querySelector(".act-back").textContent).toBe("All activities and games");
  });
  it("shows a way to more games, and no code strip, to a pupil who followed a link", async () => {
    const node = await draw(<Activities code="BINGO-12" pupil />);
    expect(node.querySelector("h2").textContent).toBe("Parliament bingo");
    expect(node.querySelector(".cc")).toBeNull();
    expect(node.querySelector("a.act-back").getAttribute("href")).toBe("#/teacher/activities");
  });
  it("says so when a code is not one of ours, and stays on the hub", async () => {
    const node = await draw(<Activities code="NOPE-1" />);
    expect(node.querySelector("#act-code-err")?.textContent).toMatch(/not one of ours/);
    expect(node.querySelector("#act-code").value).toBe("NOPE-1");
    expect(node.querySelectorAll(".act-card").length).toBe(GAME_KEYS.length);
  });
});
