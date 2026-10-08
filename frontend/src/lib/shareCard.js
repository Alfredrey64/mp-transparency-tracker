// Draws a share card (see shareSpecs.js for what goes on it) onto a canvas
// and returns it as a PNG. Browser only; it is loaded when someone opens the
// share dialog, not with the page.
import { FONT_DISPLAY, FONT_BODY, FONT_NUMERIC } from "../theme";
import { wrapLines } from "./shareSpecs";

const W = 1200;
const H = 630;
const SCALE = 2;
const PAD = 64;
const INK = "#ffffff";
const SOFT = "#aab0c8";
const FAINT = "#7c829c";
const BG = "#12141f";

async function loadFonts() {
  if (!document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load(`700 56px ${FONT_DISPLAY}`),
      document.fonts.load(`400 24px ${FONT_BODY}`),
      document.fonts.load(`700 20px ${FONT_BODY}`),
      document.fonts.load(`600 54px ${FONT_NUMERIC}`),
    ]);
  } catch {
    // The card still draws, in the fallback fonts.
  }
}

// A colour moved part of the way to white, so the small label stays readable
// on the dark card even when a party's colour is a dark one.
function lighten(hex, amount) {
  const h = String(hex).replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(h)) return hex;
  const mix = (i) => Math.round(parseInt(h.slice(i, i + 2), 16) + (255 - parseInt(h.slice(i, i + 2), 16)) * amount).toString(16).padStart(2, "0");
  return `#${mix(0)}${mix(2)}${mix(4)}`;
}

// Text cut with an ellipsis so it fits one line.
function fit(ctx, text, maxWidth) {
  let t = String(text ?? "");
  if (ctx.measureText(t).width <= maxWidth) return t;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1).trimEnd();
  return `${t}…`;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBars(ctx, bars, x, y, w, h) {
  const rows = bars.slice(0, 6);
  const rowH = Math.min(78, h / Math.max(rows.length, 1));
  rows.forEach((b, i) => {
    const top = y + i * rowH;
    ctx.font = `600 22px ${FONT_BODY}`;
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `700 22px ${FONT_NUMERIC}`;
    const valueW = ctx.measureText(b.valueText).width;
    ctx.textAlign = "right";
    ctx.fillText(b.valueText, x + w, top + 26);
    ctx.textAlign = "left";
    ctx.font = `500 22px ${FONT_BODY}`;
    ctx.fillText(fit(ctx, b.label, w - valueW - 18), x, top + 26);
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    roundRect(ctx, x, top + 38, w, 14, 7);
    ctx.fill();
    ctx.fillStyle = b.colour;
    roundRect(ctx, x, top + 38, Math.max(10, Math.min(1, b.fraction) * w), 14, 7);
    ctx.fill();
  });
}

// A line chart of one series: the line, a soft fill under it, the first and last values, and the years at each end.
function drawLine(ctx, line, x, y, w, h, accent) {
  const pts = (line.points ?? []).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return;
  ctx.fillStyle = INK;
  ctx.font = `600 22px ${FONT_BODY}`;
  ctx.textAlign = "left";
  ctx.fillText(fit(ctx, line.label ?? "", w), x, y + 22);
  const top = y + 64;
  const bottom = y + h - 40;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  if (hi === lo) { hi += 1; lo -= 1; }
  const pad = (hi - lo) * 0.08;
  lo -= pad;
  hi += pad;
  const px = (t) => x + 6 + ((t - x0) / (x1 - x0 || 1)) * (w - 12 - 90);
  const py = (v) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(px(p[0]), py(p[1])) : ctx.moveTo(px(p[0]), py(p[1]))));
  ctx.lineTo(px(pts.at(-1)[0]), bottom);
  ctx.lineTo(px(pts[0][0]), bottom);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, `${accent}55`);
  fill.addColorStop(1, `${accent}00`);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(px(p[0]), py(p[1])) : ctx.moveTo(px(p[0]), py(p[1]))));
  ctx.strokeStyle = lighten(accent, 0.25);
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  const end = pts.at(-1);
  ctx.beginPath();
  ctx.arc(px(end[0]), py(end[1]), 7, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.textAlign = "left";
  ctx.font = `700 26px ${FONT_NUMERIC}`;
  ctx.fillStyle = INK;
  ctx.fillText(fit(ctx, line.lastText ?? "", 130), px(end[0]) + 14, py(end[1]) + 8);
  ctx.font = `400 18px ${FONT_BODY}`;
  ctx.fillStyle = SOFT;
  ctx.textAlign = "left";
  ctx.fillText(fit(ctx, line.firstLabel ?? "", 200), x, y + h - 10);
  ctx.textAlign = "right";
  ctx.fillText(fit(ctx, line.lastLabel ?? "", 200), x + w - 90, y + h - 10);
  if (line.firstText) {
    ctx.textAlign = "left";
    ctx.fillStyle = FAINT;
    ctx.fillText(line.firstText, px(pts[0][0]), Math.max(top - 6, py(pts[0][1]) - 14));
  }
  ctx.textAlign = "left";
}

