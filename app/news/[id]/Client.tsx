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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function NewsDetailPage() {
  const id =
    typeof window !== 'undefined'
      ? (window.location.pathname.split('/').filter(Boolean)[1] ?? 'default')
      : 'default';
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr =
      typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(API_BASE + '/api/news/' + id, {
      headers: {
        'X-Session-ID':
          typeof window !== 'undefined'
            ? localStorage.getItem('sessionId') || ''
            : '',
      },
    })
      .then((r) => r.json())
      .then((d) => {
        const newsItem = d.data ?? d;
        setItem(newsItem);
        if (newsItem && newsItem.institution_id) {
          fetch(
            API_BASE +
              '/api/news?institution_id=' +
              newsItem.institution_id +
              '&limit=4'
          )
            .then((r) => r.json())
            .then((rd) =>
              setRelated(
                (rd.data || [])
                  .filter((n: any) => String(n.id) !== String(id))
                  .slice(0, 3)
              )
            );
        }
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div style={{ minHeight: '100vh', background: COLORS.darkNavy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        جاري التحميل...
      </div>
    );

  if (!item)
    return (
      <div style={{ minHeight: '100vh', background: COLORS.darkNavy, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: 16 }}>
        <span style={{ fontSize: '3rem' }}>💭</span>
        <p>الخبر غير موجود</p>
        <Link href="/news" style={{ color: COLORS.softGreen }}>← العودة للأخبار</Link>
      </div>
    );

  return (
    <div style={{ minHeight: '100vh', background: COLORS.darkNavy, color: 'white', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
      {item.image_url && (
        <div style={{ height: 360, background: 'linear-gradient(to bottom, rgba(40,28,89,0) 0%, ' + COLORS.darkNavy + ' 100%), url(' + item.image_url + ') center/cover' }} />
      )}

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 18px', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
            ← رجوع
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {item.category && (
            <span style={{ background: COLORS.teal + '30', color: COLORS.softGreen, padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', border: '1px solid ' + COLORS.teal + '50' }}>
              {item.category}
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
            📅 {new Date(item.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.4, marginBottom: 24, color: COLORS.lightMint }}>
          {item.title}
        </h1>

        {(item.institution_name_ar || item.institution_name) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
              {(item.institution_name_ar || item.institution_name).charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.institution_name_ar || item.institution_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>المؤسسة الناشرة</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', marginBottom: 48 }}>
          {item.content || 'لا يوجد محتوى تفصيلي لهذا الخبر.'}
        </div>

        {item.video_url && (
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ color: COLORS.softGreen, marginBottom: 12 }}>🎥 فيديو مرتبط</h3>
            <video src={item.video_url} controls style={{ width: '100%', borderRadius: 12 }} />
          </div>
        )}

        {related.length > 0 && (
          <div>
            <h3 style={{ color: COLORS.lightMint, marginBottom: 20, fontSize: '1.2rem' }}>📰 أخبار ذات صلة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {related.map((n: any) => (
                <Link key={n.id} href={'/news/' + n.id} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ background: COLORS.darkCard, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                  >
                    {n.image_url && <div style={{ height: 120, background: 'url(' + n.image_url + ') center/cover' }} />}
                    <div style={{ padding: '14px' }}>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: COLORS.lightMint, fontWeight: 600, lineHeight: 1.4 }}>
                        {n.title.length > 80 ? n.title.slice(0, 80) + '...' : n.title}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(n.published_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
