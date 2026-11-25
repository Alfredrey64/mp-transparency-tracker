import { useEffect, useMemo, useState } from "react";
import { m as motion } from "motion/react";
import { COLORS, PAGE_PADDING, readable } from "../theme";
import { supabase } from "../supabaseClient";
import { partyColour } from "../lib/format";
import { navigate } from "../lib/route";
import { PageHeader } from "./shared";
import { IconGroup, IconTopic, IconCoin, IconBook, IconGavel, IconRegister } from "./icons";
import Portrait from "./Portrait";
import { useGo } from "./story/useGo";
import "../appg.css";

// Standard UK party colours, used only when a member cannot be found in the database (their own colour is used otherwise).
const PARTY_DOT = {
  Labour: "#DC2626",
  "Labour (Co-op)": "#DC2626",
  Conservative: "#0087DC",
  "Liberal Democrat": "#FAA61A",
  "Scottish National Party": "#C9A227",
  Green: "#6AB023",
  "Plaid Cymru": "#005B54",
  "Non-affiliated": COLORS.inkSoft,
};

// The groups list their officers by name only. The names are looked up once in the MPs and peers tables, so each person gets their photo and a link to their profile; anyone who cannot be
// found keeps their initials and no link, so a wrong guess never sends a reader to the wrong person. An MP is listed as "Name MP" and matches the table's "Name"; a peer matches by the
// start of the name (the table says "Lord Kirkhope of Harrogate" where a register says "Lord Kirkhope").
const isPeer = (name) => /^(Lord|Baroness|Lady) /.test(name);
const mpName = (name) => name.replace(/ MP$/, "");
const orSafe = (t) => String(t).replace(/[,()"\\*%]/g, " ").trim();

function useMembers(all) {
  const [found, setFound] = useState({});
  const key = all.join("|");
  useEffect(() => {
    let off = false;
    const names = key.split("|");
    const mps = names.filter((n) => !isPeer(n)).map(mpName);
    const peers = names.filter(isPeer);
    (async () => {
      try {
        const [a, b] = await Promise.all([
          mps.length ? supabase.from("politicians").select("id, name, party_colour, thumbnail_url").in("name", mps) : { data: [] },
          peers.length ? supabase.from("peers").select("id, name, party_colour, thumbnail_url").or(peers.map((n) => `name.ilike.${orSafe(n)}*`).join(",")) : { data: [] },
        ]);
        if (off) return;
        const out = {};
        for (const n of names) {
          const row = isPeer(n) ? (b.data ?? []).filter((r) => r.name === n || r.name.startsWith(`${n} of `) || r.name.startsWith(`${n} `))[0] : (a.data ?? []).find((r) => r.name === mpName(n));
          if (row) out[n] = { id: row.id, peer: isPeer(n), colour: row.party_colour, photo: row.thumbnail_url };
        }
        setFound(out);
      } catch { /* the page works without the lookup */ }
    })();
    return () => { off = true; };
  }, [key]);
  return found;
}

const roleLabel = (r) => r.replace(/^./, (c) => c.toUpperCase());
const isChair = (r) => /chair/.test(r) && !/vice/.test(r);

// The people who run a group. The chair comes first and larger; each person is a button to their profile when they have been found.
function MemberList({ members, found }) {
  const ordered = [...members].sort((a, b) => Number(isChair(b.role)) - Number(isChair(a.role)));
  return (
    <ul className="ap-people">
      {ordered.map((m) => {
        const f = found[m.name];
        const colour = partyColour(f?.colour, PARTY_DOT[m.party] ?? COLORS.inkSoft);
        const chair = isChair(m.role);
        const body = (
          <>
            <Portrait name={m.name} photo={f?.photo} colour={colour} size={chair ? 72 : 56} className="ap-face" />
            <span className="ap-who">
              <b>{m.name}</b>
              <small><i style={{ background: colour }} aria-hidden="true" />{m.party}</small>
              <em>{roleLabel(m.role)}</em>
            </span>
          </>
        );
        return (
          <li key={m.name} data-chair={chair ? "1" : "0"} style={{ "--pc": colour }}>
            {f ? (
              <button type="button" className="ap-person" onClick={() => navigate(f.peer ? `#/lords/${f.id}` : `#/mp/${f.id}`)} aria-label={`${m.name}, ${m.role}, ${m.party}. Open their profile.`}>{body}</button>
            ) : <div className="ap-person">{body}</div>}
          </li>
        );
      })}
    </ul>
  );
}

// How a group comes about and what it can do, in four steps with a pulse that travels along the line when the picture scrolls into view. The words are the page's own.
const FLOW = [
  { icon: IconTopic, title: "A shared interest", text: "MPs and peers join up around one topic: a country, a health condition, an industry or a social issue.", colour: "#1E4FB8" },
  { icon: IconGroup, title: "Members from several parties", text: "Cross-party by rule: officers must come from more than one political party.", colour: "#1FA97C" },
  { icon: IconCoin, title: "Help from outside", text: "Running a group takes staff, called a secretariat. That help often comes from a charity, a trade body or a public affairs firm.", colour: "#E8741A" },
  { icon: IconBook, title: "Events, inquiries and reports", text: "They host speakers, run inquiries and publish reports that shape how MPs and ministers think.", colour: "#7A5AF0" },
];

function GroupFlow() {
  const [ref, go] = useGo(0.3);
  return (
    <section ref={ref} className="ap-flow" data-go={go} aria-labelledby="h-ap-what">
      <h2 id="h-ap-what">What is an APPG?</h2>
      <p className="ap-lead">All-party parliamentary groups are informal groups that MPs and peers join to focus on one topic. They are one of the earliest and least visible ways outside organisations get access to Parliament.</p>
      <ol className="ap-steps">
        {FLOW.map((f, i) => {
          const Icon = f.icon;
          return (
            <li key={f.title} style={{ "--tc": f.colour, "--i": i }}>
              <span className="ap-bd" aria-hidden="true"><Icon size={26} /><i>{i + 1}</i></span>
              <b>{f.title}</b>
              <p>{f.text}</p>
            </li>
          );
        })}
      </ol>
      <div className="ap-limit">
        <span className="ap-limit-ico" aria-hidden="true"><IconGavel size={22} /></span>
        <div><b>No official power</b><span>A group cannot pass laws or make decisions for Parliament. Its influence is in who it brings together and what it gets in front of MPs and ministers.</span></div>
      </div>
    </section>
  );
}

// A hand-picked sample of real, publicly reported financial benefits
// registered by APPGs — not an automated feed. The Register of APPGs is
// published as a PDF every ~6 weeks with no API to pull it from
// automatically, so — like the Ministerial Meetings page — this is a
// periodically refreshed sample rather than a complete or daily-updating
// record. See Data & Methodology. Officers are as listed on the official
// register as at 1 December 2025.
const REGISTERED_BENEFITS = [
  {
    group: "APPG on Defence Technology",
    color: readable("#B5533C"),
    detail:
      "Its secretariat took funding from RUK Advanced Systems Limited, a UK subsidiary of the Israeli arms manufacturer Rafael, without properly registering the arrangement. The Parliamentary Commissioner for Standards opened an investigation into the funding, and the group shut itself down in September 2025 rather than continue.",
    sourceUrl: "https://www.thebureauinvestigates.com/stories/2025-09-05/appg-shuts-down-while-under-investigation-over-israeli-arms-funding",
    members: null,
    note: "Wound up in September 2025: no longer on the current register.",
  },
  {
    group: "Scotch Whisky APPG",
    color: readable("#9C6B30"),
    detail:
      "Its secretariat is run directly by the Scotch Whisky Association, the industry's own trade body, rather than an independent third party, a common pattern for single-industry APPGs.",
    sourceUrl: "https://publications.parliament.uk/pa/cm/cmallparty/251201/scotch-whisky.htm",
    members: [
      { name: "Wendy Chamberlain MP", party: "Liberal Democrat", role: "chair" },
      { name: "Andrew Bowie MP", party: "Conservative", role: "officer" },
      { name: "Graham Leadbitter MP", party: "Scottish National Party", role: "officer" },
      { name: "Douglas McAllister MP", party: "Labour", role: "officer" },
    ],
  },
  {
    group: "All-Party Parliamentary Beer Group",
    color: readable("#8A7A3D"),
    detail:
      "Its administration is provided by Ocklynge Consulting, a public affairs firm whose client work includes the brewing and pub sector the group exists to promote.",
    sourceUrl: "https://publications.parliament.uk/pa/cm/cmallparty/251201/beer.htm",
    members: [
      { name: "Tonia Antoniazzi MP", party: "Labour", role: "chair" },
      { name: "Greg Smith MP", party: "Conservative", role: "vice chair" },
      { name: "Andrew Snowden MP", party: "Conservative", role: "vice chair" },
      { name: "Pete Wishart MP", party: "Scottish National Party", role: "vice chair" },
    ],
  },
];

const APPG_EXAMPLES = [
  {
    name: "APPG on the Less Survivable Cancers",
    tag: "Health",
    color: readable("#B5533C"),
    desc: "Campaigns for the cancers with the lowest survival rates (brain, liver, lung, pancreatic, oesophageal, and stomach) which between them get a fraction of the research funding and public attention that more survivable cancers receive.",
    secretariat: "Run day-to-day by Pancreatic Cancer UK, via the Less Survivable Cancers Taskforce.",
    members: [
      { name: "Paulette Hamilton MP", party: "Labour", role: "chair" },
      { name: "Charlie Maynard MP", party: "Liberal Democrat", role: "vice chair" },
      { name: "Dr Allison Gardner MP", party: "Labour", role: "officer" },
    ],
  },
  {
    name: "All-Party Parliamentary Group for Video Games and Esports",
    tag: "Industry",
    color: readable("#8A7A3D"),
    desc: "Works with the games and interactive entertainment industry to raise its profile in Parliament: one of the UK's biggest creative exports, but one MPs rarely discuss compared with film or music.",
    secretariat: "Its administration is provided by UK Interactive Entertainment (Ukie), the industry's trade body.",
    members: [
      { name: "Charlotte Nichols MP", party: "Labour", role: "chair" },
      { name: "Matt Western MP", party: "Labour", role: "vice chair" },
      { name: "Lord Vaizey of Didcot", party: "Conservative", role: "vice chair" },
    ],
  },
  {
    name: "All-Party Parliamentary Group on Portugal",
    tag: "International",
    color: readable("#2E6F6F"),
    desc: "Builds relationships between UK and Portuguese parliamentarians, and supports trade and cultural ties between the two countries.",
    secretariat: "Administered by the Portuguese Chamber of Commerce in the UK.",
    members: [
      { name: "Valerie Vaz MP", party: "Labour", role: "chair" },
      { name: "Baroness Hooper", party: "Conservative", role: "vice chair" },
      { name: "Christine Jardine MP", party: "Liberal Democrat", role: "vice chair" },
    ],
  },
  {
    name: "All-Party Parliamentary Group on Europe",
    tag: "International",
    color: readable("#5B4E8A"),
    desc: "A newer group (founded October 2024) focused on the UK's evolving relationship with Europe and the EU, aiming to encourage informed, cross-party discussion rather than push a single position.",
    secretariat: "Its secretariat is provided by European Movement UK, a campaign group.",
    members: [
      { name: "Rosena Allin-Khan MP", party: "Labour", role: "co-chair" },
      { name: "Lord Kirkhope", party: "Conservative", role: "co-chair" },
      { name: "Ellie Chowns MP", party: "Green", role: "vice chair" },
    ],
  },
  {
    name: "All-Party Parliamentary Group on Artificial Intelligence",
    tag: "Technology",
    color: readable("#4C7A6B"),
    desc: "Examines how AI is developed and regulated in the UK, bringing together parliamentarians, academics, and industry to look at both the opportunities and the risks as the technology moves fast and policy tries to keep up.",
    secretariat: "Run by the Big Innovation Centre, whose funders for this group include Deloitte, EY, BT Group, and Santander among others.",
    members: [
      { name: "Dr Allison Gardner MP", party: "Labour", role: "chair" },
      { name: "Lord Clement-Jones", party: "Liberal Democrat", role: "co-chair" },
      { name: "Dawn Butler MP", party: "Labour", role: "vice chair" },
    ],
  },
  {
    name: "All-Party Parliamentary Group for Chess",
    tag: "Culture",
    color: readable("#B0508A"),
    desc: "One of the more light-hearted examples, promotes chess in education and community life, and celebrates the game's role in the UK. A reminder that not every APPG is about heavyweight policy.",
    secretariat: "Supported by Chess in Schools and Communities, an education charity.",
    members: [
      { name: "Neil Duncan-Jordan MP", party: "Labour", role: "chair" },
      { name: "Peter Fortune MP", party: "Conservative", role: "co-chair" },
      { name: "Lord Wigley", party: "Plaid Cymru", role: "vice chair" },
    ],
  },
];

const TAGS = ["All", ...new Set(APPG_EXAMPLES.map((g) => g.tag))];

const RULES = [
  { big: "20+", text: "members, with officers from more than one political party", color: "#1E4FB8" },
  { big: "2", text: "meetings a year, one of them an annual general meeting", color: "#1FA97C" },
  { big: "£", text: "income or benefits above a set amount must be declared, including secretariat support", color: "#E8741A" },
  { big: "6 wks", text: "roughly how often a group must re-register, or it is dissolved", color: "#7A5AF0" },
];

export default function AppgMemberships() {
  const [tag, setTag] = useState("All");
  const shown = APPG_EXAMPLES.filter((g) => tag === "All" || g.tag === tag);
  const names = useMemo(() => [...new Set([...APPG_EXAMPLES, ...REGISTERED_BENEFITS].flatMap((g) => (g.members ?? []).map((m) => m.name)))], []);
  const found = useMembers(names);
  return (
    <div className="editorial" style={{ padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconGroup}
        title="Cross-party groups"
        subtitle="All-party parliamentary groups (APPGs) are informal groups that MPs and peers join to focus on one topic."
        maxWidth={900}
      />

      <div className="editorial-body">

      <GroupFlow />

      <section className="ap-sec" aria-labelledby="h-ap-ex">
        <h2 id="h-ap-ex">A few real examples</h2>
        <p className="ap-lead">APPGs cover almost every topic. Pick a kind to filter, and tap anyone to open their profile.</p>
        <div className="ap-tags" role="group" aria-label="Kind of group">
          {TAGS.map((t) => <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(t)}>{t}</button>)}
        </div>
        <div className="ap-grid">
          {shown.map((group, i) => (
            <motion.article
              key={group.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 5) * 0.05, ease: "easeOut" }}
              className="ap-card" style={{ "--gc": group.color }}
            >
              <div className="ap-top"><span className="ap-tag">{group.tag}</span></div>
              <h3>{group.name}</h3>
              <p className="ap-desc">{group.desc}</p>
              <div className="ap-run"><span className="ap-run-ico" aria-hidden="true"><IconRegister size={18} /></span><div><b>Who runs it</b><span>{group.secretariat}</span></div></div>
              <div className="ap-sub">Notable members</div>
              <MemberList members={group.members} found={found} />
            </motion.article>
          ))}
        </div>
      </section>

      <section className="ap-sec" aria-labelledby="h-ap-ben">
        <h2 id="h-ap-ben">Registered financial benefits</h2>
        <p className="ap-lead">A hand-picked sample of publicly reported cases, not a complete record. The official register is a PDF published about every 6 weeks, so this is refreshed by hand.</p>
        <div className="ap-grid ap-grid-wide">
          {REGISTERED_BENEFITS.map((b, i) => (
            <motion.article
              key={b.group}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="ap-card" style={{ "--gc": b.color }}
            >
              <h3>{b.group}</h3>
              <p className="ap-desc">{b.detail}</p>
              {b.members ? <MemberList members={b.members} found={found} /> : <p className="ap-note">{b.note}</p>}
              <a href={b.sourceUrl} target="_blank" rel="noreferrer" className="ap-src">Source ↗</a>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="ap-why" aria-labelledby="h-ap-why">
        <h2 id="h-ap-why">Why this matters</h2>
        <p>Running a group takes staff, called a "secretariat". That help often comes from an outside body with a stake in the topic: a charity, a trade body or a public affairs firm. It isn't necessarily improper, but it is an early sign of who an MP works closely with, often long before any donation is declared.</p>
      </section>

      <section className="ap-sec" aria-labelledby="h-ap-rules">
        <h2 id="h-ap-rules">The rules a group must follow</h2>
        <ol className="ap-rules">
          {RULES.map((r) => <li key={r.big} style={{ "--rc": r.color }}><b>{r.big}</b><span>{r.text}</span></li>)}
        </ol>
      </section>

      <section className="ap-look" aria-labelledby="h-ap-look">
        <div>
          <h2 id="h-ap-look">Look up any MP's memberships</h2>
          <p>The full official register is public and searchable. Find an MP to see every group they chair or belong to, and what funding each has declared.</p>
        </div>
        <a href="https://publications.parliament.uk/pa/cm/cmallparty/register/contents.htm" target="_blank" rel="noreferrer">Open the official register ↗</a>
      </section>
      </div>
    </div>
  );
}
