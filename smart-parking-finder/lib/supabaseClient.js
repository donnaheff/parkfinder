import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabaseClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set to use authentication.');
  }
  client = createClient(url, anonKey);
  return client;
}

export async function signUpWithPassword(email, password) {
  const { data, error } = await getSupabaseClient().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithPassword(email, password) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email) {
  const { error } = await getSupabaseClient().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}
