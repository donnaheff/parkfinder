'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

const SessionContext = createContext({ session: null, user: null, loading: true });

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch {
      // Supabase env vars not configured (e.g. local dev without auth set up yet).
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
