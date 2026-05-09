import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SOFTWARE_REQUIREMENT_SUBJECTS,
  suggestSmartCategory,
  validateRequirementWriting,
} from "./smartRules.mjs";

describe("SMART software requirements taxonomy", () => {
  it("limits the active taxonomy to software requirement subjects", () => {
    assert.deepEqual(
      SOFTWARE_REQUIREMENT_SUBJECTS.map((subject) => subject.name),
      [
        "Functional requirements",
        "Data requirements",
        "User interface requirements",
        "Technical interface requirements",
      ],
    );
  });

  it("suggests Functional requirements from behavior verbs", () => {
    const suggestion = suggestSmartCategory(
      "The software shall verify user credentials during login.",
    );

    assert.equal(suggestion.subject, "Functional requirements");
    assert.equal(suggestion.category, "Authentication and processing");
    assert.ok(suggestion.confidence >= 0.7);
    assert.match(suggestion.reason, /verify/);
  });

  it("suggests Data requirements from persistence terms", () => {
    const suggestion = suggestSmartCategory(
      "The software shall store requirement metadata in the repository.",
    );

    assert.equal(suggestion.subject, "Data requirements");
    assert.equal(suggestion.category, "Storage and retrieval");
  });

  it("suggests User interface requirements from screen terms", () => {
    const suggestion = suggestSmartCategory(
      "The software shall display categorized requirements on the dashboard.",
    );

    assert.equal(suggestion.subject, "User interface requirements");
    assert.equal(suggestion.category, "Presentation and navigation");
  });

  it("suggests Technical interface requirements from integration terms", () => {
    const suggestion = suggestSmartCategory(
      "The software shall integrate with an external REST API.",
    );

    assert.equal(suggestion.subject, "Technical interface requirements");
    assert.equal(suggestion.category, "External integration");
  });
});

describe("guided requirement writing validation", () => {
  it("accepts a clear SMART-compatible shall statement", () => {
    const result = validateRequirementWriting(
      "The software shall retrieve filtered requirements by project.",
    );

    assert.equal(result.isValid, true);
    assert.deepEqual(result.warnings, []);
  });

  it("accepts a DS0-style software subject template statement", () => {
    const result = validateRequirementWriting(
      'The "SMART-S2D" software shall ensure "Data" "requirement metadata" described as follows: "store priority and status" according to the model: "repository model".',
    );

    assert.equal(result.isValid, true);
    assert.deepEqual(result.warnings, []);
  });

  it("warns when a requirement is vague, short, and missing a shall pattern", () => {
    const result = validateRequirementWriting("Make it better.");

    assert.equal(result.isValid, false);
    assert.deepEqual(result.warnings, [
      'Use a required pattern: The software shall [action] [target/object], or The "[software_name]" software shall [action] "[subject]".',
      "Requirement is too short to be reviewable.",
      "Avoid vague wording such as better, easy, fast, user-friendly, or etc.",
      "Add a concrete action verb such as verify, store, display, retrieve, or integrate.",
    ]);
  });

  it("warns when one statement appears to contain unrelated actions", () => {
    const result = validateRequirementWriting(
      "The software shall verify user credentials and display a dashboard and export a PDF report.",
    );

    assert.equal(result.isValid, false);
    assert.ok(
      result.warnings.includes(
        "Split multiple unrelated actions into separate atomic requirements.",
      ),
    );
  });
});
