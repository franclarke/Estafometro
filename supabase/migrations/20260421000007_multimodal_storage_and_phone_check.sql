alter type check_type add value if not exists 'phone';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-evidence',
  'case-evidence',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow public insert to case-evidence" on storage.objects;
drop policy if exists "Allow public select from case-evidence" on storage.objects;
drop policy if exists "Allow image insert to case-evidence" on storage.objects;

create policy "Allow image insert to case-evidence"
on storage.objects
for insert
to public
with check (
  bucket_id = 'case-evidence'
  and lower(storage.extension(name)) = any (array['png', 'jpg', 'jpeg', 'webp'])
);
