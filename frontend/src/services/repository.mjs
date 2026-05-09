import { getSupabaseClient } from "./supabaseClient.mjs";

export async function getSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  throwIfError(error);
  return data.session;
}

export async function signInWithEmail(email, password) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  throwIfError(error);
  return data;
}

export async function signUpWithEmail(email, password, fullName) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  throwIfError(error);
  if (data.user && data.session) {
    await ensureProfile(data.user, fullName);
  }
  return data;
}

export async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  throwIfError(error);
}

export async function ensureProfile(user, fullName = "") {
  const client = getSupabaseClient();
  const profile = {
    id: user.id,
    full_name: fullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
    email: user.email ?? "",
  };
  const { data, error } = await client.from("profiles").upsert(profile).select().single();
  throwIfError(error);
  return data;
}

export async function listOrganizations() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("organization_members")
    .select("role, organizations(*)")
    .order("created_at", { ascending: true });
  throwIfError(error);

  return (data ?? []).map((row) => ({
    ...row.organizations,
    role: row.role,
  }));
}

export async function createOrganization(name, description = "") {
  const client = getSupabaseClient();
  const user = await getCurrentUser();
  await ensureProfile(user);

  const { data: organization, error: organizationError } = await client
    .from("organizations")
    .insert({ name, description, created_by: user.id })
    .select()
    .single();
  throwIfError(organizationError);

  const { error: memberError } = await client.from("organization_members").insert({
    organization_id: organization.id,
    user_id: user.id,
    role: "Admin",
  });
  throwIfError(memberError);

  return { ...organization, role: "Admin" };
}

export async function listProjects(organizationId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function createProject(organizationId, name, description = "") {
  const client = getSupabaseClient();
  const user = await getCurrentUser();
  const { data, error } = await client
    .from("projects")
    .insert({ organization_id: organizationId, name, description, created_by: user.id })
    .select()
    .single();
  throwIfError(error);
  await writeAuditLog({
    organization_id: organizationId,
    project_id: data.id,
    action: "create",
    entity_type: "project",
    entity_id: data.id,
    after_data: data,
  });
  return data;
}

export async function listRequirements(projectId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("requirements")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function createRequirement(payload) {
  const client = getSupabaseClient();
  const user = await getCurrentUser();
  const { data, error } = await client
    .from("requirements")
    .insert({ ...payload, created_by: user.id })
    .select()
    .single();
  throwIfError(error);
  await writeAuditLog({
    organization_id: data.organization_id,
    project_id: data.project_id,
    action: "create",
    entity_type: "requirement",
    entity_id: data.id,
    after_data: data,
  });
  return data;
}

export async function updateRequirement(id, payload) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("requirements")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  throwIfError(error);
  await writeAuditLog({
    organization_id: data.organization_id,
    project_id: data.project_id,
    action: "update",
    entity_type: "requirement",
    entity_id: data.id,
    after_data: data,
  });
  return data;
}

export async function deleteRequirement(requirement) {
  const client = getSupabaseClient();
  const { error } = await client.from("requirements").delete().eq("id", requirement.id);
  throwIfError(error);
  await writeAuditLog({
    organization_id: requirement.organization_id,
    project_id: requirement.project_id,
    action: "delete",
    entity_type: "requirement",
    entity_id: requirement.id,
    after_data: requirement,
  });
}

export async function createReport(payload) {
  const client = getSupabaseClient();
  const user = await getCurrentUser();
  const { data, error } = await client
    .from("reports")
    .insert({ ...payload, generated_by: user.id })
    .select()
    .single();
  throwIfError(error);
  return data;
}

export async function writeAuditLog(payload) {
  const client = getSupabaseClient();
  const user = await getCurrentUser();
  const { error } = await client.from("audit_logs").insert({
    ...payload,
    actor_id: user.id,
  });
  throwIfError(error);
}

async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  throwIfError(error);
  if (!data.user) {
    throw new Error("You must be signed in to continue.");
  }
  return data.user;
}

function throwIfError(error) {
  if (error) {
    throw new Error(error.message ?? "Supabase request failed.");
  }
}
