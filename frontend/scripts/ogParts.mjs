// The pieces both link-preview images share (scripts/build-og-image.mjs for the home page, scripts/build-page-og.mjs for every other page): the site's fonts read from public/fonts,
// the open-book mark drawn from the same geometry as src/components/LogoMark.jsx, and the card's violet background.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COVER_RIGHT, COVER_LEFT, PAGE_LEFT, PAGE_RIGHT, STACK_RIGHT, STACK_LEFT, SHADE_RIGHT, SHADE_LEFT, RIBBON, TEXT_LEFT, TEXT_RIGHT, RULES_LEFT, RULES_RIGHT } from "../src/lib/bookMark.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PUBLIC = path.join(here, "../public");
export const NAME = "Domesday Live";

const font = fs.readFileSync(path.join(PUBLIC, "fonts/public-sans-latin.woff2")).toString("base64");
const serif = fs.readFileSync(path.join(PUBLIC, "fonts/newsreader-latin-2.woff2")).toString("base64");

// The open book from src/components/LogoMark.jsx at rest, drawn from the same geometry (src/lib/bookMark.js), with the words following the curve of the pages.
const HOLE = "#4a3fc9";
const WORDS = `font-family="Newsreader" font-size="11" font-weight="700" letter-spacing=".1" text-anchor="middle" fill="${HOLE}"`;
const RULES = (list) => list.map((d) => `<path d="${d}" fill="none" stroke="${HOLE}" stroke-opacity=".4" stroke-width="1.5" stroke-linecap="round"/>`).join("");
const LINE = (d) => `<path d="${d}" fill="none" stroke="${HOLE}" stroke-opacity=".45" stroke-width="1.1" stroke-linecap="round"/>`;
export const MARK = `<defs><path id="tr" d="${TEXT_RIGHT}"/><path id="tl" d="${TEXT_LEFT}"/></defs>
  <path d="${COVER_RIGHT}" fill="#fff"/><path d="${COVER_LEFT}" fill="#fff"/>${LINE(STACK_RIGHT)}${LINE(STACK_LEFT)}
  <path d="${PAGE_LEFT}" fill="#fff" stroke="${HOLE}" stroke-width="1"/><path d="${PAGE_RIGHT}" fill="#fff" stroke="${HOLE}" stroke-width="1"/>
  <path d="${SHADE_LEFT}" fill="#000" fill-opacity=".11"/><path d="${SHADE_RIGHT}" fill="#000" fill-opacity=".11"/>
  <text ${WORDS}><textPath href="#tl" startOffset="50%">UK</textPath></text><text ${WORDS}><textPath href="#tr" startOffset="50%">Politics</textPath></text>
  ${RULES(RULES_LEFT)}${RULES(RULES_RIGHT)}<path d="${RIBBON}" fill="#FFB84D"/>`;


// The two @font-face rules and the card's background, as CSS text.
export const FACES = `
@font-face { font-family: "Public Sans"; font-weight: 100 900; src: url(data:font/woff2;base64,${font}) format("woff2"); }
@font-face { font-family: "Newsreader"; font-weight: 200 800; src: url(data:font/woff2;base64,${serif}) format("woff2"); }
html, body { margin: 0; }`;
export const CARD_BACKGROUND = `radial-gradient(900px 600px at 0% 0%, #7a78ef 0%, rgba(122,120,239,0) 70%), linear-gradient(135deg, #6a66e8 0%, #4a3fc9 45%, #2c2487 100%)`;
