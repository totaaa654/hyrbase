-- Cover letters private storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cover_letters', 'cover_letters', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Storage RLS: users can only access their own folder
create policy "cover_letters_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'cover_letters'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cover_letters_select_own"
  on storage.objects for select
  using (
    bucket_id = 'cover_letters'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cover_letters_update_own"
  on storage.objects for update
  using (
    bucket_id = 'cover_letters'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'cover_letters'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cover_letters_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'cover_letters'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add new columns to job_applications
alter table job_applications
  add column if not exists cover_letter_file_url  text,
  add column if not exists cover_letter_file_name text,
  add column if not exists cover_letter_file_size bigint,
  add column if not exists cover_letter_uploaded_at timestamptz;
