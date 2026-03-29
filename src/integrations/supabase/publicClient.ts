// This file creates a Supabase client that does NOT keep an auth session,
// effectively acting as an anonymous client for RLS policies that target 'anon'.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createLoggedFetch } from './loggedFetch';

const SUPABASE_URL = "https://dfwepnzwktjyhvfmpuxo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmd2Vwbnp3a3RqeWh2Zm1wdXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzE4NzQsImV4cCI6MjA3MTE0Nzg3NH0.9BR-N9tSzHetSL50Dsalwb-q_dNHfdQBp32Y9qIXlag";

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
