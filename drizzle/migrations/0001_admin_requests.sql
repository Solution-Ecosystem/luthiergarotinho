create table public.admin_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pendente',
  created_at timestamptz not null default now()
);
grant select, update on public.admin_requests to authenticated;
grant all on public.admin_requests to service_role;
alter table public.admin_requests enable row level security;
create policy "admin or own reads" on public.admin_requests for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admin updates" on public.admin_requests for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_admin_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(new.id, 'admin') then
    insert into public.admin_requests (user_id, email) values (new.id, coalesce(new.email,'')) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_request after insert on auth.users
  for each row execute function public.handle_admin_request();

create or replace function public.set_admin_request(_user uuid, _approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not allowed'; end if;
  update public.admin_requests set status = case when _approve then 'aprovado' else 'recusado' end where user_id = _user;
  if _approve then
    insert into public.user_roles (user_id, role) values (_user, 'admin') on conflict do nothing;
  else
    delete from public.user_roles where user_id = _user and role = 'admin';
  end if;
end $$;
revoke execute on function public.set_admin_request(uuid, boolean) from anon, public;
grant execute on function public.set_admin_request(uuid, boolean) to authenticated;

insert into public.admin_requests (user_id, email, status)
select u.id, coalesce(u.email,''), case when public.has_role(u.id,'admin') then 'aprovado' else 'pendente' end
from auth.users u on conflict do nothing;