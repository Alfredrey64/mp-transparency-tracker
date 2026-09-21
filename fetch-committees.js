// fetch-committees.js
//
// What this does, in plain terms:
// 1. Pulls the UK Parliament's currently-sitting select committees — the
//    groups of MPs and peers who scrutinise government departments and run
//    public inquiries — from the official Committees API (no key needed).
// 2. "Select committee" covers a few different official categories, so this
//    deliberately scopes to the three that match what most people mean by
//    the term: Commons departmental select committees (Treasury, Health,
//    Defence, and so on), Lords investigative committees (Constitution,
//    Economic Affairs, Science and Technology, and so on), and the two
//    cross-cutting Joint Committees (Human Rights, National Security
//    Strategy). Left out: procedural committees (bill committees,
//    domestic/administrative committees) and statutory bodies like the
//    Intelligence and Security Committee, which sit outside the normal
//    select committee system entirely.
// 3. For each one, fetches its current membership (and chair) and its
//    currently open inquiries, and replaces the whole `committees` table
//    with this fresh snapshot — a leaderboard of current activity, not an
//    accumulating archive of every historical committee or inquiry.
//
// Run it with: node fetch-committees.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API = "https://committees-api.parliament.uk/api";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A manual Promise.race timeout, not AbortSignal.timeout() — the latter
// doesn't reliably interrupt a hung fetch() in practice (see
// fetch-on-this-day.js for the fuller story on why).
const REQUEST_TIMEOUT_MS = 15000;
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)),
  ]);
}

async function getJson(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await withTimeout(fetch(url, { headers: { Accept: "application/json" } }), REQUEST_TIMEOUT_MS);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(1500 * attempt);
    }
  }
}

// The three committee groups that make up "select committees" for this
// feature — see the header comment above for why these three and not
// others.
const TARGETS = [
  { house: "Commons", type: "(HC) Public Standing Orders - Departmental" },
  { house: "Lords", type: "(HL) Investigative" },
  { house: "Joint", type: "(HC) Public Standing Orders - Cross-cutting" },
];

async function fetchCommitteesFor(house, requiredType) {
  const data = await getJson(`${API}/Committees?CategoryId=1&House=${house}&take=100`);
  return data.items.filter(
    (c) => c.category?.name === "Select" && c.committeeTypes?.some((t) => t.name === requiredType)
  );
}

async function fetchPurpose(committeeId) {
  const data = await getJson(`${API}/Committees/${committeeId}`);
  return data.purpose ?? null;
}

async function fetchCurrentMembers(committeeId) {
  const data = await getJson(`${API}/Committees/${committeeId}/Members?MembershipStatus=Current&take=50`);
  return (data.items ?? []).map((m) => {
    const isChair = (m.roles ?? []).some((r) => r.role?.isChair && !r.endDate);
    return {
      name: m.name,
      party: m.memberInfo?.party ?? null,
      party_colour: m.memberInfo?.partyColour ?? null,
      parliament_member_id: m.memberInfo?.mnisId ?? null,
      house: m.memberInfo?.house ?? null,
      is_chair: isChair,
    };
  });
}

async function fetchOpenInquiries(committeeId) {
  const data = await getJson(
    `${API}/CommitteeBusiness?CommitteeId=${committeeId}&Status=Open&SortOrder=DateOpenedNewest&take=20`
  );
  return (data.items ?? [])
    .filter((b) => b.type?.isInquiry)
    .map((b) => ({
      title: b.title,
      open_date: b.openDate,
      close_date: b.closeDate,
      is_open: true,
      url: `https://committees.parliament.uk/work/${b.id}/`,
    }));
}

async function main() {
  console.log("Finding current select committees...");
  const found = [];
  for (const { house, type } of TARGETS) {
    const committees = await fetchCommitteesFor(house, type);
    found.push(...committees);
    await sleep(150);
  }
  // A couple of Joint committees can show up under more than one house
  // filter — de-duplicate by ID just in case.
  const raw = [...new Map(found.map((c) => [c.id, c])).values()];
  console.log(`Found ${raw.length} committees. Fetching membership and inquiries for each...`);

  const rows = [];
  for (const [i, c] of raw.entries()) {
    process.stdout.write(`  [${i + 1}/${raw.length}] ${c.name}... `);
    try {
      const [purpose, members, inquiries] = await Promise.all([
        fetchPurpose(c.id),
        fetchCurrentMembers(c.id),
        fetchOpenInquiries(c.id),
      ]);
      const chair = members.find((m) => m.is_chair);
      rows.push({
        id: c.id,
        name: c.name,
        house: c.house,
        category: c.category?.name ?? null,
        purpose,
        chair_name: chair?.name ?? null,
        chair_party: chair?.party ?? null,
        chair_party_colour: chair?.party_colour ?? null,
        chair_parliament_member_id: chair?.parliament_member_id ?? null,
        members,
        inquiries,
        updated_at: new Date().toISOString(),
      });
      console.log(`${members.length} members, ${inquiries.length} open ${inquiries.length === 1 ? "inquiry" : "inquiries"}.`);
    } catch (err) {
      console.log(`failed: ${err.message}`);
    }
    await sleep(150);
  }

  console.log(`\nReplacing committees table with ${rows.length} committees...`);
  const { error: deleteError } = await supabase.from("committees").delete().neq("id", 0);
  if (deleteError) throw deleteError;

  const BATCH_SIZE = 25;
  let saved = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from("committees").insert(batch);
    if (insertError) {
      console.error(`  ⚠ Batch ${i / BATCH_SIZE + 1} failed: ${insertError.message}`);
      continue;
    }
    saved += batch.length;
  }

  console.log(`\nDone. Saved ${saved} of ${rows.length} committees.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Something went wrong:", err.message);
    process.exit(1);
  });
