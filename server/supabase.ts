import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://spyqcxpbtbjcrkctqfby.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY ausente — configure o arquivo .env antes de subir o servidor.'
  );
}

/**
 * Cliente admin (service_role) — usado APENAS no backend.
 * Bypassa o RLS de propósito: a fila de broadcast só existe aqui.
 */
export const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
