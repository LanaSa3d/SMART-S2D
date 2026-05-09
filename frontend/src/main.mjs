import { buildDashboardSummary, filterRequirements } from "./domain/dashboardModel.mjs";
import { suggestSmartCategory, validateRequirementWriting } from "./domain/smartRules.mjs";
import {
  REQUIREMENT_TAXONOMIES,
  SOFTWARE_CATEGORY_TEMPLATES,
  buildTemplateStatement,
  getDefaultTemplateValues,
} from "./domain/workflowModel.mjs";

const root = document.getElementById("root");

const organizations = [
  { id: "org-1", name: "SMART Research Lab", projects: 3, role: "Analyst" },
  { id: "org-2", name: "Graduation Team", projects: 2, role: "Project Manager" },
  { id: "org-3", name: "Requirements Studio", projects: 4, role: "Admin" },
];

const projects = [
  {
    id: "proj-1",
    name: "SMART Repository",
    organization: "SMART Research Lab",
    updatedAt: "Today",
    requirements: 4,
  },
  {
    id: "proj-2",
    name: "Academic Demo",
    organization: "Graduation Team",
    updatedAt: "Yesterday",
    requirements: 3,
  },
  {
    id: "proj-3",
    name: "Supabase Integration Notes",
    organization: "Requirements Studio",
    updatedAt: "May 7",
    requirements: 2,
  },
];

let requirements = [
  {
    id: "REQ-001",
    title: "Verify user credentials",
    description: "The software shall verify user credentials during login.",
    subject: "Functional requirements",
    category: "Authentication and processing",
    project: "SMART Repository",
    priority: "High",
    status: "Categorized",
  },
  {
    id: "REQ-002",
    title: "Store requirement metadata",
    description: "The software shall store requirement metadata in the repository.",
    subject: "Data requirements",
    category: "Storage and retrieval",
    project: "SMART Repository",
    priority: "Medium",
    status: "Draft",
  },
  {
    id: "REQ-003",
    title: "Display taxonomy workspace",
    description: "The software shall display software requirement taxonomy categories.",
    subject: "User interface requirements",
    category: "Presentation and navigation",
    project: "Academic Demo",
    priority: "High",
    status: "Categorized",
  },
  {
    id: "REQ-004",
    title: "Integrate Supabase Auth",
    description: "The software shall integrate with Supabase Auth.",
    subject: "Technical interface requirements",
    category: "External integration",
    project: "Academic Demo",
    priority: "Medium",
    status: "Under Review",
  },
];

let state = {
  selectedProject: projects[0],
  selectedTaxonomy: "software",
  selectedCategory: "Functional requirements",
  templateValues: getDefaultTemplateValues("Functional requirements"),
  filters: {
    keyword: "",
    subject: "",
    priority: "",
    status: "",
  },
  notice: "",
};

function render() {
  const summary = buildDashboardSummary(requirements);
  const filteredRequirements = filterRequirements(requirements, {
    ...state.filters,
    project: state.selectedProject.name,
  });
  const generatedStatement = buildTemplateStatement(
    state.selectedCategory,
    state.templateValues,
  );
  const writingFeedback = validateRequirementWriting(generatedStatement);
  const suggestion = suggestSmartCategory(generatedStatement);

  root.innerHTML = `
    <div class="product-shell">
      ${renderSidebar()}
      <main class="workspace">
        ${renderTopbar()}
        ${renderWorkspaceHome(summary)}
        ${renderTaxonomyChooser()}
        ${renderCategoryChooser()}
        ${renderTemplateWriter(generatedStatement, writingFeedback, suggestion)}
        ${renderDashboard(summary)}
        ${renderRepository(filteredRequirements)}
      </main>
    </div>
  `;

  bindEvents();
}

