/** @jsxImportSource react */
import { useRef, useState } from "react";
import { useDialog } from "../lib/useDialog";
import { useT } from "../lib/useLang";
import { dateLocale } from "../lib/i18n";
import { fullDate } from "../lib/ballots";
import { citations, citeAddress, pageName, problemLink } from "../lib/cite";
import "../pagefoot.css";

// The foot of every page, as on the best reference sites: refer to this page, print it, or tell us what is wrong with it. Nothing here collects anything. The
// report link opens a new issue on GitHub in a new tab, with the page's address filled in.
function CiteDialog({ onClose, returnFocusRef }) {
  const t = useT();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  useDialog({ open: true, onClose, panelRef, returnFocusRef, initialFocusRef: closeRef });
  const title = pageName(document.title);
  const list = citations(title, citeAddress(window.location));
  const [style, setStyle] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = list[style];
  const copy = async () => {
    try { await navigator.clipboard.writeText(current.text); } catch {
      const box = document.createElement("textarea"); box.value = current.text; document.body.appendChild(box); box.select();
      try { document.execCommand("copy"); } catch { /* the text is still on screen to copy by hand */ }
      box.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };
  return (
    <div className="pf-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} className="pf-box" role="dialog" aria-modal="true" aria-labelledby="pf-cite-h" tabIndex={-1}>
        <div className="pf-head"><h2 id="pf-cite-h">{t("Refer to this page")}</h2><button ref={closeRef} type="button" className="pf-x" aria-label={t("Close")} onClick={onClose}>×</button></div>
        <p>{t("Copy a reference to use in an essay, a report or a story. The date is today, because pages here are updated as new figures come out.")}</p>
        <div className="pf-tabs" role="group" aria-label={t("Style")}>
          {list.map((c, i) => <button key={c.key} type="button" aria-pressed={style === i} onClick={() => { setStyle(i); setCopied(false); }}>{c.label}</button>)}
        </div>
        <pre className="pf-cite" tabIndex={0} aria-label={t("{style} reference", { style: current.label })}>{current.text}</pre>
        <div className="pf-actions"><button type="button" className="btn btn-primary" onClick={copy}>{copied ? t("Copied") : t("Copy")}</button><span role="status" className="sr-only">{copied ? t("Copied to the clipboard") : ""}</span></div>
      </div>
    </div>
  );
}

// Today in the visitor's own time zone, as a yyyy-mm-dd date.
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export default function PageFoot() {
  const t = useT();
  const [cite, setCite] = useState(false);
  const citeButton = useRef(null);
  const title = () => pageName(document.title);
  return (
    <aside className="pf" aria-label={t("Use this page")}>
      <b>{t("Use this page")}</b>
      <div className="pf-row">
        <button ref={citeButton} type="button" onClick={() => setCite(true)} aria-haspopup="dialog">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h4v5c0 2.5-1.5 4-4 4M14 7h4v5c0 2.5-1.5 4-4 4" /></svg>
          {t("Refer to this page")}
        </button>
        <button type="button" onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M8 14h8v6H8z" /></svg>
          {t("Print or save as PDF")}
        </button>
        <a href={problemLink(title(), citeAddress(window.location))} target="_blank" rel="noreferrer" onClick={(e) => { e.currentTarget.href = problemLink(title(), citeAddress(window.location)); }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
          {t("Report a problem")}<span className="sr-only"> {t("(opens GitHub in a new tab)")}</span>
        </a>
      </div>
      <small>{t("Reporting opens a public page on GitHub. Please leave out personal details.")}</small>
      <p className="pf-printed">{t("Printed from {address} on {date}. Simple Politics is independent and unofficial.", { address: citeAddress(window.location), date: fullDate(todayIso(), dateLocale()) })}</p>
      {cite && <CiteDialog onClose={() => { setCite(false); citeButton.current?.focus(); }} returnFocusRef={citeButton} />}
    </aside>
  );
}
