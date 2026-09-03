'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import LotCard from '../../components/LotCard';
import { useSession } from '../../components/SessionProvider';
import { useToast } from '../../components/ToastProvider';
import { deleteReview, getPark, getReviews, getSavedParks, postReview, saveParkingLot } from '../../lib/api';

const STAR_VALUES = [1, 2, 3, 4, 5];

export default function LotDetailPage() {
  const { session, user } = useSession();
  const showToast = useToast();
  const [lotId, setLotId] = useState(null);
  const [lot, setLot] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    setLotId(id);
  }, []);

  async function load(id) {
    setLoading(true);
    try {
      setLot(await getPark(id));
    } catch (err) {
      showToast(err.message);
    }
    try {
      setReviews(await getReviews(id));
    } catch {
      // Reviews are a secondary feature — a lot should still render without them.
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!lotId) return;
    load(lotId);
    if (session) {
      getSavedParks().then((rows) => setSaved(rows.some((r) => r.id === lotId))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId, session]);

  const myReview = reviews.find((r) => r.user_id === user?.id);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  async function handleSave() {
    if (!session) { showToast('Sign in to save parking lots.'); return; }
    try {
      await saveParkingLot(lot.id);
      setSaved(true);
      showToast(`${lot.name} saved to your list.`);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!session) { showToast('Sign in to leave a review.'); return; }
    setSubmitting(true);
    try {
      await postReview({ parking_lot_id: lot.id, rating, comment });
      showToast(myReview ? 'Review updated.' : 'Review posted.');
      setComment('');
      load(lotId);
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReview() {
    if (!myReview) return;
    try {
      await deleteReview(myReview.id);
      showToast('Review removed.');
      load(lotId);
    } catch (err) {
      showToast(err.message);
    }
  }

  if (loading) {
    return <AppShell><section className="panel card"><p className="muted">Loading…</p></section></AppShell>;
  }

  if (!lot) {
    return <AppShell><section className="panel card"><p className="muted">Parking lot not found.</p></section></AppShell>;
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">{lot.area}</p>
        <h1>{lot.name}</h1>
        <p className="lead">{lot.address}</p>
      </section>

      <section className="grid aside">
        <div>
          <LotCard lot={lot} saved={saved} onSave={handleSave} />
        </div>
        <article className="panel card">
          <div className="card-header">
            <div>
              <h2>Reviews</h2>
              <p className="muted">{avgRating ? `${avgRating} average · ${reviews.length} review${reviews.length === 1 ? '' : 's'}` : 'No reviews yet'}</p>
            </div>
          </div>

          {session && (
            <form className="form-stack" onSubmit={handleSubmitReview} style={{ marginBottom: 16 }}>
              <label>Your rating
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  {STAR_VALUES.map((v) => <option key={v} value={v}>{v} star{v > 1 ? 's' : ''}</option>)}
                </select>
              </label>
              <label>Comment
                <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?" />
              </label>
              <div className="actions" style={{ marginTop: 0 }}>
                <button className="btn primary" type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : myReview ? 'Update review' : 'Post review'}
                </button>
                {myReview && <button className="btn danger" type="button" onClick={handleDeleteReview}>Delete my review</button>}
              </div>
            </form>
          )}

          <div className="timeline">
            {reviews.map((r) => (
              <div key={r.id} className="timeline-item">
                <div className="timeline-time">{'⭐'.repeat(r.rating)}</div>
                <div>
                  <div className="muted small">{new Date(r.created_at).toLocaleDateString()}{r.user_id === user?.id ? ' · you' : ''}</div>
                  {r.comment && <p style={{ margin: '4px 0 0' }}>{r.comment}</p>}
                </div>
              </div>
            ))}
            {reviews.length === 0 && <p className="muted">Be the first to review this car park.</p>}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
