import { Component } from "react";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO, PAGE_PADDING } from "../theme";

const REPO_ISSUES_URL = "https://github.com/Alfredrey64/mp-transparency-tracker/issues";

// Without this, a bug in any single page — a shape the matching logic
// didn't expect, a bad response from one of the many APIs this site
// pulls from — takes down the entire app to a blank white screen, with
// no way back except a manual URL edit. React only exposes catching a
// render error to class components (there's no hook equivalent), so this
// has to be one. Placed once, around the routed page content in App.jsx,
// inside the same keyed element that already remounts on navigation — so
// picking any other page from the sidebar clears the crash on its own,
// no reset button or reset logic needed here.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // No error-tracking service is wired up here on purpose — this site's
    // own Methodology/Privacy pages state "no accounts, no tracking, no
    // analytics", and silently phoning a crash report home would quietly
    // break that promise. This is exactly what the browser console is
    // for; a visitor who wants to report it has the GitHub link below.
    console.error("Caught by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: PAGE_PADDING }}>
        <div
          style={{
            background: "#9C3B3B14", border: "1px solid #9C3B3B33", borderRadius: 14,
            padding: "28px 26px",
          }}
        >
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.ink, marginBottom: 8 }}>
            Something broke on this page
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6, marginBottom: 16 }}>
            Not the rest of the site: just this one page hit a bug. Pick anything else from the sidebar, or
            reload to try this page again.
          </div>
          <div
            style={{
              fontFamily: FONT_MONO, fontSize: 12, color: "#9C3B3B", background: "#9C3B3B0c",
              border: "1px solid #9C3B3B22", borderRadius: 8, padding: "10px 13px", marginBottom: 18,
              wordBreak: "break-word",
            }}
          >
            {this.state.error?.message || String(this.state.error)}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "9px 18px", borderRadius: 999,
                border: "none", background: "#9C3B3B", color: "#fff", cursor: "pointer",
              }}
            >
              Reload this page
            </button>
            {this.props.onGoHome && (
              <button
                onClick={this.props.onGoHome}
                style={{
                  fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "9px 18px", borderRadius: 999,
                  border: `1px solid ${COLORS.hairline}`, background: "transparent", color: COLORS.ink, cursor: "pointer",
                }}
              >
                Back to Overview
              </button>
            )}
            <a
              href={REPO_ISSUES_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, padding: "9px 18px", borderRadius: 999,
                border: `1px solid ${COLORS.hairline}`, background: "transparent", color: COLORS.inkSoft,
                textDecoration: "none", display: "inline-flex", alignItems: "center",
              }}
            >
              Report this on GitHub ↗
            </a>
          </div>
        </div>
      </div>
    );
  }
}
