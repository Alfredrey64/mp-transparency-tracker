import { useCallback, useEffect, useRef, useState } from "react";
import "../pagetools.css";

// A helper for every page, added from the outside so no page has to ask for it. "On this page": once a long page has been scrolled, a small button lists the page's own headings and jumps to any of them, lighting the one in view.
const SKIP = ".page-hero, .sn, [role='dialog'], .site-footer, .t-root, .tm-sheet";

function slug(text, used) {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "section";
  let id = `pt-${base}`;
  for (let n = 2; used.has(id); n++) id = `pt-${base}-${n}`;
  used.add(id);
  return id;
}

function scan(main) {
  const used = new Set();
  const found = [];
  for (const h of main.querySelectorAll("h2")) {
    if (h.closest(SKIP) || h.offsetParent === null) continue;
    const text = h.textContent.replace(/\s+/g, " ").trim();
    if (text.length < 3 || text.length > 80) continue;
    if (!h.id || h.id.startsWith("pt-")) h.id = slug(text, used); else used.add(h.id);
    h.style.scrollMarginTop = "92px";
    found.push({ id: h.id, text });
  }
  return found;
}

// The page is given as `key`, so each page starts with a fresh list.
export default function PageTools({ view, selected }) {
  const [heads, setHeads] = useState([]);
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(false);
  const [current, setCurrent] = useState(null);
  const box = useRef(null);
  const btn = useRef(null);

  const refresh = useCallback(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    const next = scan(main);
    setHeads((prev) => (prev.map((h) => h.id).join("|") === next.map((h) => h.id).join("|") ? prev : next));
  }, []);

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return undefined;
    let timer = 0;
    const later = () => { clearTimeout(timer); timer = setTimeout(refresh, 450); };
    const mo = new MutationObserver(later);
    mo.observe(main, { childList: true, subtree: true });
    later();
    return () => { clearTimeout(timer); mo.disconnect(); };
  }, [view, selected, refresh]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setOn(window.scrollY > 500);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, []);

  // Which heading is nearest the top of the screen.
  useEffect(() => {
    if (heads.length < 3 || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (seen) setCurrent(seen.target.id);
    }, { rootMargin: "-10% 0px -75% 0px" });
    heads.forEach((h) => { const el = document.getElementById(h.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [heads]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!box.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (heads.length < 3 || selected) return null;
  const go = (id) => {
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    setOpen(false);
  };
  return (
    <div className="pt-tools" data-on={on || open ? "1" : "0"}>
      {open && (
        <nav ref={box} className="pt-list" aria-label="On this page">
          <b>On this page</b>
          <ol>
            {heads.map((h) => (
              <li key={h.id}><button type="button" aria-current={current === h.id ? "true" : undefined} onClick={() => go(h.id)}>{h.text}</button></li>
            ))}
          </ol>
        </nav>
      )}
      <button ref={btn} type="button" className="pt-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)} tabIndex={on || open ? 0 : -1}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4h12M2 8h9M2 12h6" /></svg>
        On this page
      </button>
    </div>
  );
}
