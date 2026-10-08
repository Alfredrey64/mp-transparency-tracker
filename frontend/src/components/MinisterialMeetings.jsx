import { useState, useMemo } from "react";
import { COLORS, FONT_DISPLAY, FONT_BODY, numeric } from "../theme";
import { PageHeader } from "./shared";
import { IconMeeting, IconSearch } from "./icons";
import { monthLabel, dayParts, shortDepartment, splitAttendees, tally } from "../lib/meetingsView";
import {
  MINISTERIAL_MEETINGS,
  MINISTERIAL_MEETINGS_UPDATED,
  MINISTERIAL_MEETINGS_PERIOD,
  MINISTERIAL_MEETINGS_COLLECTION_URL,
} from "../data/ministerialMeetings";

// One quiet colour per department, used only as a small marker beside the name.
const DEPARTMENT_PALETTE = ["#B5533C", "#4C6FA6", "#2F6F4E", "#8A5A9E", "#C28A1E", "#5A8A8A"];

const text = { fontFamily: FONT_BODY, color: COLORS.inkSoft, fontSize: 14, lineHeight: 1.6 };

// A filter row: a name, how many meetings it covers, and a thin bar for scale.
function FilterRow({ label, count, max, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
        padding: "7px 0 7px 12px", borderLeft: `2px solid ${active ? color : "transparent"}`, font: "inherit",
      }}
    >
      <span style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: FONT_BODY, fontSize: 14, color: active ? COLORS.ink : COLORS.inkSoft, fontWeight: active ? 700 : 500 }}>
        <span>{label}</span>
        <span style={{ ...numeric, fontSize: 14 }}>{count}</span>
      </span>
      {max > 0 && (
        <span style={{ display: "block", height: 3, marginTop: 5, background: COLORS.hairline, borderRadius: 2 }}>
          <span style={{ display: "block", height: 3, width: `${(count / max) * 100}%`, background: color, borderRadius: 2, opacity: active ? 1 : 0.55 }} />
        </span>
      )}
    </button>
  );
}

function FilterList({ title, children }) {
  return (
    <div style={{ marginTop: 26 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: COLORS.ink, margin: "0 0 6px" }}>{title}</h2>
      <div className="mm-filterlist">{children}</div>
    </div>
  );
}

function Meeting({ meeting, color }) {
  const { shown, rest, total } = splitAttendees(meeting.organisation);
  const { day, weekday } = dayParts(meeting.date);
  return (
    <article style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", gap: 14, padding: "18px 0", borderTop: `1px solid ${COLORS.hairline}` }}>
      <time dateTime={meeting.date} style={{ textAlign: "left" }}>
        <span style={{ display: "block", ...numeric, fontSize: 30, lineHeight: 1, color: COLORS.ink }}>{day}</span>
        <span style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>{weekday}</span>
      </time>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink, margin: 0 }}>
          {shown.join(", ")}
          {rest.length > 0 && <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> and {rest.length} more</span>}
        </h3>
        <div style={{ ...text, fontSize: 13.5, marginTop: 2 }}>
          <span aria-hidden="true" style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: color, marginRight: 7 }} />
          {meeting.minister}, {shortDepartment(meeting.department)}
        </div>
        <p style={{ ...text, margin: "8px 0 0", color: COLORS.ink, opacity: 0.85 }}>{meeting.purpose}</p>
        {rest.length > 0 && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ ...text, fontSize: 13.5, cursor: "pointer", color: COLORS.ink }}>All {total} attendees</summary>
            <p style={{ ...text, fontSize: 13.5, margin: "6px 0 0" }}>{[...shown, ...rest].join(", ")}</p>
          </details>
        )}
        <a href={meeting.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", margin: "2px 0 -6px", padding: "6px 0", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color }}>
          Read the official return
        </a>
      </div>
    </article>
  );
}

