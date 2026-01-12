-- Change default status for new stores
ALTER TABLE stores ALTER COLUMN status SET DEFAULT 'active';

-- Update existing pending stores to active
UPDATE stores SET status = 'active'
WHERE status = 'pending';