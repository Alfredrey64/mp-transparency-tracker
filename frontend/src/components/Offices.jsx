import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { fetchAllRows } from "../lib/supabasePagination";
import { loadAllCareerDetail } from "../lib/careerDetail";
import { buildOffices, searchOffices, OFFICE_KINDS } from "../lib/offices";
import { explainOffice } from "../lib/officeExplainers";
import { duration, monthYear } from "../lib/careerTimeline";
import { COLORS, FONT_BODY, FONT_DISPLAY, PAGE_PADDING } from "../theme";
import { partyColour } from "../lib/format";
import { PageHeader } from "./shared";
import { LoadFailedNote } from "./MpCards";
import { IconCabinet, IconEconomy, IconGlobe, IconDefence, IconGavel, IconHealth, IconMortarboard, IconFactory, IconHome, IconTransport, IconLeaf, IconBroadcast, IconPension, IconBolt, IconDevolved, IconGroup, IconSearch } from "./icons";
import { Segmented } from "./DeprivationControls";
import "../offices.css";
import { navigate } from "../lib/route";

// Who has held a government or shadow post, for anyone sitting in Parliament
// today, from their biography records. It can't see people who have left, so
// the page says it is a partial history and not the full list of office holders.

const KIND_COLOUR = { gov: "#1FA97C", opp: "#E8741A" };
const goHolder = (h) => {
  navigate(h.house === "lords" ? `#/lords/${h.profileId}` : `#/mp/${h.profileId}`);
};

// Each post takes the colour and picture of the part of government it belongs to, found from its name and department; anything else keeps the colour of
// its kind (green for government, orange for the shadow team).
const AREAS = [
  [/treasury|chancellor of the exchequer|exchequer/i, "#1E4FB8", IconEconomy],
  [/foreign|commonwealth|development/i, "#7A5AF0", IconGlobe],
  [/defence|armed forces|veterans/i, "#4C6FA6", IconDefence],
  [/home|justice|attorney|solicitor|lord chancellor|police|prison|crime/i, "#E0367A", IconGavel],
  [/health|social care|nhs|public health/i, "#1FA97C", IconHealth],
  [/education|skills|school|children|universit/i, "#E8741A", IconMortarboard],
  [/business|trade|energy|net zero|industry|industrial/i, "#C7871A", IconFactory],
  [/housing|communities|local government|levelling/i, "#D6455D", IconHome],
  [/transport|rail|aviation|roads/i, "#2E86C1", IconTransport],
  [/environment|food|rural|climate/i, "#3F9B3F", IconLeaf],
  [/culture|media|sport|digital/i, "#B0508A", IconBroadcast],
  [/work and pensions|pensions|welfare/i, "#8E5BB5", IconPension],
  [/science|technology|innovation/i, "#0E9AA7", IconBolt],
  [/scotland|wales|northern ireland/i, "#2A9D8F", IconDevolved],
  [/whip|house of commons|leader of the house|lords/i, "#5B6B84", IconGroup],
  [/prime minister|cabinet office|duchy|deputy prime/i, "#C0561F", IconCabinet],
];
function lookOf(office) {
  const hit = AREAS.find(([re]) => re.test(`${office.post} ${office.departments.join(" ")}`));
  return hit ? { colour: hit[1], Icon: hit[2] } : { colour: KIND_COLOUR[office.kind], Icon: IconCabinet };
}

