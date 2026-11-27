// Member portraits. Parliament's own thumbnail address returns a 240-pixel uncompressed bitmap of about 230 KB for every face, and the site shows them at 26 to 64 pixels, so a list of
// a hundred MPs used to download more than twenty megabytes of pictures. Small copies (128 pixels, a few kilobytes each) are kept on this site in /portraits/<member id>.webp, made by
// fetch-portraits.js; this turns Parliament's address into the local one. If a copy has not been made yet (a new member), the host (see vercel.json) passes the request on to
// Parliament, so a face is never missing, only heavier. Pure, so it can be tested.

const PARLIAMENT = /^https?:\/\/members-api\.parliament\.uk\/api\/Members\/(\d+)\/Thumbnail\/?$/i;

export const memberIdFromPortrait = (url) => (typeof url === "string" ? PARLIAMENT.exec(url)?.[1] ?? null : null);

export const portraitUrl = (url) => {
  const id = memberIdFromPortrait(url);
  return id ? `/portraits/${id}.webp` : url;
};

// Parliament's own 240-pixel picture again, the last resort for the image made for sharing (which tries the sharp copy first, see loadPortrait in shareCard.js).
export const fullPortraitUrl = (url) => {
  const id = typeof url === "string" ? /^\/portraits\/(\d+)\.webp$/.exec(url)?.[1] : null;
  return id ? `https://members-api.parliament.uk/api/Members/${id}/Thumbnail` : url;
};

// The sharper 240-pixel copy of a face (made for current MPs by fetch-portraits.js) for the one place that draws a face at 130 to 160 pixels, the MP card on Your area. A face with no
// sharp copy has no address here and is drawn from the ordinary one, so this only ever adds to what is shown.
export const hdPortraitUrl = (url) => {
  const id = typeof url === "string" ? /^\/portraits\/(\d+)\.webp$/.exec(url)?.[1] : null;
  return id ? `/portraits/hd/${id}.webp` : null;
};

// The sharpest copy of a face (up to 512 pixels, cut from Parliament's full-size photograph by fetch-portraits.js) for the faces drawn large: the MP profile, My MP, Your area. It
// exists for current MPs only; anyone without one has no address here to fail on, the page just tries the next copy down (see faceSources).
export const hqPortraitUrl = (url) => {
  const id = typeof url === "string" ? /^\/portraits\/(\d+)\.webp$/.exec(url)?.[1] : null;
  return id ? `/portraits/hq/${id}.webp` : null;
};

// A face drawn at this many CSS pixels or more is given the sharpest copy first. A 128-pixel copy is enough up to about 60 pixels on a screen that doubles its pixels.
export const SHARP_FROM = 56;

// The addresses to try for a face, sharpest first: the 512-pixel copy (only for faces drawn at SHARP_FROM or more), the 240-pixel copy, the ordinary small one. A page shows the
// first that loads and moves on to the next if one is missing. An address that is not one of ours (another site's picture) comes back alone.
export const faceSources = (url, size = 0) => {
  const small = portraitUrl(url);
  if (!small) return [];
  return [size >= SHARP_FROM ? hqPortraitUrl(small) : null, hdPortraitUrl(small), small].filter(Boolean);
};

// Every field called thumbnail_url (or ending _thumbnail_url) in a database reply, however deep, is pointed at the small copy. Done in place on the reply the reader has just parsed.
export function smallPortraitsIn(data) {
  if (Array.isArray(data)) { for (const row of data) smallPortraitsIn(row); return data; }
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") { if (/(^|_)thumbnail_url$/.test(key)) data[key] = portraitUrl(value); }
      else if (value && typeof value === "object") smallPortraitsIn(value);
    }
  }
  return data;
}
