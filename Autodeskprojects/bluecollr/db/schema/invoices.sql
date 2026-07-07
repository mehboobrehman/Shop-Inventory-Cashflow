-- =============================================================================
-- Table: invoices
-- Purpose: Stores invoice drafts and issued invoices.
-- Immutability: once issued_at is set, updates are blocked by a DB trigger.
-- =============================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  issued_at TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user-scoped queries (drafts + history)
CREATE INDEX idx_invoices_user_id ON invoices(user_id);

-- Index for sorting/filtering issued invoices
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at);

-- Index for sorting by creation date
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- Index for sorting/filtering by last-modified timestamp
CREATE INDEX idx_invoices_updated_at ON invoices(updated_at);
