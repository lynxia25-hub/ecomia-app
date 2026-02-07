-- Idempotent constraints for slug format and status values.
-- Run in Supabase SQL editor.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stores_status_check') then
    alter table stores
      add constraint stores_status_check
      check (status in ('draft', 'active', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stores_slug_format_check') then
    alter table stores
      add constraint stores_slug_format_check
      check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'landing_status_check') then
    alter table landing_pages
      add constraint landing_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'landing_slug_format_check') then
    alter table landing_pages
      add constraint landing_slug_format_check
      check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
end $$;
