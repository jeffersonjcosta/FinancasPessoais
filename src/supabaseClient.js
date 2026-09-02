import { createClient } from '@supabase/supabase-js';

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_SUPABASE_URL') : null;
const localKey = typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') : null;

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Chaves de demonstração/fallback
const defaultUrl = 'https://dzgclwwdyqgyenzkwsdb.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Z2Nsd3dkeXFneWVuemt3c2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MDYyMzQsImV4cCI6MjEwMTE4MjIzNH0.YkvrQUQfREjShhN14tIv0HF3Uq4UbX7Sn-5rfdooeps';

export const supabaseUrl = (localUrl && localUrl.trim()) || (envUrl && envUrl.trim()) || defaultUrl;
export const supabaseAnonKey = (localKey && localKey.trim()) || (envKey && envKey.trim()) || defaultKey;

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const getSupabaseConfig = () => ({
  supabaseUrl,
  supabaseAnonKey,
  isCustom: Boolean(localUrl && localKey)
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

