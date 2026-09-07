import { COLORS, FONT_DISPLAY, FONT_BODY, PAGE_PADDING } from "../theme";
import { useTheme } from "../lib/ThemeContext";
import { PageHeader } from "./shared";
import { IconSettings } from "./icons";

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <button
      onClick={onChange}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        width: "100%",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{label}</div>
        {description && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{description}</div>
        )}
      </div>
      <span
        style={{
          position: "relative",
          width: 44,
          height: 26,
          borderRadius: 999,
          flexShrink: 0,
          background: checked ? COLORS.brass : COLORS.hairline,
          transition: "background 0.2s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transition: "left 0.2s ease",
          }}
        />
      </span>
    </button>
  );
}

export default function Settings({ onNavigate }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ padding: PAGE_PADDING }}>
      <PageHeader icon={IconSettings} title="Settings" subtitle="Display preferences and legal information." maxWidth={700} />

      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
            Display
          </div>
          <ToggleSwitch
            checked={theme === "dark"}
            onChange={toggleTheme}
            label="Dark mode"
            description="Switches the app's backgrounds, text, and borders. Saved on this device."
          />
        </div>

        <div style={{ background: COLORS.paperCard, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
            Legal
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => onNavigate("privacy")}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, textAlign: "left" }}
            >
              Privacy Policy <span style={{ color: COLORS.inkSoft }}>→</span>
            </button>
            <button
              onClick={() => onNavigate("terms")}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink, textAlign: "left" }}
            >
              Terms & Conditions <span style={{ color: COLORS.inkSoft }}>→</span>
            </button>
          </div>
        </div>

        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.6 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic" }}>UK Parliament Tracker</span> is an independent
          project and is not affiliated with, endorsed by, or connected to the UK Parliament, the Houses of Commons or
          Lords, or Companies House.
        </div>
      </div>
    </div>
  );
}
