import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveRequestPath } from "./serverPaths.mjs";

describe("static server paths", () => {
  it("maps the root route to index.html under the frontend root", () => {
    const result = resolveRequestPath("C:\\project\\frontend", "/");

    assert.equal(result.safe, true);
    assert.equal(result.filePath, "C:\\project\\frontend\\index.html");
  });

  it("blocks path traversal outside the frontend root", () => {
    const result = resolveRequestPath("C:\\project\\frontend", "/../secret.txt");

    assert.equal(result.safe, false);
  });
});
