'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useSession } from '../../components/SessionProvider';
import { useToast } from '../../components/ToastProvider';
import { adminDecision, deleteReview, getAdminSubmissions, getFlaggedReviews } from '../../lib/api';
import { verificationLabel } from '../../lib/format';

export default function AdminPage() {
  const { session, loading: sessionLoading } = useSession();
  const [submissions, setSubmissions] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const showToast = useToast();

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { setLoading(false); return; }
    setLoading(true);
    setError('');
    Promise.all([getAdminSubmissions(), getFlaggedReviews()])
      .then(([subs, reviews]) => { setSubmissions(subs); setFlaggedReviews(reviews); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading]);

  async function decide(id, action) {
    try {
      await adminDecision(id, action, '');
      showToast(`Listing ${action.replace('-', ' ')}d.`);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeleteReview(id) {
    try {
      await deleteReview(id);
      showToast('Review removed.');
      setFlaggedReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Moderation</p>
        <h1>Admin verification queue</h1>
        <p className="lead">Review owner-submitted car parks before they go live. Restricted to accounts listed in the <code>admins</code> table.</p>
      </section>

      {!sessionLoading && !session ? (
        <section className="panel card">
          <h2>Sign in to continue</h2>
          <div className="actions"><Link className="btn primary" href="/login">Sign in</Link></div>
        </section>
      ) : (
        <section className="panel card">
          <div className="card-header">
            <div>
              <h2>Pending submissions</h2>
              <p className="muted">{loading ? 'Loading…' : error ? error : `${submissions.length} awaiting review`}</p>
            </div>
          </div>
          {submissions.map((lot) => (
            <div key={lot.id} className="card" style={{ marginBottom: 12 }}>
              <div className="card-header">
                <div>
                  <h3>{lot.name}</h3>
                  <div className="muted">{lot.area} · {lot.address}</div>
                </div>
                <span className="badge">{verificationLabel(lot.verification_status)}</span>
              </div>
              <div className="lot-meta">
                <span>🅿️ {lot.available_spaces}/{lot.capacity} spaces</span>
                <span>🚶 {lot.walk_meters}m</span>
                <span>🚗 {lot.drive_minutes} min</span>
              </div>
              <div className="actions">
                <button className="btn primary" type="button" onClick={() => decide(lot.id, 'approve')}>Approve</button>
                <button className="btn secondary" type="button" onClick={() => decide(lot.id, 'request-info')}>Request info</button>
                <button className="btn danger" type="button" onClick={() => decide(lot.id, 'reject')}>Reject</button>
              </div>
            </div>
          ))}
          {!loading && !error && submissions.length === 0 && <p className="muted">Nothing pending review.</p>}
        </section>
      )}

      {session && (
        <section className="panel card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div>
              <h2>Flagged reviews</h2>
              <p className="muted">{loading ? 'Loading…' : `${flaggedReviews.length} flagged`}</p>
            </div>
          </div>
          {flaggedReviews.map((r) => (
            <div key={r.id} className="card" style={{ marginBottom: 12 }}>
              <div className="card-header">
                <div>
                  <h3>{r.parking_lots?.name || 'Parking lot'}</h3>
                  <div className="muted">{'⭐'.repeat(r.rating)} · {r.report_count} report{r.report_count === 1 ? '' : 's'}</div>
                </div>
              </div>
              {r.comment && <p className="muted">{r.comment}</p>}
              <div className="actions">
                <button className="btn danger" type="button" onClick={() => handleDeleteReview(r.id)}>Delete review</button>
              </div>
            </div>
          ))}
          {!loading && flaggedReviews.length === 0 && <p className="muted">No flagged reviews.</p>}
        </section>
      )}
    </AppShell>
  );
}
