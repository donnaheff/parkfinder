'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from './SessionProvider';
import { useToast } from './ToastProvider';
import { signOut } from '../lib/supabaseClient';

const NAV_LINKS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/map', label: 'Map', key: 'map' },
  { href: '/lots', label: 'Parking lots', key: 'lots' },
  { href: '/areas', label: 'Areas', key: 'areas' },
  { href: '/updates', label: 'Updates', key: 'updates' },
  { href: '/reservations', label: 'Reservations', key: 'reservations' },
  { href: '/owner', label: 'Owner', key: 'owner' },
  { href: '/operator', label: 'Operator', key: 'operator' },
  { href: '/admin', label: 'Admin', key: 'admin' },
];

const BOTTOM_LINKS = NAV_LINKS.slice(0, 4);

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { session, user, loading } = useSession();
  const router = useRouter();
  const showToast = useToast();

  async function handleSignOut() {
    try {
      await signOut();
      showToast('Signed out.');
      router.push('/');
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">P</span>
          <span>ParkSwift</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link key={link.key} href={link.href} className={pathname === link.href ? 'active' : ''}>
              {link.label}
            </Link>
          ))}
          <span className="status-pill">Live API</span>
          {!loading && (session ? (
            <>
              <span className="pill" title={user?.email}>{user?.email}</span>
              <button className="btn secondary" type="button" onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <Link href="/login" className={pathname === '/login' ? 'active' : ''}>Sign in</Link>
          ))}
        </nav>
      </header>

      <main id="main-content">{children}</main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {BOTTOM_LINKS.map((link) => (
          <Link key={link.key} href={link.href} className={pathname === link.href ? 'active' : ''}>
            {link.label === 'Parking lots' ? 'Lots' : link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
