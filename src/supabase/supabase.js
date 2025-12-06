import { createClient } from '@supabase/supabase-js';

// Safe environment variable access
const getEnv = (key, fallback) => {
  try {
    return import.meta.env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL', 'https://fdvzucfdwughipygcmpt.supabase.co');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdnp1Y2Zkd3VnaGlweWdjbXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDc4MTgsImV4cCI6MjA4MDQyMzgxOH0.PG2fnExF772N1cTvTBorkKmkQQzYo2IKTdrK4Fe4rCs');

let supabaseClient;

// Mock client generator to prevent crashes if credentials fail
const createMockClient = () => ({
  from: () => createMockClient(),
  select: () => createMockClient(),
  insert: () => createMockClient(),
  update: () => createMockClient(),
  delete: () => createMockClient(),
  eq: () => createMockClient(),
  order: () => createMockClient(),
  limit: () => createMockClient(),
  single: () => Promise.resolve({ data: null, error: null }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ error: { message: 'Mock auth enabled' } }),
    signOut: () => Promise.resolve({ error: null }),
  }
});

try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'undefined') {
    console.warn('Supabase credentials missing or invalid. Using mock client.');
    supabaseClient = createMockClient();
  } else {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  supabaseClient = createMockClient();
}

export default supabaseClient;