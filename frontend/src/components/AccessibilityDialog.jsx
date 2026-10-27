/** @jsxImportSource react */
import { useRef } from "react";
import { useDialog } from "../lib/useDialog";
import AccessibilityControls from "./AccessibilityControls";
import { PageLink } from "./SiteHeader";

// The accessibility panel that opens from the header. The same controls are on the Accessibility page, with the statement about how the site is tested.
export default function AccessibilityDialog({ onClose, returnFocusRef, onNavigate }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  useDialog({ open: true, onClose, panelRef, returnFocusRef, initialFocusRef: closeRef });
  return (
    <div className="ax-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} className="ax-box" role="dialog" aria-modal="true" aria-labelledby="ax-title" tabIndex={-1}>
        <div className="ax-head">
          <h2 id="ax-title">Make the site easier to use</h2>
          <button ref={closeRef} type="button" className="ax-close" aria-label="Close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <AccessibilityControls onListen={onClose} />
        <p className="ax-more"><PageLink to="accessibility" onNavigate={onNavigate} onAfter={onClose}>Read our accessibility statement</PageLink></p>
      </div>
    </div>
  );
}
