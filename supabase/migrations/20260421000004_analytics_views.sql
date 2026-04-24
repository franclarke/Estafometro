create or replace view funnel_daily as
select
  date_trunc('day', created_at) as day,
  count(*) filter (where event_type = 'case_started') as cases_started,
  count(*) filter (where event_type = 'analysis_completed') as analyses_completed,
  count(*) filter (where event_type = 'feedback_submitted') as feedback_submitted
from analytics_events
group by 1
order by 1 desc;

create or replace view risk_distribution as
select
  final_risk_level,
  count(*) as total_cases
from cases
where final_risk_level is not null
group by final_risk_level;
