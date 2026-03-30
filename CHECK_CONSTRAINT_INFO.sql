-- INVESTIGAR CONSTRAINT check_horario_valido
SELECT 
    conrelid::regclass AS table_name, 
    conname AS constraint_name, 
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint 
WHERE conname = 'check_horario_valido';
