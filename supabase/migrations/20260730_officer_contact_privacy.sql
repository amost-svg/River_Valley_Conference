-- Conference inquiries use the protected public contact form. Direct officer
-- email addresses are intentionally omitted from the publicly readable table.
update public.conference_officials
set email = null,
    updated_at = now()
where starts_on = date '2026-07-01'
  and is_active;
