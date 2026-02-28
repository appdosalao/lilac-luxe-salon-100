// This file creates a Supabase client that does NOT keep an auth session,
// effectively acting as an anonymous client for RLS policies that target 'anon'.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dfwepnzwktjyhvfmpuxo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmd2Vwbnp3a3RqeWh2Zm1wdXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzE4NzQsImV4cCI6MjA3MTE0Nzg3NH0.9BR-N9tSzHetSL50Dsalwb-q_dNHfdQBp32Y9qIXlag";

export const supabasePublic = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

