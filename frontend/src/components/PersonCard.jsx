import { useState } from "react";
import { COLORS, FONT_DISPLAY, FONT_BODY, chip } from "../theme";
import { initials } from "../lib/format";

// One clickable person in a list, the same for an MP and a peer: a round photo (or initials) ringed in their party colour, their name in bold, a
// line under it, and an optional smaller line. Used by the MPs list and the House of Lords list so both read the same way.

function Avatar({ url, name, color }) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (url && !errored) {
    return (
      <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.paperCard, border: `2px solid ${COLORS.paperCard}`, boxShadow: `0 0 0 2px ${color}55` }}>
        <img loading="lazy" decoding="async" src={url} alt="" onError={() => setErrored(true)} onLoad={() => setLoaded(true)} style={{ width: 29, height: 29, borderRadius: "50%", objectFit: "cover", objectPosition: "center", opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }} />
      </div>
    );
  }
  return (
    <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, ...chip(color) }}>
      {initials(name)}
    </div>
  );
}

// One watcher for every card on the page. A card starts a few pixels low and transparent and eases up once it is near the screen; it is plain CSS
// (.pc in index.css) rather than an animated component each, because taking hundreds of those away when you leave the MPs list froze the page change.
let watcher;
function revealWhenNear(el) {
  if (!el) return undefined;
  if (typeof IntersectionObserver === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
  watcher ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
        e.target.removeAttribute("data-pc");
        watcher.unobserve(e.target);
      }
    },
    { rootMargin: "80px" },
  );
  el.setAttribute("data-pc", "wait");
  watcher.observe(el);
  return () => watcher.unobserve(el);
}

export default function PersonCard({ name, photo, color, line, extra, onClick, index = 0 }) {
  return (
    <button
      type="button"
      className="pc"
      onClick={onClick}
      ref={revealWhenNear}
      style={{ "--pc-c": color, "--pc-d": `${(index % 16) * 0.02}s`, textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: `color-mix(in srgb, ${color} 7%, ${COLORS.paperCard})`, borderRadius: 12, cursor: "pointer" }}
    >
      <Avatar url={photo} name={name} color={color} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 16.5, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{line}</div>
        {extra && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{extra}</div>}
      </span>
    </button>
  );
}
