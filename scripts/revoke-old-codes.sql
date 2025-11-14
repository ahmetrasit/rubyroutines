-- Revoke all existing ACTIVE kiosk codes
-- After running this, new codes with the updated format will be auto-generated
UPDATE "Code"
SET status = 'REVOKED'
WHERE type = 'KIOSK' AND status = 'ACTIVE';
