import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localUrl = localStorage.getItem('CUSTOM_SUPABASE_URL');
const localKey = localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY');

// Chaves do projeto Supabase ativo do usuário (dzgclwwdyqgyenzkwsdb)
const defaultUrl = 'https://dzgclwwdyqgyenzkwsdb.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Z2Nsd3dkeXFneWVuemt3c2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MDYyMzQsImV4cCI6MjEwMTE4MjIzNH0.YkvrQUQfREjShhN14tIv0HF3Uq4UbX7Sn-5rfdooeps';

const supabaseUrl = envUrl || localUrl || defaultUrl;
const supabaseAnonKey = envKey || localKey || defaultKey;

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
