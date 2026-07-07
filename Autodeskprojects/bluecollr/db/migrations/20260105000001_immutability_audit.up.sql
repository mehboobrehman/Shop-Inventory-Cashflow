BEGIN;

-- Function: prevent updates to issued invoices
CREATE OR REPLACE FUNCTION prevent_issued_invoice_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.issued_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot update issued invoice %', OLD.id;
  END IF;
  -- Version bump for draft optimistic concurrency
  IF TG_OP = 'UPDATE' THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_issued_invoice_update_trigger
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_issued_invoice_update();

-- Function: auto-update updated_at on draft updates
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_updated_at_trigger
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_updated_at();

-- Function: audit issuance event
CREATE OR REPLACE FUNCTION log_invoice_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.issued_at IS NULL AND NEW.issued_at IS NOT NULL THEN
    INSERT INTO audit_log (invoice_id, action, details)
    VALUES (NEW.id, 'issue', jsonb_build_object('from_status', OLD.status, 'to_status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_issue_audit_trigger
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION log_invoice_issue();

COMMIT;
