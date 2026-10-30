// The rules behind the weekly content check (scripts/audit-content.mjs), kept apart so they can be tested without a network or a file system.

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

// "30 October 2026" -> a Date, or null.
export function parseLongDate(text) {
  const m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(String(text ?? "").trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  return month < 0 ? null : new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
}

const days = (from, to) => Math.floor((to - from) / 86400000);

// A page of facts says when its figures were last checked against their sources. Past `limit` days it is due for another look.
export function staleExplainers(pages, now, limit = 60) {
  return pages.flatMap((p) => {
    const d = parseLongDate(p.checked);
    if (!d) return [{ name: p.name, problem: "has no date for when its figures were last checked" }];
    const age = days(d, now);
    return age > limit ? [{ name: p.name, problem: `its figures were last checked ${age} days ago (${p.checked})` }] : [];
  });
}

// How often each kind of saved data is rebuilt, in days. A file that has not changed for longer than twice this has stopped refreshing.
export const CADENCE = [
  [/^(ons\/|regionalBreakdowns|benchmarks|representatives|pipelineStatus|mpCareers|councilsIndex)/, 1],
  [/^(educationData|energyData|healthData|inequalityData|inequalityPlace|inequalityAbroad|defenceData|ageingData|brexitData|devolutionData|transportData|careData|trustData)/, 7],
];

export function staleData(files, now) {
  return files.flatMap(({ name, stamp }) => {
    const rule = CADENCE.find(([re]) => re.test(name));
    if (!rule || !stamp) return [];
    const d = new Date(stamp);
    if (Number.isNaN(d.getTime())) return [];
    const age = days(d, now);
    const limit = rule[1] * 2 + 1;
    return age > limit ? [{ name, problem: `not rebuilt for ${age} days (it should be rebuilt every ${rule[1] === 1 ? "day" : `${rule[1]} days`})` }] : [];
  });
}

// A link is a problem if it is gone or the site is failing. A site that refuses automatic visitors (403, 429) says nothing about whether the page exists.
export function brokenLinks(results) {
  return results.flatMap((r) => {
    if (r.status === 403 || r.status === 429 || r.status === 401) return [];
    if (r.status >= 200 && r.status < 400) return [];
    return [{ name: r.url, problem: r.status ? `answered ${r.status}` : `could not be reached (${r.error ?? "no answer"})` }];
  });
}

export function report(sections) {
  const lines = ["## Content check", ""];
  let total = 0;
  for (const [title, items] of sections) {
    lines.push(`### ${title}`, items.length ? "" : "Nothing to do.", ...items.map((i) => `- ${i.name}: ${i.problem}`), "");
    total += items.length;
  }
  lines.push(total ? `**${total} thing${total === 1 ? "" : "s"} to look at.**` : "**All clear.**");
  return { text: lines.join("\n"), total };
}
