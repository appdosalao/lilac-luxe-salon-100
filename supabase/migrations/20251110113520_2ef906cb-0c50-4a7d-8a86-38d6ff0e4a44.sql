-- Fix input validation on agendamentos_online table
-- First clean existing data, then add constraints

-- Step 1: Clean existing phone numbers - remove all non-numeric characters except leading +
UPDATE agendamentos_online 
SET telefone = regexp_replace(telefone, '[^0-9+]', '', 'g');

-- Step 2: Add CHECK constraints
-- Constraint for nome_completo: between 2 and 200 characters
ALTER TABLE agendamentos_online 
ADD CONSTRAINT check_nome_length 
CHECK (length(nome_completo) >= 2 AND length(nome_completo) <= 200);

-- Constraint for email: valid email format
ALTER TABLE agendamentos_online 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Constraint for telefone: valid phone format (numeric only, 8-15 digits)
ALTER TABLE agendamentos_online 
ADD CONSTRAINT check_telefone_format 
CHECK (telefone ~ '^[0-9]{8,15}$' OR telefone ~ '^\+[0-9]{8,15}$');

-- Constraint for observacoes: max 500 characters to prevent DoS
ALTER TABLE agendamentos_online 
ADD CONSTRAINT check_observacoes_length 
CHECK (observacoes IS NULL OR length(observacoes) <= 500);