'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  darkCard: '#1e1650',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const EVENT_TYPE_LABELS: Record<string, string> = {
  lecture: '🎤 محاضرة',
  conference: '🏛️ مؤتمر',
  workshop: '🛠️ ورشة عمل',
  seminar: '📚 ندوة',
  course: '🎓 دورة تدريبية',
};

// ─── Status helpers ────────────────────────────────────────────────────────────
function getEventStatus(start: string, end?: string) {
  const now = new Date();
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  if (now < s) return { label: '⏳ قادم', color: COLORS.teal };
  if (e && now <= e) return { label: '🔴 جاري الآن', color: COLORS.softGreen };
  return { label: '✅ منتهي', color: '#9E9E9E' };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const id = typeof window !== 'undefined'
    ? (window.location.pathname.split('/').filter(Boolean)[1] ?? 'default')
    : 'default';
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/api/events/${id}`, {
      headers: { 'X-Session-ID': typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '' },
    })
      .then(r => r.json())
      .then(d => {
        const ev = d.data ?? d;
        setItem(ev);
        if (ev?.institution_id) {
          fetch(`${API_BASE}/api/events?institution_id=${ev.institution_id}&limit=4`)
            .then(r => r.json())
            .then(rd => setRelated((rd.data || []).filter((e: any) => String(e.id) !== String(id)).slice(0, 3)));
        }
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const canManage = user?.role === 'admin' || (user?.institution_id && item && user.institution_id === item.institution_id);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: COLORS.darkNavy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>جاري التحميل...</div>
  );

  if (!item) return (
    <div style={{ minHeight: '100vh', background: COLORS.darkNavy, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 16 }}>
      <span style={{ fontSize: '3rem' }}>📭</span>
      <p>الفعالية غير موجودة</p>
      <Link href="/news" style={{ color: COLORS.softGreen }}>← العودة للأخبار والفعاليات</Link>
    </div>
  );

  const status = getEventStatus(item.start_datetime, item.end_datetime);
  const fmt = (d: string) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: COLORS.darkNavy, color: 'white', direction: 'rtl' }}>

      {/* Hero banner */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, ${COLORS.teal}80 100%)`,
        padding: '60px 20px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, background: 'radial-gradient(circle at 30% 50%, white 0%, transparent 60%)' }} />
        <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative' }}>
          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 18px', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
              ← رجوع
            </button>
          </div>

          {/* Status + type */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: status.color + '25', color: status.color, border: `1px solid ${status.color}50`, padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>
              {status.label}
            </span>
            {item.type && (
              <span style={{ background: 'rgba(255,255,255,0.08)', color: COLORS.lightMint, padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem' }}>
                {EVENT_TYPE_LABELS[item.type] || item.type}
              </span>
            )}
            {item.is_online && (
              <span style={{ background: 'rgba(78,141,156,0.2)', color: COLORS.softGreen, border: `1px solid ${COLORS.teal}`, padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem' }}>
                🌐 عبر الإنترنت
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.4, margin: '0 0 20px', color: COLORS.lightMint }}>
            {item.title}
          </h1>

          {/* Date + location row */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              📅 {fmt(item.start_datetime)}
              {item.end_datetime && ` — ${fmt(item.end_datetime)}`}
            </span>
            {item.location && (
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                📍 {item.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px' }}>

        {/* Institution */}
        {(item.institution_name_ar || item.institution_name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {(item.institution_name_ar || item.institution_name).charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.institution_name_ar || item.institution_name}</div>
              <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)' }}>المؤسسة المنظِّمة</div>
            </div>
          </div>
        )}

        {/* Online link */}
        {item.is_online && item.online_url && (
          <div style={{ background: 'rgba(78,141,156,0.1)', border: `1px solid ${COLORS.teal}50`, borderRadius: 14, padding: '18px 20px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4, color: COLORS.lightMint }}>🌐 رابط الفعالية الإلكترونية</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>انضم عبر الرابط أدناه</div>
            </div>
            <a href={item.online_url} target="_blank" rel="noopener noreferrer"
              style={{ background: COLORS.teal, color: 'white', padding: '10px 24px', borderRadius: 30, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
              انضم الآن ←
            </a>
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', marginBottom: 48 }}>
            {item.description}
          </div>
        )}

        {/* Related events */}
        {related.length > 0 && (
          <div>
            <h3 style={{ color: COLORS.lightMint, marginBottom: 20, fontSize: '1.2rem' }}>📅 فعاليات ذات صلة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {related.map((e: any) => {
                const s = getEventStatus(e.start_datetime, e.end_datetime);
                return (
                  <Link key={e.id} href={`/events/${e.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: COLORS.darkCard, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s' }}
                      onMouseEnter={ev => (ev.currentTarget.style.transform = 'translateY(-3px)')}
                      onMouseLeave={ev => (ev.currentTarget.style.transform = 'none')}>
                      <div style={{ background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`, padding: '12px', textAlign: 'center', color: 'white' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{new Date(e.start_datetime).toLocaleDateString('ar-EG', { day: 'numeric' })}</div>
                        <div style={{ fontSize: '0.8rem' }}>{new Date(e.start_datetime).toLocaleDateString('ar-EG', { month: 'long' })}</div>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.82rem', color: s.color, marginBottom: 6, display: 'block' }}>{s.label}</span>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: COLORS.lightMint, fontWeight: 600, lineHeight: 1.4 }}>
                          {e.title.length > 70 ? e.title.slice(0, 70) + '...' : e.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
