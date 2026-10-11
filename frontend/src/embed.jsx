import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import EmbedApp from "./components/EmbedApp.jsx";
import { parseEmbedHash } from "./lib/embed.js";

// The embeddable card: no menu, no search, just the one card and a link back. The theme comes from the address (?theme=dark).
document.documentElement.setAttribute("data-theme", parseEmbedHash(window.location.hash)?.theme ?? "light");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EmbedApp />
  </StrictMode>,
);
