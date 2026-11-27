import { describe, it, expect } from "vitest";
import { hdPortraitUrl, hqPortraitUrl, faceSources, SHARP_FROM, portraitUrl, memberIdFromPortrait, smallPortraitsIn } from "./portrait";
import { createReader } from "./postgrest";

describe("member portraits", () => {
  it("points Parliament's heavy thumbnail at the small local copy", () => {
    expect(portraitUrl("https://members-api.parliament.uk/api/Members/172/Thumbnail")).toBe("/portraits/172.webp");
    expect(memberIdFromPortrait("https://members-api.parliament.uk/api/Members/4212/Thumbnail/")).toBe("4212");
  });
  it("leaves any other address, and anything that is not text, alone", () => {
    for (const v of ["https://thumb.wikimedia.org/x.jpg", "", null, undefined, 5, "https://members-api.parliament.uk/api/Members/abc/Thumbnail"]) expect(portraitUrl(v)).toBe(v);
  });
  it("rewrites thumbnail fields in a reply, however deep, and nothing else", () => {
    const heavy = "https://members-api.parliament.uk/api/Members/1/Thumbnail";
    const data = [{ name: heavy, thumbnail_url: heavy, asking_member_thumbnail_url: heavy, nested: { thumbnail_url: heavy }, n: 3, nothing: null }];
    smallPortraitsIn(data);
    expect(data[0]).toEqual({ name: heavy, thumbnail_url: "/portraits/1.webp", asking_member_thumbnail_url: "/portraits/1.webp", nested: { thumbnail_url: "/portraits/1.webp" }, n: 3, nothing: null });
  });
  it("is applied to what the reader returns", async () => {
    const rows = [{ id: 1, thumbnail_url: "https://members-api.parliament.uk/api/Members/9/Thumbnail" }];
    const db = createReader({ url: "http://x", key: "k", fetch: async () => new Response(JSON.stringify(rows), { status: 200 }) });
    const { data } = await db.from("politicians").select("id, thumbnail_url");
    expect(data[0].thumbnail_url).toBe("/portraits/9.webp");
  });
});

describe("sharp portraits", () => {
  it("points a saved small copy at its sharp one, and leaves other pictures alone", () => {
    expect(hdPortraitUrl("/portraits/4212.webp")).toBe("/portraits/hd/4212.webp");
    expect(hdPortraitUrl("https://example.org/face.jpg")).toBeNull();
    expect(hdPortraitUrl(null)).toBeNull();
  });
});

describe("the sharpest portraits", () => {
  it("points a saved small copy at its 512-pixel one, and leaves other pictures alone", () => {
    expect(hqPortraitUrl("/portraits/4212.webp")).toBe("/portraits/hq/4212.webp");
    expect(hqPortraitUrl("/portraits/hd/4212.webp")).toBeNull();
    expect(hqPortraitUrl("https://example.org/face.jpg")).toBeNull();
    expect(hqPortraitUrl(null)).toBeNull();
  });
  it("tries the sharpest copy first only for faces drawn large, and always ends on the small one", () => {
    const parliament = "https://members-api.parliament.uk/api/Members/4212/Thumbnail";
    expect(faceSources(parliament, 140)).toEqual(["/portraits/hq/4212.webp", "/portraits/hd/4212.webp", "/portraits/4212.webp"]);
    expect(faceSources("/portraits/4212.webp", SHARP_FROM)).toEqual(["/portraits/hq/4212.webp", "/portraits/hd/4212.webp", "/portraits/4212.webp"]);
    expect(faceSources("/portraits/4212.webp", SHARP_FROM - 1)).toEqual(["/portraits/hd/4212.webp", "/portraits/4212.webp"]);
    expect(faceSources("/portraits/4212.webp")).toEqual(["/portraits/hd/4212.webp", "/portraits/4212.webp"]);
  });
  it("returns another site's picture alone, and nothing for no picture", () => {
    expect(faceSources("https://thumb.wikimedia.org/x.jpg", 140)).toEqual(["https://thumb.wikimedia.org/x.jpg"]);
    expect(faceSources(null, 140)).toEqual([]);
    expect(faceSources("", 140)).toEqual([]);
  });
});