const initials = (name) => String(name).replace(/^(rt hon|sir|dame|dr|mr|mrs|ms|lord|lady|baroness)\s+/gi, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Holder({ h, now }) {
  const colour = partyColour(h.colour, COLORS.inkSoft);
  return (
    <button type="button" className="nclick off-holder" onClick={() => goHolder(h)} style={{ "--hc": colour }}>
      <span className="off-av" aria-hidden="true">{initials(h.name)}</span>
      <span style={{ minWidth: 0 }}>
        <span className="off-name">{h.name}<em>{h.house === "lords" ? "Lords" : "MP"}</em></span>
        <span className="off-party">{h.party ?? "No party"}</span>
      </span>
      <span className="off-when">
        <b>{monthYear(h.start)} to {h.end ? monthYear(h.end) : "now"}</b>
        <span>{duration(h.start, h.end, now)}{!h.end && <strong className="off-live">In post</strong>}</span>
      </span>
    </button>
  );
}

function OfficeRow({ office, open, onToggle, now }) {
  const { colour, Icon } = lookOf(office);
  const note = explainOffice(office.post, office.kind);
  const current = office.holders.filter((h) => !h.end).length;
  return (
    <div className="off-card" data-open={open ? "1" : "0"} style={{ "--oc": colour }}>
      <button type="button" aria-expanded={open} onClick={onToggle} className="off-head">
        <span className="off-icon" aria-hidden="true"><Icon size={24} /></span>
        <span className="off-title">
          <b>{office.post}</b>
          <span className="off-tags">
            <i style={{ "--kc": KIND_COLOUR[office.kind] }}>{OFFICE_KINDS[office.kind]}</i>
            {office.departments.length > 0 && <span>{office.departments.slice(0, 2).join(", ")}{office.departments.length > 2 ? ` and ${office.departments.length - 2} more` : ""}</span>}
            {current > 0 && <em>{current} in post now</em>}
          </span>
        </span>
        <span className="off-count"><b>{office.holders.length}</b><span>holder{office.holders.length === 1 ? "" : "s"}</span></span>
        <span aria-hidden="true" className="off-chev">▾</span>
      </button>
      <div className="off-notes">
        <p><strong>What it does</strong>{note.what}</p>
        <p><strong>Why it matters</strong>{note.why}</p>
      </div>
      {open && (
        <div className="off-holders">
          {office.holders.map((h) => <Holder key={`${h.house}-${h.memberId}-${h.start}`} h={h} now={now} />)}
        </div>
      )}
    </div>
  );
}

export default function Offices({ initialQuery = "" }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [seenQuery, setSeenQuery] = useState(initialQuery);
  if (seenQuery !== initialQuery) {
    setSeenQuery(initialQuery);
    setQuery(initialQuery ?? "");
  }
  const [kind, setKind] = useState("all");
  const [open, setOpen] = useState(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([
      loadAllCareerDetail("commons"),
      loadAllCareerDetail("lords"),
      fetchAllRows(() => supabase.from("politicians").select("id, parliament_member_id, name, party, party_colour")),
      fetchAllRows(() => supabase.from("peers").select("id, name, party, party_colour")),
    ])
      .then(([mpCareers, peerCareers, mps, peers]) => {
        const people = {};
        const careers = {};
        for (const p of mps) {
          const d = mpCareers[p.parliament_member_id];
          if (!d) continue;
          people[`m${p.parliament_member_id}`] = { name: p.name, party: p.party, colour: p.party_colour, house: "commons", profileId: p.id };
          careers[`m${p.parliament_member_id}`] = d;
        }
        for (const p of peers) {
          const d = peerCareers[p.id];
          if (!d) continue;
          people[`l${p.id}`] = { name: p.name, party: p.party, colour: p.party_colour, house: "lords", profileId: p.id };
          careers[`l${p.id}`] = d;
        }
        setData(buildOffices(careers, people));
      })
      .catch(() => setFailed(true));
  }, []);

  const results = useMemo(() => {
    if (!data) return [];
    const byKind = kind === "all" ? data : data.filter((o) => o.kind === kind);
    return searchOffices(byKind, query, 40);
  }, [data, query, kind]);

  const people = useMemo(() => (data ? new Set(data.flatMap((o) => o.holders.map((h) => `${h.house}${h.memberId}`))).size : 0), [data]);

  const govCount = data ? data.filter((o) => o.kind === "gov").length : 0;
  const oppCount = data ? data.length - govCount : 0;
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: PAGE_PADDING }}>
      <PageHeader
        icon={IconCabinet}
        accent="#C7871A"
        kicker="Who held office"
        title="Who has held this office?"
        subtitle="Search any government or shadow post, such as Secretary of State for Health or Shadow Chancellor, and see everyone in Parliament today who has held it, with dates."
      />

      {failed && <div style={{ marginTop: 24 }}><LoadFailedNote item="the office records" /></div>}
      {!data && !failed && <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.inkSoft, marginTop: 24 }}>Loading every career record…</div>}

      {data && (
        <>
          <div className="off-stats">
            <div style={{ "--sc": "#C7871A" }}><b>{data.length.toLocaleString("en-GB")}</b><span>posts</span></div>
            <div style={{ "--sc": "#1FA97C" }}><b>{govCount.toLocaleString("en-GB")}</b><span>in government</span></div>
            <div style={{ "--sc": "#E8741A" }}><b>{oppCount.toLocaleString("en-GB")}</b><span>on the shadow team</span></div>
            <div style={{ "--sc": "#7A5AF0" }}><b>{people.toLocaleString("en-GB")}</b><span>MPs and peers</span></div>
          </div>

          <div className="off-tools">
            <label className="off-search">
              <span aria-hidden="true"><IconSearch size={19} /></span>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(null); }}
                placeholder="Try health, chancellor or home office"
                aria-label="Search offices"
              />
            </label>
            <Segmented
              label="Kind of post" value={kind} accent="#C7871A"
              onChange={(k) => { setKind(k); setOpen(null); }}
              options={[{ id: "all", label: "All" }, { id: "gov", label: "Government" }, { id: "opp", label: "Shadow" }]}
            />
          </div>

          <p className="off-lead">
            {query.trim() ? `${results.length} matching post${results.length === 1 ? "" : "s"}.` : "The posts held most often, to start with."} This covers the MPs and peers
            in Parliament today who have held a post. People who have since left Parliament aren't in it, so older holders of an office are missing: it shows who in Parliament today has
            held it, not everyone who ever has. The party shown is the one they sit for today. Tap a post to see its holders.
          </p>

          <div className="off-list">
            {results.map((o) => (
              <OfficeRow key={`${o.kind}-${o.post}`} office={o} open={open === o.post} onToggle={() => setOpen(open === o.post ? null : o.post)} now={now} />
            ))}
            {results.length === 0 && <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: COLORS.inkSoft }}>No post matches that. Try fewer words, such as just the department.</div>}
          </div>
        </>
      )}
    </div>
  );
}
