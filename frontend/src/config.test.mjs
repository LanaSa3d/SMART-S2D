import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getAppConfig, hasSupabaseConfig } from "./config.mjs";

describe("app config", () => {
  afterEach(() => {
    delete globalThis.SMART_S2D_CONFIG;
  });

  it("reads Supabase settings from the browser global", () => {
    globalThis.SMART_S2D_CONFIG = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    };

    assert.deepEqual(getAppConfig(), {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    });
    assert.equal(hasSupabaseConfig(), true);
  });

  it("reports missing config when values are absent", () => {
    assert.equal(hasSupabaseConfig(), false);
  });
});
