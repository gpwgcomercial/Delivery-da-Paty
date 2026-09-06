import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ATENÇÃO: isto usa a Service Role Key, que ignora todo o RLS.
// Só pode ser chamado a partir de Server Actions/Route Handlers —
// nunca importe isto num Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
