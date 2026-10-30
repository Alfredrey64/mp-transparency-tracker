// Puts a visitor's saved look on the page before it is first drawn, so a page opened in dark mode, or at a larger text size, never shows for a moment in the
// standard look and then switches. It does only what src/lib/display.js and ThemeContext.jsx would do a moment later, for the same saved choices.
(function () {
  try {
    var d = document.documentElement;
    if (localStorage.getItem("simple-politics-theme-choice") === "dark") d.setAttribute("data-theme", "dark");
    var p = JSON.parse(localStorage.getItem("simple-politics-display") || "null");
    if (!p || typeof p !== "object") return;
    ["readable", "spacing", "contrast", "links", "calm"].forEach(function (k) { if (p[k] === true) d.setAttribute("data-" + k, "on"); });
    var sizes = [1, 1.15, 1.3];
    if (Number.isInteger(p.size) && p.size > 0 && p.size < sizes.length) {
      d.setAttribute("data-text-size", String(p.size));
      var zoom = Math.max(1, Math.min(sizes[p.size], window.innerWidth / 340));
      if (zoom > 1) d.style.zoom = String(zoom);
    }
  } catch { /* storage is blocked: the page opens in the standard look */ }
})();
