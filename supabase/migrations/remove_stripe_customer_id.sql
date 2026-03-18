DROP INDEX IF EXISTS public.idx_usuarios_stripe_customer;

ALTER TABLE public.usuarios
DROP COLUMN IF EXISTS stripe_customer_id;