function drawHexes(ctx, hexes, x, y, w, h) {
  if (!hexes.length) return;
  const xs = hexes.map((c) => c.x);
  const ys = hexes.map((c) => c.y);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minY = Math.min(...ys) - 1;
  const maxY = Math.max(...ys) + 1;
  const scale = Math.min(w / (maxX - minX), h / (maxY - minY));
  const ox = x + (w - (maxX - minX) * scale) / 2;
  const oy = y + (h - (maxY - minY) * scale) / 2;
  for (const c of hexes) {
    const cx = ox + (c.x - minX) * scale;
    const cy = oy + (c.y - minY) * scale;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      const px = cx + scale * 0.97 * Math.cos(a);
      const py = cy + scale * 0.97 * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = c.colour;
    ctx.fill();
  }
}

export async function renderShareCard(spec) {
  await loadFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);
  const accent = spec.accent || "#4F46E5";

  // Background: dark, with a wash of the accent from the top right.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W - 140, 40, 20, W - 140, 40, 620);
  glow.addColorStop(0, `${accent}55`);
  glow.addColorStop(1, `${accent}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 14, H);

  const hasPanel = Boolean(spec.bars?.length || spec.hexes?.length || spec.line?.points?.length);
  const leftW = hasPanel ? 540 : W - PAD * 2;
  const panelX = 700;
  const panelW = W - PAD - panelX;

  // Kicker, title, subtitle.
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = lighten(accent, 0.4);
  ctx.font = `700 20px ${FONT_BODY}`;
  ctx.fillText(String(spec.kicker ?? "").toUpperCase(), PAD, 92);
  ctx.fillStyle = INK;
  ctx.font = `700 54px ${FONT_DISPLAY}`;
  const titleLines = wrapLines(spec.title, (t) => ctx.measureText(t).width, leftW, 2);
  titleLines.forEach((line, i) => ctx.fillText(line, PAD, 160 + i * 62));
  let y = 160 + titleLines.length * 62 - 10;
  ctx.fillStyle = SOFT;
  ctx.font = `400 26px ${FONT_BODY}`;
  const subLines = wrapLines(spec.subtitle, (t) => ctx.measureText(t).width, leftW, 2);
  subLines.forEach((line, i) => ctx.fillText(line, PAD, y + 24 + i * 34));
  y += 24 + subLines.length * 34;

  // Big figures.
  const stats = (spec.stats ?? []).slice(0, 4);
  if (stats.length) {
    const cols = hasPanel ? 2 : Math.min(4, stats.length);
    const colW = leftW / cols;
    const startY = Math.max(y + 56, hasPanel ? 360 : 380);
    stats.forEach((s, i) => {
      const cx = PAD + (i % cols) * colW;
      const cy = startY + Math.floor(i / cols) * 104;
      ctx.fillStyle = INK;
      ctx.font = `600 52px ${FONT_NUMERIC}`;
      ctx.fillText(fit(ctx, s.value, colW - 16), cx, cy);
      ctx.fillStyle = SOFT;
      ctx.font = `400 20px ${FONT_BODY}`;
      ctx.fillText(fit(ctx, s.label, colW - 16), cx, cy + 28);
    });
  }

  // A key for the map's colours.
  if (spec.legend?.length) {
    let ly = Math.max(y + 36, 330);
    ctx.font = `400 19px ${FONT_BODY}`;
    spec.legend.forEach((k, i) => {
      const lx = PAD + (i % 2) * 260;
      const row = ly + Math.floor(i / 2) * 32;
      ctx.fillStyle = k.colour;
      roundRect(ctx, lx, row - 14, 16, 16, 4);
      ctx.fill();
      ctx.fillStyle = SOFT;
      ctx.fillText(fit(ctx, k.label, 230), lx + 26, row);
    });
  }

  if (spec.note) {
    ctx.fillStyle = SOFT;
    ctx.font = `400 19px ${FONT_BODY}`;
    const lines = wrapLines(spec.note, (t) => ctx.measureText(t).width, leftW, 2);
    lines.forEach((line, i) => ctx.fillText(line, PAD, H - 118 + i * 26));
  }

  // Right-hand panel: bars or the hexagon map.
  if (spec.bars?.length) drawBars(ctx, spec.bars, panelX, 86, panelW, H - 86 - 100);
  if (spec.line?.points?.length) drawLine(ctx, spec.line, panelX, 86, panelW, H - 86 - 100, accent);
  if (spec.hexes?.length) drawHexes(ctx, spec.hexes, panelX - 20, 70, panelW + 20, H - 70 - 90);

  // Footer.
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(PAD, H - 78, W - PAD * 2, 1);
  ctx.fillStyle = FAINT;
  ctx.font = `400 18px ${FONT_BODY}`;
  ctx.textAlign = "left";
  ctx.fillText(fit(ctx, spec.footer ?? "", W - PAD * 2 - 320), PAD, H - 40);
  ctx.textAlign = "right";
  ctx.fillText(typeof location !== "undefined" ? location.host : "", W - PAD, H - 40);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't make the image"))), "image/png"));
}
