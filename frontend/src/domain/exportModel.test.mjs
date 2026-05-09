import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDocxHtml, buildPdfHtml, buildRequirementsXml } from "./exportModel.mjs";

const payload = {
  organization: { name: "SMART Research & QA" },
  project: { name: "SMART-S2D <Pilot>" },
  requirements: [
    {
      requirement_code: "REQ-001",
      title: "Verify users",
      formal_statement:
        'The "SMART-S2D" software shall ensure "Function" "user authentication" described as follows: "verify authorized users" according to the model: "RBAC".',
      final_subject: "Functional requirements",
      final_category: "Authentication and processing",
      priority: "High",
      status: "Categorized",
      validation_state: "Valid",
    },
  ],
};

describe("requirement exports", () => {
  it("builds XML with escaped organization, project, and formal statement values", () => {
    const xml = buildRequirementsXml(payload);

    assert.match(xml, /<organization>SMART Research &amp; QA<\/organization>/);
    assert.match(xml, /<project>SMART-S2D &lt;Pilot&gt;<\/project>/);
    assert.match(xml, /&quot;SMART-S2D&quot;/);
  });

  it("builds printable PDF HTML report content", () => {
    const html = buildPdfHtml(payload);

    assert.match(html, /SMART-S2D Requirements Report/);
    assert.match(html, /REQ-001/);
    assert.match(html, /Authentication and processing/);
  });

  it("builds Word-compatible HTML report content", () => {
    const html = buildDocxHtml(payload);

    assert.match(html, /xmlns:o="urn:schemas-microsoft-com:office:office"/);
    assert.match(html, /SMART-S2D Requirements Report/);
    assert.match(html, /Verify users/);
  });
});
