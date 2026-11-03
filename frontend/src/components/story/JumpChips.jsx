/** @jsxImportSource react */
import "../../today.css";

// A row of buttons that scroll to the chapters of a long page, each with how many entries it holds. Chapters are found by their heading text.
export default function JumpChips({ items, label = "Jump to a part of this page" }) {
  const go = (title) => {
    const h = [...document.querySelectorAll("main h2")].find((el) => el.textContent.trim() === title);
    if (h) h.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  return (
    <nav className="td-jump" aria-label={label}>
      {items.map((it) => (
        <button key={it.title} type="button" style={{ "--tc": it.colour }} onClick={() => go(it.title)}>
          <i aria-hidden="true" />{it.title}{it.count !== undefined && <span>{it.count}</span>}
        </button>
      ))}
    </nav>
  );
}
