import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env");
  process.exit(1);
}

export const sb = createClient(supabaseUrl, supabaseKey);
export const sbAnon = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY
);