export default function MinisterialMeetings() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState(null);
  const [minister, setMinister] = useState(null);

  const byDepartment = useMemo(() => tally(MINISTERIAL_MEETINGS, (m) => m.department), []);
  const byMinister = useMemo(() => tally(MINISTERIAL_MEETINGS, (m) => m.minister), []);
  const colorOf = useMemo(() => Object.fromEntries(byDepartment.map(([d], i) => [d, DEPARTMENT_PALETTE[i % DEPARTMENT_PALETTE.length]])), [byDepartment]);
  const ministerDepartment = useMemo(() => Object.fromEntries(MINISTERIAL_MEETINGS.map((m) => [m.minister, m.department])), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MINISTERIAL_MEETINGS.filter((m) => {
      if (department && m.department !== department) return false;
      if (minister && m.minister !== minister) return false;
      return !q || `${m.minister} ${m.organisation} ${m.purpose}`.toLowerCase().includes(q);
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [query, department, minister]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const m of filtered) {
      const label = monthLabel(m.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  const filtering = Boolean(query || department || minister);
  const clear = () => { setQuery(""); setDepartment(null); setMinister(null); };
  const maxMinister = byMinister[0]?.[1] ?? 0;
  const maxDepartment = byDepartment[0]?.[1] ?? 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 40px) 60px" }}>
      <PageHeader
        icon={IconMeeting}
        kicker="Who ministers meet"
        title="Who's getting a minister's time"
        subtitle="Ministers have to publish who they meet outside government: companies, charities, unions and industry bodies. This is a sample of those meetings, copied from each department's own return."
        maxWidth={720}
      />

      <div className="mm-wrap">
      <div className="mm-layout">
        <aside className="mm-side">
          <div style={{ ...numeric, fontSize: 56, lineHeight: 1, color: COLORS.ink }}>{MINISTERIAL_MEETINGS.length}</div>
          <p style={{ ...text, margin: "6px 0 0" }}>
            declared meetings, {MINISTERIAL_MEETINGS_PERIOD}. That is the latest period any department has published.
          </p>

          <div style={{ position: "relative", marginTop: 22 }}>
            <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft, display: "flex" }}>
              <IconSearch size={15} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a minister, group or topic"
              aria-label="Search meetings"
              style={{
                width: "100%", padding: "9px 0 9px 24px", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.ink,
                background: "transparent", border: "none", borderBottom: `1px solid ${COLORS.ink}`, borderRadius: 0, outline: "none",
              }}
            />
          </div>

          <FilterList title="Ministers">
            {byMinister.map(([name, count]) => (
              <FilterRow
                key={name} label={name} count={count} max={maxMinister} color={colorOf[ministerDepartment[name]]}
                active={minister === name} onClick={() => setMinister(minister === name ? null : name)}
              />
            ))}
          </FilterList>

          <FilterList title="Departments">
            {byDepartment.map(([name, count]) => (
              <FilterRow
                key={name} label={shortDepartment(name)} count={count} max={maxDepartment} color={colorOf[name]}
                active={department === name} onClick={() => setDepartment(department === name ? null : name)}
              />
            ))}
          </FilterList>
        </aside>

        <main style={{ minWidth: 0 }}>
          <p style={{ ...text, margin: "0 0 4px", maxWidth: 640 }}>
            Departments publish these returns months after the fact, so this is the freshest record there is. It is also a hand-picked sample, not a
            complete list: each department publishes in its own format, so there is no single feed to collect from. For everything, browse{" "}
            <a href={MINISTERIAL_MEETINGS_COLLECTION_URL} target="_blank" rel="noreferrer" style={{ color: COLORS.ink, fontWeight: 600 }}>
              each department's own releases
            </a>
            . Last refreshed {MINISTERIAL_MEETINGS_UPDATED}.
          </p>

          <div style={{ ...text, fontSize: 13.5, margin: "18px 0 6px", minHeight: 22 }} aria-live="polite">
            {filtering ? (
              <>
                Showing {filtered.length} of {MINISTERIAL_MEETINGS.length} meetings.{" "}
                <button onClick={clear} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: COLORS.ink, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
                  Clear filters
                </button>
              </>
            ) : null}
          </div>

          {groups.length === 0 && <p style={{ ...text, padding: "20px 0" }}>Nothing matches that search.</p>}

          {groups.map(([label, meetings]) => (
            <section key={label} style={{ marginTop: 14 }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: COLORS.ink, margin: "0 0 10px" }}>
                {label} <span style={{ ...numeric, fontSize: 15, fontWeight: 400, color: COLORS.inkSoft }}>{meetings.length}</span>
              </h2>
              {meetings.map((m) => (
                <Meeting key={`${m.minister}-${m.date}-${m.organisation}`} meeting={m} color={colorOf[m.department]} />
              ))}
            </section>
          ))}
        </main>
      </div>
      </div>
    </div>
  );
}
