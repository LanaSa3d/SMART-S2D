create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('Admin', 'Analyst', 'Software User', 'Project Manager')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'Active' check (status in ('Active', 'Archived')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taxonomy_subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0
);

create table if not exists public.taxonomy_categories (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references public.taxonomy_subjects(code) on delete cascade,
  parent_id uuid references public.taxonomy_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  unique (subject_code, parent_id, name)
);

create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_code text not null,
  title text not null,
  human_summary text not null default '',
  formal_statement text not null,
  software_name text not null,
  obligation text not null check (obligation in ('shall', 'should', 'must')),
  relation_verb text not null check (relation_verb in ('ensure', 'require', 'adopt')),
  generic_subject text not null,
  specific_subject_name text not null,
  specific_subject_statement text not null,
  specific_subject_model text not null,
  suggested_subject text not null default '',
  suggested_category text not null default '',
  final_subject text not null default '',
  final_category text not null default '',
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Draft' check (status in ('Draft', 'Under Review', 'Categorized', 'Approved', 'Rejected')),
  source_type text not null default 'Manual' check (source_type in ('Manual', 'Paste', 'TXT', 'CSV', 'DOCX')),
  validation_state text not null default 'Valid' check (validation_state in ('Valid', 'Warnings', 'Blocked')),
  validation_warnings jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, requirement_code)
);

create table if not exists public.requirement_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  version_number integer not null,
  formal_statement text not null,
  changed_by uuid not null references public.profiles(id) on delete cascade,
  change_reason text not null default '',
  created_at timestamptz not null default now(),
  unique (requirement_id, version_number)
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text not null check (source_type in ('Paste', 'TXT', 'CSV', 'DOCX')),
  source_name text not null default '',
  candidate_count integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  report_type text not null check (report_type in ('Project', 'Filtered', 'Requirement', 'Categorized', 'User')),
  export_format text not null check (export_format in ('XML', 'PDF', 'DOCX')),
  filters jsonb not null default '{}'::jsonb,
  generated_by uuid not null references public.profiles(id) on delete cascade,
  generated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  after_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists requirements_set_updated_at on public.requirements;
create trigger requirements_set_updated_at
before update on public.requirements
for each row execute function public.set_updated_at();

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = org_id
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = org_id
      and member.user_id = auth.uid()
      and member.role = 'Admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.taxonomy_subjects enable row level security;
alter table public.taxonomy_categories enable row level security;
alter table public.requirements enable row level security;
alter table public.requirement_versions enable row level security;
alter table public.imports enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles own row" on public.profiles;
create policy "profiles own row" on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "members read organizations" on public.organizations;
create policy "members read organizations" on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists "authenticated create organizations" on public.organizations;
create policy "authenticated create organizations" on public.organizations
  for insert with check (created_by = auth.uid());

drop policy if exists "members update organizations" on public.organizations;
create policy "members update organizations" on public.organizations
  for update using (public.is_org_member(id));

drop policy if exists "members read memberships" on public.organization_members;
create policy "members read memberships" on public.organization_members
  for select using (public.is_org_member(organization_id) or user_id = auth.uid());

drop policy if exists "creator creates first membership" on public.organization_members;
create policy "creator creates first membership" on public.organization_members
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.organizations organization
      where organization.id = organization_id
        and organization.created_by = auth.uid()
    )
  );

drop policy if exists "admins manage memberships" on public.organization_members;
create policy "admins manage memberships" on public.organization_members
  for update using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

drop policy if exists "admins delete memberships" on public.organization_members;
create policy "admins delete memberships" on public.organization_members
  for delete using (public.is_org_admin(organization_id));

drop policy if exists "members read projects" on public.projects;
create policy "members read projects" on public.projects
  for select using (public.is_org_member(organization_id));

drop policy if exists "members create projects" on public.projects;
create policy "members create projects" on public.projects
  for insert with check (public.is_org_member(organization_id) and created_by = auth.uid());

drop policy if exists "members update projects" on public.projects;
create policy "members update projects" on public.projects
  for update using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "members delete projects" on public.projects;
create policy "members delete projects" on public.projects
  for delete using (public.is_org_member(organization_id));

drop policy if exists "authenticated read taxonomy subjects" on public.taxonomy_subjects;
create policy "authenticated read taxonomy subjects" on public.taxonomy_subjects
  for select using (auth.uid() is not null);

drop policy if exists "authenticated read taxonomy categories" on public.taxonomy_categories;
create policy "authenticated read taxonomy categories" on public.taxonomy_categories
  for select using (auth.uid() is not null);

drop policy if exists "members read requirements" on public.requirements;
create policy "members read requirements" on public.requirements
  for select using (public.is_org_member(organization_id));

drop policy if exists "members create requirements" on public.requirements;
create policy "members create requirements" on public.requirements
  for insert with check (public.is_org_member(organization_id) and created_by = auth.uid());

drop policy if exists "members update requirements" on public.requirements;
create policy "members update requirements" on public.requirements
  for update using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "members delete requirements" on public.requirements;
create policy "members delete requirements" on public.requirements
  for delete using (public.is_org_member(organization_id));

drop policy if exists "members manage versions" on public.requirement_versions;
create policy "members manage versions" on public.requirement_versions
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "members manage imports" on public.imports;
create policy "members manage imports" on public.imports
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "members manage reports" on public.reports;
create policy "members manage reports" on public.reports
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "members read audit logs" on public.audit_logs;
create policy "members read audit logs" on public.audit_logs
  for select using (organization_id is null or public.is_org_member(organization_id));

drop policy if exists "members create audit logs" on public.audit_logs;
create policy "members create audit logs" on public.audit_logs
  for insert with check (organization_id is null or public.is_org_member(organization_id));

insert into public.taxonomy_subjects (code, name, description, sort_order) values
  ('functional', 'Functional requirements', 'Behavior the software must perform for stakeholders.', 1),
  ('data', 'Data requirements', 'Data the software must store, manage, retrieve, or preserve.', 2),
  ('user-interface', 'User interface requirements', 'Screens, controls, navigation, and visual feedback.', 3),
  ('technical-interface', 'Technical interface requirements', 'APIs, integrations, protocols, and external software communication.', 4)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.taxonomy_categories (subject_code, name, description, sort_order) values
  ('functional', 'Authentication and processing', 'Authentication, validation, calculation, and business processing behavior.', 1),
  ('functional', 'Business rules', 'Rules and decisions the software must enforce.', 2),
  ('functional', 'Workflow automation', 'Steps, transitions, and automated operational behavior.', 3),
  ('data', 'Storage and retrieval', 'Persistent records, repositories, search, and retrieval.', 1),
  ('data', 'Metadata management', 'Requirement attributes, owners, versions, and classification metadata.', 2),
  ('data', 'Data quality', 'Integrity, completeness, and validation of stored data.', 3),
  ('user-interface', 'Presentation and navigation', 'Screens, menus, dashboards, and browsing structures.', 1),
  ('user-interface', 'Forms and input', 'Entry forms, validation messages, and user input controls.', 2),
  ('user-interface', 'Dashboards and visualization', 'Metrics, reports, summaries, and visual analytics.', 3),
  ('technical-interface', 'External integration', 'External services, APIs, and third-party connections.', 1),
  ('technical-interface', 'API contracts', 'Request/response formats and service boundaries.', 2),
  ('technical-interface', 'Authentication protocols', 'OAuth, tokens, sessions, and secure access exchange.', 3)
on conflict (subject_code, parent_id, name) do update set
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;
