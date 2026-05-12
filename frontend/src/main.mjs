import { hasSupabaseConfig } from "./config.mjs";
import {
  canCreateProject,
  canEditRequirement,
  canManageOrganization,
  canManageProject,
  canManageUsers,
  normalizeInviteCode,
} from "./domain/accessModel.mjs";
import { buildDashboardSummary, filterRequirements } from "./domain/dashboardModel.mjs";
import { REQUIREMENT_PRIORITIES, REQUIREMENT_STATUSES, SOURCE_TYPES } from "./domain/entities.mjs";
import { buildDocxHtml, buildRequirementsXml } from "./domain/exportModel.mjs";
import { parseDocxRequirements, parsePastedRequirements, parseTxtRequirements } from "./domain/importModel.mjs";
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
  addOrganizationMemberByEmail,
  createOrganization,
  createProject,
  createReport,
  createRequirement,
  deleteOrganization,
  deleteProject,
  deleteRequirement,
  ensureProfile,
  getSession,
  joinOrganizationByCode,
  listOrganizationMembers,
  listOrganizations,
  listProjects,
  listRequirements,
  regenerateOrganizationInviteCode,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateOrganization,
  updateProject,
  updateRequirement,
} from "./services/repository.mjs";

const root = document.getElementById("root");

const MODULES = [
  ["dashboard", "Dashboard"],
  ["wizard", "SMART Requirement Template"],
  ["requirements", "Requirements"],
  ["taxonomy", "Taxonomy"],
  ["search", "Search"],
  ["reports", "Reports"],
  ["settings", "Admin/Settings"],
];

const SOURCE_LABELS = {
  Manual: "Form editor",
  Paste: "Text editor",
  TXT: "Import XML",
  DOCX: "Import DOCX",
};

const SUBJECT_LABELS = {
  "Functional requirements": "Function requirements",
  "Data requirements": "Data requirements",
  "User interface requirements": "User Interface requirements",
  "Technical interface requirements": "Technical Interface requirements",
};

