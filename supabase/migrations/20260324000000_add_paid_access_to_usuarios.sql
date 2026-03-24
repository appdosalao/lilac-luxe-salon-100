-- Migration to add paid access control to usuarios table
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS paid_access BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;
