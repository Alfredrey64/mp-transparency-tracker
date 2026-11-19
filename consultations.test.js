import { describe, it, expect } from "vitest";
import { leadOrganisation, readConsultation, summariseConsultations } from "./consultations.js";

const org = (title, acronym, type = "ministerial_department") => ({ title, acronym, organisation_type: type });
const row = (title, end, extra = {}) => ({ title, link: "/government/consultations/" + title.toLowerCase().replace(/\W+/g, "-"), public_timestamp: "2026-11-01T10:00:00Z", end_date: end, description: "  Seeks   views. ", organisations: [org("Department for Transport", "DfT")], ...extra });

describe("consultations", () => {
  it("prefers the ministerial department over an agency", () => {
    expect(leadOrganisation([org("Agency", "AG", "executive_agency"), org("Home Office", "HO")])).toEqual({ name: "Home Office", short: "HO" });
    expect(leadOrganisation([org("Only Agency", "", "executive_agency")])).toEqual({ name: "Only Agency", short: "" });
    expect(leadOrganisation([])).toBeNull();
  });
  it("reads a result, tidying the text and dates, and rejects ones without a link", () => {
    expect(readConsultation(row("Bus fares", "2027-02-03T23:59:00.000+00:00"))).toEqual({
      title: "Bus fares", url: "https://www.gov.uk/government/consultations/bus-fares", published: "2026-11-01", closes: "2027-02-03", summary: "Seeks views.", department: "Department for Transport", short: "DfT",
    });
    expect(readConsultation({ title: "x", link: "" })).toBeNull();
    expect(readConsultation({ link: "/a" })).toBeNull();
  });
  it("keeps only open consultations, soonest closing first, with counts by department", () => {
    const out = summariseConsultations([
      row("Later", "2027-03-01T00:00:00Z"), row("Closed", "2026-11-01T00:00:00Z"), row("Soon", "2026-11-25T00:00:00Z"),
      row("Today", "2026-11-19T23:59:00Z", { organisations: [org("HM Treasury", "HMT")] }), row("No date", undefined),
    ], "2026-11-19");
    expect(out.items.map((c) => c.title)).toEqual(["Today", "Soon", "Later", "No date"]);
    expect(out.total).toBe(4);
    expect(out.byDepartment).toEqual([{ name: "Department for Transport", count: 3 }, { name: "HM Treasury", count: 1 }]);
  });
});
