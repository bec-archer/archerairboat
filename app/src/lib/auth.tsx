'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({ session: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase().auth.signOut();
  };

  return <AuthCtx.Provider value={{ session, loading, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}

/**
 * Deep-link bounce: SMS links open /a?id=xxx. If logged out, we stash the
 * target, run OTP login, then return. Kept in sessionStorage (survives the
 * login round-trip, dies with the tab — nothing sensitive persisted).
 */
const RETURN_KEY = 'archer-return-to';

export function stashReturnTo(path: string) {
  try { sessionStorage.setItem(RETURN_KEY, path); } catch {}
}

export function popReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return v;
  } catch {
    return null;
  }
}
