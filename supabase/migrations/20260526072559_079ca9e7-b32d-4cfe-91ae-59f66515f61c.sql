-- Reports table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  report_date text,
  lab_name text,
  patient_name text,
  status_counts jsonb not null,
  biomarkers jsonb not null,
  summary text not null,
  doctor_questions jsonb not null,
  content_warning text
);

alter table public.reports enable row level security;

create policy "own reports select"
  on public.reports for select
  to authenticated
  using (auth.uid() = user_id);

create policy "own reports insert"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "own reports update"
  on public.reports for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own reports delete"
  on public.reports for delete
  to authenticated
  using (auth.uid() = user_id);

create index reports_user_id_created_at_idx
  on public.reports (user_id, created_at desc);

-- Share tokens table
create table public.share_tokens (
  token text primary key,
  report_id uuid references public.reports(id) on delete cascade,
  share_type text not null check (share_type in ('summary','audio')),
  expires_at timestamptz not null,
  accessed_count int not null default 0,
  max_accesses int not null default 10,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.share_tokens enable row level security;
-- No anon/authenticated policies: all access via server fns using service role.

create index share_tokens_report_id_idx on public.share_tokens (report_id);