-- =============================================================================
-- Table: rate_log
-- Purpose: Stores exchange-rate metadata tied to invoices for currency conversion
--          audit trail and manual override notes.
-- =============================================================================

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

-- Index for invoice-scoped lookups
CREATE INDEX idx_rate_log_invoice_id ON rate_log(invoice_id);

-- Index for sorting/filtering by fetch timestamp
CREATE INDEX idx_rate_log_fetched_at ON rate_log(fetched_at);
