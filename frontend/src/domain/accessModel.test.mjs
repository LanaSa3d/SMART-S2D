import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canCreateProject,
  canManageOrganization,
  canManageRequirements,
  canManageUsers,
  canViewRequirement,
  generateInviteCode,
  normalizeInviteCode,
} from "./accessModel.mjs";

describe("role based organization access", () => {
  it("generates numeric six digit organization invite codes", () => {
    const code = generateInviteCode(() => 0.123456);

    assert.equal(code, "123456");
    assert.equal(normalizeInviteCode(" 123-456 "), "123456");
  });

  it("keeps organization and user management with admins and project managers", () => {
    assert.equal(canManageOrganization("Admin"), true);
    assert.equal(canManageOrganization("Project Manager"), true);
    assert.equal(canManageOrganization("Analyst"), false);
    assert.equal(canManageUsers("Admin"), true);
    assert.equal(canManageUsers("Project Manager"), true);
    assert.equal(canManageUsers("Software User"), false);
  });

  it("allows analysts to manage requirements but not projects", () => {
    assert.equal(canManageRequirements("Analyst"), true);
    assert.equal(canCreateProject("Analyst"), false);
    assert.equal(canCreateProject("Project Manager"), true);
    assert.equal(canCreateProject("Admin"), true);
  });

  it("limits software users to their own requirements", () => {
    const ownRequirement = { created_by: "user-1" };
    const otherRequirement = { created_by: "user-2" };

    assert.equal(canViewRequirement("Software User", ownRequirement, "user-1"), true);
    assert.equal(canViewRequirement("Software User", otherRequirement, "user-1"), false);
    assert.equal(canViewRequirement("Analyst", otherRequirement, "user-1"), true);
  });
});
