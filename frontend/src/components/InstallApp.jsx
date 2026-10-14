/** @jsxImportSource react */
import { useState } from "react";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../theme";
import { useInstall, promptInstall, installDismissed, dismissInstall } from "../lib/install";
import { useOnline } from "../lib/useOnline";

// Two places to install the site as an app: a card in Settings that always says how, and a quiet banner on phones and tablets that appears on
// the second visit and can be put away for good. Nothing is installed without the person choosing it.

const button = { fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, padding: "9px 18px", borderRadius: 999, border: "none", cursor: "pointer", background: COLORS.accent, color: "#fff" };

function Steps() {
  return (
    <ol style={{ margin: "8px 0 0", paddingLeft: 20, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.inkSoft }}>
      <li>Tap the Share button in Safari (the square with an arrow pointing up).</li>
      <li>Scroll down and tap Add to Home Screen.</li>
      <li>Tap Add. Simple Politics then opens like any other app.</li>
    </ol>
  );
}

export function InstallCard() {
  const { standalone, canPrompt, ios } = useInstall();
  const [asked, setAsked] = useState(false);
  let body;
  if (standalone) body = "You are using Simple Politics as an app on this device.";
  else if (canPrompt) body = "Add Simple Politics to your home screen or desktop. It opens in its own window, works offline for pages you have already visited, and uses no extra storage to speak of.";
  else if (ios) body = "On iPhone and iPad you add it from Safari:";
  else body = "In Chrome or Edge, open the browser menu and choose Install app or Add to Home Screen. Firefox and desktop Safari can add it as a bookmark instead.";
  return (
    <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Get the app</div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: COLORS.ink, margin: 0 }}>{body}</p>
      {ios && !standalone && <Steps />}
      {canPrompt && !asked && <button type="button" style={{ ...button, marginTop: 12 }} onClick={async () => { await promptInstall(); setAsked(true); }}>Install the app</button>}
    </div>
  );
}

export function InstallBanner() {
  const { standalone, canPrompt, ios, visits } = useInstall();
  const online = useOnline();
  const [gone, setGone] = useState(() => installDismissed());
  const [steps, setSteps] = useState(false);
  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
  if (gone || standalone || !online || !narrow || visits < 2 || !(canPrompt || ios)) return null;
  const close = () => { dismissInstall(); setGone(true); };
  return (
    <section
      aria-label="Install the app"
      style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "max(14px, env(safe-area-inset-bottom))", zIndex: 60, width: "min(520px, calc(100vw - 24px))", boxSizing: "border-box", padding: "14px 16px", borderRadius: 16, background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, boxShadow: "0 12px 34px rgba(0,0,0,0.22)" }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: COLORS.ink }}>Keep Simple Politics on your phone</div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.5, color: COLORS.inkSoft, margin: "3px 0 0" }}>Add it to your home screen to open it in one tap, even with a poor signal.</p>
      {steps && <Steps />}
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        {canPrompt
          ? <button type="button" style={button} onClick={async () => { const ok = await promptInstall(); if (ok) close(); }}>Install</button>
          : !steps && <button type="button" style={button} onClick={() => setSteps(true)}>Show me how</button>}
        <button type="button" onClick={close} style={{ ...button, background: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.hairline}`, fontWeight: 600 }}>Not now</button>
      </div>
    </section>
  );
}
