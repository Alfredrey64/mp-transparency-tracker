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

// The full-size picture again, for the one place that draws a face large (the image made for sharing, where 128 pixels would look soft).
export const fullPortraitUrl = (url) => {
  const id = typeof url === "string" ? /^\/portraits\/(\d+)\.webp$/.exec(url)?.[1] : null;
  return id ? `https://members-api.parliament.uk/api/Members/${id}/Thumbnail` : url;
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
