import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseCsvRequirements,
  parseDocxRequirements,
  parsePastedRequirements,
  parseTxtRequirements,
} from "./importModel.mjs";

describe("requirement import candidates", () => {
  it("splits pasted numbered text into reviewable candidates", () => {
    const result = parsePastedRequirements(`
      1. The software shall verify user credentials.
      2. The software shall store requirement metadata.
    `);

    assert.equal(result.warnings.length, 0);
    assert.deepEqual(
      result.candidates.map((candidate) => candidate.tempId),
      ["CAND-001", "CAND-002"],
    );
    assert.equal(result.candidates[0].title, "Verify user credentials");
    assert.equal(result.candidates[0].sourceType, "Paste");
  });

  it("splits txt content by non-empty lines", () => {
    const result = parseTxtRequirements(
      "The software shall display taxonomy categories.\n\nThe software shall export XML reports.",
      "requirements.txt",
    );

    assert.deepEqual(
      result.candidates.map((candidate) => candidate.sourceName),
      ["requirements.txt", "requirements.txt"],
    );
  });

  it("parses csv rows with title and statement columns", () => {
    const result = parseCsvRequirements(
      "title,statement\nAuthentication,The software shall verify users.\nRepository,The software shall store requirements.",
    );

    assert.equal(result.candidates.length, 2);
    assert.equal(result.candidates[0].title, "Authentication");
    assert.equal(result.candidates[0].rawText, "The software shall verify users.");
    assert.equal(result.candidates[0].sourceType, "CSV");
  });

  it("returns an explicit docx parser warning until docx extraction is implemented", () => {
    const result = parseDocxRequirements();

    assert.deepEqual(result.candidates, []);
    assert.deepEqual(result.warnings, [
      "DOCX import review is planned for the next parser slice.",
    ]);
  });
});
