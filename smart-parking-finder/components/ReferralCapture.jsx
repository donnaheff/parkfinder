'use client';

import { useEffect } from 'react';
import { useSession } from './SessionProvider';
import { applyReferralCode } from '../lib/api';

const STORAGE_KEY = 'parkswift_pending_referral';

// Two halves of one flow: /login stores ?ref=CODE here on load (a magic-link
// or email-confirm signup means the session doesn't exist yet at that
// point), and this component — mounted once in app/layout.jsx, so it sees
// every page — submits it the moment a session actually appears, then
// clears it so it's never resubmitted.
export function stashReferralCode(code) {
  try {
    sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage unavailable (private browsing, etc.) — the referral is
    // simply not captured; not worth failing sign-up over.
  }
}

export default function ReferralCapture() {
  const { session } = useSession();

  useEffect(() => {
    if (!session) return;
    let code;
    try {
      code = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (!code) return;
    applyReferralCode(code)
      .catch(() => {}) // e.g. self-referral, already recorded, invalid code — nothing the user needs to see
      .finally(() => {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      });
  }, [session]);

  return null;
}