function renderSidebar() {
  return `
    <aside class="sidebar" aria-label="Workspace navigation">
      <div class="brand-row">
        <div class="brand-mark">S2D</div>
        <div>
          <strong>SMART-S2D</strong>
          <span>Requirements workspace</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a class="active" href="#home">For you</a>
        <a href="#taxonomy">Taxonomy</a>
        <a href="#templates">Templates</a>
        <a href="#dashboard">Dashboard</a>
        <a href="#repository">Search</a>
      </nav>

      <section class="sidebar-section">
        <div class="section-title">Organizations</div>
        ${organizations
          .map(
            (organization) => `
              <button class="sidebar-item" data-action="connect-org" data-org="${organization.name}">
                <span>${organization.name}</span>
                <small>${organization.role}</small>
              </button>
            `,
          )
          .join("")}
      </section>

      <section class="sidebar-section">
        <div class="section-title">Recent projects</div>
        ${projects
          .map(
            (project) => `
              <button class="sidebar-item ${project.id === state.selectedProject.id ? "selected" : ""}" data-action="select-project" data-project="${project.id}">
                <span>${project.name}</span>
                <small>${project.updatedAt}</small>
              </button>
            `,
          )
          .join("")}
      </section>
    </aside>
  `;
}

function renderTopbar() {
  return `
    <header class="workspace-topbar">
      <div>
        <p class="eyebrow">Project file</p>
        <h1>${state.selectedProject.name}</h1>
      </div>
      <div class="topbar-actions">
        <label class="global-search">
          <span>Search</span>
          <input data-filter="keyword" value="${escapeHtml(state.filters.keyword)}" placeholder="Search requirements, categories, reports" />
        </label>
        <button data-action="connect-org" class="ghost-button">Connect organization</button>
        <button data-action="create-file" class="primary-button">Create file</button>
      </div>
    </header>
    ${state.notice ? `<div class="notice">${state.notice}</div>` : ""}
  `;
}

