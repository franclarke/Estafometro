alter table feedback
  add column if not exists outcome text,
  add column if not exists action_taken text,
  add column if not exists clarity_score integer check (clarity_score between 1 and 5),
  add column if not exists reason_tags text[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

alter table feedback
  drop constraint if exists feedback_outcome_v2_check,
  add constraint feedback_outcome_v2_check
  check (outcome is null or outcome in ('paused', 'verified', 'ignored', 'already_paid', 'reported', 'other'));

alter table feedback
  drop constraint if exists feedback_action_taken_v2_check,
  add constraint feedback_action_taken_v2_check
  check (
    action_taken is null
    or action_taken in (
      'did_not_pay',
      'called_official_channel',
      'asked_family',
      'blocked_contact',
      'saved_evidence',
      'other'
    )
  );

drop trigger if exists set_feedback_updated_at on feedback;
create trigger set_feedback_updated_at
before update on feedback
for each row execute function set_updated_at();

create or replace view funnel_daily as
select
  date_trunc('day', analytics_events.created_at) as day,
  count(*) filter (where event_type = 'case_started') as cases_started,
  count(*) filter (where event_type = 'analysis_completed') as analyses_completed,
  count(*) filter (where event_type = 'feedback_submitted' or event_type = 'feedback_submitted_v2') as feedback_submitted,
  count(*) filter (where event_type = 'result_copied') as results_copied,
  count(*) filter (where event_type = 'result_shared') as results_shared,
  round(
    100.0 * count(*) filter (where event_type = 'analysis_completed')
    / nullif(count(*) filter (where event_type = 'case_started'), 0),
    2
  ) as analysis_completion_rate,
  round(
    100.0 * count(*) filter (where event_type = 'feedback_submitted' or event_type = 'feedback_submitted_v2')
    / nullif(count(*) filter (where event_type = 'analysis_completed'), 0),
    2
  ) as feedback_rate
from analytics_events
group by 1
order by 1 desc;

create or replace view feedback_quality as
select
  date_trunc('day', feedback.created_at) as day,
  cases.case_type,
  cases.final_risk_level,
  count(*) as total_feedback,
  count(*) filter (where feedback.helpful) as helpful_count,
  count(*) filter (where not feedback.helpful) as negative_count,
  count(*) filter (where feedback.outcome in ('paused', 'verified')) as paused_or_verified_count,
  avg(feedback.clarity_score) as avg_clarity_score
from feedback
join cases on cases.id = feedback.case_id
group by 1, 2, 3
order by 1 desc;

create or replace view risk_distribution as
select
  final_risk_level,
  count(*) as total_cases,
  count(*) filter (where feedback.helpful) as helpful_feedback,
  count(*) filter (where feedback.outcome in ('paused', 'verified')) as paused_or_verified
from cases
left join feedback on feedback.case_id = cases.id
where final_risk_level is not null
group by final_risk_level;
