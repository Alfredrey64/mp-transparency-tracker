// Hides the plain opening text that a page is sent with (see scripts/prerender.mjs) when the address is not the page the text is for. Every address
// without a page of its own is answered with the home page's HTML, and its text would otherwise show for a moment before the app starts.
(function () {
  var pre = document.querySelector(".pre");
  if (!pre) return;
  var here = location.pathname.replace(/\/+$/, "") || "/";
  if (pre.getAttribute("data-path") !== here) pre.style.display = "none";
})();