function renderWorkspaceHome(summary) {
  return `
    <section class="workspace-hero" id="home">
      <div class="hero-copy">
        <p class="eyebrow">Welcome back</p>
        <h2>Choose a project file, then build structured SMART requirements.</h2>
        <p>
          Start from recent project files, connect an organization, or open a SMART taxonomy workflow.
        </p>
        <div class="hero-actions">
          <button data-action="create-file" class="primary-button">Create file</button>
          <button data-action="open-file" class="secondary-button">Open file</button>
          <button data-action="connect-org" class="ghost-button">Connect organization</button>
        </div>
      </div>

      <div class="recent-board" aria-label="Recent project files">
        ${projects
          .map(
            (project) => `
              <button class="project-card ${project.id === state.selectedProject.id ? "active" : ""}" data-action="select-project" data-project="${project.id}">
                <span>${project.organization}</span>
                <strong>${project.name}</strong>
                <small>${project.requirements} requirements · ${project.updatedAt}</small>
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="mini-stats">
        <article><span>Total</span><strong>${summary.totalRequirements}</strong></article>
        <article><span>Categorized</span><strong>${summary.categorizedRequirements}</strong></article>
        <article><span>Draft</span><strong>${summary.uncategorizedRequirements}</strong></article>
      </div>
    </section>
  `;
}

function renderTaxonomyChooser() {
  return `
    <section class="panel" id="taxonomy">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Step 1</p>
          <h2>Choose requirement taxonomy</h2>
        </div>
        <span class="workflow-pill">Endogenous requirements</span>
      </div>
      <div class="taxonomy-grid">
        ${REQUIREMENT_TAXONOMIES.map(
          (taxonomy) => `
            <button
              class="taxonomy-card ${taxonomy.enabled ? "" : "disabled"} ${state.selectedTaxonomy === taxonomy.id ? "selected" : ""}"
              data-action="select-taxonomy"
              data-taxonomy="${taxonomy.id}"
              ${taxonomy.enabled ? "" : "aria-disabled=\"true\""}
            >
              <span>${taxonomy.enabled ? "Available" : "Future"}</span>
              <strong>${taxonomy.name}</strong>
              <small>${taxonomy.description}</small>
            </button>
          `,
        ).join("")}
      </div>
    </section>
  `;
}

function renderCategoryChooser() {
  return `
    <section class="panel" id="templates">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Step 2</p>
          <h2>Select software requirement category</h2>
        </div>
        <span class="workflow-pill">Software requirements</span>
      </div>
      <div class="category-grid">
        ${Object.entries(SOFTWARE_CATEGORY_TEMPLATES)
          .map(
            ([category, template]) => `
              <button class="category-card ${template.accent} ${state.selectedCategory === category ? "selected" : ""}" data-action="select-category" data-category="${category}">
                <span>${template.shortName}</span>
                <strong>${category}</strong>
                <small>${template.intent}</small>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTemplateWriter(statement, writingFeedback, suggestion) {
  const template = SOFTWARE_CATEGORY_TEMPLATES[state.selectedCategory];

  return `
    <section class="panel template-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Step 3</p>
          <h2>${state.selectedCategory} template</h2>
        </div>
        <span class="workflow-pill">${template.prompt}</span>
      </div>

      <div class="template-layout">
        <form class="template-form" data-form="template">
          ${renderInput("softwareName", "Software name")}
          ${renderSelect("obligation", "Obligation", ["shall", "should", "must"])}
          ${renderInput("goalStatement", "Goal selected from R2F")}
          ${renderInput("subjectName", "Software subject")}
          ${renderTextarea("subjectStatement", "Subject statement")}
          ${renderInput("subjectModel", "Subject model")}
        </form>

        <aside class="statement-preview">
          <p class="eyebrow">Generated requirement</p>
          <blockquote>${escapeHtml(statement)}</blockquote>
          <div class="suggestion-box">
            <strong>${suggestion.subject}</strong>
            <span>${suggestion.category} · ${Math.round(suggestion.confidence * 100)}% confidence</span>
          </div>
          <div class="verb-row">
            ${template.verbs.map((verb) => `<button data-action="use-verb" data-verb="${verb}">${verb}</button>`).join("")}
          </div>
          <ul class="validation-list">
            ${(writingFeedback.warnings.length
              ? writingFeedback.warnings
              : ["Requirement follows the SMART writing guidance."]
            )
              .map((warning) => `<li>${warning}</li>`)
              .join("")}
          </ul>
          <button data-action="save-requirement" class="primary-button">Save requirement</button>
        </aside>
      </div>
    </section>
  `;
}

function renderDashboard(summary) {
  return `
    <section class="panel dashboard-panel" id="dashboard">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Dashboard</p>
          <h2>Project requirement overview</h2>
        </div>
      </div>
      <div class="metric-grid">
        ${[
          ["Total requirements", summary.totalRequirements],
          ["Categorized", summary.categorizedRequirements],
          ["Uncategorized", summary.uncategorizedRequirements],
          ["Projects", Object.keys(summary.byProject).length],
        ]
          .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
          .join("")}
      </div>
      <div class="status-board">
        ${["Draft", "Under Review", "Categorized"].map((status) => renderStatusColumn(status)).join("")}
      </div>
    </section>
  `;
}

function renderStatusColumn(status) {
  const statusRequirements = requirements.filter(
    (requirement) =>
      requirement.project === state.selectedProject.name && requirement.status === status,
  );

  return `
    <article class="status-column">
      <div class="column-title">${status} <span>${statusRequirements.length}</span></div>
      ${statusRequirements
        .map(
          (requirement) => `
            <div class="requirement-card">
              <strong>${requirement.title}</strong>
              <small>${requirement.subject}</small>
            </div>
          `,
        )
        .join("")}
    </article>
  `;
}

function renderRepository(filteredRequirements) {
  return `
    <section class="panel" id="repository">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Search</p>
          <h2>Requirements in ${state.selectedProject.name}</h2>
        </div>
        <span class="workflow-pill">${filteredRequirements.length} result(s)</span>
      </div>
      <div class="filters">
        ${renderFilterSelect("subject", "Subject", ["", ...Object.keys(SOFTWARE_CATEGORY_TEMPLATES)])}
        ${renderFilterSelect("priority", "Priority", ["", "High", "Medium", "Low"])}
        ${renderFilterSelect("status", "Status", ["", "Draft", "Under Review", "Categorized"])}
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRequirements
              .map(
                (requirement) => `
                  <tr>
                    <td>${requirement.id}</td>
                    <td>${requirement.title}</td>
                    <td>${requirement.subject}</td>
                    <td>${requirement.category}</td>
                    <td>${requirement.priority}</td>
                    <td><span class="status-badge">${requirement.status}</span></td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderInput(name, label) {
  return `
    <label class="field">
      <span>${label}</span>
      <input data-template-field="${name}" value="${escapeHtml(state.templateValues[name])}" />
    </label>
  `;
}

function renderTextarea(name, label) {
  return `
    <label class="field full">
      <span>${label}</span>
      <textarea data-template-field="${name}" rows="4">${escapeHtml(state.templateValues[name])}</textarea>
    </label>
  `;
}

function renderSelect(name, label, options) {
  return `
    <label class="field">
      <span>${label}</span>
      <select data-template-field="${name}">
        ${options
          .map(
            (option) =>
              `<option value="${option}" ${state.templateValues[name] === option ? "selected" : ""}>${option}</option>`,
          )
          .join("")}
      </select>
    </label>
  `;
}

function renderFilterSelect(name, label, options) {
  return `
    <label class="field compact">
      <span>${label}</span>
      <select data-filter="${name}">
        ${options
          .map(
            (option) =>
              `<option value="${option}" ${state.filters[name] === option ? "selected" : ""}>${option || "All"}</option>`,
          )
          .join("")}
      </select>
    </label>
  `;
}

function bindEvents() {
  root.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
  });

  root.querySelectorAll("[data-template-field]").forEach((element) => {
    element.addEventListener("input", (event) => {
      state = {
        ...state,
        templateValues: {
          ...state.templateValues,
          [event.target.dataset.templateField]: event.target.value,
        },
      };
      render();
    });
  });

  root.querySelectorAll("[data-filter]").forEach((element) => {
    element.addEventListener("input", (event) => {
      state = {
        ...state,
        filters: {
          ...state.filters,
          [event.target.dataset.filter]: event.target.value,
        },
      };
      render();
    });
  });
}

function handleAction(event) {
  const button = event.currentTarget;
  const action = button.dataset.action;

  if (action === "select-project") {
    state = {
      ...state,
      selectedProject: projects.find((project) => project.id === button.dataset.project),
      notice: "",
    };
  }

  if (action === "create-file") {
    const nextProject = {
      id: `proj-${projects.length + 1}`,
      name: `Untitled SMART File ${projects.length + 1}`,
      organization: "SMART Research Lab",
      updatedAt: "Now",
      requirements: 0,
    };
    projects.unshift(nextProject);
    state = { ...state, selectedProject: nextProject, notice: "New SMART file created." };
  }

  if (action === "open-file") {
    state = { ...state, selectedProject: projects[0], notice: "Opened the most recent SMART file." };
  }

  if (action === "connect-org") {
    state = { ...state, notice: "Organization connection is prepared for the Supabase Auth phase." };
  }

  if (action === "select-taxonomy") {
    const taxonomy = REQUIREMENT_TAXONOMIES.find((item) => item.id === button.dataset.taxonomy);
    state = taxonomy.enabled
      ? { ...state, selectedTaxonomy: taxonomy.id, notice: "" }
      : { ...state, notice: `${taxonomy.name} will be available in a future version.` };
  }

  if (action === "select-category") {
    state = {
      ...state,
      selectedCategory: button.dataset.category,
      templateValues: getDefaultTemplateValues(button.dataset.category),
      notice: "",
    };
  }

  if (action === "use-verb") {
    state = {
      ...state,
      templateValues: { ...state.templateValues, goalStatement: button.dataset.verb },
    };
  }

  if (action === "save-requirement") {
    saveRequirement();
  }

  render();
}

function saveRequirement() {
  const statement = buildTemplateStatement(state.selectedCategory, state.templateValues);
  const suggestion = suggestSmartCategory(statement);
  const nextRequirement = {
    id: `REQ-${String(requirements.length + 1).padStart(3, "0")}`,
    title: `${state.templateValues.goalStatement} ${state.templateValues.subjectName}`,
    description: statement,
    subject: state.selectedCategory,
    category: suggestion.category,
    project: state.selectedProject.name,
    priority: "Medium",
    status: "Categorized",
  };

  requirements = [nextRequirement, ...requirements];
  state = {
    ...state,
    notice: `${nextRequirement.id} saved to ${state.selectedProject.name}.`,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

render();
