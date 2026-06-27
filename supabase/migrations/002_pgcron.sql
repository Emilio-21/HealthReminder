-- Enable extensions (run once in Supabase SQL editor)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Cron 1: Materialize reminders daily at 06:05 UTC (= 00:05 CST / America/Mexico_City)
select cron.schedule(
  'materialize-day',
  '5 6 * * *',
  $$
  select net.http_post(
    url := 'https://health-reminder-green.vercel.app/api/materialize-day',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Cron 2: Escalate every minute
select cron.schedule(
  'escalate',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://health-reminder-green.vercel.app/api/escalate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Store service role key so cron jobs can reference it
-- Run this too:
-- alter database postgres set app.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';
