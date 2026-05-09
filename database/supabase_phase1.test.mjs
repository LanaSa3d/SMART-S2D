import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const sql = await readFile(new URL("./supabase_phase1.sql", import.meta.url), "utf8");

describe("Supabase organization security schema", () => {
  it("stores unique six digit organization invite codes", () => {
    assert.match(sql, /invite_code text/i);
    assert.match(sql, /organizations_invite_code_key/i);
    assert.match(sql, /invite_code ~ '\^\[0-9\]\{6\}\$'/i);
  });

  it("joins organizations through a security definer invite-code function", () => {
    assert.match(sql, /create or replace function public\.join_organization_by_code/i);
    assert.match(sql, /language plpgsql/i);
    assert.match(sql, /security definer/i);
    assert.match(sql, /role\) values[\s\S]*'Software User'/i);
  });

  it("keeps project and requirement access scoped by role", () => {
    assert.match(sql, /create or replace function public\.can_manage_projects/i);
    assert.match(sql, /create or replace function public\.can_review_requirements/i);
    assert.match(sql, /created_by = auth\.uid\(\)/i);
  });
});
