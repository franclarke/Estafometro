alter table cases enable row level security;
alter table case_evidence enable row level security;
alter table case_entities enable row level security;
alter table case_signals enable row level security;
alter table analysis_runs enable row level security;
alter table external_checks enable row level security;
alter table patterns enable row level security;
alter table pattern_versions enable row level security;
alter table pattern_matches enable row level security;
alter table candidate_patterns enable row level security;
alter table case_candidate_pattern_links enable row level security;
alter table feedback enable row level security;
alter table analytics_events enable row level security;
alter table signal_catalog enable row level security;
alter table rate_limit_hits enable row level security;

create policy "signal_catalog_read_only"
on signal_catalog
for select
using (true);

create policy "patterns_read_only"
on patterns
for select
using (true);

create policy "pattern_versions_read_only"
on pattern_versions
for select
using (true);
