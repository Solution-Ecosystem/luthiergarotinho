create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- first account created becomes the owner/admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'instrumento' check (kind in ('instrumento','acessorio')),
  category text not null default '',
  price numeric(10,2) not null default 0,
  description text not null default '',
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public reads active" on public.products for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin insert" on public.products for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.products for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.products for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "public read product images" on storage.objects for select using (bucket_id = 'products');
create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'products' and public.has_role(auth.uid(),'admin'));
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id = 'products' and public.has_role(auth.uid(),'admin'));