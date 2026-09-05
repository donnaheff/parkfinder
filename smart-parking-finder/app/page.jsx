import AppShell from '../components/AppShell';
import HomeClient from '../components/HomeClient';
import { getParksServer } from '../lib/api-server';

export const metadata = {
  title: 'ParkSwift — Find and reserve real parking spaces',
  description: 'Search live parking availability and reserve a space before you arrive, backed by real-time data.',
};

export default async function HomePage() {
  const { lots } = await getParksServer({ available: 'true' });

  return (
    <AppShell>
      <HomeClient initialLots={lots} />
    </AppShell>
  );
}
