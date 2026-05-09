import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { buildDashboardSummary, filterRequirements } from "./domain/dashboardModel.mjs";
import {
  SOFTWARE_REQUIREMENT_SUBJECTS,
  suggestSmartCategory,
  validateRequirementWriting,
} from "./domain/smartRules.mjs";

const initialRequirements = [
  {
    id: "REQ-001",
    title: "Verify user credentials",
    description: "The software shall verify user credentials during login.",
    type: "Endogenous",
    subject: "Functional requirements",
    suggestedCategory: "Authentication and processing",
    category: "Authentication and processing",
    project: "SMART Repository",
    priority: "High",
    status: "Categorized",
    createdBy: "Analyst",
    updatedAt: "2026-05-09",
    notes: "Core access-control behavior.",
  },
  {
    id: "REQ-002",
    title: "Store requirement metadata",
    description: "The software shall store requirement metadata in the repository.",
    type: "Endogenous",
    subject: "Data requirements",
    suggestedCategory: "Storage and retrieval",
    category: "Storage and retrieval",
    project: "SMART Repository",
    priority: "Medium",
    status: "Draft",
    createdBy: "Software User",
    updatedAt: "2026-05-09",
    notes: "Supports retrieval, audit, and export.",
  },
  {
    id: "REQ-003",
    title: "Display taxonomy tree",
    description: "The software shall display software requirement taxonomy categories.",
    type: "Endogenous",
    subject: "User interface requirements",
    suggestedCategory: "Presentation and navigation",
    category: "Presentation and navigation",
    project: "Academic Demo",
    priority: "High",
    status: "Categorized",
    createdBy: "Analyst",
    updatedAt: "2026-05-09",
    notes: "Shows SMART/R2F navigation in the demo.",
  },
  {
    id: "REQ-004",
    title: "Integrate export service",
    description: "The software shall integrate with an internal report export API.",
    type: "Endogenous",
    subject: "Technical interface requirements",
    suggestedCategory: "External integration",
    category: "External integration",
    project: "Academic Demo",
    priority: "Medium",
    status: "Categorized",
    createdBy: "Project Manager",
    updatedAt: "2026-05-09",
    notes: "Future backend endpoint for XML, PDF, and DOCX.",
  },
];

function App() {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [form, setForm] = useState({
    title: "",
    description: "The software shall ",
    project: "SMART Repository",
    priority: "Medium",
    status: "Draft",
  });
  const [filters, setFilters] = useState({
    keyword: "",
    project: "",
    subject: "",
    priority: "",
    status: "",
  });

  const summary = useMemo(() => buildDashboardSummary(requirements), [requirements]);
  const filteredRequirements = useMemo(
    () => filterRequirements(requirements, filters),
    [requirements, filters],
  );
  const writingFeedback = validateRequirementWriting(form.description);
  const suggestion = suggestSmartCategory(form.description);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function updateFilters(event) {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  }

  function submitRequirement(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    const nextRequirement = {
      id: `REQ-${String(requirements.length + 1).padStart(3, "0")}`,
      title: form.title.trim(),
      description: form.description.trim(),
      type: "Endogenous",
      subject: suggestion.subject,
      suggestedCategory: suggestion.category,
      category: suggestion.category,
      project: form.project,
      priority: form.priority,
      status: form.status === "Draft" && writingFeedback.isValid ? "Categorized" : form.status,
      createdBy: "Analyst",
      updatedAt: "2026-05-09",
      notes: "Created from the guided SMART requirement workflow.",
    };

    setRequirements([nextRequirement, ...requirements]);
    setForm({
      title: "",
      description: "The software shall ",
      project: form.project,
      priority: "Medium",
      status: "Draft",
    });
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Header),
    React.createElement(
      "main",
      { className: "app-shell" },
      React.createElement(Dashboard, { summary }),
      React.createElement(RequirementWriter, {
        form,
        updateForm,
        submitRequirement,
        writingFeedback,
        suggestion,
      }),
      React.createElement(
        "section",
        { className: "two-column" },
        React.createElement(TaxonomyTree),
        React.createElement(ReportPreview, { requirements: filteredRequirements }),
      ),
      React.createElement(RequirementRepository, {
        requirements: filteredRequirements,
        filters,
        updateFilters,
      }),
      React.createElement(AuditTrail),
    ),
  );
}

