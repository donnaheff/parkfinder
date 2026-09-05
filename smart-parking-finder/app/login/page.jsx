'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { useSession } from '../../components/SessionProvider';
import { useToast } from '../../components/ToastProvider';
import { signInWithMagicLink, signInWithPassword, signUpWithPassword } from '../../lib/supabaseClient';
import { stashReferralCode } from '../../components/ReferralCapture';

export default function LoginPage() {
  const { session, loading } = useSession();
  const router = useRouter();
  const showToast = useToast();
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up' | 'magic-link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace('/owner');
  }, [loading, session, router]);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) { stashReferralCode(ref); setMode('sign-up'); }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'magic-link') {
        await signInWithMagicLink(email);
        setMagicLinkSent(true);
        showToast('Check your email for a sign-in link.');
      } else if (mode === 'sign-up') {
        await signUpWithPassword(email, password);
        showToast('Account created. Check your email to confirm, then sign in.');
        setMode('sign-in');
      } else {
        await signInWithPassword(email, password);
        showToast('Signed in.');
        router.replace('/owner');
      }
    } catch (err) {
      showToast(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Account</p>
        <h1>{mode === 'sign-up' ? 'Create your account' : 'Sign in'}</h1>
        <p className="lead">Sign in to save parking lots, manage your listings as an owner, or moderate submissions as an admin.</p>
      </section>

      <section className="panel card" style={{ maxWidth: 420 }}>
        <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
          <button className={`btn ${mode === 'sign-in' ? 'primary' : 'secondary'}`} type="button" onClick={() => setMode('sign-in')}>Sign in</button>
          <button className={`btn ${mode === 'sign-up' ? 'primary' : 'secondary'}`} type="button" onClick={() => setMode('sign-up')}>Sign up</button>
          <button className={`btn ${mode === 'magic-link' ? 'primary' : 'secondary'}`} type="button" onClick={() => setMode('magic-link')}>Magic link</button>
        </div>

        {mode === 'magic-link' && magicLinkSent ? (
          <p className="muted">A sign-in link has been sent to <strong>{email}</strong>. Open it on this device to finish signing in.</p>
        ) : (
          <form className="form-stack" onSubmit={handleSubmit}>
            <label>Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {mode !== 'magic-link' && (
              <label>Password
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
            )}
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : mode === 'magic-link' ? 'Send magic link' : 'Sign in'}
            </button>
          </form>
        )}
      </section>
    </AppShell>
  );
}
