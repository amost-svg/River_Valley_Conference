alter table public.result_submissions
  add column if not exists submitted_at timestamptz;

update public.result_submissions
set submitted_at = created_at
where submitted_at is null;

alter table public.result_submissions
  alter column submitted_at set default now(),
  alter column submitted_at set not null;

create index if not exists result_submissions_submitted_at_idx
  on public.result_submissions(submitted_at desc);
