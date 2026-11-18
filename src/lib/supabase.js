import { createClient } from '@supabase/supabase-js';
import { publicEnv } from './env';
export const supabase = createClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'amex-house-auth',
  },
  global: { headers: { 'X-Client-Info': 'amex-house-web' } },
});
