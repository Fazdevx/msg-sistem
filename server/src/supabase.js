import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const sb = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
export const sbAnon = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function checkSupabase() {
  if (!sb) {
    throw new Error("SUPABASE_URL o SUPABASE_SERVICE_KEY no configuradas");
  }
  if (!sbAnon) {
    throw new Error("SUPABASE_ANON_KEY no configurada");
  }
}