function Header() {
  return React.createElement(
    "header",
    { className: "topbar" },
    React.createElement(
      "div",
      null,
      React.createElement("p", { className: "eyebrow" }, "SMART methodology + R2F framework"),
      React.createElement("h1", null, "SMART-S2D"),
      React.createElement(
        "p",
        { className: "lede" },
        "Software requirements categorization, retrieval, refinement, and reporting for an academic prototype.",
      ),
    ),
    React.createElement(
      "nav",
      { "aria-label": "Primary" },
      ["Dashboard", "Requirements", "Taxonomy", "Reports"].map((item) =>
        React.createElement("a", { href: `#${item.toLowerCase()}`, key: item }, item),
      ),
    ),
  );
}

function Dashboard({ summary }) {
  const cards = [
    ["Total requirements", summary.totalRequirements],
    ["Categorized", summary.categorizedRequirements],
    ["Uncategorized", summary.uncategorizedRequirements],
    ["Projects", Object.keys(summary.byProject).length],
  ];

  return React.createElement(
    "section",
    { id: "dashboard", className: "panel dashboard" },
    React.createElement("div", null, React.createElement("p", { className: "eyebrow" }, "Role dashboard"), React.createElement("h2", null, "Analyst overview")),
    React.createElement(
      "div",
      { className: "metric-grid" },
      cards.map(([label, value]) =>
        React.createElement(
          "article",
          { className: "metric", key: label },
          React.createElement("span", null, label),
          React.createElement("strong", null, value),
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "subject-bars" },
      Object.entries(summary.bySubject).map(([subject, count]) =>
        React.createElement(
          "div",
          { className: "bar-row", key: subject },
          React.createElement("span", null, subject),
          React.createElement(
            "div",
            { className: "bar-track" },
            React.createElement("div", {
              className: "bar-fill",
              style: { width: `${Math.max(14, count * 22)}%` },
            }),
          ),
          React.createElement("b", null, count),
        ),
      ),
    ),
  );
}

function RequirementWriter({ form, updateForm, submitRequirement, writingFeedback, suggestion }) {
  return React.createElement(
    "section",
    { className: "panel", id: "requirements" },
    React.createElement("p", { className: "eyebrow" }, "Guided requirement writing"),
    React.createElement("h2", null, "Create a SMART-compatible software requirement"),
    React.createElement(
      "form",
      { className: "writer-grid", onSubmit: submitRequirement },
      React.createElement(Field, {
        label: "Requirement title",
        name: "title",
        value: form.title,
        onChange: updateForm,
        placeholder: "Verify user credentials",
      }),
      React.createElement(SelectField, {
        label: "Project",
        name: "project",
        value: form.project,
        onChange: updateForm,
        options: ["SMART Repository", "Academic Demo"],
      }),
      React.createElement(SelectField, {
        label: "Priority",
        name: "priority",
        value: form.priority,
        onChange: updateForm,
        options: ["High", "Medium", "Low"],
      }),
      React.createElement(SelectField, {
        label: "Status",
        name: "status",
        value: form.status,
        onChange: updateForm,
        options: ["Draft", "Categorized", "Under Review"],
      }),
      React.createElement(
        "label",
        { className: "field full" },
        React.createElement("span", null, "Requirement description"),
        React.createElement("textarea", {
          name: "description",
          value: form.description,
          onChange: updateForm,
          rows: 4,
        }),
      ),
      React.createElement(
        "aside",
        { className: "guidance full" },
        React.createElement("strong", null, "Suggested category"),
        React.createElement("p", null, `${suggestion.subject} / ${suggestion.category}`),
        React.createElement("small", null, `${Math.round(suggestion.confidence * 100)}% confidence. ${suggestion.reason}`),
        React.createElement(
          "ul",
          null,
          (writingFeedback.warnings.length
            ? writingFeedback.warnings
            : ["Requirement follows the guided SMART writing pattern."]
          ).map((warning) => React.createElement("li", { key: warning }, warning)),
        ),
      ),
      React.createElement("button", { className: "primary-button", type: "submit" }, "Save requirement"),
    ),
  );
}

function TaxonomyTree() {
  return React.createElement(
    "section",
    { className: "panel", id: "taxonomy" },
    React.createElement("p", { className: "eyebrow" }, "Software requirements only"),
    React.createElement("h2", null, "SMART taxonomy tree"),
    React.createElement(
      "div",
      { className: "tree" },
      React.createElement("div", { className: "tree-root" }, "Endogenous requirements"),
      React.createElement("div", { className: "tree-branch" }, "Software requirements"),
      SOFTWARE_REQUIREMENT_SUBJECTS.map((subject) =>
        React.createElement(
          "details",
          { open: true, key: subject.id },
          React.createElement("summary", null, subject.name),
          React.createElement(
            "ul",
            null,
            subject.categories.map((category) => React.createElement("li", { key: category }, category)),
          ),
        ),
      ),
    ),
  );
}

function RequirementRepository({ requirements, filters, updateFilters }) {
  return React.createElement(
    "section",
    { className: "panel" },
    React.createElement("p", { className: "eyebrow" }, "Search and retrieval"),
    React.createElement("h2", null, "Requirement repository"),
    React.createElement(
      "div",
      { className: "filters" },
      React.createElement(Field, {
        label: "Keyword",
        name: "keyword",
        value: filters.keyword,
        onChange: updateFilters,
        placeholder: "metadata, dashboard, API",
      }),
      React.createElement(SelectField, {
        label: "Subject",
        name: "subject",
        value: filters.subject,
        onChange: updateFilters,
        options: ["", ...SOFTWARE_REQUIREMENT_SUBJECTS.map((subject) => subject.name)],
      }),
      React.createElement(SelectField, {
        label: "Priority",
        name: "priority",
        value: filters.priority,
        onChange: updateFilters,
        options: ["", "High", "Medium", "Low"],
      }),
      React.createElement(SelectField, {
        label: "Status",
        name: "status",
        value: filters.status,
        onChange: updateFilters,
        options: ["", "Draft", "Categorized", "Under Review"],
      }),
    ),
    React.createElement(
      "div",
      { className: "table-wrap" },
      React.createElement(
        "table",
        null,
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            ["ID", "Title", "Project", "SMART subject", "Category", "Priority", "Status"].map((heading) =>
              React.createElement("th", { key: heading }, heading),
            ),
          ),
        ),
        React.createElement(
          "tbody",
          null,
          requirements.map((requirement) =>
            React.createElement(
              "tr",
              { key: requirement.id },
              ["id", "title", "project", "subject", "category", "priority", "status"].map((key) =>
                React.createElement("td", { key }, requirement[key]),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function ReportPreview({ requirements }) {
  return React.createElement(
    "section",
    { className: "panel", id: "reports" },
    React.createElement("p", { className: "eyebrow" }, "Report preview"),
    React.createElement("h2", null, "Export-ready summary"),
    React.createElement("p", null, `${requirements.length} requirement(s) selected for XML, PDF, or DOCX export.`),
    React.createElement(
      "div",
      { className: "export-actions" },
      ["XML", "PDF", "DOCX"].map((format) =>
        React.createElement("button", { type: "button", key: format }, format),
      ),
    ),
    React.createElement(
      "ul",
      { className: "report-list" },
      requirements.slice(0, 4).map((requirement) =>
        React.createElement("li", { key: requirement.id }, `${requirement.id}: ${requirement.title}`),
      ),
    ),
  );
}

function AuditTrail() {
  const events = [
    "Analyst created REQ-001",
    "System suggested Functional requirements",
    "Project Manager reviewed categorized report",
    "Admin updated software taxonomy category",
  ];

  return React.createElement(
    "section",
    { className: "panel" },
    React.createElement("p", { className: "eyebrow" }, "Audit trail"),
    React.createElement("h2", null, "Recent activity"),
    React.createElement(
      "ol",
      { className: "activity" },
      events.map((event) => React.createElement("li", { key: event }, event)),
    ),
  );
}

function Field({ label, name, value, onChange, placeholder }) {
  return React.createElement(
    "label",
    { className: "field" },
    React.createElement("span", null, label),
    React.createElement("input", { name, value, onChange, placeholder }),
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return React.createElement(
    "label",
    { className: "field" },
    React.createElement("span", null, label),
    React.createElement(
      "select",
      { name, value, onChange },
      options.map((option) =>
        React.createElement("option", { value: option, key: option || "all" }, option || "All"),
      ),
    ),
  );
}

createRoot(document.getElementById("root")).render(React.createElement(App));
