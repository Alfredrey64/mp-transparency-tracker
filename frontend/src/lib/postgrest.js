// A small read-only client for the data service's REST interface (PostgREST). The site only ever reads, so this does the few things it needs and
// nothing else, in a fraction of the size of the full client library, which matters on a slow connection: that library had to arrive before
// the first figure could.
//
//   const { data, error, count } = await db.from("bills").select("title, stage", { count: "exact" }).eq("house", "Commons").order("date", { ascending: false }).limit(20);
//
// Like the library it replaces, a failed request does not throw: it comes back as { data: null, error }.

const quoted = (v) => (typeof v === "string" && /[,()]/.test(v) ? `"${v}"` : String(v));
const list = (values) => `(${Array.from(new Set(values)).map(quoted).join(",")})`;
const operand = (op, value) => (op === "in" && Array.isArray(value) ? list(value) : value === null ? "null" : String(value));

class Query {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.params = new URLSearchParams();
    this.orders = [];
    this.headers = {};
    this.method = "GET";
    this.mode = "rows";
  }

  select(columns = "*", { count, head } = {}) {
    // Spaces are dropped except inside quotes, as the library did, so "a, b" and "a,b" are the same request.
    let quote = false;
    let out = "";
    for (const ch of columns) {
      if (ch === '"') quote = !quote;
      if (/\s/.test(ch) && !quote) continue;
      out += ch;
    }
    this.params.set("select", out);
    if (count) this.headers.Prefer = `count=${count}`;
    if (head) this.method = "HEAD";
    return this;
  }

  filter(column, op, value) { this.params.append(column, `${op}.${value}`); return this; }
  eq(column, value) { return this.filter(column, "eq", value); }
  neq(column, value) { return this.filter(column, "neq", value); }
  gt(column, value) { return this.filter(column, "gt", value); }
  gte(column, value) { return this.filter(column, "gte", value); }
  lt(column, value) { return this.filter(column, "lt", value); }
  lte(column, value) { return this.filter(column, "lte", value); }
  like(column, pattern) { return this.filter(column, "like", pattern); }
  ilike(column, pattern) { return this.filter(column, "ilike", pattern); }
  is(column, value) { return this.filter(column, "is", value === null ? "null" : value); }
  in(column, values) { return this.filter(column, "in", list(values)); }
  not(column, op, value) { return this.filter(column, `not.${op}`, operand(op, value)); }
  or(filters) { this.params.append("or", `(${filters})`); return this; }
  match(query) { for (const [column, value] of Object.entries(query)) this.eq(column, value); return this; }

  order(column, { ascending = true, nullsFirst } = {}) {
    this.orders.push(`${column}.${ascending ? "asc" : "desc"}${nullsFirst === undefined ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
    return this;
  }
  limit(n) { this.params.set("limit", String(n)); return this; }
  range(from, to) { this.params.set("offset", String(from)); this.params.set("limit", String(to - from + 1)); return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }

  then(resolve, reject) { return this.run().then(resolve, reject); }

  async run() {
    const { url, headers: base, fetch: doFetch } = this.client;
    const params = new URLSearchParams(this.params);
    if (this.orders.length) params.set("order", this.orders.join(","));
    const headers = { ...base, ...this.headers };
    if (this.mode === "single") headers.Accept = "application/vnd.pgrst.object+json";
    // On a poor connection a request often fails once and works the second time, so a read that fails to connect, or is answered with a busy-server
    // error, is tried again (twice at most, a short and then a longer wait) before it is reported as failed.
    let res;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await doFetch(`${url}/rest/v1/${this.table}?${params}`, { method: this.method, headers });
        if (![502, 503, 504, 520].includes(res.status) || attempt >= this.client.retries) break;
      } catch (e) {
        if (attempt >= this.client.retries) return { data: null, error: { message: e instanceof Error ? e.message : String(e), details: "", hint: "", code: "" }, count: null, status: 0, statusText: "" };
      }
      await new Promise((resolve) => setTimeout(resolve, this.client.wait * (attempt + 1) ** 2));
    }
    const range = res.headers.get("content-range");
    const total = range && /\/(\d+)$/.exec(range);
    const count = total ? Number(total[1]) : null;
    const out = { count, status: res.status, statusText: res.statusText };
    if (!res.ok) {
      let body = null;
      try { body = await res.json(); } catch { /* an error with no readable body */ }
      return { ...out, data: null, error: { message: body?.message ?? res.statusText ?? "Request failed", details: body?.details ?? "", hint: body?.hint ?? "", code: body?.code ?? "" } };
    }
    if (this.method === "HEAD") return { ...out, data: null, error: null };
    let data;
    try { data = await res.json(); } catch { return { ...out, data: null, error: { message: "The reply could not be read", details: "", hint: "", code: "" } }; }
    if (this.mode === "maybe") {
      if (Array.isArray(data) && data.length > 1) return { ...out, data: null, error: { message: "More than one row was returned", details: "", hint: "", code: "PGRST116" } };
      data = Array.isArray(data) ? data[0] ?? null : data;
    }
    return { ...out, data, error: null };
  }
}

// With no address or key (a build made without the data service's settings, such as a test run), the reader still exists and every request simply fails
// and is reported as an error, so a page says it could not load something instead of the whole site failing to start.
export function createReader({ url, key, fetch: doFetch = (...a) => fetch(...a), retries = 2, wait = 500 }) {
  const client = { url: String(url ?? "").replace(/\/+$/, ""), fetch: doFetch, retries, wait, headers: { apikey: key ?? "", Authorization: `Bearer ${key ?? ""}`, Accept: "application/json" } };
  return { from: (table) => new Query(client, table) };
}
