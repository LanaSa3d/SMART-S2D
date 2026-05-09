import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  connectOrganization,
  createFile,
  openFile,
  saveRequirement,
  selectCategory,
  selectProject,
  selectTaxonomy,
  useVerb,
} from "./appState.mjs";
import { getDefaultTemplateValues } from "./workflowModel.mjs";

const projects = [
  { id: "proj-1", name: "SMART Repository", organization: "Lab", updatedAt: "Today", requirements: 2 },
  { id: "proj-2", name: "Academic Demo", organization: "Team", updatedAt: "Yesterday", requirements: 1 },
];

const baseState = {
  selectedProject: projects[0],
  selectedTaxonomy: "software",
  selectedCategory: "Functional requirements",
  templateValues: getDefaultTemplateValues("Functional requirements"),
  filters: { keyword: "", subject: "", priority: "", status: "" },
  notice: "",
};

describe("workspace app state actions", () => {
  it("creates a new project file and selects it", () => {
    const result = createFile(baseState, projects);

    assert.equal(result.projects[0].name, "Untitled SMART File 3");
    assert.equal(result.state.selectedProject.id, "proj-3");
    assert.equal(result.state.notice, "New SMART file created.");
  });

  it("opens the most recent project file", () => {
    const result = openFile({ ...baseState, selectedProject: projects[1] }, projects);

    assert.equal(result.selectedProject.id, "proj-1");
    assert.equal(result.notice, "Opened the most recent SMART file.");
  });

  it("selects a project from recent files", () => {
    const result = selectProject(baseState, projects, "proj-2");

    assert.equal(result.selectedProject.name, "Academic Demo");
  });

  it("keeps disabled future taxonomies inactive and shows a notice", () => {
    const result = selectTaxonomy(baseState, "operation");

    assert.equal(result.selectedTaxonomy, "software");
    assert.equal(result.notice, "Operation requirements will be available in a future version.");
  });

  it("selects a software category and loads its template defaults", () => {
    const result = selectCategory(baseState, "Data requirements");

    assert.equal(result.selectedCategory, "Data requirements");
    assert.equal(result.templateValues.goalStatement, "store");
  });

  it("updates the template verb from suggested verbs", () => {
    const result = useVerb(baseState, "calculate");

    assert.equal(result.templateValues.goalStatement, "calculate");
  });

  it("saves a generated requirement to the selected project", () => {
    const result = saveRequirement(baseState, []);

    assert.equal(result.requirements[0].id, "REQ-001");
    assert.equal(result.requirements[0].project, "SMART Repository");
    assert.equal(result.requirements[0].subject, "Functional requirements");
    assert.equal(result.state.notice, "REQ-001 saved to SMART Repository.");
  });

  it("shows an organization connection notice", () => {
    const result = connectOrganization(baseState);

    assert.equal(result.notice, "Organization connection is prepared for the Supabase Auth phase.");
  });
});
