export function getAppConfig() {
  const config = globalThis.SMART_S2D_CONFIG ?? {};

  return {
    supabaseUrl: config.SUPABASE_URL ?? "",
    supabaseAnonKey: config.SUPABASE_ANON_KEY ?? "",
  };
}

export function hasSupabaseConfig(config = getAppConfig()) {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}
