-- ============================================================================
-- ForkJam — Row Level Security (RLS) & policies
-- ============================================================================
-- PROPOSITION à RELIRE avant application. Reconstruit à partir de l'usage réel
-- du code (lib/supabase/*, app/**, components/**), PAS d'un dump du schéma.
--
-- ⚠️  AVANT DE LANCER :
--   1. Vérifie que les noms de tables/colonnes ci-dessous correspondent à ta base
--      (surtout users.avatar_url, votes.target_type/target_id, nodes.user_id).
--   2. Lance d'abord sur une base de staging ou fais un backup.
--   3. Exécute dans Supabase → SQL Editor. Le script est idempotent
--      (DROP POLICY IF EXISTS avant chaque CREATE), donc rejouable.
--
-- MODÈLE D'ACCÈS (déduit du code) :
--   • nodes  : contenu PUBLIC (la landing lit les nodes sans être connecté)
--   • votes  : PUBLIC en lecture (scores affichés à tous), écriture = son vote
--   • users  : PRIVÉ (email sensible) — chacun ne lit/écrit que SA ligne
--   • storage recordings/avatars : lecture publique (getPublicUrl), upload connecté
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Auto-création de la ligne public.users à l'inscription (trigger)
-- ----------------------------------------------------------------------------
-- Remplace l'INSERT client-side actuel (app/auth/*, SignUpModal) qui échoue
-- quand la confirmation e-mail est active (pas de session au moment de l'insert).
-- Le trigger tourne en SECURITY DEFINER : fiable, indépendant des policies.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, username, department)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'department', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 1. USERS  (privé : chacun sa ligne)
-- ----------------------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Fallback si tu gardes l'insert client (le trigger ci-dessus le couvre déjà) :
drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
  on public.users for insert
  with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Pas de DELETE côté client → aucune policy delete (donc interdit).


-- ----------------------------------------------------------------------------
-- 2. NODES  (contenu public, écriture par le créateur)
-- ----------------------------------------------------------------------------
alter table public.nodes enable row level security;

-- Lecture publique (anon inclus) : landing / explore / feed / page graphe.
drop policy if exists "nodes_select_public" on public.nodes;
create policy "nodes_select_public"
  on public.nodes for select
  using (true);

-- Création : utilisateur connecté, uniquement en son nom.
drop policy if exists "nodes_insert_own" on public.nodes;
create policy "nodes_insert_own"
  on public.nodes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Édition / suppression par le propriétaire (pas encore utilisé côté app,
-- mais cohérent et sans risque — décommente si tu veux les activer).
drop policy if exists "nodes_update_own" on public.nodes;
create policy "nodes_update_own"
  on public.nodes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "nodes_delete_own" on public.nodes;
create policy "nodes_delete_own"
  on public.nodes for delete
  to authenticated
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 3. VOTES  (lecture publique pour les scores, écriture = son propre vote)
-- ----------------------------------------------------------------------------
alter table public.votes enable row level security;

-- Un seul vote par (user, cible). Empêche les doublons que le code suppose déjà.
-- (Ignore l'erreur si la contrainte existe déjà.)
do $$
begin
  alter table public.votes
    add constraint votes_user_target_unique
    unique (user_id, target_type, target_id);
exception when duplicate_table or duplicate_object then null;
end $$;

drop policy if exists "votes_select_public" on public.votes;
create policy "votes_select_public"
  on public.votes for select
  using (true);

drop policy if exists "votes_insert_own" on public.votes;
create policy "votes_insert_own"
  on public.votes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "votes_update_own" on public.votes;
create policy "votes_update_own"
  on public.votes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "votes_delete_own" on public.votes;
create policy "votes_delete_own"
  on public.votes for delete
  to authenticated
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 4. STORAGE  (buckets "recordings" et "avatars")
-- ----------------------------------------------------------------------------
-- Les deux buckets doivent être PUBLICS en lecture (le code utilise getPublicUrl).
-- À faire une fois dans Supabase → Storage → bucket → "Public bucket" = ON,
-- OU via les policies de lecture ci-dessous.

-- Lecture publique.
drop policy if exists "recordings_read_public" on storage.objects;
create policy "recordings_read_public"
  on storage.objects for select
  using (bucket_id = 'recordings');

drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload d'un enregistrement : utilisateur connecté.
drop policy if exists "recordings_insert_auth" on storage.objects;
create policy "recordings_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'recordings');

-- Avatar : upload/maj par le propriétaire uniquement.
-- avatarUploader écrit `${user.id}.${ext}` à la racine du bucket → on vérifie le préfixe.
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '.', 1) = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '.', 1) = auth.uid()::text
  );

-- ============================================================================
-- FIN. Après application, teste : connecté ET déconnecté (anon), que
-- la landing charge bien les nodes/scores, que la création de node marche,
-- et qu'un user ne peut pas lire la ligne users d'un autre.
-- ============================================================================
