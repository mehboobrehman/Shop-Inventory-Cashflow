BEGIN;

-- Drop if exists (idempotent initial migration)
DROP TABLE IF EXISTS rate_log CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued')),
  issued_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rate_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('ecb','openexchangerates','manual')),
  rate NUMERIC NOT NULL,
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  provider TEXT,
  manual_note TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('issue', 'rate_override', 'currency_change')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_rate_log_invoice_id ON rate_log(invoice_id);
CREATE INDEX idx_rate_log_fetched_at ON rate_log(fetched_at);
CREATE INDEX idx_audit_log_invoice_id ON audit_log(invoice_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

COMMIT;
