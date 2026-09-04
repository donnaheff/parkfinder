import AppShell from '../../components/AppShell';
import LotsClient from '../../components/LotsClient';
import { getParksServer } from '../../lib/api-server';

export const metadata = {
  title: 'Parking lots — ParkSwift',
  description: 'Filter by destination, amenity, and live availability across every verified and pending car park.',
};

export default async function LotsPage({ searchParams }) {
  const sp = await searchParams;
  const q = sp?.q || '';
  const { lots } = await getParksServer({ q });

  return (
    <AppShell>
      <LotsClient initialLots={lots} initialQuery={q} />
    </AppShell>
  );
}
