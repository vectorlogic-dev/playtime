import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const IS_DEV = import.meta.env.DEV;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient<Database> | null = hasSupabaseEnv
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  const warnKey = '__supabaseEnvWarned';
  const globalAny = globalThis as Record<string, unknown>;
  if (!globalAny[warnKey]) {
    console.warn('Supabase env vars missing; running without Supabase.');
    globalAny[warnKey] = true;
  }
}
