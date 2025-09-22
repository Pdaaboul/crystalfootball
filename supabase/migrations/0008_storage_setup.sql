-- Step 5: Storage Setup for Receipt Files
-- Migration: 0008_storage_setup.sql
-- Creates Supabase Storage bucket for payment receipt files

-- Create the receipts storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 
  'receipts',
  false, -- private bucket 
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
);

-- Enable RLS on the bucket
create policy "Users can upload their own receipts"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read their own receipts
create policy "Users can view their own receipts"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can read all receipts
create policy "Admins can view all receipts"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts'
  and public.current_role() in ('admin', 'superadmin')
);

-- Admins can delete receipts if needed
create policy "Admins can delete receipts"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipts'
  and public.current_role() in ('admin', 'superadmin')
); 