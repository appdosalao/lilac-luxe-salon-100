// This file creates a Supabase client that does NOT keep an auth session,
// effectively acting as an anonymous client for RLS policies that target 'anon'.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createLoggedFetch } from './loggedFetch';

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!VITE_SUPABASE_URL) throw new Error('VITE_SUPABASE_URL não definida');
if (!VITE_SUPABASE_ANON_KEY) throw new Error('VITE_SUPABASE_ANON_KEY não definida');

const SUPABASE_URL = VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = VITE_SUPABASE_ANON_KEY;

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
})();

export const supabasePublic = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'sb-public-no-session',
    storage: memoryStorage as any,
  },
  global: {
    fetch: createLoggedFetch({ label: 'supabasePublic', timeoutMs: 15000 }),
  },
});
