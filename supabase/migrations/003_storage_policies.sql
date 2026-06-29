-- ============================================================
-- HyrBase migration 003: Harden Supabase Storage policies
--
-- Drops the three policies created in 002 (which lacked the
-- UPDATE verb) and replaces them with four explicit, per-verb
-- policies that all use the folder-ownership check:
--
--   (storage.foldername(name))[1] = auth.uid()::text
--
-- This ensures every user can only touch files inside their
-- own  resumes/<user_id>/  folder.
-- ============================================================

-- ── Remove old policies from migration 002 ────────────────────
drop policy if exists "Users upload their own resumes" on storage.objects;
drop policy if exists "Users read their own resumes"   on storage.objects;
drop policy if exists "Users delete their own resumes" on storage.objects;

-- ── INSERT ────────────────────────────────────────────────────
create policy "resumes_insert_own_folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── SELECT ────────────────────────────────────────────────────
create policy "resumes_select_own_folder"
  on storage.objects
  for select
  using (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── UPDATE ────────────────────────────────────────────────────
create policy "resumes_update_own_folder"
  on storage.objects
  for update
  using (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── DELETE ────────────────────────────────────────────────────
create policy "resumes_delete_own_folder"
  on storage.objects
  for delete
  using (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
