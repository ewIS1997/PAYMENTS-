export let isSupabaseConfigured = false;

export function enableSupabaseMode() {
  isSupabaseConfigured = true;
}

export function disableSupabaseMode() {
  isSupabaseConfigured = false;
}
