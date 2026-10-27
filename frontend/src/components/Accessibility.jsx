/** @jsxImportSource react */
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { card, cardTitle } from "../lib/onsStyles";
import { PageHeader } from "./shared";
import { IconAccess } from "./icons";
import AccessibilityControls from "./AccessibilityControls";

// The accessibility page: the controls, and a plain statement of how accessible the site is, how it is checked, what is not good enough yet, and how to tell us.
const ISSUES = "https://github.com/Alfredrey64/mp-transparency-tracker/issues";
const p = { fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.65, color: COLORS.inkSoft, margin: "8px 0 0", maxWidth: 760 };
const h = { ...cardTitle, fontSize: 21 };
const li = { marginBottom: 6 };

export default function Accessibility() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader icon={IconAccess} kicker="About this site" title="Accessibility" subtitle="Change how the site looks and sounds, hear a page read aloud, and read how we check that it works for everyone." />
      <section aria-labelledby="h-ax-controls" style={card}>
        <h2 id="h-ax-controls" style={h}>Change how the site looks and sounds</h2>
        <p style={p}>Your choices apply to every page and stay on this device. You can also open this panel from the person icon at the top of any page.</p>
        <div style={{ marginTop: 16 }}><AccessibilityControls /></div>
      </section>

      <section aria-labelledby="h-ax-statement" style={{ ...card, marginTop: 24 }}>
        <h2 id="h-ax-statement" style={h}>Our accessibility statement</h2>
        <p style={p}>We want everyone to be able to understand how their politics works, including people who use a screen reader, a keyboard, a switch, a magnifier, or who find reading hard. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. We have not had an independent audit, so we say what we do, not that we have passed.</p>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, margin: "18px 0 0", color: COLORS.ink }}>What we do</h3>
        <ul style={{ ...p, paddingLeft: 20 }}>
          <li style={li}>Every page works with the keyboard alone. There is a link at the top to skip straight to the content, and a clear ring shows where you are.</li>
          <li style={li}>Pop-up boxes trap focus while they are open, close with Escape and put you back where you were.</li>
          <li style={li}>Text and colours are tuned to reach at least the contrast the guidelines ask for, in both the light and the dark page. Meaning is never carried by colour alone.</li>
          <li style={li}>Moving pictures stop when your device asks for less motion, and you can also switch motion off here.</li>
          <li style={li}>Pages have headings in order, a list of them under &ldquo;On this page&rdquo;, and plain-English explanations of political words.</li>
          <li style={li}>Automated accessibility checks run on the pieces of the site as we build them, and we test pages by hand in several browsers and at phone and desktop sizes.</li>
        </ul>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, margin: "18px 0 0", color: COLORS.ink }}>What is not good enough yet</h3>
        <ul style={{ ...p, paddingLeft: 20 }}>
          <li style={li}>Some charts and maps are mainly visual. Most have a table or a written summary beside them, but not every one does yet.</li>
          <li style={li}>The animated stories in Teacher mode are made for a class screen. Their words are on the page, but the pictures themselves are not described one by one.</li>
          <li style={li}>The larger text option zooms the page, so on a small phone it can only grow a little before the page would stop fitting.</li>
          <li style={li}>Reading aloud uses the voice built into your browser, so how it sounds depends on your device.</li>
        </ul>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, margin: "18px 0 0", color: COLORS.ink }}>Tell us about a problem</h3>
        <p style={p}>If something does not work for you, please <a href={`${ISSUES}/new?title=${encodeURIComponent("Accessibility problem: ")}`} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 700 }}>report it on GitHub<span className="sr-only"> (opens in a new tab)</span></a>, naming the page and what you use to read it. We will look at it and say what we can do.</p>
        <p style={{ ...p, fontSize: 13.5 }}>This statement was written on 27 October 2026 and is checked whenever a large feature is added.</p>
      </section>
    </div>
  );
}
