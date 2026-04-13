-- Programa de Fidelización Plasér
-- Ejecuta este SQL en Supabase > SQL Editor

-- Tabla de clientes
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text not null,
  qr_code text unique not null,
  points integer not null default 0,
  total_spent numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Tabla de visitas / transacciones
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  amount_spent numeric(10,2) not null,
  points_earned integer not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Tabla de promociones
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  points_required integer not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tabla de productos
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  category text not null default 'General',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Políticas de acceso (Row Level Security)
alter table customers enable row level security;
alter table visits enable row level security;
alter table promotions enable row level security;
alter table products enable row level security;

-- Permitir lectura pública de clientes (para tarjeta del cliente)
create policy "Clientes públicos" on customers for select using (true);
create policy "Insertar clientes" on customers for insert with check (true);

-- Visitas: solo service role puede insertar/leer
create policy "Visitas públicas" on visits for select using (true);
create policy "Insertar visitas" on visits for insert with check (true);

-- Actualizar puntos del cliente
create policy "Actualizar clientes" on customers for update using (true);

-- Promociones y productos: lectura pública
create policy "Promociones públicas" on promotions for select using (true);
create policy "Productos públicos" on products for select using (true);
create policy "CRUD promociones" on promotions for all using (true);
create policy "CRUD productos" on products for all using (true);

-- Datos de ejemplo
insert into promotions (title, description, points_required, discount_type, discount_value, active) values
  ('Café gratis', 'Canjea tus puntos por un café', 50, 'fixed', 2.50, true),
  ('10% descuento', 'Descuento en tu próxima visita', 100, 'percentage', 10, true),
  ('Desayuno gratis', 'Café + tostada gratis', 150, 'fixed', 5.00, true);

insert into products (name, price, category, active) values
  ('Café solo', 1.50, 'Bebidas', true),
  ('Café con leche', 1.80, 'Bebidas', true),
  ('Cappuccino', 2.20, 'Bebidas', true),
  ('Tostada con mantequilla', 2.00, 'Comida', true),
  ('Tostada con tomate', 2.50, 'Comida', true),
  ('Croissant', 1.80, 'Comida', true),
  ('Zumo de naranja', 2.50, 'Bebidas', true),
  ('Agua', 1.00, 'Bebidas', true);
