-- StockSense schema for Supabase PostgreSQL.
-- Supabase is used only as the PostgreSQL host. Authentication is handled by FastAPI.
-- Run this for a fresh database. For an existing database, use migration_auth_to_local.sql.

create extension if not exists "pgcrypto";

do $$ begin
  create type role_enum as enum ('INVENTORY_MANAGER', 'WAREHOUSE_STAFF');
exception when duplicate_object then null; end $$;

do $$ begin
  create type operation_type_enum as enum ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type operation_status_enum as enum ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  reset_token_hash text unique,
  reset_token_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_users_email on users(email);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role role_enum not null default 'WAREHOUSE_STAFF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category_id uuid not null references categories(id),
  unit text not null default 'unit',
  reorder_level double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_sku on products (sku);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  unique (warehouse_id, code)
);

create table if not exists stock (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  quantity double precision not null default 0,
  updated_at timestamptz not null default now(),
  unique (product_id, location_id)
);

create table if not exists inventory_operations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  type operation_type_enum not null,
  status operation_status_enum not null default 'DRAFT',
  partner_name text,
  source_location_id uuid references locations(id),
  destination_location_id uuid references locations(id),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  validated_at timestamptz
);

create table if not exists operation_items (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references inventory_operations(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity double precision not null,
  processed_quantity double precision not null default 0
);

create table if not exists stock_ledger (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  operation_id uuid references inventory_operations(id),
  source_location_id uuid references locations(id),
  destination_location_id uuid references locations(id),
  quantity_change double precision not null,
  balance_after double precision not null,
  operation_type operation_type_enum not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_ledger_product on stock_ledger (product_id);
create index if not exists idx_ledger_created_at on stock_ledger (created_at);

create table if not exists reordering_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  min_qty double precision not null default 0,
  max_qty double precision not null default 0,
  unique (product_id, location_id)
);

-- FastAPI owns authorization, so the API database connection is trusted.
-- Do not query these tables directly from the public browser client.
