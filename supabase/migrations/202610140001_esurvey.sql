-- Dedicated E-Survey project only. Authentication is handled by Supabase Auth.
create schema if not exists esurvey_private;
revoke all on schema esurvey_private from public, anon, authenticated;

create table public.esurvey_families (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  members jsonb not null default '[]'::jsonb,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  constraint members_array check (jsonb_typeof(members) = 'array')
);
alter table public.esurvey_families enable row level security;
create policy read_own_family on public.esurvey_families
  for select to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.esurvey_families from public, anon, authenticated;
grant select on public.esurvey_families to authenticated;

create function esurvey_private.validate_members(records jsonb)
returns void language plpgsql set search_path = '' as $$
declare
  item jsonb;
  index_by_id jsonb := '{}'::jsonb;
  generations jsonb := '{}'::jsonb;
  person_id text;
  related_id text;
  other_parent text;
  cursor_id text;
  cursor_person jsonb;
  visited_ids text[];
  depth integer;
  heads integer := 0;
  field_name text;
  field_limit integer;
  age_value numeric;
begin
  if records is null or jsonb_typeof(records) <> 'array' then
    raise sqlstate 'PT400' using message = 'Family records must be an array.';
  end if;
  if jsonb_array_length(records) > 500 then
    raise sqlstate 'PT400' using message = 'A family can contain up to 500 members.';
  end if;
  if jsonb_array_length(records) = 0 then return; end if;
  for item in select value from jsonb_array_elements(records) loop
    if jsonb_typeof(item) <> 'object' then raise sqlstate 'PT400' using message = 'Invalid member.'; end if;
    person_id := item->>'id';
    if person_id is null or person_id !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' or index_by_id ? person_id then
      raise sqlstate 'PT400' using message = 'Member IDs must be valid and unique.';
    end if;
    foreach field_name in array array['name','place','doorNumber','occupation','notes'] loop
      field_limit := case when field_name = 'doorNumber' then 40 when field_name = 'notes' then 1000 else 120 end;
      if item ? field_name and jsonb_typeof(item->field_name) not in ('string','null') then
        raise sqlstate 'PT400' using message = 'Invalid member field: ' || field_name;
      end if;
      if char_length(coalesce(item->>field_name,'')) > field_limit then
        raise sqlstate 'PT400' using message = 'Member field is too long: ' || field_name;
      end if;
      if field_name in ('name','place','doorNumber') and btrim(coalesce(item->>field_name,'')) = '' then
        raise sqlstate 'PT400' using message = 'Enter a valid ' || field_name || '.';
      end if;
    end loop;
    if coalesce(item->>'gender','') not in ('male','female','other') then
      raise sqlstate 'PT400' using message = 'Invalid relationship labels.';
    end if;
    if item ? 'age' and jsonb_typeof(item->'age') <> 'null' then
      if jsonb_typeof(item->'age') <> 'number' then raise sqlstate 'PT400' using message = 'Invalid age.'; end if;
      age_value := (item->>'age')::numeric;
      if age_value <> trunc(age_value) or age_value < 0 or age_value > 125 then
        raise sqlstate 'PT400' using message = 'Age must be a whole number from 0 to 125.';
      end if;
    end if;
    related_id := nullif(item->>'relativeTo','');
    if related_id is null then heads := heads + 1;
    elsif coalesce(item->>'connection','') not in ('child','parent','sibling','spouse') then
      raise sqlstate 'PT400' using message = 'Choose a valid connection.';
    end if;
    index_by_id := index_by_id || jsonb_build_object(person_id,item);
  end loop;
  if heads <> 1 then raise sqlstate 'PT400' using message = 'A family needs exactly one head.'; end if;
  for item in select value from jsonb_array_elements(records) loop
    person_id := item->>'id'; cursor_id := person_id; visited_ids := array[]::text[]; depth := 0;
    loop
      if cursor_id = any(visited_ids) then raise sqlstate 'PT400' using message = 'This connection would create a cycle.'; end if;
      if not index_by_id ? cursor_id then raise sqlstate 'PT400' using message = 'Choose an existing relative.'; end if;
      visited_ids := array_append(visited_ids,cursor_id);
      cursor_person := index_by_id->cursor_id;
      related_id := nullif(cursor_person->>'relativeTo','');
      exit when related_id is null;
      depth := depth + case cursor_person->>'connection' when 'child' then 1 when 'parent' then -1 else 0 end;
      cursor_id := related_id;
    end loop;
    generations := generations || jsonb_build_object(person_id,depth);
  end loop;
  for item in select value from jsonb_array_elements(records) loop
    other_parent := nullif(item->>'secondParent',''); related_id := nullif(item->>'relativeTo','');
    if other_parent is not null then
      if coalesce(item->>'connection','') <> 'child' or related_id is null then
        raise sqlstate 'PT400' using message = 'A second parent is only valid on child connections.';
      end if;
      if not index_by_id ? other_parent or other_parent = item->>'id' or other_parent = related_id then
        raise sqlstate 'PT400' using message = 'Choose a different existing second parent.';
      end if;
      if generations->other_parent <> generations->related_id then
        raise sqlstate 'PT400' using message = 'Both parents must belong to the same generation.';
      end if;
    end if;
  end loop;
  -- Every ancestry edge increases the validated generation by exactly one,
  -- so second-parent edges cannot introduce an ancestry cycle.
end;
$$;
revoke all on function esurvey_private.validate_members(jsonb) from public, anon, authenticated;

create function public.esurvey_get_family()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_owner uuid := auth.uid(); result jsonb;
begin
  if current_owner is null then raise sqlstate 'PT401' using message = 'Please sign in to continue.'; end if;
  select jsonb_build_object('members',members,'revision',revision) into result
    from public.esurvey_families where owner_id = current_owner;
  return coalesce(result,jsonb_build_object('members','[]'::jsonb,'revision',0));
end;
$$;
revoke all on function public.esurvey_get_family() from public, anon;
grant execute on function public.esurvey_get_family() to authenticated;

create function public.esurvey_save_family(p_members jsonb,p_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_owner uuid := auth.uid(); result jsonb;
begin
  if current_owner is null then raise sqlstate 'PT401' using message = 'Please sign in to continue.'; end if;
  if p_revision is null or p_revision < 0 then raise sqlstate 'PT400' using message = 'Invalid family revision.'; end if;
  perform esurvey_private.validate_members(p_members);
  update public.esurvey_families set members=p_members,revision=revision+1,updated_at=now()
    where owner_id=current_owner and revision=p_revision
    returning jsonb_build_object('members',members,'revision',revision) into result;
  if result is null and p_revision=0 then
    insert into public.esurvey_families(owner_id,members,revision)
      values(current_owner,p_members,1) on conflict(owner_id) do nothing
      returning jsonb_build_object('members',members,'revision',revision) into result;
  end if;
  if result is null then raise sqlstate 'PT409' using message = 'This family changed in another window. Refresh and try again.'; end if;
  return result;
end;
$$;
revoke all on function public.esurvey_save_family(jsonb,integer) from public, anon;
grant execute on function public.esurvey_save_family(jsonb,integer) to authenticated;
