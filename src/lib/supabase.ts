import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-url.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const isSupabaseConfigured = (): boolean => isConfigured;

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (isConfigured) {
  console.log('⚡ Supabase Client initialized with remote PostgreSQL instance.');
} else {
  console.log('ℹ️ Running in Local Storage / Live Demo Mode with persistent schema state.');
}
