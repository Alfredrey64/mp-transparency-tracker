import { describe, it, expect } from "vitest";
import { createReader } from "./postgrest";

const reply = (body, init = {}) => ({ ok: init.status ? init.status < 400 : true, status: init.status ?? 200, statusText: init.statusText ?? "OK", headers: new Headers(init.headers ?? {}), json: async () => body });
function reader(response) {
  const calls = [];
  const db = createReader({ url: "https://x.test/", key: "k", wait: 0, fetch: async (url, init) => { calls.push({ url, init }); return typeof response === "function" ? response(url, init) : response; } });
  return { db, calls };
}
const query = (calls) => new URL(calls[0].url).searchParams;

describe("the small data reader", () => {
  it("builds the request the data service expects", async () => {
    const { db, calls } = reader(reply([{ id: 1 }]));
    const { data, error } = await db.from("bills").select("title, stage").eq("house", "Commons").not("date", "is", null).gte("n", 3).in("id", [1, "a,b", 1]).order("date", { ascending: false }).order("id").limit(5);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: 1 }]);
    expect(calls[0].url.startsWith("https://x.test/rest/v1/bills?")).toBe(true);
    const q = query(calls);
    expect(q.get("select")).toBe("title,stage");
    expect(q.get("house")).toBe("eq.Commons");
    expect(q.get("date")).toBe("not.is.null");
    expect(q.get("n")).toBe("gte.3");
    expect(q.get("id")).toBe('in.(1,"a,b")');
    expect(q.get("order")).toBe("date.desc,id.asc");
    expect(q.get("limit")).toBe("5");
    expect(calls[0].init.headers.apikey).toBe("k");
  });

  it("turns range into an offset and a limit, and reads the total from the reply", async () => {
    const { db, calls } = reader(reply([1, 2], { headers: { "content-range": "10-11/573" } }));
    const out = await db.from("t").select("*", { count: "exact" }).range(10, 11);
    expect(query(calls).get("offset")).toBe("10");
    expect(query(calls).get("limit")).toBe("2");
    expect(calls[0].init.headers.Prefer).toBe("count=exact");
    expect(out.count).toBe(573);
  });

  it("counts without fetching rows when asked for the head only", async () => {
    const { db, calls } = reader(reply(null, { headers: { "content-range": "*/651" } }));
    const out = await db.from("t").select("*", { count: "exact", head: true });
    expect(calls[0].init.method).toBe("HEAD");
    expect(out).toMatchObject({ count: 651, data: null, error: null });
  });

  it("returns one row, none, or an error for single and maybeSingle", async () => {
    expect((await reader(reply([{ id: 1 }])).db.from("t").select("*").maybeSingle()).data).toEqual({ id: 1 });
    expect((await reader(reply([])).db.from("t").select("*").maybeSingle())).toMatchObject({ data: null, error: null });
    expect((await reader(reply([{}, {}])).db.from("t").select("*").maybeSingle()).error.code).toBe("PGRST116");
    const one = reader(reply({ id: 2 }));
    expect((await one.db.from("t").select("*").single()).data).toEqual({ id: 2 });
    expect(one.calls[0].init.headers.Accept).toBe("application/vnd.pgrst.object+json");
  });

  it("does not throw: a failed request comes back as an error", async () => {
    const bad = await reader(reply({ message: "no such table", code: "PGRST205" }, { status: 404, statusText: "Not Found" })).db.from("nope").select("*");
    expect(bad).toMatchObject({ data: null, error: { message: "no such table", code: "PGRST205" } });
    let tries = 0;
    const down = createReader({ url: "https://x.test", key: "k", wait: 0, fetch: async () => { tries += 1; throw new TypeError("Failed to fetch"); } });
    expect(await down.from("t").select("*")).toMatchObject({ data: null, error: { message: "Failed to fetch" } });
    expect(tries).toBe(3);
  });

  it("tries again after a failed connection or a busy server, then succeeds", async () => {
    let n = 0;
    const flaky = createReader({ url: "https://x.test", key: "k", wait: 0, fetch: async () => { n += 1; if (n === 1) throw new TypeError("offline"); if (n === 2) return reply({}, { status: 503, statusText: "Busy" }); return reply([{ id: 9 }]); } });
    expect((await flaky.from("t").select("*")).data).toEqual([{ id: 9 }]);
    expect(n).toBe(3);
  });

  it("does not try again for a refused request", async () => {
    let n = 0;
    const refused = createReader({ url: "https://x.test", key: "k", wait: 0, fetch: async () => { n += 1; return reply({ message: "denied" }, { status: 401 }); } });
    expect((await refused.from("t").select("*")).error.message).toBe("denied");
    expect(n).toBe(1);
  });

  it("works inside Promise.all, as the pages use it", async () => {
    const { db } = reader(reply([]));
    const [a, b] = await Promise.all([db.from("a").select("*"), db.from("b").select("*")]);
    expect([a.error, b.error]).toEqual([null, null]);
  });
});

describe("createReader with no settings", () => {
  it("still builds, and reports a failed request as an error instead of throwing", async () => {
    const reader = createReader({ fetch: async () => { throw new Error("offline"); }, retries: 0, wait: 0 });
    const res = await reader.from("politicians").select("id").limit(1);
    expect(res.data ?? null).toBeNull();
    expect(res.error).toBeTruthy();
  });
});
