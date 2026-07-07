BEGIN;

DROP TRIGGER IF EXISTS prevent_issued_invoice_update_trigger ON invoices;
DROP FUNCTION IF EXISTS prevent_issued_invoice_update();

DROP TRIGGER IF EXISTS update_invoice_updated_at_trigger ON invoices;
DROP FUNCTION IF EXISTS update_invoice_updated_at();

DROP TRIGGER IF EXISTS invoices_issue_audit_trigger ON invoices;
DROP FUNCTION IF EXISTS log_invoice_issue();

COMMIT;
