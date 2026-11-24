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

// If the app never draws (a connection that dropped part-way, a script that could not be fetched or run, a browser too old for it) the page would stay empty.
// This watches for that and turns the loading screen in index.html into a plain message with a button that throws away every saved copy and tries again.
// It does nothing once the app has drawn. (Kept here, not inline in the page: the site's security policy allows only scripts from its own files.)
(function () {
  function drawn() { return !document.querySelector(".dl-boot"); }
  function help(text) {
    if (drawn()) return;
    var msg = document.getElementById("dl-boot-msg");
    var box = document.getElementById("dl-boot-help");
    if (!msg || !box) return;
    msg.textContent = text;
    box.hidden = false;
  }
  var slow = function () { help("This is taking longer than it should. It may be your connection."); };
  var failed = function () { help("The page could not finish loading. Check your connection, then try again."); };
  setTimeout(slow, 9000);
  setTimeout(function () { if (!drawn()) failed(); }, 30000);
  // A script or stylesheet of the site that could not be fetched (an error on the element itself) or an error before the app has drawn anything.
  window.addEventListener("error", function (e) {
    var t = e && e.target;
    if (t && t !== window && (t.tagName === "SCRIPT" || t.tagName === "LINK") && /\/assets\//.test(t.src || t.href || "")) failed();
    else if (e && e.message) setTimeout(function () { if (!drawn()) failed(); }, 4000);
  }, true);
  window.addEventListener("unhandledrejection", function () { setTimeout(function () { if (!drawn()) failed(); }, 4000); });
  document.addEventListener("click", function (e) {
    var el = e.target;
    if (!el || el.id !== "dl-boot-retry") return;
    el.disabled = true;
    el.textContent = "Trying again…";
    var done = false;
    function go() { if (done) return; done = true; location.reload(); }
    setTimeout(go, 1500);
    try {
      var work = [];
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) work.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
      if (window.caches && caches.keys) work.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
      Promise.all(work).then(go, go);
    } catch { go(); }
  });
})();
