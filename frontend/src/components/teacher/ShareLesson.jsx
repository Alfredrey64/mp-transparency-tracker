/** @jsxImportSource react */
import { useMemo, useState } from "react";
import { CHAPTERS } from "../../data/teacherMode";
import { qrSvg, chapterLink } from "../../lib/qr";
import "../../classroom.css";

// Share a chapter: a web address and QR code that open it straight away on a pupil's own device. The code is drawn in the browser from the address, and
// nothing about the class or the pupils is recorded: it is an ordinary link.
export default function ShareLesson() {
  const [key, setKey] = useState(CHAPTERS[0].key);
  const [copied, setCopied] = useState(false);
  const chapter = CHAPTERS.find((c) => c.key === key);
  const url = chapterLink(window.location.origin, key);
  const svg = useMemo(() => qrSvg(url, { cell: 8 }), [url]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  return (
    <section className="sl" aria-labelledby="h-tm-share" style={{ "--c": chapter.colour }}>
      <div>
        <h2 id="h-tm-share">Share a chapter with the class</h2>
        <p>Pupils can open a chapter on their own tablet or phone and go through it at their own pace, with nothing to install and no account. Put the code on the board, or print it as a poster from the sheets above.</p>
        <label className="sl-pick">
          <span>Chapter</span>
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {CHAPTERS.map((c, n) => <option key={c.key} value={c.key}>{n + 1}. {c.title}</option>)}
          </select>
        </label>
        <div className="sl-url"><code>{url}</code><button type="button" className="btn btn-secondary" onClick={copy}>{copied ? "Copied" : "Copy the link"}</button></div>
        <p className="sl-note">The link opens the chapter straight away. It records nothing about the pupils. The teacher's notes and the level setting stay on the teacher's own device.</p>
      </div>
      <div className="sl-qr" role="img" aria-label={`QR code that opens ${chapter.title}`} dangerouslySetInnerHTML={{ __html: svg }} />
    </section>
  );
}
