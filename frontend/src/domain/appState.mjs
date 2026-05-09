import { suggestSmartCategory } from "./smartRules.mjs";
import {
  REQUIREMENT_TAXONOMIES,
  buildTemplateStatement,
  getDefaultTemplateValues,
} from "./workflowModel.mjs";

export function createFile(state, projects) {
  const nextProject = {
    id: `proj-${projects.length + 1}`,
    name: `Untitled SMART File ${projects.length + 1}`,
    organization: "SMART Research Lab",
    updatedAt: "Now",
    requirements: 0,
  };

  return {
    projects: [nextProject, ...projects],
    state: { ...state, selectedProject: nextProject, notice: "New SMART file created." },
  };
}

export function openFile(state, projects) {
  return {
    ...state,
    selectedProject: projects[0],
    notice: "Opened the most recent SMART file.",
  };
}

export function connectOrganization(state) {
  return {
    ...state,
    notice: "Organization connection is prepared for the Supabase Auth phase.",
  };
}

export function selectProject(state, projects, projectId) {
  return {
    ...state,
    selectedProject: projects.find((project) => project.id === projectId),
    notice: "",
  };
}

export function selectTaxonomy(state, taxonomyId) {
  const taxonomy = REQUIREMENT_TAXONOMIES.find((item) => item.id === taxonomyId);
  if (!taxonomy.enabled) {
    return {
      ...state,
      notice: `${taxonomy.name} will be available in a future version.`,
    };
  }

  return { ...state, selectedTaxonomy: taxonomy.id, notice: "" };
}

export function selectCategory(state, categoryName) {
  return {
    ...state,
    selectedCategory: categoryName,
    templateValues: getDefaultTemplateValues(categoryName),
    notice: "",
  };
}

export function useVerb(state, verb) {
  return {
    ...state,
    templateValues: { ...state.templateValues, relationVerb: verb, goalStatement: verb },
  };
}

export function saveRequirement(state, requirements) {
  const statement = buildTemplateStatement(state.selectedCategory, state.templateValues);
  const suggestion = suggestSmartCategory(statement);
  const subjectName =
    state.templateValues.specificSubjectName ?? state.templateValues.subjectName ?? "requirement";
  const relationVerb =
    state.templateValues.relationVerb ?? state.templateValues.goalStatement ?? "ensure";
  const nextRequirement = {
    id: `REQ-${String(requirements.length + 1).padStart(3, "0")}`,
    title: `${relationVerb} ${subjectName}`,
    description: statement,
    subject: state.selectedCategory,
    category: suggestion.category,
    project: state.selectedProject.name,
    priority: "Medium",
    status: "Categorized",
  };

  return {
    requirements: [nextRequirement, ...requirements],
    state: {
      ...state,
      notice: `${nextRequirement.id} saved to ${state.selectedProject.name}.`,
    },
  };
}
