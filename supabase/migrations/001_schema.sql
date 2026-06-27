-- Config global (single-user). Una sola fila.
create table if not exists config (
  id                int primary key default 1,
  telegram_chat_id  text,
  timezone          text default 'America/Mexico_City',
  escalation_minutes int default 5,
  give_up_minutes    int default 60,
  allow_snooze       boolean default false
);

-- Insert default config row
insert into config (id) values (1) on conflict (id) do nothing;

-- Hábitos a vigilar
create table if not exists habits (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  emoji     text default '💧',
  qr_token  text unique not null,
  active    boolean default true,
  created_at timestamptz default now()
);

-- Reglas de horario por hábito
create table if not exists schedules (
  id           uuid primary key default gen_random_uuid(),
  habit_id     uuid references habits(id) on delete cascade,
  mode         text not null check (mode in ('fixed','interval')),
  fixed_times  time[],
  interval_min int,
  window_start time default '08:00',
  window_end   time default '21:00',
  days_of_week int[] default '{1,2,3,4,5,6,7}',
  active       boolean default true
);

-- Instancias concretas del día
create table if not exists reminders (
  id            uuid primary key default gen_random_uuid(),
  habit_id      uuid references habits(id) on delete cascade,
  scheduled_for timestamptz not null,
  status        text not null default 'pending'
                check (status in ('pending','done','missed')),
  nag_count     int default 0,
  last_nagged_at timestamptz,
  done_at       timestamptz,
  source        text,
  created_at    timestamptz default now(),
  unique (habit_id, scheduled_for)
);

create index if not exists reminders_status_scheduled on reminders (status, scheduled_for);

-- Error log for cron debugging
create table if not exists logs (
  id         bigserial primary key,
  fn         text,
  level      text default 'info',
  message    text,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED: 3 habits + schedules
-- ============================================================

-- Agua: interval, every 120 min, 08:00-21:00
with ins as (
  insert into habits (name, emoji, qr_token)
  values ('Agua', '💧', 'agua-' || substr(gen_random_uuid()::text, 1, 8))
  on conflict (qr_token) do nothing
  returning id
)
insert into schedules (habit_id, mode, interval_min, window_start, window_end)
select id, 'interval', 120, '08:00', '21:00'
from ins
on conflict do nothing;

-- Vitaminas AM: fixed 08:00
with ins as (
  insert into habits (name, emoji, qr_token)
  values ('Vitaminas AM', '🌅', 'vitaminas-am-' || substr(gen_random_uuid()::text, 1, 8))
  on conflict (qr_token) do nothing
  returning id
)
insert into schedules (habit_id, mode, fixed_times)
select id, 'fixed', '{08:00}'::time[]
from ins
on conflict do nothing;

-- Vitaminas PM: fixed 21:00
with ins as (
  insert into habits (name, emoji, qr_token)
  values ('Vitaminas PM', '🌙', 'vitaminas-pm-' || substr(gen_random_uuid()::text, 1, 8))
  on conflict (qr_token) do nothing
  returning id
)
insert into schedules (habit_id, mode, fixed_times)
select id, 'fixed', '{21:00}'::time[]
from ins
on conflict do nothing;
