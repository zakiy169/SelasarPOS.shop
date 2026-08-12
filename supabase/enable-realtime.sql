-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Skrip ini hanya mengaktifkan event realtime untuk snapshot data toko;
-- tidak mengubah ataupun menghapus data yang sudah ada.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'organization_data'
  ) then
    alter publication supabase_realtime add table public.organization_data;
  end if;
end;
$$;
