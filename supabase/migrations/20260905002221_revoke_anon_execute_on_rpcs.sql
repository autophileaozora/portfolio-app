-- Supabase's default privileges grant EXECUTE on new public-schema functions
-- to anon/authenticated/service_role automatically, regardless of the
-- "revoke all ... from public" already in the defining migration — that
-- only strips the PUBLIC-level grant, not the separate one Supabase applies
-- directly to each named role. RLS already stopped anon from writing
-- through these RPCs (verified directly), but anon should not even be able
-- to call them — belt and suspenders.
revoke execute on function public.reorder_ranked_item(text, uuid, integer) from anon;
revoke execute on function public.compact_ranked_table(text, integer) from anon;
