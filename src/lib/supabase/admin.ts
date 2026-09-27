import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — omzeilt RLS volledig. Enkel gebruiken voor
 * operaties die écht niet via de normale, aan de gebruiker gebonden
 * client kunnen (op dit moment enkel: een account permanent verwijderen
 * via de Auth Admin API). NOOIT importeren in client-side code, en de
 * SUPABASE_SERVICE_ROLE_KEY nooit als NEXT_PUBLIC_-variabele zetten.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
