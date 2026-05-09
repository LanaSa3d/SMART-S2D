const MANAGEMENT_ROLES = new Set(["Admin", "Project Manager"]);
const REQUIREMENT_REVIEW_ROLES = new Set(["Admin", "Project Manager", "Analyst"]);

export function generateInviteCode(random = Math.random) {
  return String(Math.floor(random() * 1_000_000)).padStart(6, "0").slice(0, 6);
}

export function normalizeInviteCode(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

export function canManageOrganization(role) {
  return MANAGEMENT_ROLES.has(role);
}

export function canManageUsers(role) {
  return MANAGEMENT_ROLES.has(role);
}

export function canCreateProject(role) {
  return MANAGEMENT_ROLES.has(role);
}

export function canManageProject(role, project, userId) {
  return MANAGEMENT_ROLES.has(role) || project?.created_by === userId;
}

export function canManageRequirements(role) {
  return REQUIREMENT_REVIEW_ROLES.has(role);
}

export function canEditRequirement(role, requirement, userId) {
  return canManageRequirements(role) || requirement?.created_by === userId;
}

export function canViewRequirement(role, requirement, userId) {
  return canManageRequirements(role) || requirement?.created_by === userId;
}
