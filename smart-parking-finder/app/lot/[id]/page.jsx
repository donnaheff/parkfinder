import { notFound } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import LotDetailClient from '../../../components/LotDetailClient';
import { getParkServer, getReviewsServer } from '../../../lib/api-server';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { lot } = await getParkServer(id);
  if (!lot) return { title: 'Parking lot not found — ParkSwift' };
  return {
    title: `${lot.name} — ParkSwift`,
    description: `${lot.name} in ${lot.area}${lot.city ? `, ${lot.city}` : ''} — ${lot.available_spaces}/${lot.capacity} spaces available.`,
  };
}

export default async function LotDetailPage({ params }) {
  const { id } = await params;
  const { lot } = await getParkServer(id);
  if (!lot) notFound();
  const reviews = await getReviewsServer(id);

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">{lot.area}{lot.city ? `, ${lot.city}` : ''}</p>
        <h1>{lot.name}</h1>
        <p className="lead">{lot.address}</p>
      </section>

      <LotDetailClient lot={lot} initialReviews={reviews} />
    </AppShell>
  );
}
