import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  REQUIREMENT_TAXONOMIES,
  SOFTWARE_CATEGORY_TEMPLATES,
  buildTemplateStatement,
  getDefaultTemplateValues,
} from "./workflowModel.mjs";

describe("workspace taxonomy workflow", () => {
  it("keeps Software active and future taxonomy branches disabled", () => {
    assert.deepEqual(
      REQUIREMENT_TAXONOMIES.map((taxonomy) => ({
        id: taxonomy.id,
        enabled: taxonomy.enabled,
      })),
      [
        { id: "software", enabled: true },
        { id: "operation", enabled: false },
        { id: "development", enabled: false },
      ],
    );
  });

  it("provides one writing template for each software requirement category", () => {
    assert.deepEqual(Object.keys(SOFTWARE_CATEGORY_TEMPLATES), [
      "Functional requirements",
      "Data requirements",
      "User interface requirements",
      "Technical interface requirements",
    ]);
  });

  it("builds the formal supervisor-approved template statement from selected fields", () => {
    const values = getDefaultTemplateValues("Technical interface requirements");
    const statement = buildTemplateStatement("Technical interface requirements", {
      ...values,
      softwareName: "SMART-S2D",
      obligation: "shall",
      relationVerb: "ensure",
      genericSubject: "Technical Interface",
      specificSubjectName: "Supabase Auth",
      specificSubjectStatement: "authenticate users through secure tokens",
      specificSubjectModel: "OAuth-based Supabase authentication model",
    });

    assert.equal(
      statement,
      'The "SMART-S2D" software shall ensure "Technical Interface" "Supabase Auth" described as follows: "authenticate users through secure tokens" according to the model: "OAuth-based Supabase authentication model".',
    );
  });
});
