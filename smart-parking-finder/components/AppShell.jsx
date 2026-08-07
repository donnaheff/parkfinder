'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/map', label: 'Map', key: 'map' },
  { href: '/lots', label: 'Parking lots', key: 'lots' },
  { href: '/areas', label: 'Areas', key: 'areas' },
  { href: '/updates', label: 'Updates', key: 'updates' },
  { href: '/owner', label: 'Owner', key: 'owner' },
  { href: '/operator', label: 'Operator', key: 'operator' },
  { href: '/admin', label: 'Admin', key: 'admin' },
];

const BOTTOM_LINKS = NAV_LINKS.slice(0, 4);

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <main className="app-shell">
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
        </nav>
      </header>

      {children}

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {BOTTOM_LINKS.map((link) => (
          <Link key={link.key} href={link.href} className={pathname === link.href ? 'active' : ''}>
            {link.label === 'Parking lots' ? 'Lots' : link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
