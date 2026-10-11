/** @jsxImportSource react */
import { COLORS, FONT_BODY } from "../theme";
import { useOnline } from "../lib/useOnline";

// A quiet notice at the foot of the screen while the connection is down. It sits over the page (fixed), so it never moves anything.
export default function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "max(14px, env(safe-area-inset-bottom))", zIndex: 70,
        maxWidth: "min(560px, calc(100vw - 24px))", padding: "10px 16px", borderRadius: 14, background: COLORS.ink, color: COLORS.paper,
        fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.45, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      }}
    >
      You are offline. Pages you have already opened still work, and new figures will load when you are back online.
    </div>
  );
}
