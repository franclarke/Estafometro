create extension if not exists pgcrypto;

create type risk_level as enum ('low', 'medium', 'high', 'very_high');
create type case_status as enum ('received', 'processing', 'analyzed', 'partial', 'error', 'expired');
create type privacy_mode as enum ('minimal_retention', 'no_store_raw');
create type evidence_type as enum ('narrative', 'pasted_chat', 'screenshot', 'url', 'username', 'alias', 'phone', 'note');
create type entity_type as enum ('platform', 'business_name', 'instagram_handle', 'url', 'domain', 'alias', 'cbu', 'phone', 'authority', 'bank', 'product', 'payment_method', 'marketplace');
create type signal_severity as enum ('info', 'low', 'medium', 'high', 'critical');
create type check_type as enum ('platform_bypass', 'domain', 'website_consistency', 'public_business_presence', 'social_profile');
create type check_status as enum ('skipped', 'success', 'warning', 'failed');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  status case_status not null default 'received',
  privacy_mode privacy_mode not null default 'minimal_retention',
  narrative_text text,
  merged_case_text text,
  case_type text,
  summary text,
  final_risk_score integer check (final_risk_score between 0 and 100),
  final_risk_level risk_level,
  confidence numeric(4, 3),
  ip_hash text,
  user_agent_hash text,
  expires_at timestamptz,
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_cases_updated_at
before update on cases
for each row execute function set_updated_at();

create table if not exists case_evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  evidence_type evidence_type not null,
  raw_text text,
  storage_path text,
  ocr_text text,
  parsed_metadata jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists signal_catalog (
  code text primary key,
  group_name text not null,
  description text not null,
  user_label text not null,
  default_weight integer not null,
  severity signal_severity not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists case_entities (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  entity_type entity_type not null,
  value text not null,
  normalized_value text not null,
  confidence numeric(4, 3) not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists case_signals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  signal_code text not null references signal_catalog(code),
  confidence numeric(4, 3) not null,
  weight integer not null,
  sources text[] not null default '{}',
  evidence_ref_id uuid,
  created_at timestamptz not null default now(),
  unique (case_id, signal_code)
);

create table if not exists analysis_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  pipeline_version text not null,
  prompt_version text not null,
  llm_model text not null,
  status text not null,
  raw_llm_response jsonb,
  subscores jsonb not null default '{}'::jsonb,
  hard_rules_applied text[] not null default '{}',
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists external_checks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  check_type check_type not null,
  status check_status not null,
  result_summary text not null,
  result_json jsonb,
  signal_impact jsonb,
  created_at timestamptz not null default now()
);

create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null,
  current_version_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_patterns_updated_at
before update on patterns
for each row execute function set_updated_at();

create table if not exists pattern_versions (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references patterns(id) on delete cascade,
  version integer not null,
  definition_snapshot jsonb not null,
  source_hash text not null,
  created_at timestamptz not null default now(),
  unique (pattern_id, version)
);

alter table patterns
  add constraint patterns_current_version_fk
  foreign key (current_version_id)
  references pattern_versions(id)
  on delete set null;

create table if not exists pattern_matches (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  pattern_id uuid not null references patterns(id) on delete cascade,
  pattern_version_id uuid not null references pattern_versions(id) on delete cascade,
  match_score numeric(4, 3) not null,
  matched_signals text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists candidate_patterns (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  signature_components jsonb not null,
  occurrence_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  promoted_pattern_id uuid references patterns(id) on delete set null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists case_candidate_pattern_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  candidate_pattern_id uuid not null references candidate_patterns(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (case_id, candidate_pattern_id)
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references cases(id) on delete cascade,
  helpful boolean not null,
  false_alarm boolean not null default false,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id bigint generated by default as identity primary key,
  event_type text not null,
  case_id uuid references cases(id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  bucket_key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (ip_hash, bucket_key, window_start)
);

create index if not exists cases_public_id_idx on cases(public_id);
create index if not exists case_evidence_case_id_idx on case_evidence(case_id);
create index if not exists case_entities_case_id_entity_type_idx on case_entities(case_id, entity_type);
create index if not exists case_signals_case_id_idx on case_signals(case_id);
create index if not exists analysis_runs_case_id_created_at_idx on analysis_runs(case_id, created_at desc);
create index if not exists external_checks_case_id_idx on external_checks(case_id);
create index if not exists pattern_matches_case_id_idx on pattern_matches(case_id);
create index if not exists candidate_patterns_fingerprint_idx on candidate_patterns(fingerprint);
create index if not exists analytics_events_type_created_at_idx on analytics_events(event_type, created_at desc);
