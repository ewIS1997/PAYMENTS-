-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- to create all the tables needed by the installment management app.

-- Customers
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  second_phone TEXT DEFAULT '',
  village TEXT NOT NULL,
  national_id TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  isDeleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_price NUMERIC NOT NULL,
  isDeleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contracts
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_village TEXT NOT NULL,
  product_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  monthly_amount NUMERIC NOT NULL,
  months_count INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Installments
CREATE TABLE installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  customer_id UUID REFERENCES customers(id),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late', 'partial')),
  due_date DATE NOT NULL,
  payment_date TIMESTAMPTZ,
  paid_amount NUMERIC,
  receipt_id TEXT,
  carryover_from_partial NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Receipts
CREATE TABLE receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL,
  installment_id TEXT,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  contract_id UUID REFERENCES contracts(id),
  issue_date TIMESTAMPTZ NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  printed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Settings (singleton)
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  shop_name TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  show_logo BOOLEAN DEFAULT false,
  last_receipt_number INTEGER DEFAULT 0,
  receipt_prefix TEXT DEFAULT 'RCPT',
  receipt_year INTEGER DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_isDeleted ON customers(isDeleted);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_isDeleted ON products(isDeleted);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_installments_contract_id ON installments(contract_id);
CREATE INDEX idx_installments_customer_id ON installments(customer_id);
CREATE INDEX idx_installments_status ON installments(status);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_receipts_customer_id ON receipts(customer_id);
CREATE INDEX idx_receipts_contract_id ON receipts(contract_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_installments_status_due_date ON installments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_installments_customer_id_status ON installments(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id_issue_date ON receipts(customer_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id_status ON contracts(customer_id, status);

-- RPC for aggregated grand totals (avoids transferring all rows to client)
CREATE OR REPLACE FUNCTION get_grand_totals()
RETURNS JSON
LANGUAGE SQL
STABLE
AS $$
SELECT json_build_object(
  'totalCollected',
    COALESCE((SELECT SUM(amount) FROM installments WHERE status = 'paid'), 0)
    + COALESCE((SELECT SUM(paid_amount) FROM installments WHERE status = 'partial'), 0),
  'totalOutstanding',
    COALESCE((SELECT SUM(amount) FROM installments WHERE status IN ('pending', 'late')), 0)
    + COALESCE((SELECT SUM(amount - paid_amount) FROM installments WHERE status = 'partial'), 0)
);
$$;

-- Atomic receipt counter increment (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_receipt_counter(count INT)
RETURNS TABLE(last_number INT, receipt_year INT, receipt_prefix TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_last INT;
  v_year INT;
  v_prefix TEXT;
  v_current_year INT := EXTRACT(YEAR FROM NOW());
BEGIN
  SELECT last_receipt_number, receipt_year, receipt_prefix
  INTO v_last, v_year, v_prefix
  FROM settings WHERE id = 'app_settings';

  IF v_year IS NULL OR v_year != v_current_year THEN
    v_last := 0;
    v_year := v_current_year;
  END IF;

  v_last := v_last + count;

  UPDATE settings
  SET last_receipt_number = v_last, receipt_year = v_year
  WHERE id = 'app_settings';

  RETURN QUERY SELECT v_last AS last_number, v_year AS receipt_year, COALESCE(v_prefix, 'RCPT') AS receipt_prefix;
END;
$$;
