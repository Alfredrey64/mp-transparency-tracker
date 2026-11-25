/** @jsxImportSource react */
import "../../backbench.css";

// A card that opens to show what is inside it. The header is the button; the panel grows smoothly and, while shut, is taken out of the tab order.
export default function Open({ colour, lead, title, meta, sub, open, onToggle, id, children }) {
  return (
    <li className="bbx-card" data-open={open ? "1" : "0"} style={{ "--ac": colour }}>
      <button type="button" className="bbx-head" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        {lead}
        <span className="bbx-main"><b className="bbx-title">{title}</b><span className="bbx-meta">{meta}</span>{sub && <span className="bbx-sub">{sub}</span>}</span>
        <span className="bbx-chev" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3.5 6l4.5 4.5L12.5 6" /></svg></span>
      </button>
      <div className="bbx-panel" id={id} inert={!open}>
        <div className="bbx-in">{children}</div>
      </div>
    </li>
  );
}
