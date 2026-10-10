// Turns a chart on the page into a picture someone can save or post: the chart's
// SVG drawn on a canvas under a title and above its source line.

import { downloadBlob } from "./onsDownload";

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// A colour written as a CSS variable becomes the real colour on the page right now.
function resolveColor(value) {
  if (!value || !value.includes("var(")) return value;
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

// A copy of the SVG that still looks right on its own, away from the page's styles.
function standaloneSvg(svg) {
  const clone = svg.cloneNode(true);
  const originals = [svg, ...svg.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  originals.forEach((el, i) => {
    const copy = copies[i];
    for (const attr of ["fill", "stroke", "stop-color"]) {
      const value = el.getAttribute(attr);
      if (value?.includes("var(")) copy.setAttribute(attr, resolveColor(value));
    }
    if (el.hasAttribute("font-family")) copy.setAttribute("font-family", FONT);
  });
  const box = svg.viewBox.baseVal;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(box.width));
  clone.setAttribute("height", String(box.height));
  clone.removeAttribute("style");
  clone.removeAttribute("aria-label");
  return { markup: new XMLSerializer().serializeToString(clone), width: box.width, height: box.height };
}

function loadImage(markup) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The chart could not be drawn as a picture")); };
    img.src = url;
  });
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// colours: { paper, ink, inkSoft, hairline } as CSS colours; legend: [{ name, color }]
export async function saveChartImage({ svg, title, sentence, source, accent, legend = [], filename, colours }) {
  const c = {
    paper: resolveColor(colours.paper), ink: resolveColor(colours.ink), inkSoft: resolveColor(colours.inkSoft), hairline: resolveColor(colours.hairline),
  };
  const { markup, width, height } = standaloneSvg(svg);
  const image = await loadImage(markup);

  const W = 1200;
  const pad = 56;
  const inner = W - pad * 2;
  const chartH = Math.round((height / width) * inner);
  const scale = 2;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = `700 36px ${FONT}`;
  const titleLines = wrap(probe, title, inner);
  probe.font = `400 22px ${FONT}`;
  const sentenceLines = sentence ? wrap(probe, sentence, inner) : [];
  probe.font = `400 17px ${FONT}`;
  const sourceLines = source ? wrap(probe, `Source: ${source}`, inner) : [];

  const legendRows = legend.length ? Math.ceil(legend.length / 3) : 0;
  const H = pad + titleLines.length * 44 + (sentenceLines.length ? 14 + sentenceLines.length * 32 : 0) + (legendRows ? 18 + legendRows * 30 : 0) + 20 + chartH + 24 + sourceLines.length * 24 + 40 + pad / 2;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 10, H);
  ctx.textBaseline = "alphabetic";

  let y = pad;
  ctx.fillStyle = c.ink;
  ctx.font = `700 36px ${FONT}`;
  for (const line of titleLines) { y += 36; ctx.fillText(line, pad, y); y += 8; }
  if (sentenceLines.length) {
    y += 14;
    ctx.fillStyle = c.inkSoft;
    ctx.font = `400 22px ${FONT}`;
    for (const line of sentenceLines) { y += 24; ctx.fillText(line, pad, y); y += 8; }
  }
  if (legendRows) {
    y += 18;
    ctx.font = `600 18px ${FONT}`;
    legend.forEach((item, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = pad + col * (inner / 3);
      const ly = y + row * 30 + 20;
      ctx.fillStyle = item.color;
      ctx.fillRect(x, ly - 12, 22, 5);
      ctx.fillStyle = c.ink;
      ctx.fillText(item.name, x + 30, ly);
    });
    y += legendRows * 30;
  }
  y += 20;
  ctx.drawImage(image, pad, y, inner, chartH);
  y += chartH + 24;
  ctx.fillStyle = c.inkSoft;
  ctx.font = `400 17px ${FONT}`;
  for (const line of sourceLines) { y += 18; ctx.fillText(line, pad, y); y += 6; }
  ctx.font = `700 17px ${FONT}`;
  ctx.fillStyle = c.ink;
  ctx.fillText("Simple Politics · Britain in numbers", pad, H - pad / 2);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The picture could not be saved");
  downloadBlob(filename, blob);
}
