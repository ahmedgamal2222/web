'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

interface Event {
  id: number;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  cover_image?: string;
  logo?: string;
  primary_color?: string;
  registration_open?: number;
  created_at: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/events?limit=100`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setEvents(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', direction: 'rtl', fontFamily: "'Cairo', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: 'var(--heading)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '0 0 0.75rem', fontWeight: 800 }}>
            🚀 انطلاقات المجرة الحضارية
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
            الفعاليات والانطلاقات الحضارية القادمة
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#4E8D9C' }}>جاري التحميل...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 20, color: '#888' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
            <div>لا توجد انطلاقات حالياً</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {events.map(ev => (
              <Link
                key={ev.id}
                href={`/${ev.slug}`}
                style={{
                  display: 'block', textDecoration: 'none',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(78,141,156,0.2)',
                  borderRadius: '1.25rem',
                  overflow: 'hidden',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                {ev.cover_image && (
                  <div style={{
                    height: 160,
                    background: `url(${ev.cover_image}) center/cover no-repeat`,
                  }} />
                )}
                <div style={{ padding: '1.25rem' }}>
                  <h2 style={{ color: 'var(--heading)', margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700 }}>
                    {ev.name_ar || ev.name}
                  </h2>
                  {ev.description && (
                    <p style={{ color: '#666', fontSize: '0.85rem', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {ev.description.substring(0, 120)}{ev.description.length > 120 ? '...' : ''}
                    </p>
                  )}
                  <div style={{ fontSize: '0.83rem', color: '#888', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>📅 {new Date(ev.start_date).toLocaleDateString('ar-EG')}</span>
                    {ev.location && <span>📍 {ev.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
