-- =====================================================================
-- Swave Cups Cafe — complete schema (run ONCE on a fresh Supabase project)
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- =====================================================================

-- ---------- Enums ----------
create type public.user_role        as enum ('admin', 'staff');
create type public.fulfillment_type as enum ('dine_in', 'pickup', 'delivery');
create type public.order_status     as enum ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
create type public.payment_status   as enum ('unpaid', 'paid', 'refunded');
create type public.payment_method   as enum ('cash');  -- online providers are NOT integrated; add values only when they are
create type public.task_status      as enum ('not_started', 'in_progress', 'completed', 'on_hold');
create type public.task_priority    as enum ('low', 'medium', 'high', 'urgent');

-- ---------- Generic helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- Admin profiles & role helpers ----------
create table public.admin_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       public.user_role not null default 'staff',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_admin_profiles_updated before update on public.admin_profiles
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER so RLS policies can check roles without recursing into admin_profiles' own RLS.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles p
                 where p.id = (select auth.uid()) and p.is_active and p.role in ('admin','staff'));
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_profiles p
                 where p.id = (select auth.uid()) and p.is_active and p.role = 'admin');
$$;

-- ---------- Cafe settings (single row) ----------
create table public.cafe_settings (
  id               smallint primary key default 1 check (id = 1),
  cafe_name        text not null default 'Swave Cups Cafe',
  tagline          text,
  description      text,
  phone            text,
  email            text,
  address          text,
  popup_location   text,
  map_url          text,
  hours            jsonb not null default '[]'::jsonb,   -- [{ "day": "Monday", "open": "08:00", "close": "20:00", "closed": false }]
  facebook_url     text,
  instagram_url    text,
  logo_url         text,
  orders_enabled   boolean not null default true,
  dine_in_enabled  boolean not null default true,
  pickup_enabled   boolean not null default true,
  delivery_enabled boolean not null default false,
  delivery_fee     numeric(10,2) not null default 0 check (delivery_fee >= 0),
  min_order_amount numeric(10,2) not null default 0 check (min_order_amount >= 0),
  order_notice     text,
  updated_at       timestamptz not null default now()
);
create trigger trg_cafe_settings_updated before update on public.cafe_settings
  for each row execute function public.set_updated_at();
-- Real details from the original site (hours were never published, so they start empty).
insert into public.cafe_settings (cafe_name, tagline, description, address, popup_location, facebook_url, instagram_url, order_notice)
values ('Swave Cups Cafe',
        'More than just coffee. Mostly coffee though.',
        'Swave Cups is a tiny neighborhood cafe in Progress Homes, San Vicente, Canaman. We pull shots, whisk matcha, and keep the beanbags warm for you.',
        'Progress Homes, 2nd Street Left, San Vicente, Canaman, Camarines Sur',
        'Canaman Boulevard',
        'https://www.facebook.com/search/top?q=Swave%20Cups%20Cafe',
        'https://www.instagram.com/swave.cafe/',
        'Payment is cash only for now (pay at the counter, on pickup, or on delivery). Online payment is not available yet.');

-- ---------- Menu ----------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(btrim(name)) between 1 and 80),
  description text check (char_length(description) <= 300),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid not null references public.categories(id) on delete restrict,  -- must reassign before deleting a category
  name              text not null check (char_length(btrim(name)) between 1 and 120),
  slug              text not null unique,
  short_description text check (char_length(short_description) <= 200),
  description       text check (char_length(description) <= 2000),
  price             numeric(10,2) not null check (price >= 0 and price <= 100000),
  image_url         text,
  image_path        text,            -- storage object path (for cleanup); null for external/static images
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_products_category on public.products (category_id);
create index idx_products_public   on public.products (is_active, is_featured);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Gallery ----------
create table public.gallery_images (
  id           uuid primary key default gen_random_uuid(),
  title        text check (char_length(title) <= 150),
  description  text check (char_length(description) <= 500),
  image_url    text not null,
  storage_path text,
  photo_date   date not null default current_date,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_gallery_public on public.gallery_images (is_published, photo_date desc, sort_order);
create trigger trg_gallery_updated before update on public.gallery_images
  for each row execute function public.set_updated_at();

-- ---------- Customers & orders ----------
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text not null unique,   -- normalized (digits and optional leading +)
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

create sequence public.order_number_seq;

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  customer_id      uuid references public.customers(id) on delete set null,
  customer_name    text not null,           -- snapshot
  customer_phone   text not null,           -- snapshot
  customer_email   text,
  fulfillment      public.fulfillment_type not null,
  table_number     text,
  requested_time   text,
  delivery_address text,
  notes            text check (char_length(notes) <= 500),
  admin_notes      text check (char_length(admin_notes) <= 1000),
  subtotal         numeric(10,2) not null check (subtotal >= 0),
  delivery_fee     numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total            numeric(10,2) not null check (total >= 0),
  status           public.order_status not null default 'pending',
  payment_method   public.payment_method not null default 'cash',
  payment_status   public.payment_status not null default 'unpaid',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  completed_at     timestamptz,
  cancelled_at     timestamptz,
  constraint chk_delivery_address check (fulfillment <> 'delivery' or char_length(btrim(coalesce(delivery_address,''))) >= 5)
);
create index idx_orders_status_created on public.orders (status, created_at desc);
create index idx_orders_customer       on public.orders (customer_id);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,                                   -- snapshot
  unit_price   numeric(10,2) not null check (unit_price >= 0),  -- snapshot
  quantity     integer not null check (quantity between 1 and 99),
  line_total   numeric(10,2) generated always as (unit_price * quantity) stored
);
create index idx_order_items_order   on public.order_items (order_id);
create index idx_order_items_product on public.order_items (product_id);

