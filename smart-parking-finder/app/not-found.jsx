import Link from 'next/link';
import AppShell from '../components/AppShell';

export default function NotFound() {
  return (
    <AppShell>
      <section className="panel card">
        <h1>Page not found</h1>
        <p className="muted">This parking lot or page doesn&rsquo;t exist, or it may have been removed.</p>
        <div className="actions"><Link className="btn primary" href="/lots">Browse parking lots</Link></div>
      </section>
    </AppShell>
  );
}