const state = {
  initialized: false,
  loading: false,
  session: null,
  profile: null,
  organizations: [],
  selectedOrganization: null,
  organizationMembers: [],
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
  editingRequirementId: "",
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
    state.organizationMembers = [];
    return;
  }

  state.organizationMembers = canManageUsers(state.selectedOrganization.role)
    ? await listOrganizationMembers(state.selectedOrganization.id)
    : [];
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
        <p class="muted">Sign in or create an account to manage companies, projects, and SMART/R2F requirements.</p>
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
        <div class="section-title">Company</div>
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
        <span class="role-chip">${escapeHtml(state.activeRole)}</span>
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
  const canManageOrg = canManageOrganization(state.selectedOrganization?.role);
  const canCreateProjects = canCreateProject(state.selectedOrganization?.role);
  return `
    <section class="workspace-grid">
      <article class="panel hero-panel">
        <p class="eyebrow">Start here</p>
        <h2>Create, join, or open a SMART-S2D company.</h2>
      </article>

      <article class="panel">
        <div class="section-heading">
          <h2>Companies</h2>
          <span class="count-pill">${state.organizations.length}</span>
        </div>
        <div class="split-stack">
          <form class="stack-form">
            <input data-form-field="organizationName" placeholder="Company name" />
            <input data-form-field="organizationDescription" placeholder="Description" />
            <button class="primary-button" data-action="create-organization" type="button">Create company</button>
          </form>
          <form class="stack-form">
            <input data-form-field="inviteCode" inputmode="numeric" maxlength="6" placeholder="6 digit invite code" />
            <button class="secondary-button" data-action="join-organization" type="button">Join company</button>
          </form>
        </div>
        <div class="list-stack">
          ${state.organizations.map(renderOrganizationCard).join("") || `<p class="muted">No companies yet.</p>`}
        </div>
      </article>

      <article class="panel">
        <div class="section-heading">
          <h2>Projects</h2>
          <span class="count-pill">${state.projects.length}</span>
        </div>
        ${
          state.selectedOrganization && canCreateProjects
            ? `<form class="stack-form">
                <input data-form-field="projectName" placeholder="Project name" />
                <input data-form-field="projectDescription" placeholder="Description" />
                <button class="primary-button" data-action="create-project" type="button">Create project</button>
              </form>`
            : state.selectedOrganization
              ? `<p class="muted">Your current company role can view assigned work but cannot create projects.</p>`
            : `<p class="muted">Select or create a company first.</p>`
        }
        <div class="list-stack">
          ${state.projects.map(renderProjectCard).join("") || `<p class="muted">No projects yet.</p>`}
        </div>
        ${
          state.selectedProject && canManageProject(state.selectedOrganization?.role, state.selectedProject, state.session?.user?.id)
            ? `<form class="stack-form edit-block">
                <input data-form-field="projectUpdateName" value="${escapeHtml(state.selectedProject.name)}" placeholder="Project name" />
                <input data-form-field="projectUpdateDescription" value="${escapeHtml(state.selectedProject.description || "")}" placeholder="Description" />
                <select data-form-field="projectUpdateStatus">
                  ${["Active", "Archived"].map((status) => `<option ${state.selectedProject.status === status ? "selected" : ""}>${status}</option>`).join("")}
                </select>
                <button class="secondary-button" data-action="update-selected-project" type="button">Save project changes</button>
              </form>`
            : ""
        }
      </article>

      ${
        state.selectedOrganization
          ? `<article class="panel">
              <div class="section-heading">
                <div>
                  <p class="eyebrow">Company controls</p>
                  <h2>${escapeHtml(state.selectedOrganization.name)}</h2>
                </div>
                <span class="count-pill">${escapeHtml(state.selectedOrganization.role ?? "Member")}</span>
              </div>
              ${
                canManageOrg
                  ? renderOrganizationManagement()
                  : `<p class="muted">Managers control invite codes and membership. You can work only inside companies you created or joined.</p>`
              }
            </article>`
          : ""
      }
    </section>
  `;
}

