// fetch-peers.js
//
// What this does, in plain terms:
// 1. Fetches every current member of the House of Lords from the Members
//    API (House=2), paged, since there are ~800.
// 2. For each peer, fetches a short official biography, their current
//    government post if they hold one (several ministers sit in the
//    Lords, not just the Commons), their full ministerial history, and
//    their Lords committee service — the last two come from the same
//    Biography response, just reading more of it.
// 3. Saves/updates it all into Supabase — safely re-runnable, no duplicates.
//
// 4. Also fetches each peer's most recent debate contributions and written
//    questions — this data IS available for the Lords (unlike interests
//    and votes, below), so it's a real answer to "what have they actually
//    been doing lately".
//
// What this deliberately doesn't do: fetch declared financial interests or
// a voting record. Both of the APIs the rest of this site uses for that
// (interests-api.parliament.uk, commonsvotes-api.parliament.uk) turn out
// to be Commons-only — verified by hand before writing this script, not
// assumed. There's no reliable, structured source for the Lords equivalent
// (including no attendance percentage), so rather than guess or scrape
// around a bot-protected page, this leaves that out — the Lords tab says
// so explicitly.
//
// Run it with: node fetch-peers.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function stripHtml(text) {
  if (!text) return text;
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

// The API's own "membershipFrom" field doubles as a peerage-type label for
// the Lords (it's the constituency name for the Commons) — three values
// currently appear: "Life peer", "Life Peer (judicial)", and "Bishops"
// (the Lords Spiritual).
function peerageType(membershipFrom) {
  if (!membershipFrom) return null;
  if (/bishop/i.test(membershipFrom)) return "Bishop";
  return membershipFrom;
}

async function fetchAllCurrentPeers() {
  const peers = [];
  let skip = 0;
  const take = 20;
  let total = Infinity;

  while (skip < total) {
    const url = `https://members-api.parliament.uk/api/Members/Search?House=2&IsCurrentMember=true&skip=${skip}&take=${take}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Members API error: ${res.status}`);
    const data = await res.json();
    total = data.totalResults ?? 0;

    for (const item of data.items ?? []) {
      const v = item.value;
      peers.push({
        id: v.id,
        name: v.nameDisplayAs,
        party: v.latestParty?.name ?? null,
        party_colour: v.latestParty?.backgroundColour ?? null,
        peerage_type: peerageType(v.latestHouseMembership?.membershipFrom),
        membership_start_date: v.latestHouseMembership?.membershipStartDate?.slice(0, 10) ?? null,
        thumbnail_url: v.thumbnailUrl ?? null,
        gender: v.gender ?? null,
      });
    }
    skip += take;
    await sleep(120);
  }
  return peers;
}

async function fetchSynopsis(memberId) {
  try {
    const res = await fetch(`https://members-api.parliament.uk/api/Members/${memberId}/Synopsis`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.value === "string" ? stripHtml(data.value) || null : null;
  } catch {
    return null;
  }
}

// Pulls three things out of the one Biography call: the current government
// post (if any), a full history of every government post ever held (not
// just the current one), and Lords committee service. All three come from
// fields the API already returns here — no extra request needed.
async function fetchBiographyDetails(memberId) {
  try {
    const res = await fetch(`https://members-api.parliament.uk/api/Members/${memberId}/Biography`);
    if (!res.ok) return { role: null, startDate: null, ministerialHistory: [], committees: [] };
    const data = await res.json();

    const posts = data.value?.governmentPosts ?? [];
    const current = posts.find((p) => p.endDate === null) ?? null;
    const ministerialHistory = [...posts]
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .map((p) => ({
        role: p.name ?? null,
        department: p.additionalInfo ?? null,
        startDate: p.startDate?.slice(0, 10) ?? null,
        endDate: p.endDate?.slice(0, 10) ?? null,
      }));

    // Lords committees only — Commons committee service (for peers who were
    // previously MPs) is a different career and already surfaced via the
    // "Previously an MP" callout, not this Lords-activity section.
    const committees = (data.value?.committeeMemberships ?? [])
      .filter((c) => c.house === 2)
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .map((c) => ({
        name: c.name ?? null,
        role: c.additionalInfo ?? null,
        startDate: c.startDate?.slice(0, 10) ?? null,
        endDate: c.endDate?.slice(0, 10) ?? null,
      }));

    return {
      role: current?.name ?? null,
      startDate: current?.startDate?.slice(0, 10) ?? null,
      ministerialHistory,
      committees,
    };
  } catch {
    return { role: null, startDate: null, ministerialHistory: [], committees: [] };
  }
}

async function fetchRecentContributions(memberId) {
  try {
    const res = await fetch(`https://members-api.parliament.uk/api/Members/${memberId}/ContributionSummary?page=1`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).slice(0, 5).map((item) => {
      const v = item.value;
      return {
        title: v.debateTitle,
        date: v.sittingDate?.slice(0, 10) ?? null,
        section: v.section,
        speechCount: v.speechCount,
        questionCount: v.questionCount,
        interventionCount: v.interventionCount,
      };
    });
  } catch {
    return [];
  }
}

async function fetchRecentWrittenQuestions(memberId) {
  try {
    const res = await fetch(`https://members-api.parliament.uk/api/Members/${memberId}/WrittenQuestions?take=5`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).slice(0, 5).map((item) => {
      const v = item.value;
      return {
        heading: v.heading,
        questionText: v.questionText,
        department: v.answeringBody?.name ?? null,
        dateTabled: v.dateTabled?.slice(0, 10) ?? null,
        dateAnswered: v.dateAnswered?.slice(0, 10) ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function main() {
  console.log("Fetching all current members of the House of Lords...");
  const peers = await fetchAllCurrentPeers();
  console.log(`Found ${peers.length} current peers. Fetching biography and government role for each...\n`);

  const rows = [];
  for (const [i, peer] of peers.entries()) {
    const [biography, bioDetails, contributions, writtenQuestions] = await Promise.all([
      fetchSynopsis(peer.id),
      fetchBiographyDetails(peer.id),
      fetchRecentContributions(peer.id),
      fetchRecentWrittenQuestions(peer.id),
    ]);
    rows.push({
      ...peer,
      biography,
      government_role: bioDetails.role,
      government_role_start_date: bioDetails.startDate,
      ministerial_history: bioDetails.ministerialHistory,
      committees: bioDetails.committees,
      recent_activity: { contributions, writtenQuestions },
    });
    if ((i + 1) % 50 === 0) console.log(`  ...${i + 1}/${peers.length} done`);
    await sleep(120);
  }

  const BATCH_SIZE = 200;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("peers").upsert(batch, { onConflict: "id" });
    if (error) throw error;
  }

  console.log(`\nDone. Saved ${rows.length} peers.`);
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
