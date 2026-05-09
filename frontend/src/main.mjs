import { hasSupabaseConfig } from "./config.mjs";
import { buildDashboardSummary, filterRequirements } from "./domain/dashboardModel.mjs";
import { REQUIREMENT_PRIORITIES, REQUIREMENT_STATUSES, SOURCE_TYPES, USER_ROLES } from "./domain/entities.mjs";
import { buildDocxHtml, buildPdfHtml, buildRequirementsXml } from "./domain/exportModel.mjs";
import { parseCsvRequirements, parseDocxRequirements, parsePastedRequirements, parseTxtRequirements } from "./domain/importModel.mjs";
import { suggestSmartCategory, validateRequirementWriting } from "./domain/smartRules.mjs";
import {
  REQUIREMENT_TAXONOMIES,
  SOFTWARE_CATEGORY_TEMPLATES,
  buildHumanSummary,
  buildTemplateStatement,
  getDefaultTemplateValues,
} from "./domain/workflowModel.mjs";
import { downloadTextFile } from "./services/downloads.mjs";
import {
  createOrganization,
  createProject,
  createReport,
  createRequirement,
  deleteRequirement,
  ensureProfile,
  getSession,
  listOrganizations,
  listProjects,
  listRequirements,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateRequirement,
} from "./services/repository.mjs";

const root = document.getElementById("root");

const MODULES = [
  ["dashboard", "Dashboard"],
  ["wizard", "SMART Wizard"],
  ["requirements", "Requirements"],
  ["taxonomy", "Taxonomy"],
  ["search", "Search"],
  ["reports", "Reports"],
  ["settings", "Admin/Settings"],
];

const state = {
  initialized: false,
  loading: false,
  session: null,
  profile: null,
  organizations: [],
  selectedOrganization: null,
  projects: [],
  selectedProject: null,
  requirements: [],
  activeModule: "dashboard",
  activeRole: "Analyst",
  selectedCategory: "Functional requirements",
  templateValues: getDefaultTemplateValues("Functional requirements"),
  importText: "",
  importSource: "Manual",
  importCandidates: [],
  filters: {
    keyword: "",
    subject: "",
    category: "",
    priority: "",
    status: "",
    sourceType: "",
    validationState: "",
  },
  selectedRequirementId: "",
  reportFormat: "XML",
  reportScope: "Project",
  authMode: "signIn",
  notice: "",
  error: "",
};

init();

async function init() {
  if (!hasSupabaseConfig()) {
    state.initialized = true;
    render();
    return;
  }

  await runWithUi(async () => {
    state.session = await getSession();
    if (state.session?.user) {
      state.profile = await ensureProfile(state.session.user);
      await loadWorkspace();
    }
    state.initialized = true;
  });
}

async function loadWorkspace() {
  state.organizations = await listOrganizations();
  if (!state.selectedOrganization && state.organizations.length) {
    state.selectedOrganization = state.organizations[0];
    state.activeRole = state.selectedOrganization.role ?? state.activeRole;
  }
  await loadProjects();
}

async function loadProjects() {
  if (!state.selectedOrganization) {
    state.projects = [];
    state.selectedProject = null;
    state.requirements = [];
    return;
  }

  state.projects = await listProjects(state.selectedOrganization.id);
  if (!state.selectedProject && state.projects.length) {
    state.selectedProject = state.projects[0];
  }
  await loadRequirements();
}

async function loadRequirements() {
  if (!state.selectedProject) {
    state.requirements = [];
    return;
  }

  state.requirements = await listRequirements(state.selectedProject.id);
}

