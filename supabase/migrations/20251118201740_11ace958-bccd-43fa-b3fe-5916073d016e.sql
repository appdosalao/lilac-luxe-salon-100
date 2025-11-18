-- Remove subscription-related columns from usuarios table
ALTER TABLE public.usuarios 
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS trial_start_date,
DROP COLUMN IF EXISTS trial_used;
