import Link from 'next/link';
import AppShell from '../../components/AppShell';
import { getAreasServer } from '../../lib/api-server';

export const metadata = {
  title: 'Parking by area — ParkSwift',
  description: 'See how many car parks and available spaces each neighborhood has right now.',
};

export default async function AreasPage() {
  const { areas } = await getAreasServer();

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Neighborhoods</p>
        <h1>Parking by area</h1>
        <p className="lead">See how many car parks and available spaces each neighborhood has right now.</p>
      </section>

      <section className="grid three">
        {areas.map((area) => (
          <Link key={area.area} className="card" href={`/lots?q=${encodeURIComponent(area.area)}`}>
            <h2>{area.area}</h2>
            <div className="lot-meta">
              <span>🅿️ {area.lots} lot{area.lots === 1 ? '' : 's'}</span>
              <span>{area.available_spaces} open spaces</span>
              <span>{area.owner_listed} owner-listed</span>
            </div>
          </Link>
        ))}
        {areas.length === 0 && <p className="muted">No areas found yet.</p>}
      </section>
    </AppShell>
  );
}