function renderOrganizationCard(organization) {
  return `
    <article class="record-card ${state.selectedOrganization?.id === organization.id ? "selected" : ""}">
      <strong>${escapeHtml(organization.name)}</strong>
      <span>${escapeHtml(organization.description || "No description")}</span>
      <small>${escapeHtml(organization.role ?? "Member")} ${organization.invite_code ? `- Code ${escapeHtml(organization.invite_code)}` : ""}</small>
      <div class="button-row">
        <button class="tiny-button" data-action="select-organization" data-id="${organization.id}" type="button">Open</button>
        ${
          canManageOrganization(organization.role)
            ? `<button class="tiny-button" data-action="update-organization" data-id="${organization.id}" type="button">Update</button>
               <button class="tiny-button danger" data-action="delete-organization" data-id="${organization.id}" type="button">Delete</button>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderProjectCard(project) {
  const canManage = canManageProject(state.selectedOrganization?.role, project, state.session?.user?.id);
  return `
    <article class="record-card ${state.selectedProject?.id === project.id ? "selected" : ""}">
      <strong>${escapeHtml(project.name)}</strong>
      <span>${escapeHtml(project.description || "No description")}</span>
      <small>${escapeHtml(project.status)}</small>
      <div class="button-row">
        <button class="tiny-button" data-action="select-project" data-id="${project.id}" type="button">Open</button>
        ${
          canManage
            ? `<button class="tiny-button" data-action="update-project" data-id="${project.id}" type="button">Update</button>
               <button class="tiny-button danger" data-action="delete-project" data-id="${project.id}" type="button">Delete</button>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderOrganizationManagement() {
  return `
    <div class="management-grid">
      <form class="stack-form">
        <input data-form-field="organizationUpdateName" value="${escapeHtml(state.selectedOrganization.name)}" placeholder="Company name" />
        <input data-form-field="organizationUpdateDescription" value="${escapeHtml(state.selectedOrganization.description || "")}" placeholder="Description" />
        <button class="secondary-button" data-action="update-selected-organization" type="button">Save company changes</button>
      </form>
      <div class="invite-panel">
        <span>Invite code</span>
        <strong>${escapeHtml(state.selectedOrganization.invite_code ?? "------")}</strong>
        <button class="secondary-button" data-action="regenerate-invite-code" type="button">Generate new code</button>
      </div>
      <form class="stack-form">
        <input data-form-field="memberEmail" type="email" placeholder="Member email" />
        <select data-form-field="memberRole">
          ${["Project Manager", "Analyst", "Software User"].map((role) => `<option>${role}</option>`).join("")}
        </select>
        <button class="secondary-button" data-action="add-member" type="button">Add member</button>
      </form>
      <div class="member-list">
        ${state.organizationMembers.map((member) => `<div class="signal-row"><span>${escapeHtml(member.full_name || member.email)}</span><strong>${escapeHtml(member.role)}</strong></div>`).join("") || `<p class="muted">No members loaded.</p>`}
      </div>
    </div>
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
  const statusCounts = summary.byStatus;
  return `
    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Project dashboard</p>
          <h2>Requirement Distribution</h2>
        </div>
        <button class="primary-button" data-action="set-module" data-module="wizard">New requirement</button>
      </div>
      <div class="metric-grid">
        <article class="metric"><span>Total</span><strong>${summary.totalRequirements}</strong></article>
        <article class="metric"><span>Draft</span><strong>${statusCounts.Draft ?? 0}</strong></article>
        <article class="metric"><span>Need Review</span><strong>${statusCounts["Under Review"] ?? 0}</strong></article>
        <article class="metric"><span>Approved</span><strong>${statusCounts.Approved ?? 0}</strong></article>
        <article class="metric"><span>Rejected</span><strong>${statusCounts.Rejected ?? 0}</strong></article>
      </div>
      <div class="distribution-grid">
        ${Object.entries(summary.bySubject).map(([subject, count]) => `<div class="signal-row"><span>${escapeHtml(displaySubjectName(subject))}</span><strong>${count}</strong></div>`).join("") || `<p class="muted">No requirements yet.</p>`}
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
            <p class="eyebrow">SMART Requirement Template</p>
            <h2>Create or Import Requirement</h2>
          </div>
          <span class="count-pill">Software taxonomy</span>
        </div>
        <div class="source-grid">
          ${SOURCE_TYPES.map((source) => `<button class="source-card ${state.importSource === source ? "selected" : ""}" data-action="set-source" data-source="${source}">${escapeHtml(displaySourceName(source))}</button>`).join("")}
        </div>
        ${state.importSource === "Manual" ? "" : renderImportPanel()}
        <div class="taxonomy-strip">
          ${REQUIREMENT_TAXONOMIES.map((taxonomy) => `<span class="${taxonomy.enabled ? "active" : "locked"}">${escapeHtml(taxonomy.name)}</span>`).join("")}
        </div>
        <div class="category-grid">
          ${Object.entries(SOFTWARE_CATEGORY_TEMPLATES).map(
            ([category, template]) => `
              <button class="category-card ${state.selectedCategory === category ? "selected" : ""}" data-action="select-category" data-category="${category}">
                <strong>${escapeHtml(displaySubjectName(category))}</strong>
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
          <strong>${escapeHtml(displaySubjectName(suggestion.subject))}</strong>
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
      <textarea data-action="set-import-text" rows="5" placeholder="Text or import requirements here.">${escapeHtml(state.importText)}</textarea>
      <button class="secondary-button" data-action="parse-import">Review requirements</button>
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
      ${renderField("genericSubject", "Generic subject")}
      ${renderField("specificSubjectName", "Specific subject name")}
      ${renderField("specificSubjectStatement", "Specific subject statement", true)}
      ${renderField("specificSubjectModel", "Specific subject model")}
      ${renderSelect("priority", "Priority", REQUIREMENT_PRIORITIES)}
      ${renderSelect("status", "Status", REQUIREMENT_STATUSES)}
      ${renderSelect("sourceType", "Source type", SOURCE_TYPES, SOURCE_LABELS)}
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
  const canEdit = canEditRequirement(state.selectedOrganization?.role, requirement, state.session?.user?.id);
  return `
    <tr>
      <td>${escapeHtml(requirement.requirement_code)}</td>
      <td>${escapeHtml(requirement.title)}</td>
      <td>${escapeHtml(displaySubjectName(requirement.final_subject))}</td>
      <td>${escapeHtml(requirement.final_category)}</td>
      <td>${escapeHtml(requirement.priority)}</td>
      <td><span class="status-badge">${escapeHtml(requirement.status)}</span></td>
      <td>${escapeHtml(requirement.validation_state)}</td>
      <td>
        <button class="tiny-button" data-action="select-requirement" data-id="${requirement.id}">View</button>
        ${canEdit ? `<button class="tiny-button" data-action="edit-requirement" data-id="${requirement.id}">Edit</button>` : ""}
        ${canEdit ? `<button class="tiny-button danger" data-action="delete-requirement" data-id="${requirement.id}">Delete</button>` : ""}
      </td>
    </tr>
  `;
}

function renderSelectedRequirement() {
  const requirement = state.requirements.find((item) => item.id === state.selectedRequirementId);
  if (!requirement) return "";
  if (state.editingRequirementId === requirement.id) return renderRequirementEditForm(requirement);
  const canEdit = canEditRequirement(state.selectedOrganization?.role, requirement, state.session?.user?.id);

  return `
    <aside class="detail-panel">
      <p class="eyebrow">${escapeHtml(requirement.requirement_code)}</p>
      <h2>${escapeHtml(requirement.title)}</h2>
      <blockquote>${escapeHtml(requirement.formal_statement)}</blockquote>
      <div class="button-row">
        ${
          canEdit
            ? `<button class="secondary-button" data-action="edit-requirement" data-id="${requirement.id}" type="button">Edit requirement</button>`
            : ""
        }
        ${
          canEdit
            ? `<select data-edit-field="status" data-id="${requirement.id}">
                ${REQUIREMENT_STATUSES.map((status) => `<option ${requirement.status === status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
              <select data-edit-field="priority" data-id="${requirement.id}">
                ${REQUIREMENT_PRIORITIES.map((priority) => `<option ${requirement.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}
              </select>`
            : ""
        }
      </div>
    </aside>
  `;
}

function renderRequirementEditForm(requirement) {
  return `
    <aside class="detail-panel">
      <p class="eyebrow">Edit ${escapeHtml(requirement.requirement_code)}</p>
      <h2>Requirement editor</h2>
      <form class="template-form">
        ${renderRequirementEditField("title", "Title", requirement.title)}
        ${renderRequirementEditField("software_name", "Software name", requirement.software_name)}
        ${renderRequirementEditSelect("obligation", "Obligation", requirement.obligation, ["shall", "should", "must"])}
        ${renderRequirementEditSelect("relation_verb", "Relation verb", requirement.relation_verb, ["ensure", "require", "adopt"])}
        ${renderRequirementEditField("generic_subject", "Generic subject", requirement.generic_subject)}
        ${renderRequirementEditField("specific_subject_name", "Specific subject name", requirement.specific_subject_name)}
        ${renderRequirementEditField("specific_subject_statement", "Specific subject statement", requirement.specific_subject_statement, true)}
        ${renderRequirementEditField("specific_subject_model", "Specific subject model", requirement.specific_subject_model)}
        ${renderRequirementEditSelect("final_subject", "SMART subject", requirement.final_subject, Object.keys(SOFTWARE_CATEGORY_TEMPLATES), SUBJECT_LABELS)}
        ${renderRequirementEditField("final_category", "Final category", requirement.final_category)}
        ${renderRequirementEditSelect("priority", "Priority", requirement.priority, REQUIREMENT_PRIORITIES)}
        ${renderRequirementEditSelect("status", "Status", requirement.status, REQUIREMENT_STATUSES)}
        ${renderRequirementEditSelect("source_type", "Source type", requirement.source_type, SOURCE_TYPES, SOURCE_LABELS)}
        ${renderRequirementEditField("notes", "Notes", requirement.notes, true)}
      </form>
      <div class="button-row">
        <button class="primary-button" data-action="save-requirement-edits" data-id="${requirement.id}" type="button">Ok</button>
        <button class="ghost-button" data-action="cancel-requirement-edit" type="button">Cancel</button>
      </div>
    </aside>
  `;
}

function renderRequirementEditField(name, label, value, textarea = false) {
  return `
    <label class="field ${textarea ? "full" : ""}">
      <span>${label}</span>
      ${textarea ? `<textarea data-requirement-field="${name}" rows="3">${escapeHtml(value ?? "")}</textarea>` : `<input data-requirement-field="${name}" value="${escapeHtml(value ?? "")}" />`}
    </label>
  `;
}

function renderRequirementEditSelect(name, label, value, options, labels = {}) {
  return `
    <label class="field">
      <span>${label}</span>
      <select data-requirement-field="${name}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(labels[option] ?? option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderFilters() {
  return `
    <div class="filters">
      <label class="field"><span>Keyword</span><input data-filter="keyword" value="${escapeHtml(state.filters.keyword)}" /></label>
      ${renderFilterSelect("subject", "Subject", ["", ...Object.keys(SOFTWARE_CATEGORY_TEMPLATES)], SUBJECT_LABELS)}
      ${renderFilterSelect("priority", "Priority", ["", ...REQUIREMENT_PRIORITIES])}
      ${renderFilterSelect("status", "Status", ["", ...REQUIREMENT_STATUSES])}
      ${renderFilterSelect("sourceType", "Source", ["", ...SOURCE_TYPES], SOURCE_LABELS)}
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
        ${bySubject.map((item) => `<div class="tree-leaf"><span>${escapeHtml(displaySubjectName(item.subject))}</span><strong>${item.count}</strong></div>`).join("")}
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
        ${renderReportSelect("reportFormat", "Format", ["XML", "DOCX"])}
        ${renderReportSelect("reportScope", "Scope", ["Project", "Filtered"])}
      </div>
      <button class="primary-button" data-action="export-report">Export</button>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="panel">
      <p class="eyebrow">Admin/Settings</p>
      <h2>Company controls</h2>
      <p class="muted">Full member and taxonomy management arrives in the next depth slice. Current role: ${escapeHtml(state.activeRole)}.</p>
      <div class="signal-row"><span>Company</span><strong>${escapeHtml(state.selectedOrganization?.name)}</strong></div>
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

function renderSelect(name, label, options, labels = {}) {
  const value = state.templateValues[name] ?? "";
  return `
    <label class="field">
      <span>${label}</span>
      <select data-template-field="${name}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(labels[option] ?? option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderFilterSelect(name, label, options, labels = {}) {
  const value = state.filters[name] ?? "";
  return `
    <label class="field">
      <span>${label}</span>
      <select data-filter="${name}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option ? labels[option] ?? option : "All")}</option>`).join("")}
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
    if (element.tagName === "SELECT") {
      element.addEventListener("change", handleAction);
    } else {
      element.addEventListener("click", handleAction);
    }
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

  if (action === "sign-in" || action === "sign-up") {
    const authValues = getAuthValues();
    await runWithUi(async () => {
      if (action === "sign-in") await handleSignIn(authValues);
      if (action === "sign-up") await handleSignUp(authValues);
    });
    return;
  }

  if (
    [
      "create-organization",
      "create-project",
      "join-organization",
      "update-selected-organization",
      "add-member",
      "update-selected-project",
    ].includes(action)
  ) {
    const formValues = {
      organizationName: getFieldValue("organizationName"),
      organizationDescription: getFieldValue("organizationDescription"),
      organizationUpdateName: getFieldValue("organizationUpdateName"),
      organizationUpdateDescription: getFieldValue("organizationUpdateDescription"),
      inviteCode: getFieldValue("inviteCode"),
      memberEmail: getFieldValue("memberEmail"),
      memberRole: getFieldValue("memberRole"),
      projectName: getFieldValue("projectName"),
      projectDescription: getFieldValue("projectDescription"),
      projectUpdateName: getFieldValue("projectUpdateName"),
      projectUpdateDescription: getFieldValue("projectUpdateDescription"),
      projectUpdateStatus: getFieldValue("projectUpdateStatus"),
    };
    await runWithUi(async () => {
      if (action === "create-organization") await handleCreateOrganization(formValues);
      if (action === "create-project") await handleCreateProject(formValues);
      if (action === "join-organization") await handleJoinOrganization(formValues);
      if (action === "update-selected-organization") await handleUpdateSelectedOrganization(formValues);
      if (action === "add-member") await handleAddMember(formValues);
      if (action === "update-selected-project") await handleUpdateSelectedProject(formValues);
    });
    return;
  }

  await runWithUi(async () => {
    if (action === "sign-out") await handleSignOut();
    if (action === "refresh") await refreshAll();
    if (action === "go-workspace") closeProject();
    if (action === "set-module") state.activeModule = element.dataset.module;
    if (action === "select-organization") await handleSelectOrganization(element.dataset.id);
    if (action === "update-organization") await handleSelectOrganization(element.dataset.id);
    if (action === "delete-organization") await handleDeleteOrganization(element.dataset.id);
    if (action === "select-project") await handleSelectProject(element.dataset.id);
    if (action === "update-project") await handleSelectProject(element.dataset.id);
    if (action === "delete-project") await handleDeleteProject(element.dataset.id);
    if (action === "regenerate-invite-code") await handleRegenerateInviteCode();
    if (action === "set-source") state.importSource = element.dataset.source;
    if (action === "parse-import") handleParseImport();
    if (action === "select-category") handleSelectCategory(element.dataset.category);
    if (action === "save-requirement") await handleSaveRequirement();
    if (action === "select-requirement") state.selectedRequirementId = element.dataset.id;
    if (action === "edit-requirement") handleEditRequirement(element.dataset.id);
    if (action === "save-requirement-edits") await handleSaveRequirementEdits(element.dataset.id);
    if (action === "cancel-requirement-edit") state.editingRequirementId = "";
    if (action === "delete-requirement") await handleDeleteRequirement(element.dataset.id);
    if (action === "export-report") await handleExportReport();
  });
}

async function handleRequirementEdit(event) {
  const requirement = state.requirements.find((item) => item.id === event.target.dataset.id);
  if (!requirement) return;
  if (!canEditRequirement(state.selectedOrganization?.role, requirement, state.session?.user?.id)) {
    state.error = "You do not have permission to edit this requirement.";
    render();
    return;
  }
  await runWithUi(async () => {
    await updateRequirement(requirement.id, {
      [event.target.dataset.editField]: event.target.value,
    });
    await loadRequirements();
    state.notice = `${requirement.requirement_code} updated.`;
  });
}

async function handleSignIn(values) {
  requireAuthFields(values, false);
  const result = await signInWithEmail(values.email, values.password);
  state.session = result.session;
  if (state.session?.user) {
    state.profile = await ensureProfile(state.session.user, values.fullName);
  }
  await loadWorkspace();
  state.notice = "Signed in.";
}

async function handleSignUp(values) {
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

async function handleCreateOrganization(formValues) {
  const name = formValues.organizationName;
  if (!name) throw new Error("Company name is required.");
  state.selectedOrganization = await createOrganization(name, formValues.organizationDescription);
  state.activeRole = state.selectedOrganization.role ?? "Admin";
  await loadWorkspace();
  state.notice = `${name} company created.`;
}

async function handleJoinOrganization(formValues) {
  const inviteCode = normalizeInviteCode(formValues.inviteCode);
  if (inviteCode.length !== 6) throw new Error("Enter a valid 6 digit invite code.");
  state.selectedOrganization = await joinOrganizationByCode(inviteCode);
  if (!state.selectedOrganization) throw new Error("No company was joined.");
  state.activeRole = state.selectedOrganization.role ?? "Software User";
  state.selectedProject = null;
  await loadWorkspace();
  state.notice = `Joined ${state.selectedOrganization.name}.`;
}

async function handleSelectOrganization(id) {
  state.selectedOrganization = state.organizations.find((organization) => organization.id === id) ?? null;
  state.activeRole = state.selectedOrganization?.role ?? state.activeRole;
  state.selectedProject = null;
  await loadProjects();
}

async function handleUpdateSelectedOrganization(formValues) {
  if (!state.selectedOrganization) throw new Error("Select a company first.");
  if (!canManageOrganization(state.selectedOrganization.role)) {
    throw new Error("Only company managers can update company details.");
  }
  const name = formValues.organizationUpdateName;
  if (!name) throw new Error("Company name is required.");
  const updated = await updateOrganization(state.selectedOrganization.id, {
    name,
    description: formValues.organizationUpdateDescription,
  });
  state.selectedOrganization = { ...state.selectedOrganization, ...updated };
  await loadWorkspace();
  state.notice = `${name} company updated.`;
}

async function handleDeleteOrganization(id) {
  const organization = state.organizations.find((item) => item.id === id);
  if (!organization) return;
  if (!canManageOrganization(organization.role)) {
    throw new Error("Only company managers can delete companies.");
  }
  await deleteOrganization(organization);
  state.selectedOrganization = null;
  state.selectedProject = null;
  state.projects = [];
  state.requirements = [];
  await loadWorkspace();
  state.notice = `${organization.name} company deleted.`;
}

async function handleRegenerateInviteCode() {
  if (!state.selectedOrganization) throw new Error("Select a company first.");
  if (!canManageOrganization(state.selectedOrganization.role)) {
    throw new Error("Only company managers can generate invite codes.");
  }
  const inviteCode = await regenerateOrganizationInviteCode(state.selectedOrganization.id);
  state.selectedOrganization = { ...state.selectedOrganization, invite_code: inviteCode };
  await loadWorkspace();
  state.notice = `New invite code generated: ${inviteCode}.`;
}

async function handleAddMember(formValues) {
  if (!state.selectedOrganization) throw new Error("Select a company first.");
  if (!canManageUsers(state.selectedOrganization.role)) {
    throw new Error("Only company managers can add users.");
  }
  if (!formValues.memberEmail) throw new Error("Member email is required.");
  await addOrganizationMemberByEmail(
    state.selectedOrganization.id,
    formValues.memberEmail,
    formValues.memberRole || "Software User",
  );
  await loadProjects();
  state.notice = `${formValues.memberEmail} added as ${formValues.memberRole}.`;
}

async function handleCreateProject(formValues) {
  if (!state.selectedOrganization) throw new Error("Select a company first.");
  if (!canCreateProject(state.selectedOrganization.role)) {
    throw new Error("Only company managers can create projects.");
  }
  const name = formValues.projectName;
  if (!name) throw new Error("Project name is required.");
  state.selectedProject = await createProject(
    state.selectedOrganization.id,
    name,
    formValues.projectDescription,
  );
  await loadProjects();
  state.activeModule = "dashboard";
  state.notice = `${name} project created.`;
}

async function handleUpdateSelectedProject(formValues) {
  if (!state.selectedProject) throw new Error("Select a project first.");
  if (!canManageProject(state.selectedOrganization?.role, state.selectedProject, state.session?.user?.id)) {
    throw new Error("You do not have permission to update this project.");
  }
  const name = formValues.projectUpdateName;
  if (!name) throw new Error("Project name is required.");
  const updated = await updateProject(state.selectedProject.id, {
    name,
    description: formValues.projectUpdateDescription,
    status: formValues.projectUpdateStatus || "Active",
  });
  state.selectedProject = updated;
  await loadProjects();
  state.notice = `${name} project updated.`;
}

async function handleDeleteProject(id) {
  const project = state.projects.find((item) => item.id === id);
  if (!project) return;
  if (!canManageProject(state.selectedOrganization?.role, project, state.session?.user?.id)) {
    throw new Error("You do not have permission to delete this project.");
  }
  await deleteProject(project);
  if (state.selectedProject?.id === project.id) {
    state.selectedProject = null;
    state.requirements = [];
  }
  await loadProjects();
  state.notice = `${project.name} project deleted.`;
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
    DOCX: () => parseDocxRequirements(),
  };
  const result = (parsers[state.importSource] ?? parsers.Paste)();
  state.importCandidates = result.candidates;
  state.notice = result.warnings[0] ?? `${result.candidates.length} candidate(s) ready for review.`;
}

async function handleSaveRequirement() {
  if (!state.selectedOrganization || !state.selectedProject) {
    throw new Error("Select a company and project before saving requirements.");
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

function handleEditRequirement(id) {
  const requirement = state.requirements.find((item) => item.id === id);
  if (!requirement) return;
  if (!canEditRequirement(state.selectedOrganization?.role, requirement, state.session?.user?.id)) {
    throw new Error("You do not have permission to edit this requirement.");
  }
  state.selectedRequirementId = id;
  state.editingRequirementId = id;
}

async function handleSaveRequirementEdits(id) {
  const requirement = state.requirements.find((item) => item.id === id);
  if (!requirement) return;
  if (!canEditRequirement(state.selectedOrganization?.role, requirement, state.session?.user?.id)) {
    throw new Error("You do not have permission to edit this requirement.");
  }

  const values = getRequirementEditValues();
  const templateValues = {
    softwareName: values.software_name,
    obligation: values.obligation,
    relationVerb: values.relation_verb,
    genericSubject: values.generic_subject,
    specificSubjectName: values.specific_subject_name,
    specificSubjectStatement: values.specific_subject_statement,
    specificSubjectModel: values.specific_subject_model,
  };
  const formalStatement = buildTemplateStatement(values.final_subject, templateValues);
  const validation = validateRequirementWriting(formalStatement);
  const suggestion = suggestSmartCategory(formalStatement);

  await updateRequirement(requirement.id, {
    title: values.title,
    human_summary: buildHumanSummary(templateValues),
    formal_statement: formalStatement,
    software_name: values.software_name,
    obligation: values.obligation,
    relation_verb: values.relation_verb,
    generic_subject: values.generic_subject,
    specific_subject_name: values.specific_subject_name,
    specific_subject_statement: values.specific_subject_statement,
    specific_subject_model: values.specific_subject_model,
    suggested_subject: suggestion.subject,
    suggested_category: suggestion.category,
    final_subject: values.final_subject,
    final_category: values.final_category,
    priority: values.priority,
    status: validation.isValid ? values.status : "Under Review",
    source_type: values.source_type,
    validation_state: validation.warnings.length ? "Warnings" : "Valid",
    validation_warnings: validation.warnings,
    notes: values.notes,
  });
  await loadRequirements();
  state.selectedRequirementId = id;
  state.editingRequirementId = "";
  state.notice = `${requirement.requirement_code} updated.`;
}

async function handleDeleteRequirement(id) {
  const requirement = state.requirements.find((item) => item.id === id);
  if (!requirement) return;
  if (!canEditRequirement(state.selectedOrganization?.role, requirement, state.session?.user?.id)) {
    throw new Error("You do not have permission to delete this requirement.");
  }
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

function getRequirementEditValues() {
  const values = {};
  root.querySelectorAll("[data-requirement-field]").forEach((field) => {
    values[field.dataset.requirementField] = field.value.trim();
  });
  return values;
}

function displaySubjectName(subject) {
  return SUBJECT_LABELS[subject] ?? subject;
}

function displaySourceName(source) {
  return SOURCE_LABELS[source] ?? source;
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
