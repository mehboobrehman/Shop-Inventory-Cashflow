-- =============================================================================
-- Table: audit_log
-- Purpose: Immutable audit trail of significant invoice events.
-- =============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  action VARCHAR(30) NOT NULL
    CHECK (action IN ('issue', 'rate_override', 'currency_change')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB,
  user_id UUID NOT NULL
);

-- Foreign key: orphaned audit rows are not useful
ALTER TABLE audit_log
  ADD CONSTRAINT fk_audit_log_invoice
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- Index for fetching audit history of an invoice
CREATE INDEX idx_audit_log_invoice_id ON audit_log(invoice_id);

-- Index for filtering/pagination by action type
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Index for time-range queries (e.g., recent changes)
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Index for user-scoped audit queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
