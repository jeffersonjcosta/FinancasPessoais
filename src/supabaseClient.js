import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localUrl = localStorage.getItem('CUSTOM_SUPABASE_URL');
const localKey = localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY');

// Chaves do projeto Supabase do usuário (vfzdezjgpqmcuhwcrlhi)
const defaultUrl = 'https://vfzdezjgpqmcuhwcrlhi.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmemRlempncHFtY3Vod2NybGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDU0MjMsImV4cCI6MjEwMDQyMTQyM30.4vhJvjAt7QOEU1Q8jLfbHDVsTqI1PY8QJGAgM0lS5Aw';

const supabaseUrl = envUrl || localUrl || defaultUrl;
const supabaseAnonKey = envKey || localKey || defaultKey;

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
