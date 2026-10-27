// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import axe from "axe-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import PromiseExplorer from "./components/PartyPromises";
import Loading from "./components/Loading";
import AccessibilityControls from "./components/AccessibilityControls";
import SpotTheSpin from "./components/teacher/games/SpotTheSpin";
import ClassCode from "./components/teacher/ClassCode";
import { ThemeProvider } from "./lib/ThemeContext";
import { keyboardActivate, scrollRegion } from "./lib/a11y";

// Runs the axe accessibility checker over pieces of the site that can be drawn without a network. Colour contrast and page-level landmark
// rules need a real browser and a whole page, so they are checked separately (see the accessibility notes in the README).
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

async function violations(node) {
  const result = await axe.run(node, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`);
}

describe("accessibility checks", () => {
  it("the who-promises-what explorer has no violations", async () => {
    const node = await draw(<PromiseExplorer initialQuestion="why-housing-expensive" />);
    expect(await violations(node)).toEqual([]);
  });

  it("the loading placeholder has no violations and says it is loading", async () => {
    const node = await draw(<Loading />);
    expect(node.textContent).toContain("Loading");
    expect(await violations(node)).toEqual([]);
  });

  it("a scrolling box and a keyboard-activated box are named and reachable", async () => {
    let clicks = 0;
    const node = await draw(
      <div>
        <div {...scrollRegion("A wide table")} style={{ overflowX: "auto" }}><table><tbody><tr><td>x</td></tr></tbody></table></div>
        <div {...keyboardActivate(() => { clicks += 1; }, { label: "Open the details", expanded: false })}>Details</div>
      </div>,
    );
    expect(await violations(node)).toEqual([]);
    const box = node.querySelector('[aria-expanded]');
    await act(async () => { box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); });
    expect(clicks).toBe(1);
  });

  it("the accessibility controls have no violations, and each switch has a name and a state", async () => {
    const node = await draw(<ThemeProvider><AccessibilityControls /></ThemeProvider>);
    expect(await violations(node)).toEqual([]);
    const switches = [...node.querySelectorAll('[role="switch"]')];
    expect(switches.length).toBeGreaterThanOrEqual(6);
    for (const sw of switches) {
      expect(sw.getAttribute("aria-checked")).toMatch(/true|false/);
      const label = document.getElementById(sw.getAttribute("aria-labelledby"));
      expect(label?.textContent.length).toBeGreaterThan(3);
    }
  });
  it("the spot-the-spin game has no violations at the start, and its class code strip has none either", async () => {
    const node = await draw(<SpotTheSpin />);
    expect(await violations(node)).toEqual([]);
    act(() => root.unmount());
    host.remove();
    const code = await draw(<ClassCode code="QUIZ-4-5-99" />);
    expect(await violations(code)).toEqual([]);
  });
});
