// Embeddable cards: a question's answer, or one Britain in numbers chart, that anyone can put on their own page in an iframe.
// The card lives at /embed.html#/answer/<id> or /embed.html#/chart/<page>/<measure>, with ?theme=dark for a dark card.

export const SITE_ORIGIN = "https://simple-politics.vercel.app";

export function embedHash(spec, theme = "light") {
  const base = spec.kind === "answer" ? `#/answer/${encodeURIComponent(spec.id)}` : `#/chart/${encodeURIComponent(spec.sector)}/${encodeURIComponent(spec.id)}`;
  return theme === "dark" ? `${base}?theme=dark` : base;
}

export const embedUrl = (origin, spec, theme) => `${origin}/embed.html${embedHash(spec, theme)}`;

// The inverse of embedHash. Returns null for anything that is not a card address.
export function parseEmbedHash(hash) {
  const raw = String(hash ?? "").replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
  const theme = new URLSearchParams(query).get("theme") === "dark" ? "dark" : "light";
  if (parts[0] === "answer" && parts[1]) return { kind: "answer", id: parts[1], theme };
  if (parts[0] === "chart" && parts[1] && parts[2]) return { kind: "chart", sector: parts[1], id: parts[2], theme };
  return null;
}

export const embedHeight = (kind) => (kind === "answer" ? 520 : 440);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function iframeCode({ origin = SITE_ORIGIN, spec, theme = "light", title }) {
  return `<iframe src="${esc(embedUrl(origin, spec, theme))}" title="${esc(title)}" width="100%" height="${embedHeight(spec.kind)}" style="border:0;max-width:640px" loading="lazy"></iframe>`;
}

// Optional: lets the card tell the page how tall it needs to be, so there is no scrollbar and no empty space.
export const RESIZE_SNIPPET = `<script>
window.addEventListener("message", function (e) {
  if (!e.data || e.data.source !== "simple-politics" || e.data.type !== "height") return;
  document.querySelectorAll('iframe[src*="simple-politics"]').forEach(function (f) {
    if (f.contentWindow === e.source) f.style.height = e.data.height + "px";
  });
});
</script>`;
