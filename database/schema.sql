create extension if not exists "pgcrypto";

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('Admin', 'Analyst', 'Software User', 'Project Manager')),
  description text not null default ''
);

create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  supabase_user_id uuid not null unique,
  role_id uuid not null references roles(id),
  full_name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'Active',
  owner_id uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table taxonomy_subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0
);

create table taxonomy_categories (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references taxonomy_subjects(id) on delete cascade,
  parent_id uuid references taxonomy_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  unique (subject_id, parent_id, name)
);

create table requirements (
  id uuid primary key default gen_random_uuid(),
  requirement_code text not null unique,
  title text not null,
  description text not null,
  requirement_type text not null default 'Endogenous',
  project_id uuid references projects(id),
  suggested_subject_id uuid references taxonomy_subjects(id),
  suggested_category_id uuid references taxonomy_categories(id),
  final_subject_id uuid references taxonomy_subjects(id),
  final_category_id uuid references taxonomy_categories(id),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Draft' check (status in ('Draft', 'Under Review', 'Categorized', 'Approved', 'Rejected')),
  notes text not null default '',
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table requirement_versions (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  version_number integer not null,
  title text not null,
  description text not null,
  final_subject_id uuid references taxonomy_subjects(id),
  final_category_id uuid references taxonomy_categories(id),
  changed_by uuid references user_profiles(id),
  change_reason text not null default '',
  created_at timestamptz not null default now(),
  unique (requirement_id, version_number)
);

create table requirement_category_links (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references requirements(id) on delete cascade,
  category_id uuid not null references taxonomy_categories(id) on delete cascade,
  relationship_type text not null default 'final',
  created_at timestamptz not null default now(),
  unique (requirement_id, category_id, relationship_type)
);

create table requirement_refinements (
  id uuid primary key default gen_random_uuid(),
  parent_requirement_id uuid not null references requirements(id) on delete cascade,
  child_requirement_id uuid not null references requirements(id) on delete cascade,
  refinement_note text not null default '',
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  unique (parent_requirement_id, child_requirement_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  report_type text not null check (report_type in ('Individual', 'Project', 'Filtered', 'Categorized')),
  export_format text not null check (export_format in ('XML', 'PDF', 'DOCX')),
  filters jsonb not null default '{}'::jsonb,
  generated_by uuid references user_profiles(id),
  generated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references user_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

insert into taxonomy_subjects (code, name, description, sort_order) values
  ('functional', 'Functional requirements', 'Behavior the software must perform.', 1),
  ('data', 'Data requirements', 'Data the software must store, manage, retrieve, or preserve.', 2),
  ('user-interface', 'User interface requirements', 'Screens, controls, navigation, and visual feedback.', 3),
  ('technical-interface', 'Technical interface requirements', 'APIs, integrations, protocols, and external communication.', 4);
