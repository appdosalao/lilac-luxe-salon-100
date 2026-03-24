import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = "https://dfwepnzwktjyhvfmpuxo.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente.');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
