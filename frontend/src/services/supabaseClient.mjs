import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { getAppConfig, hasSupabaseConfig } from "../config.mjs";

let client;

export function getSupabaseClient() {
  const config = getAppConfig();

  if (!hasSupabaseConfig(config)) {
    throw new Error("Supabase is not configured. Create frontend/src/env.local.js first.");
  }

  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  return client;
}