create table public.order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  changed_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index idx_order_events_order on public.order_events (order_id, created_at);

-- Enforce valid status transitions in the database (the authoritative check).
create or replace function public.enforce_order_transition() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending'   and new.status in ('confirmed','cancelled')) or
      (old.status = 'confirmed' and new.status in ('preparing','cancelled')) or
      (old.status = 'preparing' and new.status in ('ready','cancelled')) or
      (old.status = 'ready'     and new.status in ('completed','cancelled'))
    ) then
      raise exception 'ORDER: Cannot change an order from % to %.', old.status, new.status;
    end if;
    if new.status = 'completed' then new.completed_at = now(); end if;
    if new.status = 'cancelled' then new.cancelled_at = now(); end if;
    insert into public.order_events (order_id, from_status, to_status, changed_by)
    values (old.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end $$;
create trigger trg_orders_transition before update of status on public.orders
  for each row execute function public.enforce_order_transition();

-- ---------- Public order placement (server-side pricing; the browser never sends prices) ----------
create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  s            public.cafe_settings%rowtype;
  v_name       text := btrim(coalesce(payload->>'customer_name', ''));
  v_phone      text := regexp_replace(coalesce(payload->>'customer_phone', ''), '[^0-9+]', '', 'g');
  v_email      text := nullif(btrim(coalesce(payload->>'customer_email', '')), '');
  v_type       public.fulfillment_type;
  v_table      text := nullif(btrim(coalesce(payload->>'table_number', '')), '');
  v_time       text := nullif(btrim(coalesce(payload->>'requested_time', '')), '');
  v_address    text := nullif(btrim(coalesce(payload->>'delivery_address', '')), '');
  v_notes      text := nullif(btrim(coalesce(payload->>'notes', '')), '');
  v_subtotal   numeric(10,2) := 0;
  v_fee        numeric(10,2) := 0;
  v_customer   uuid;
  v_order      uuid;
  v_number     text;
  v_count      integer;
  v_found      integer;
  v_cart       jsonb;
begin
  select * into s from public.cafe_settings where id = 1;
  if not s.orders_enabled then raise exception 'ORDER: The cafe is not accepting online orders right now.'; end if;

  if char_length(v_name) < 2 or char_length(v_name) > 100 then raise exception 'ORDER: Please enter your name.'; end if;
  if char_length(v_phone) < 7 or char_length(v_phone) > 16 then raise exception 'ORDER: Please enter a valid phone number.'; end if;
  if v_email is not null and (char_length(v_email) > 150 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'ORDER: Please enter a valid email address or leave it blank.'; end if;
  if char_length(coalesce(v_notes,'')) > 500 or char_length(coalesce(v_address,'')) > 300
     or char_length(coalesce(v_table,'')) > 20 or char_length(coalesce(v_time,'')) > 40 then
    raise exception 'ORDER: One of the fields is too long.'; end if;

  begin v_type := (payload->>'fulfillment')::public.fulfillment_type;
  exception when others then raise exception 'ORDER: Please choose dine-in, pickup, or delivery.'; end;
  if (v_type = 'dine_in'  and not s.dine_in_enabled)
  or (v_type = 'pickup'   and not s.pickup_enabled)
  or (v_type = 'delivery' and not s.delivery_enabled) then
    raise exception 'ORDER: That order type is not available right now.'; end if;
  if v_type = 'delivery' and char_length(coalesce(v_address,'')) < 5 then
    raise exception 'ORDER: Please enter a delivery address.'; end if;

  -- Merge duplicate product lines into one jsonb cart: [{product_id, qty}]
  begin
    select coalesce(jsonb_agg(jsonb_build_object('product_id', m.product_id, 'qty', m.qty)), '[]'::jsonb) into v_cart
    from (select (i->>'product_id')::uuid as product_id, sum((i->>'quantity')::int)::int as qty
          from jsonb_array_elements(coalesce(payload->'items', '[]'::jsonb)) i
          group by 1) m
    where m.qty >= 1;
  exception when others then raise exception 'ORDER: Your cart could not be read. Please refresh and try again.'; end;

  select count(*) into v_count from jsonb_to_recordset(v_cart) as t(product_id uuid, qty integer);
  if v_count = 0 then raise exception 'ORDER: Your cart is empty.'; end if;
  if v_count > 30 then raise exception 'ORDER: Too many different items in one order.'; end if;
  if exists (select 1 from jsonb_to_recordset(v_cart) as t(product_id uuid, qty integer) where t.qty > 99) then
    raise exception 'ORDER: Quantity too large (max 99 per item).'; end if;

  select count(*) into v_found
  from jsonb_to_recordset(v_cart) as t(product_id uuid, qty integer)
  join public.products p on p.id = t.product_id and p.is_active
  join public.categories c on c.id = p.category_id and c.is_active;
  if v_found <> v_count then
    raise exception 'ORDER: Some items in your cart are no longer available. Please review your cart.'; end if;

  select coalesce(sum(p.price * t.qty), 0) into v_subtotal
  from jsonb_to_recordset(v_cart) as t(product_id uuid, qty integer)
  join public.products p on p.id = t.product_id;

  if v_subtotal < s.min_order_amount then
    raise exception 'ORDER: The minimum order amount is %.', s.min_order_amount; end if;
  if v_type = 'delivery' then v_fee := s.delivery_fee; end if;

  insert into public.customers (full_name, phone, email) values (v_name, v_phone, v_email)
  on conflict (phone) do update set email = coalesce(public.customers.email, excluded.email)
  returning id into v_customer;

  v_number := 'SC-' || to_char(now() at time zone 'Asia/Manila', 'YYMMDD') || '-' ||
              lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into public.orders (order_number, customer_id, customer_name, customer_phone, customer_email, fulfillment,
                             table_number, requested_time, delivery_address, notes, subtotal, delivery_fee, total)
  values (v_number, v_customer, v_name, v_phone, v_email, v_type,
          case when v_type = 'dine_in' then v_table end, case when v_type <> 'dine_in' then v_time end,
          case when v_type = 'delivery' then v_address end, v_notes, v_subtotal, v_fee, v_subtotal + v_fee)
  returning id into v_order;

  insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
  select v_order, p.id, p.name, p.price, t.qty
  from jsonb_to_recordset(v_cart) as t(product_id uuid, qty integer)
  join public.products p on p.id = t.product_id;

  insert into public.order_events (order_id, from_status, to_status) values (v_order, null, 'pending');

  return jsonb_build_object('order_number', v_number);
end $$;
revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- ---------- Dashboard statistics (staff only) ----------
create or replace function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.is_staff() then raise exception 'Not authorized'; end if;
  select jsonb_build_object(
    'total_products',  (select count(*) from public.products),
    'active_products', (select count(*) from public.products where is_active),
    'total_orders',    (select count(*) from public.orders),
    'pending',         (select count(*) from public.orders where status = 'pending'),
    'confirmed',       (select count(*) from public.orders where status = 'confirmed'),
    'preparing',       (select count(*) from public.orders where status = 'preparing'),
    'ready',           (select count(*) from public.orders where status = 'ready'),
    'completed',       (select count(*) from public.orders where status = 'completed'),
    'cancelled',       (select count(*) from public.orders where status = 'cancelled'),
    'total_sales',     (select coalesce(sum(total), 0) from public.orders where status = 'completed'),
    'recent_orders',   (select coalesce(jsonb_agg(o), '[]'::jsonb) from (
                          select id, order_number, customer_name, total, status, created_at
                          from public.orders order by created_at desc limit 5) o),
    'popular_products',(select coalesce(jsonb_agg(p), '[]'::jsonb) from (
                          select oi.product_name as name, sum(oi.quantity)::int as quantity
                          from public.order_items oi join public.orders o on o.id = oi.order_id
                          where o.status <> 'cancelled'
                          group by oi.product_name order by sum(oi.quantity) desc, oi.product_name limit 5) p)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------- Staff management RPCs (admin only; no service-role key needed) ----------
create or replace function public.staff_add(p_email text, p_full_name text, p_role public.user_role) returns void
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_id is null then
    raise exception 'ORDER: No auth user with that email. Create the user first in Supabase → Authentication → Users.'; end if;
  insert into public.admin_profiles (id, email, full_name, role)
  values (v_id, lower(btrim(p_email)), nullif(btrim(p_full_name), ''), p_role)
  on conflict (id) do update set role = excluded.role, is_active = true,
                                 full_name = coalesce(excluded.full_name, public.admin_profiles.full_name);
end $$;

create or replace function public.staff_update(p_id uuid, p_role public.user_role, p_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_id = (select auth.uid()) and (p_role <> 'admin' or not p_active) then
    raise exception 'ORDER: You cannot demote or deactivate your own account.'; end if;
  update public.admin_profiles set role = p_role, is_active = p_active where id = p_id;
  if not exists (select 1 from public.admin_profiles where role = 'admin' and is_active) then
    raise exception 'ORDER: At least one active admin must remain.'; end if;
end $$;
revoke all on function public.staff_add(text, text, public.user_role) from public;
revoke all on function public.staff_update(uuid, public.user_role, boolean) from public;
grant execute on function public.staff_add(text, text, public.user_role) to authenticated;
grant execute on function public.staff_update(uuid, public.user_role, boolean) to authenticated;

-- ---------- Project progress tracker ----------
create table public.project_tasks (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(btrim(title)) between 1 and 200),
  description      text check (char_length(description) <= 2000),
  status           public.task_status not null default 'not_started',
  priority         public.task_priority not null default 'medium',
  category         text not null default 'General' check (char_length(btrim(category)) between 1 and 80),
  start_date       date,
  due_date         date,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  notes            text check (char_length(notes) <= 2000),
  source           text,  -- e.g. 'to-do.md' for tasks imported from the original tracker
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  completed_at     timestamptz,
  constraint chk_task_dates check (start_date is null or due_date is null or due_date >= start_date)
);
create index idx_tasks_status   on public.project_tasks (status, due_date);
create index idx_tasks_category on public.project_tasks (category);

-- Keeps status and progress consistent: Completed <=> 100%.
create or replace function public.normalize_task() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if new.progress_percent = 100 then new.status = 'completed'; end if;
  if new.status = 'completed' then
    new.progress_percent = 100;
    if tg_op = 'UPDATE' then new.completed_at = coalesce(old.completed_at, now());
    else new.completed_at = now(); end if;
  else
    new.completed_at = null;
    if new.progress_percent = 100 then new.progress_percent = 99; end if;
  end if;
  return new;
end $$;
create trigger trg_tasks_normalize before insert or update on public.project_tasks
  for each row execute function public.normalize_task();

create table public.project_task_activity (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.project_tasks(id) on delete cascade,
  actor_id    uuid references auth.users(id) on delete set null,
  actor_email text,
  action      text not null,   -- created | status | progress | edited | note
  detail      text,
  created_at  timestamptz not null default now()
);
create index idx_task_activity_task on public.project_task_activity (task_id, created_at desc);

create or replace function public.log_task_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_email text;
begin
  select email into v_email from public.admin_profiles where id = v_uid;
  if tg_op = 'INSERT' then
    insert into public.project_task_activity (task_id, actor_id, actor_email, action, detail)
    values (new.id, v_uid, v_email, 'created', coalesce(new.source, 'Task created'));
  else
    if new.status <> old.status then
      insert into public.project_task_activity (task_id, actor_id, actor_email, action, detail)
      values (new.id, v_uid, v_email, 'status', old.status || ' → ' || new.status);
    end if;
    if new.progress_percent <> old.progress_percent then
      insert into public.project_task_activity (task_id, actor_id, actor_email, action, detail)
      values (new.id, v_uid, v_email, 'progress', old.progress_percent || '% → ' || new.progress_percent || '%');
    end if;
    if (new.title, new.description, new.priority, new.category, new.start_date, new.due_date, new.notes)
       is distinct from (old.title, old.description, old.priority, old.category, old.start_date, old.due_date, old.notes) then
      insert into public.project_task_activity (task_id, actor_id, actor_email, action, detail)
      values (new.id, v_uid, v_email, 'edited', 'Details updated');
    end if;
  end if;
  return null;
end $$;
create trigger trg_tasks_log after insert or update on public.project_tasks
  for each row execute function public.log_task_activity();

-- ---------- Privileges (explicit; nothing is granted by default) ----------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.categories, public.products, public.gallery_images, public.cafe_settings to anon, authenticated;
grant select on public.admin_profiles, public.customers, public.orders, public.order_items, public.order_events,
                public.project_tasks, public.project_task_activity to authenticated;
grant insert, update, delete on public.categories, public.products, public.gallery_images, public.project_tasks to authenticated;
grant insert on public.project_task_activity to authenticated;
grant update on public.cafe_settings to authenticated;
-- Staff may change ONLY these order columns; totals, items and customer data are immutable from the API.
grant update (status, payment_status, admin_notes) on public.orders to authenticated;

-- ---------- Row Level Security ----------
alter table public.admin_profiles        enable row level security;
alter table public.cafe_settings         enable row level security;
alter table public.categories            enable row level security;
alter table public.products              enable row level security;
alter table public.gallery_images        enable row level security;
alter table public.customers             enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_events          enable row level security;
alter table public.project_tasks         enable row level security;
alter table public.project_task_activity enable row level security;

-- admin_profiles: you can read your own row; admins can read all. No direct writes (use staff_* RPCs).
create policy profiles_read_own   on public.admin_profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_read_admin on public.admin_profiles for select to authenticated using (public.is_admin());

-- cafe_settings: public read; admin update.
create policy settings_read   on public.cafe_settings for select to anon, authenticated using (true);
create policy settings_update on public.cafe_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- categories: public sees active; staff see all; admin writes.
create policy categories_public on public.categories for select to anon, authenticated using (is_active);
create policy categories_staff  on public.categories for select to authenticated using (public.is_staff());
create policy categories_insert on public.categories for insert to authenticated with check (public.is_admin());
create policy categories_update on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy categories_delete on public.categories for delete to authenticated using (public.is_admin());

-- products: public sees active products in active categories.
create policy products_public on public.products for select to anon, authenticated
  using (is_active and exists (select 1 from public.categories c where c.id = category_id and c.is_active));
create policy products_staff  on public.products for select to authenticated using (public.is_staff());
create policy products_insert on public.products for insert to authenticated with check (public.is_admin());
create policy products_update on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_delete on public.products for delete to authenticated using (public.is_admin());

-- gallery: public sees published only.
create policy gallery_public on public.gallery_images for select to anon, authenticated using (is_published);
create policy gallery_staff  on public.gallery_images for select to authenticated using (public.is_staff());
create policy gallery_insert on public.gallery_images for insert to authenticated with check (public.is_admin());
create policy gallery_update on public.gallery_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy gallery_delete on public.gallery_images for delete to authenticated using (public.is_admin());

-- customers / orders / items / events: staff read; staff update limited columns on orders. Anonymous users get NOTHING.
create policy customers_staff    on public.customers    for select to authenticated using (public.is_staff());
create policy orders_staff_read  on public.orders      for select to authenticated using (public.is_staff());
create policy orders_staff_upd   on public.orders      for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy items_staff        on public.order_items  for select to authenticated using (public.is_staff());
create policy events_staff       on public.order_events for select to authenticated using (public.is_staff());

-- project tracker: admin only.
create policy tasks_read   on public.project_tasks for select to authenticated using (public.is_admin());
create policy tasks_insert on public.project_tasks for insert to authenticated with check (public.is_admin());
create policy tasks_update on public.project_tasks for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tasks_delete on public.project_tasks for delete to authenticated using (public.is_admin());
create policy activity_read   on public.project_task_activity for select to authenticated using (public.is_admin());
create policy activity_insert on public.project_task_activity for insert to authenticated with check (public.is_admin());

-- ---------- Storage buckets & policies ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('menu-images', 'menu-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('gallery',     'gallery',     true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

create policy storage_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('menu-images','gallery') and public.is_admin());
create policy storage_admin_update on storage.objects for update to authenticated
  using (bucket_id in ('menu-images','gallery') and public.is_admin());
create policy storage_admin_delete on storage.objects for delete to authenticated
  using (bucket_id in ('menu-images','gallery') and public.is_admin());
create policy storage_staff_select on storage.objects for select to authenticated
  using (bucket_id in ('menu-images','gallery') and public.is_staff());
