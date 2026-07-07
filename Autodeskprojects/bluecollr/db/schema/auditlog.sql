-- =============================================================================
-- Table: audit_log
-- Purpose: Tracks key invoice lifecycle events (issue, rate override, currency
--          change) for compliance and debugging.
-- =============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('issue', 'rate_override', 'currency_change')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for invoice-scoped lookups
CREATE INDEX idx_audit_log_invoice_id ON audit_log(invoice_id);

-- Index for sorting/filtering by event timestamp
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
