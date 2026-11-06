import { describe, expect, it } from "vitest";
import { replaceTable } from "./replaceTable.js";

// A stand-in for the Supabase client that keeps one table in memory. failInsertWhen(batch, attempt) makes a chosen insert answer with an error.
function fake(initial, { failInsertWhen = () => false, rejectIds = false } = {}) {
  const state = { rows: initial.map((r) => ({ ...r })), inserts: 0, deletes: 0 };
  const client = {
    state,
    from() {
      return {
        select: () => ({ order: () => ({ range: async (a, b) => ({ data: state.rows.slice(a, b + 1), error: null }) }) }),
        delete: () => ({ neq: async () => { state.deletes++; state.rows = []; return { error: null }; } }),
        insert: async (batch) => {
          state.inserts++;
          if (failInsertWhen(batch, state.inserts)) return { error: { message: "boom" } };
          if (rejectIds && batch.some((r) => "id" in r)) return { error: { message: "cannot insert into identity column" } };
          state.rows.push(...batch.map((r, i) => ({ id: state.rows.length + i + 1, ...r })));
          return { error: null };
        },
      };
    },
  };
  return client;
}

const rows = (n, tag = "x") => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `${tag}${i}` }));

describe("replaceTable", () => {
  it("swaps in the new rows", async () => {
    const db = fake(rows(30, "old"));
    expect(await replaceTable(db, "t", rows(40, "new"), { batchSize: 15 })).toBe(40);
    expect(db.state.rows).toHaveLength(40);
    expect(db.state.rows[0].name).toBe("new0");
  });

  it("refuses an empty replacement and leaves the saved rows alone", async () => {
    const db = fake(rows(30));
    await expect(replaceTable(db, "t", [])).rejects.toThrow(/gave no t rows/);
    expect(db.state.deletes).toBe(0);
    expect(db.state.rows).toHaveLength(30);
  });

  it("refuses a replacement that is a fraction of what is saved", async () => {
    const db = fake(rows(100));
    await expect(replaceTable(db, "t", rows(10))).rejects.toThrow(/broken fetch/);
    expect(db.state.rows).toHaveLength(100);
  });

  it("accepts a first fill, and a small table that really did shrink", async () => {
    expect(await replaceTable(fake([]), "t", rows(5))).toBe(5);
    const small = fake(rows(10));
    expect(await replaceTable(small, "t", rows(2))).toBe(2);
  });

  it("puts the old rows back, and says so, when a batch fails to save", async () => {
    const db = fake(rows(30, "old"), { failInsertWhen: (batch) => batch[0].name.startsWith("new") && batch[0].name === "new20" });
    await expect(replaceTable(db, "t", rows(40, "new"), { batchSize: 20 })).rejects.toThrow(/1 of 2 batches of t failed to save .*30 previous rows were put back/);
    expect(db.state.rows).toHaveLength(30);
    expect(db.state.rows[0].name).toBe("old0");
  });

  it("puts the old rows back without their ids if the table will not take them", async () => {
    // The new rows carry no ids, as on a table whose ids are made by the database, and that table refuses ids that are given.
    const fresh = rows(40, "new").map(({ id, ...r }) => r);
    const db = fake(rows(30, "old"), { failInsertWhen: (batch) => batch[0].name === "new0", rejectIds: true });
    await expect(replaceTable(db, "t", fresh, { batchSize: 20 })).rejects.toThrow(/previous rows were put back/);
    expect(db.state.rows).toHaveLength(30);
  });

  it("says so if the old rows cannot be put back either", async () => {
    const db = fake(rows(30, "old"), { failInsertWhen: () => true });
    await expect(replaceTable(db, "t", rows(40), { batchSize: 20 })).rejects.toThrow(/could NOT all be put back/);
  });
});
