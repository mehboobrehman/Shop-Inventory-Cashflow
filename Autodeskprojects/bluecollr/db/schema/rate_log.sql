-- =============================================================================
-- Table: rate_log
-- Purpose: Tracks exchange-rate fetches and manual overrides per invoice.
-- =============================================================================

CREATE TABLE rate_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  source VARCHAR(50) NOT NULL,
  rate NUMERIC(18, 8) NOT NULL CHECK (rate > 0),
  base_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider VARCHAR(100),
  manual_note TEXT
);

-- Foreign key: orphaned rate logs are not useful
ALTER TABLE rate_log
  ADD CONSTRAINT fk_rate_log_invoice
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- Index for fetching all rate history for an invoice
CREATE INDEX idx_rate_log_invoice_id ON rate_log(invoice_id);

-- Index for recent fetches (e.g., cleanup of stale cache)
CREATE INDEX idx_rate_log_fetched_at ON rate_log(fetched_at);

-- Index for currency-pair lookups
CREATE INDEX idx_rate_log_currency_pair ON rate_log(base_currency, target_currency);
