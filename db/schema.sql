CREATE TYPE user_role AS ENUM ('supplier', 'contractor', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled', 'rejected');
CREATE TYPE payment_status AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'refunded');
CREATE TYPE sms_direction AS ENUM ('in', 'out');
CREATE TYPE sms_type AS ENUM ('enquiry', 'order', 'alert', 'otp', 'broadcast');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  role user_role NOT NULL,
  county VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT false,
  otp_code VARCHAR(16),
  otp_expires TIMESTAMPTZ
);

CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(16) NOT NULL UNIQUE,
  business_name VARCHAR(180) NOT NULL,
  registration_no VARCHAR(80),
  county VARCHAR(80),
  town VARCHAR(120),
  location_lat NUMERIC(10, 7),
  location_lng NUMERIC(10, 7),
  delivery_radius_km NUMERIC(8, 2) NOT NULL DEFAULT 0,
  delivery_days JSONB NOT NULL DEFAULT '[]',
  min_order_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_fee_type VARCHAR(40) NOT NULL DEFAULT 'flat',
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_methods JSONB NOT NULL DEFAULT '[]',
  rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE materials (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  aliases JSONB NOT NULL DEFAULT '[]',
  category VARCHAR(120) NOT NULL,
  unit VARCHAR(40) NOT NULL,
  description TEXT,
  image_url TEXT
);

CREATE TABLE supplier_products (
  id BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock_qty NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  min_order_qty NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (min_order_qty > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  times_queried_week INTEGER NOT NULL DEFAULT 0,
  UNIQUE (supplier_id, material_id)
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  contractor_id BIGINT NOT NULL REFERENCES users(id),
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT,
  delivery_date TIMESTAMPTZ,
  payment_method VARCHAR(80) NOT NULL DEFAULT 'cash_on_delivery',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  payment_reference VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_product_id BIGINT NOT NULL REFERENCES supplier_products(id),
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE sms_logs (
  id BIGSERIAL PRIMARY KEY,
  from_phone VARCHAR(32),
  to_phone VARCHAR(32),
  message TEXT NOT NULL,
  direction sms_direction NOT NULL,
  message_type sms_type NOT NULL,
  at_message_id VARCHAR(160),
  cost VARCHAR(80),
  status VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_reported_at TIMESTAMPTZ
);

CREATE TABLE price_alerts (
  id BIGSERIAL PRIMARY KEY,
  contractor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  target_price NUMERIC(12, 2) NOT NULL CHECK (target_price > 0),
  county VARCHAR(80),
  is_active BOOLEAN NOT NULL DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE delivery_events (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(80) NOT NULL,
  note TEXT,
  sms_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sms_sessions (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(32) NOT NULL UNIQUE,
  last_material_id BIGINT REFERENCES materials(id),
  last_county VARCHAR(80),
  last_product_ids JSONB NOT NULL DEFAULT '[]',
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_products_material_price ON supplier_products(material_id, price);
CREATE INDEX idx_suppliers_county_active ON suppliers(county, is_active);
CREATE INDEX idx_orders_contractor ON orders(contractor_id, created_at DESC);
CREATE INDEX idx_orders_supplier ON orders(supplier_id, created_at DESC);
CREATE INDEX idx_sms_logs_phone_created ON sms_logs(from_phone, created_at DESC);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active, material_id, county);