function render() {
  if (!state.initialized) {
    root.innerHTML = `<div class="loading-screen">Starting SMART-S2D...</div>`;
    return;
  }

  if (!hasSupabaseConfig()) {
    root.innerHTML = renderMissingConfig();
    return;
  }

  if (!state.session) {
    root.innerHTML = renderAuth();
    bindEvents();
    return;
  }

  root.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <main class="main-surface">
        ${renderTopbar()}
        ${renderFeedback()}
        ${state.selectedProject ? renderProjectModule() : renderWorkspaceDashboard()}
      </main>
    </div>
  `;
  bindEvents();
}

function renderMissingConfig() {
  return `
    <main class="setup-screen">
      <section class="setup-panel">
        <div class="brand-lockup">
          <div class="hex-mark">S</div>
          <div>
            <p class="eyebrow">Setup required</p>
            <h1>Connect SMART-S2D to Supabase</h1>
          </div>
        </div>
        <p>Create <code>frontend/src/env.local.js</code> from <code>frontend/src/env.local.example.js</code>, then add your Supabase URL and anon key.</p>
        <pre>Copy-Item frontend/src/env.local.example.js frontend/src/env.local.js</pre>
      </section>
    </main>
  `;
}

function renderAuth() {
  const isSignUp = state.authMode === "signUp";
  return `
    <main class="auth-screen">
      <section class="auth-panel">
        <div class="brand-lockup">
          <div class="hex-mark">S</div>
          <div>
            <p class="eyebrow">SMART-S2D</p>
            <h1>Requirements command workspace</h1>
          </div>
        </div>
        <p class="muted">Sign in or create an account to manage organizations, projects, and SMART/R2F requirements.</p>
        ${renderFeedback()}
        <div class="auth-tabs">
          <button class="${state.authMode === "signIn" ? "active" : ""}" data-action="set-auth-mode" data-mode="signIn" type="button">Sign in</button>
          <button class="${state.authMode === "signUp" ? "active" : ""}" data-action="set-auth-mode" data-mode="signUp" type="button">Create account</button>
        </div>
        <form class="auth-form" data-form="auth">
          ${
            isSignUp
              ? `<label class="field">
                  <span>Full name</span>
                  <input data-auth-field="fullName" autocomplete="name" placeholder="Lana Saad" />
                </label>`
              : ""
          }
          <label class="field">
            <span>Email</span>
            <input data-auth-field="email" autocomplete="email" type="email" placeholder="name@example.com" />
          </label>
          <label class="field">
            <span>Password</span>
            <input data-auth-field="password" autocomplete="current-password" type="password" />
          </label>
          <div class="button-row">
            <button class="primary-button" data-action="${isSignUp ? "sign-up" : "sign-in"}" type="button">${isSignUp ? "Create account" : "Sign in"}</button>
          </div>
        </form>
      </section>
    </main>
  `;
}

function renderSidebar() {
  const projectOpen = Boolean(state.selectedProject);
  return `
    <aside class="sidebar">
      <div class="brand-row">
        <div class="hex-mark small">S</div>
        <div>
          <strong>SMART-S2D</strong>
          <span>Support Software</span>
        </div>
      </div>

      <nav class="module-nav">
        <button class="${!projectOpen ? "active" : ""}" data-action="go-workspace">Workspace</button>
        ${MODULES.map(
          ([id, label]) => `
            <button class="${state.activeModule === id && projectOpen ? "active" : ""}" data-action="set-module" data-module="${id}" ${projectOpen ? "" : "disabled"}>
              ${label}
            </button>
          `,
        ).join("")}
      </nav>

      <section class="sidebar-block">
        <div class="section-title">Organization</div>
        <strong>${escapeHtml(state.selectedOrganization?.name ?? "None selected")}</strong>
        <span>${escapeHtml(state.activeRole)}</span>
      </section>

      <section class="sidebar-block">
        <div class="section-title">Project</div>
        <strong>${escapeHtml(state.selectedProject?.name ?? "No project open")}</strong>
        <span>${state.requirements.length} requirement(s)</span>
      </section>
    </aside>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${state.selectedProject ? "Project workspace" : "Workspace dashboard"}</p>
        <h1>${escapeHtml(state.selectedProject?.name ?? "Open or create a SMART-S2D project")}</h1>
      </div>
      <div class="topbar-actions">
        <label class="field compact role-field">
          <span>Role</span>
          <select data-action="set-role">
            ${USER_ROLES.map((role) => `<option ${state.activeRole === role ? "selected" : ""}>${role}</option>`).join("")}
          </select>
        </label>
        <button class="ghost-button" data-action="refresh">Refresh</button>
        <button class="secondary-button" data-action="sign-out">Sign out</button>
      </div>
    </header>
  `;
}

function renderFeedback() {
  return `
    ${state.loading ? `<div class="notice">Working...</div>` : ""}
    ${state.notice ? `<div class="notice">${escapeHtml(state.notice)}</div>` : ""}
    ${state.error ? `<div class="error-box">${escapeHtml(state.error)}</div>` : ""}
  `;
}

function renderWorkspaceDashboard() {
  return `
    <section class="workspace-grid">
      <article class="panel hero-panel">
        <p class="eyebrow">Start here</p>
        <h2>Create an organization, then open a project.</h2>
        <p class="muted">SMART-S2D now stores work by account, organization, and project. Files are exports, not the primary workspace.</p>
      </article>

      <article class="panel">
        <div class="section-heading">
          <h2>Organizations</h2>
          <span class="count-pill">${state.organizations.length}</span>
        </div>
        <form class="stack-form">
          <input data-form-field="organizationName" placeholder="Organization name" />
          <input data-form-field="organizationDescription" placeholder="Description" />
          <button class="primary-button" data-action="create-organization" type="button">Create organization</button>
        </form>
        <div class="list-stack">
          ${state.organizations.map(renderOrganizationCard).join("") || `<p class="muted">No organizations yet.</p>`}
        </div>
      </article>

      <article class="panel">
        <div class="section-heading">
          <h2>Projects</h2>
          <span class="count-pill">${state.projects.length}</span>
        </div>
        ${
          state.selectedOrganization
            ? `<form class="stack-form">
                <input data-form-field="projectName" placeholder="Project name" />
                <input data-form-field="projectDescription" placeholder="Description" />
                <button class="primary-button" data-action="create-project" type="button">Create project</button>
              </form>`
            : `<p class="muted">Select or create an organization first.</p>`
        }
        <div class="list-stack">
          ${state.projects.map(renderProjectCard).join("") || `<p class="muted">No projects yet.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderOrganizationCard(organization) {
  return `
    <button class="record-card ${state.selectedOrganization?.id === organization.id ? "selected" : ""}" data-action="select-organization" data-id="${organization.id}">
      <strong>${escapeHtml(organization.name)}</strong>
      <span>${escapeHtml(organization.description || "No description")}</span>
      <small>${escapeHtml(organization.role ?? "Member")}</small>
    </button>
  `;
}

function renderProjectCard(project) {
  return `
    <button class="record-card ${state.selectedProject?.id === project.id ? "selected" : ""}" data-action="select-project" data-id="${project.id}">
      <strong>${escapeHtml(project.name)}</strong>
      <span>${escapeHtml(project.description || "No description")}</span>
      <small>${escapeHtml(project.status)}</small>
    </button>
  `;
}

function renderProjectModule() {
  if (state.activeModule === "wizard") return renderWizard();
  if (state.activeModule === "requirements") return renderRequirements();
  if (state.activeModule === "taxonomy") return renderTaxonomy();
  if (state.activeModule === "search") return renderSearch();
  if (state.activeModule === "reports") return renderReports();
  if (state.activeModule === "settings") return renderSettings();
  return renderDashboard();
}

function renderDashboard() {
  const summary = buildDashboardSummary(mapRequirementsForDomain(state.requirements));
  const warnings = state.requirements.filter((requirement) => requirement.validation_state !== "Valid").length;
  return `
    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Project dashboard</p>
          <h2>SMART requirement distribution</h2>
        </div>
        <button class="primary-button" data-action="set-module" data-module="wizard">New requirement</button>
      </div>
      <div class="metric-grid">
        <article class="metric"><span>Total</span><strong>${summary.totalRequirements}</strong></article>
        <article class="metric"><span>Categorized</span><strong>${summary.categorizedRequirements}</strong></article>
        <article class="metric"><span>Needs review</span><strong>${summary.uncategorizedRequirements}</strong></article>
        <article class="metric"><span>Warnings</span><strong>${warnings}</strong></article>
      </div>
      <div class="distribution-grid">
        ${Object.entries(summary.bySubject).map(([subject, count]) => `<div class="signal-row"><span>${escapeHtml(subject)}</span><strong>${count}</strong></div>`).join("") || `<p class="muted">No requirements yet.</p>`}
      </div>
    </section>
  `;
}

function renderWizard() {
  const statement = buildTemplateStatement(state.selectedCategory, state.templateValues);
  const humanSummary = buildHumanSummary(state.templateValues);
  const validation = validateRequirementWriting(statement);
  const suggestion = suggestSmartCategory(statement);

  return `
    <section class="wizard-grid">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">SMART Wizard</p>
            <h2>Create or import requirement candidates</h2>
          </div>
          <span class="count-pill">Software taxonomy</span>
        </div>
        <div class="source-grid">
          ${["Manual", "Paste", "TXT", "CSV", "DOCX"].map((source) => `<button class="source-card ${state.importSource === source ? "selected" : ""}" data-action="set-source" data-source="${source}">${source}</button>`).join("")}
        </div>
        ${state.importSource === "Manual" ? "" : renderImportPanel()}
        <div class="taxonomy-strip">
          ${REQUIREMENT_TAXONOMIES.map((taxonomy) => `<span class="${taxonomy.enabled ? "active" : "locked"}">${escapeHtml(taxonomy.name)}</span>`).join("")}
        </div>
        <div class="category-grid">
          ${Object.entries(SOFTWARE_CATEGORY_TEMPLATES).map(
            ([category, template]) => `
              <button class="category-card ${state.selectedCategory === category ? "selected" : ""}" data-action="select-category" data-category="${category}">
                <span>${escapeHtml(template.shortName)}</span>
                <strong>${escapeHtml(category)}</strong>
                <small>${escapeHtml(template.intent)}</small>
              </button>
            `,
          ).join("")}
        </div>
        ${renderTemplateForm()}
      </article>

      <aside class="panel review-panel">
        <p class="eyebrow">Review</p>
        <h2>Generated statement</h2>
        <div class="summary-box">${escapeHtml(humanSummary)}</div>
        <blockquote>${escapeHtml(statement)}</blockquote>
        <div class="suggestion-box">
          <strong>${escapeHtml(suggestion.subject)}</strong>
          <span>${escapeHtml(suggestion.category)} - ${Math.round(suggestion.confidence * 100)}% confidence</span>
          <small>${escapeHtml(suggestion.reason)}</small>
        </div>
        <ul class="validation-list">
          ${(validation.warnings.length ? validation.warnings : ["Requirement follows the SMART writing guidance."]).map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}
        </ul>
        <button class="primary-button" data-action="save-requirement">Save requirement</button>
      </aside>
    </section>
  `;
}

function renderImportPanel() {
  return `
    <div class="import-panel">
      <textarea data-action="set-import-text" rows="5" placeholder="Paste text or CSV content here. TXT/CSV/DOCX file upload controls will feed this review queue in the next parser slice.">${escapeHtml(state.importText)}</textarea>
      <button class="secondary-button" data-action="parse-import">Parse candidates</button>
      <div class="candidate-list">
        ${state.importCandidates.map((candidate) => `<div class="candidate-card"><strong>${escapeHtml(candidate.tempId)} ${escapeHtml(candidate.title)}</strong><span>${escapeHtml(candidate.rawText)}</span></div>`).join("")}
      </div>
    </div>
  `;
}

function renderTemplateForm() {
  return `
    <form class="template-form">
      ${renderField("softwareName", "Software name")}
      ${renderSelect("obligation", "Obligation", ["shall", "should", "must"])}
      ${renderSelect("relationVerb", "Relation verb", ["ensure", "require", "adopt"])}
      ${renderField("genericSubject", "Generic subject from R2F")}
      ${renderField("specificSubjectName", "Specific subject name")}
      ${renderField("specificSubjectStatement", "Specific subject statement", true)}
      ${renderField("specificSubjectModel", "Specific subject model")}
      ${renderSelect("priority", "Priority", REQUIREMENT_PRIORITIES)}
      ${renderSelect("status", "Status", REQUIREMENT_STATUSES)}
      ${renderSelect("sourceType", "Source type", SOURCE_TYPES)}
      ${renderField("notes", "Notes", true)}
    </form>
  `;
}

function renderRequirements() {
  return renderRequirementTable("Requirements repository", state.requirements);
}

function renderSearch() {
  const filtered = getFilteredRequirements();
  return `
    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Multicriteria retrieval</p>
          <h2>Search requirements</h2>
        </div>
        <span class="count-pill">${filtered.length} result(s)</span>
      </div>
      ${renderFilters()}
      ${renderRequirementTable("Search results", filtered, false)}
    </section>
  `;
}

function renderRequirementTable(title, requirements, wrap = true) {
  const content = `
    <div class="table-header"><h2>${escapeHtml(title)}</h2><span>${requirements.length} item(s)</span></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Subject</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Validation</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${requirements.map(renderRequirementRow).join("") || `<tr><td colspan="8">No requirements yet.</td></tr>`}
        </tbody>
      </table>
    </div>
    ${renderSelectedRequirement()}
  `;
  return wrap ? `<section class="panel">${content}</section>` : content;
}

function renderRequirementRow(requirement) {
  return `
    <tr>
      <td>${escapeHtml(requirement.requirement_code)}</td>
      <td>${escapeHtml(requirement.title)}</td>
      <td>${escapeHtml(requirement.final_subject)}</td>
      <td>${escapeHtml(requirement.final_category)}</td>
      <td>${escapeHtml(requirement.priority)}</td>
      <td><span class="status-badge">${escapeHtml(requirement.status)}</span></td>
      <td>${escapeHtml(requirement.validation_state)}</td>
      <td>
        <button class="tiny-button" data-action="select-requirement" data-id="${requirement.id}">View</button>
        <button class="tiny-button danger" data-action="delete-requirement" data-id="${requirement.id}">Delete</button>
      </td>
    </tr>
  `;
}

function renderSelectedRequirement() {
  const requirement = state.requirements.find((item) => item.id === state.selectedRequirementId);
  if (!requirement) return "";

  return `
    <aside class="detail-panel">
      <p class="eyebrow">${escapeHtml(requirement.requirement_code)}</p>
      <h2>${escapeHtml(requirement.title)}</h2>
      <blockquote>${escapeHtml(requirement.formal_statement)}</blockquote>
      <div class="button-row">
        <select data-edit-field="status" data-id="${requirement.id}">
          ${REQUIREMENT_STATUSES.map((status) => `<option ${requirement.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
        <select data-edit-field="priority" data-id="${requirement.id}">
          ${REQUIREMENT_PRIORITIES.map((priority) => `<option ${requirement.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}
        </select>
      </div>
    </aside>
  `;
}

function renderFilters() {
  return `
    <div class="filters">
      <label class="field"><span>Keyword</span><input data-filter="keyword" value="${escapeHtml(state.filters.keyword)}" /></label>
      ${renderFilterSelect("subject", "Subject", ["", ...Object.keys(SOFTWARE_CATEGORY_TEMPLATES)])}
      ${renderFilterSelect("priority", "Priority", ["", ...REQUIREMENT_PRIORITIES])}
      ${renderFilterSelect("status", "Status", ["", ...REQUIREMENT_STATUSES])}
      ${renderFilterSelect("sourceType", "Source", ["", ...SOURCE_TYPES])}
      ${renderFilterSelect("validationState", "Validation", ["", "Valid", "Warnings", "Blocked"])}
    </div>
  `;
}

function renderTaxonomy() {
  const bySubject = Object.keys(SOFTWARE_CATEGORY_TEMPLATES).map((subject) => ({
    subject,
    count: state.requirements.filter((requirement) => requirement.final_subject === subject).length,
  }));

  return `
    <section class="panel taxonomy-panel">
      <p class="eyebrow">Hybrid taxonomy</p>
      <h2>Endogenous requirements</h2>
      <div class="taxonomy-tree">
        <div class="tree-node root">Endogenous requirements</div>
        <div class="tree-branch active">Software requirements</div>
        ${bySubject.map((item) => `<div class="tree-leaf"><span>${escapeHtml(item.subject)}</span><strong>${item.count}</strong></div>`).join("")}
        <div class="tree-branch locked">Operation requirements - future</div>
        <div class="tree-branch locked">Development requirements - future</div>
      </div>
    </section>
  `;
}

function renderReports() {
  const requirements = state.reportScope === "Filtered" ? getFilteredRequirements() : state.requirements;
  return `
    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Reports</p>
          <h2>Export project requirements</h2>
        </div>
        <span class="count-pill">${requirements.length} included</span>
      </div>
      <div class="filters">
        ${renderReportSelect("reportFormat", "Format", ["XML", "PDF", "DOCX"])}
        ${renderReportSelect("reportScope", "Scope", ["Project", "Filtered"])}
      </div>
      <button class="primary-button" data-action="export-report">Generate export</button>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="panel">
      <p class="eyebrow">Admin/Settings</p>
      <h2>Organization controls</h2>
      <p class="muted">Full member and taxonomy management arrives in the next depth slice. Current role: ${escapeHtml(state.activeRole)}.</p>
      <div class="signal-row"><span>Organization</span><strong>${escapeHtml(state.selectedOrganization?.name)}</strong></div>
      <div class="signal-row"><span>Project</span><strong>${escapeHtml(state.selectedProject?.name)}</strong></div>
    </section>
  `;
}

function renderField(name, label, textarea = false) {
  const value = state.templateValues[name] ?? "";
  return `
    <label class="field ${textarea ? "full" : ""}">
      <span>${label}</span>
      ${textarea ? `<textarea data-template-field="${name}" rows="3">${escapeHtml(value)}</textarea>` : `<input data-template-field="${name}" value="${escapeHtml(value)}" />`}
    </label>
  `;
}

function renderSelect(name, label, options) {
  const value = state.templateValues[name] ?? "";
  return `
    <label class="field">
      <span>${label}</span>
      <select data-template-field="${name}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderFilterSelect(name, label, options) {
  const value = state.filters[name] ?? "";
  return `
    <label class="field">
      <span>${label}</span>
      <select data-filter="${name}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option || "All")}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderReportSelect(name, label, options) {
  const value = state[name];
  return `
    <label class="field">
      <span>${label}</span>
      <select data-report-field="${name}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function bindEvents() {
  root.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
    element.addEventListener("change", handleAction);
  });

  root.querySelectorAll("[data-template-field]").forEach((element) => {
    element.addEventListener("input", (event) => {
      state.templateValues = {
        ...state.templateValues,
        [event.target.dataset.templateField]: event.target.value,
      };
      render();
    });
  });

  root.querySelectorAll("[data-filter]").forEach((element) => {
    element.addEventListener("input", (event) => {
      state.filters = { ...state.filters, [event.target.dataset.filter]: event.target.value };
      render();
    });
  });

  root.querySelectorAll("[data-report-field]").forEach((element) => {
    element.addEventListener("input", (event) => {
      state[event.target.dataset.reportField] = event.target.value;
      render();
    });
  });

  root.querySelectorAll("[data-edit-field]").forEach((element) => {
    element.addEventListener("change", handleRequirementEdit);
  });

  const importText = root.querySelector("[data-action='set-import-text']");
  if (importText) {
    importText.addEventListener("input", (event) => {
      state.importText = event.target.value;
    });
  }
}

async function handleAction(event) {
  const element = event.currentTarget;
  const action = element.dataset.action;

  if (action === "set-auth-mode") {
    state.authMode = element.dataset.mode;
    state.error = "";
    state.notice = "";
    render();
    return;
  }

  await runWithUi(async () => {
    if (action === "sign-in") await handleSignIn();
    if (action === "sign-up") await handleSignUp();
    if (action === "sign-out") await handleSignOut();
    if (action === "refresh") await refreshAll();
    if (action === "go-workspace") closeProject();
    if (action === "set-module") state.activeModule = element.dataset.module;
    if (action === "set-role") state.activeRole = element.value;
    if (action === "create-organization") await handleCreateOrganization();
    if (action === "select-organization") await handleSelectOrganization(element.dataset.id);
    if (action === "create-project") await handleCreateProject();
    if (action === "select-project") await handleSelectProject(element.dataset.id);
    if (action === "set-source") state.importSource = element.dataset.source;
    if (action === "parse-import") handleParseImport();
    if (action === "select-category") handleSelectCategory(element.dataset.category);
    if (action === "save-requirement") await handleSaveRequirement();
    if (action === "select-requirement") state.selectedRequirementId = element.dataset.id;
    if (action === "delete-requirement") await handleDeleteRequirement(element.dataset.id);
    if (action === "export-report") await handleExportReport();
  });
}

async function handleRequirementEdit(event) {
  const requirement = state.requirements.find((item) => item.id === event.target.dataset.id);
  if (!requirement) return;
  await runWithUi(async () => {
    await updateRequirement(requirement.id, {
      [event.target.dataset.editField]: event.target.value,
    });
    await loadRequirements();
    state.notice = `${requirement.requirement_code} updated.`;
  });
}

async function handleSignIn() {
  const values = getAuthValues();
  requireAuthFields(values, false);
  const result = await signInWithEmail(values.email, values.password);
  state.session = result.session;
  if (state.session?.user) {
    state.profile = await ensureProfile(state.session.user, values.fullName);
  }
  await loadWorkspace();
  state.notice = "Signed in.";
}

async function handleSignUp() {
  const values = getAuthValues();
  requireAuthFields(values, true);
  const result = await signUpWithEmail(values.email, values.password, values.fullName);
  state.session = result.session;
  if (state.session?.user) {
    state.profile = await ensureProfile(state.session.user, values.fullName);
    await loadWorkspace();
    state.notice = "Account created.";
  } else {
    state.notice = "Account created. Check Supabase email confirmation settings if sign-in is required.";
  }
}

async function handleSignOut() {
  await signOut();
  state.session = null;
  state.profile = null;
  state.organizations = [];
  state.projects = [];
  state.requirements = [];
  state.selectedOrganization = null;
  state.selectedProject = null;
}

async function handleCreateOrganization() {
  const name = getFieldValue("organizationName");
  if (!name) throw new Error("Organization name is required.");
  state.selectedOrganization = await createOrganization(name, getFieldValue("organizationDescription"));
  state.activeRole = state.selectedOrganization.role ?? "Admin";
  await loadWorkspace();
  state.notice = `${name} organization created.`;
}

async function handleSelectOrganization(id) {
  state.selectedOrganization = state.organizations.find((organization) => organization.id === id) ?? null;
  state.activeRole = state.selectedOrganization?.role ?? state.activeRole;
  state.selectedProject = null;
  await loadProjects();
}

async function handleCreateProject() {
  if (!state.selectedOrganization) throw new Error("Select an organization first.");
  const name = getFieldValue("projectName");
  if (!name) throw new Error("Project name is required.");
  state.selectedProject = await createProject(
    state.selectedOrganization.id,
    name,
    getFieldValue("projectDescription"),
  );
  await loadProjects();
  state.activeModule = "dashboard";
  state.notice = `${name} project created.`;
}

async function handleSelectProject(id) {
  state.selectedProject = state.projects.find((project) => project.id === id) ?? null;
  state.activeModule = "dashboard";
  await loadRequirements();
}

function closeProject() {
  state.selectedProject = null;
  state.requirements = [];
  state.activeModule = "dashboard";
}

function handleSelectCategory(category) {
  state.selectedCategory = category;
  state.templateValues = getDefaultTemplateValues(category);
}

function handleParseImport() {
  const parsers = {
    Paste: () => parsePastedRequirements(state.importText),
    TXT: () => parseTxtRequirements(state.importText),
    CSV: () => parseCsvRequirements(state.importText),
    DOCX: () => parseDocxRequirements(),
  };
  const result = (parsers[state.importSource] ?? parsers.Paste)();
  state.importCandidates = result.candidates;
  state.notice = result.warnings[0] ?? `${result.candidates.length} candidate(s) ready for review.`;
}

async function handleSaveRequirement() {
  if (!state.selectedOrganization || !state.selectedProject) {
    throw new Error("Select an organization and project before saving requirements.");
  }

  const formalStatement = buildTemplateStatement(state.selectedCategory, state.templateValues);
  const validation = validateRequirementWriting(formalStatement);
  const suggestion = suggestSmartCategory(formalStatement);
  const nextCode = `REQ-${String(state.requirements.length + 1).padStart(3, "0")}`;
  const payload = {
    organization_id: state.selectedOrganization.id,
    project_id: state.selectedProject.id,
    requirement_code: nextCode,
    title: state.templateValues.specificSubjectName,
    human_summary: buildHumanSummary(state.templateValues),
    formal_statement: formalStatement,
    software_name: state.templateValues.softwareName,
    obligation: state.templateValues.obligation,
    relation_verb: state.templateValues.relationVerb,
    generic_subject: state.templateValues.genericSubject,
    specific_subject_name: state.templateValues.specificSubjectName,
    specific_subject_statement: state.templateValues.specificSubjectStatement,
    specific_subject_model: state.templateValues.specificSubjectModel,
    suggested_subject: suggestion.subject,
    suggested_category: suggestion.category,
    final_subject: state.selectedCategory,
    final_category: suggestion.category,
    priority: state.templateValues.priority,
    status: validation.isValid ? state.templateValues.status : "Under Review",
    source_type: state.templateValues.sourceType,
    validation_state: validation.warnings.length ? "Warnings" : "Valid",
    validation_warnings: validation.warnings,
    notes: state.templateValues.notes,
  };

  const saved = await createRequirement(payload);
  await loadRequirements();
  state.selectedRequirementId = saved.id;
  state.notice = `${saved.requirement_code} saved to ${state.selectedProject.name}.`;
}

async function handleDeleteRequirement(id) {
  const requirement = state.requirements.find((item) => item.id === id);
  if (!requirement) return;
  await deleteRequirement(requirement);
  await loadRequirements();
  state.selectedRequirementId = "";
  state.notice = `${requirement.requirement_code} deleted.`;
}

async function handleExportReport() {
  const requirements = state.reportScope === "Filtered" ? getFilteredRequirements() : state.requirements;
  const payload = {
    organization: state.selectedOrganization,
    project: state.selectedProject,
    requirements,
  };
  const baseName = `${slugify(state.selectedProject.name)}-requirements`;

  if (state.reportFormat === "XML") {
    downloadTextFile(`${baseName}.xml`, buildRequirementsXml(payload), "application/xml;charset=utf-8");
  }
  if (state.reportFormat === "PDF") {
    downloadTextFile(`${baseName}.html`, buildPdfHtml(payload), "text/html;charset=utf-8");
  }
  if (state.reportFormat === "DOCX") {
    downloadTextFile(`${baseName}.doc`, buildDocxHtml(payload), "application/msword;charset=utf-8");
  }

  await createReport({
    organization_id: state.selectedOrganization.id,
    project_id: state.selectedProject.id,
    name: `${state.reportScope} ${state.reportFormat} export`,
    report_type: state.reportScope,
    export_format: state.reportFormat,
    filters: state.filters,
  });
  state.notice = `${state.reportFormat} report generated.`;
}

async function refreshAll() {
  if (state.session) {
    await loadWorkspace();
    state.notice = "Workspace refreshed.";
  }
}

function getFilteredRequirements() {
  const domainRequirements = mapRequirementsForDomain(state.requirements);
  const filteredDomain = filterRequirements(domainRequirements, {
    keyword: state.filters.keyword,
    project: state.selectedProject?.name ?? "",
    subject: state.filters.subject,
    priority: state.filters.priority,
    status: state.filters.status,
  });
  const ids = new Set(filteredDomain.map((requirement) => requirement.id));
  return state.requirements.filter((requirement) => {
    const categoryMatch = !state.filters.category || requirement.final_category === state.filters.category;
    const sourceMatch = !state.filters.sourceType || requirement.source_type === state.filters.sourceType;
    const validationMatch =
      !state.filters.validationState || requirement.validation_state === state.filters.validationState;
    return ids.has(requirement.id) && categoryMatch && sourceMatch && validationMatch;
  });
}

function mapRequirementsForDomain(requirements) {
  return requirements.map((requirement) => ({
    id: requirement.id,
    title: requirement.title,
    description: requirement.formal_statement,
    project: state.selectedProject?.name ?? "",
    subject: requirement.final_subject,
    category: requirement.final_category,
    priority: requirement.priority,
    status: requirement.status,
  }));
}

async function runWithUi(operation) {
  state.loading = true;
  state.error = "";
  render();
  try {
    await operation();
  } catch (error) {
    state.error = error.message ?? String(error);
  } finally {
    state.loading = false;
    render();
  }
}

function getAuthValues() {
  return {
    fullName: getAuthValue("fullName"),
    email: getAuthValue("email"),
    password: getAuthValue("password"),
  };
}

function requireAuthFields(values, fullNameRequired) {
  if (fullNameRequired && !values.fullName) throw new Error("Full name is required.");
  if (!values.email) throw new Error("Email is required.");
  if (!values.password) throw new Error("Password is required.");
}

function getAuthValue(name) {
  return root.querySelector(`[data-auth-field="${name}"]`)?.value.trim() ?? "";
}

function getFieldValue(name) {
  return root.querySelector(`[data-form-field="${name}"]`)?.value.trim() ?? "";
}

function slugify(value) {
  return String(value ?? "smart-s2d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
