import { createClient } from "@supabase/supabase-js";

// Bypass RLS — usar APENAS em Server Actions e Route Handlers do módulo /settings
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
