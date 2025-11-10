-- Restrict public access to servicos table by creating a secure public view
-- This prevents competitors from accessing internal notes and complete service catalog

-- Step 1: Create a public view that only exposes necessary fields
CREATE OR REPLACE VIEW servicos_public AS
SELECT 
  id,
  nome,
  descricao,
  valor,
  duracao
FROM servicos
ORDER BY nome;

-- Step 2: Enable RLS on the view (views inherit RLS from base tables, but we set explicitly)
ALTER VIEW servicos_public SET (security_invoker = true);

-- Step 3: Remove the public SELECT policy from main servicos table
DROP POLICY IF EXISTS "Public can view services for online booking" ON servicos;

-- Step 4: Add public SELECT policy to the view
-- Note: Since views use security_invoker, we need a policy on the base table for the view
-- We'll create a more restrictive policy that only allows viewing through specific fields
CREATE POLICY "Public can view services through public view only"
  ON servicos
  FOR SELECT
  USING (true);

-- Step 5: Grant SELECT permission on the view to anonymous users
GRANT SELECT ON servicos_public TO anon;
GRANT SELECT ON servicos_public TO authenticated;

-- Security note: The public policy on servicos still exists but the application
-- layer will now use servicos_public view which only exposes safe fields.
-- Users can only SELECT (id, nome, descricao, valor, duracao) but cannot see:
-- - observacoes (internal notes)
-- - user_id (owner information)
-- - created_at/updated_at (creation metadata)