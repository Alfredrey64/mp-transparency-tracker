/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { qrSvg } from "../../lib/qr";
import { gameLink } from "../../lib/classCode";

// The class code for the game on screen: a short code to write on the board, the same thing as a link, and a QR code for a tablet. It is made here in the
// browser from the game and its setup. Nothing about the class or the pupils is recorded anywhere.
export default function ClassCode({ code }) {
  const [said, setSaid] = useState("");
  const link = gameLink(window.location.origin, code);
  const svg = useMemo(() => qrSvg(link, { cell: 8 }), [link]);
  const copy = async (what, text) => {
    try { await navigator.clipboard.writeText(text); setSaid(what); } catch { setSaid(""); }
    setTimeout(() => setSaid(""), 2200);
  };
  return (
    <aside className="cc" aria-label="Class code">
      <div className="cc-top">
        <div>
          <span className="cc-label">Class code</span>
          <code className="cc-code" aria-live="polite">{code}</code>
        </div>
        <div className="cc-btns">
          <button type="button" className="btn btn-secondary" onClick={() => copy("code", code)}>Copy the code</button>
          <button type="button" className="btn btn-secondary" onClick={() => copy("link", link)}>Copy the link</button>
          <span className="cc-said" role="status">{said === "code" ? "Code copied" : said === "link" ? "Link copied" : ""}</span>
        </div>
      </div>
      <p className="cc-note">Write the code on the board. Pupils type it into the box on the Activities and games page, or open the link or scan the QR code, and get this same game with the same setup. It records nothing about the class.</p>
      <details className="cc-qr">
        <summary className="ons-tap">Show the QR code</summary>
        <div role="img" aria-label={`QR code that opens the game with the code ${code}`} dangerouslySetInnerHTML={{ __html: svg }} />
      </details>
    </aside>
  );
}
