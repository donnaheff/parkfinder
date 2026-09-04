import AppShell from '../../components/AppShell';
import UpdatesClient from '../../components/UpdatesClient';
import { getParksServer, getUpdatesServer } from '../../lib/api-server';

export const metadata = {
  title: 'Live status updates — ParkSwift',
  description: 'Community-reported parking status updates between sensor syncs.',
};

export default async function UpdatesPage() {
  const [{ lots }, { updates }] = await Promise.all([getParksServer({}), getUpdatesServer()]);

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Community reports</p>
        <h1>Live status updates</h1>
        <p className="lead">Drivers can flag when a car park is full, filling fast, or has a security concern — helping keep availability accurate between sensor syncs.</p>
      </section>

      <UpdatesClient initialLots={lots} initialReports={updates} />
    </AppShell>
  );
}
