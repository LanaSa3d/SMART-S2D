import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDashboardSummary, filterRequirements } from "./dashboardModel.mjs";

const requirements = [
  {
    id: "REQ-001",
    project: "Campus Portal",
    subject: "Functional requirements",
    category: "Authentication and processing",
    priority: "High",
    status: "Categorized",
    title: "Verify student credentials",
  },
  {
    id: "REQ-002",
    project: "Campus Portal",
    subject: "Data requirements",
    category: "Storage and retrieval",
    priority: "Medium",
    status: "Draft",
    title: "Store requirement metadata",
  },
  {
    id: "REQ-003",
    project: "Research Archive",
    subject: "User interface requirements",
    category: "Presentation and navigation",
    priority: "Low",
    status: "Categorized",
    title: "Display taxonomy tree",
  },
];

describe("dashboard model", () => {
  it("summarizes requirement counts for the demo dashboard", () => {
    const summary = buildDashboardSummary(requirements);

    assert.equal(summary.totalRequirements, 3);
    assert.equal(summary.categorizedRequirements, 2);
    assert.equal(summary.uncategorizedRequirements, 1);
    assert.deepEqual(summary.bySubject, {
      "Functional requirements": 1,
      "Data requirements": 1,
      "User interface requirements": 1,
    });
    assert.deepEqual(summary.byPriority, { High: 1, Medium: 1, Low: 1 });
  });

  it("filters requirements by keyword, project, subject, priority, and status", () => {
    const filtered = filterRequirements(requirements, {
      keyword: "metadata",
      project: "Campus Portal",
      subject: "Data requirements",
      priority: "Medium",
      status: "Draft",
    });

    assert.deepEqual(
      filtered.map((requirement) => requirement.id),
      ["REQ-002"],
    );
  });
});
