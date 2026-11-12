import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveRequestPath } from "./serverPaths.mjs";

const indexHtml = await readFile(new URL("./index.html", import.meta.url), "utf8");
const productionConfig = await readFile(new URL("./src/env.production.js", import.meta.url), "utf8");

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

  it("loads a tracked Supabase production config without server secrets", () => {
    assert.match(indexHtml, /src\/env\.production\.js/);
    assert.doesNotMatch(indexHtml, /src\/env\.local\.js/);
    assert.match(productionConfig, /LOCAL_MODE:\s*false/);
    assert.match(productionConfig, /SUPABASE_URL:\s*"https:\/\/pfmbmfwtgiccjpopykqp\.supabase\.co"/);
    assert.match(productionConfig, /SUPABASE_ANON_KEY:\s*"sb_publishable_/);
    assert.doesNotMatch(productionConfig, /sb_secret_/);
  });
});
