-- ============================================================================
-- ForkJam — Migration corrective RLS
-- ============================================================================
-- Basé sur l'ÉTAT RÉEL de la base (inspecté via pg_policies / pg_constraint,
-- août 2026), pas sur des hypothèses.
--
-- Constat : RLS déjà activée sur users/nodes/votes, users en own-row, votes
-- avec PK (user_id,target_type,target_id) + CHECK value in (-1,1), bucket
-- recordings public. => On NE recrée PAS ces éléments.
--
-- Cette migration fait 3 choses :
--   1. CORRIGE la faille d'INSERT sur nodes (usurpation d'auteur + quota bypass)
--   2. SUPPRIME les policies dupliquées (users, nodes, votes)
--   3. RÉPARE le storage avatars (policies INSERT/UPDATE alignées sur le chemin)
--
-- ⚠️  Relire, tester en staging / faire un backup, puis exécuter dans
--     Supabase → SQL Editor. Idempotent (drop-if-exists avant create).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. NODES — INSERT : ownership + quota MENSUEL en UNE policy
-- ----------------------------------------------------------------------------
-- Avant : 2 policies permissives OU-ées => chacune annulait l'autre
--         (usurpation d'auteur + quota contournable).
-- Après : une seule => propriétaire ET sous quota du mois en cours (ou admin).
--
-- Le quota est MENSUEL : on ne compte que les nodes créés depuis le 1er du mois
-- (date_trunc('month', now())). plans.max_nodes est donc désormais interprété
-- comme un plafond PAR MOIS (mettre 10 pour le plan basique — voir étape SQL).

drop policy if exists "allow insert nodes for owner" on public.nodes;
drop policy if exists "limit nodes by role" on public.nodes;

create policy "nodes_insert_owner_within_quota"
  on public.nodes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      (
        (select count(*)
           from public.nodes n
          where n.user_id = auth.uid()
            and n.created_at >= date_trunc('month', now()))
        <
        (select p.max_nodes
           from public.users u
           join public.plans p on p.role = u.role
          where u.id = auth.uid())
      )
      or
      (
        (select users.role from public.users where users.id = auth.uid()) = 'admin'
      )
    )
  );


-- ----------------------------------------------------------------------------
-- 2. NODES — SELECT : garder une seule policy de lecture publique
-- ----------------------------------------------------------------------------
-- "Everyone can read nodes" (public, true) couvre déjà les authenticated.
drop policy if exists "Allow read for Authenticated users" on public.nodes;
-- on garde "Everyone can read nodes"


-- ----------------------------------------------------------------------------
-- 3. USERS — retirer les doublons (on garde le jeu users_*)
-- ----------------------------------------------------------------------------
drop policy if exists "Users can read themselves"   on public.users;
drop policy if exists "Users can insert themselves" on public.users;
drop policy if exists "Users can update themselves" on public.users;
-- restent : users_select_own / users_insert_own / users_update_own


-- ----------------------------------------------------------------------------
-- 4. VOTES — retirer les doublons (on garde le jeu votes_*)
-- ----------------------------------------------------------------------------
drop policy if exists "Users can insert their own votes" on public.votes;
drop policy if exists "Users can update their own votes" on public.votes;
drop policy if exists "Users can delete their own votes" on public.votes;
-- restent : "Votes are viewable by everyone" + votes_insert_own / _update_own / _delete_own


-- ----------------------------------------------------------------------------
-- 5. STORAGE avatars — réparer INSERT + ajouter UPDATE (upsert)
-- ----------------------------------------------------------------------------
-- La policy actuelle attend l'uid comme 1er segment de chemin : substring(name,'[^/]+').
-- => le code doit uploader vers `${uid}/avatar.<ext>` (patch dans avatarUploader.tsx).
-- On recrée l'INSERT au même format et on AJOUTE l'UPDATE (manquant) pour upsert:true.

drop policy if exists "User uploads his avatar" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (auth.uid())::text = substring(name, '[^/]+')
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (auth.uid())::text = substring(name, '[^/]+')
  )
  with check (
    bucket_id = 'avatars'
    and (auth.uid())::text = substring(name, '[^/]+')
  );


-- ============================================================================
-- OPTIONNEL — trigger de création de la ligne public.users à l'inscription.
-- À activer si tu veux arrêter de dépendre de l'INSERT client (fragile quand
-- la confirmation e-mail est active). Une fois en place, on retirera les
-- inserts client dans app/auth/* et SignUpModal, et la policy users_insert_own
-- devient superflue.
-- ----------------------------------------------------------------------------
-- create or replace function public.handle_new_user()
-- returns trigger language plpgsql security definer set search_path = public as $$
-- begin
--   insert into public.users (id, email, username, department)
--   values (
--     new.id,
--     new.email,
--     coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
--     nullif(new.raw_user_meta_data->>'department','')
--   )
--   on conflict (id) do nothing;
--   return new;
-- end $$;
--
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
-- ============================================================================
