import qrcode from "qrcode-generator";

// A QR code for some text, as an SVG string made of squares only (no script, no images, no link back to anyone), with a quiet border. Made in the
// browser, so the link never leaves the page. `ecc` "M" survives a smudge or a crease in a printout.
export function qrSvg(text, { cell = 8, margin = 4, ecc = "M" } = {}) {
  const qr = qrcode(0, ecc);
  qr.addData(String(text));
  qr.make();
  const n = qr.getModuleCount();
  const size = (n + margin * 2) * cell;
  let d = "";
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) if (qr.isDark(r, c)) d += `M${(c + margin) * cell} ${(r + margin) * cell}h${cell}v${cell}h${-cell}z`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR code for ${String(text).replace(/[<>&"]/g, "")}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

// The address pupils open for a chapter: the Teacher mode page with the chapter in the path.
export const chapterLink = (origin, key) => `${origin.replace(/\/$/, "")}/teacher${key ? `/${key}` : ""}`;
