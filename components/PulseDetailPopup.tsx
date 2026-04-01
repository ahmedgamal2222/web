'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import type { PulseItem } from '@/lib/api';

// ── مشتركات ──────────────────────────────────────────────────────────────────
export type PulseUrlType = 'institution' | 'event' | 'news' | 'other';

export function parsePulseUrl(url: string | null): { type: PulseUrlType; id: number | null } {
  if (!url) return { type: 'other', id: null };
  const m = url.match(/\/(institutions|events|news)\/(\d+)/);
  if (!m) return { type: 'other', id: null };
  const type = m[1] === 'institutions' ? 'institution'
             : m[1] === 'events'       ? 'event'
             : 'news';
  return { type: type as PulseUrlType, id: parseInt(m[2]) };
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  return `منذ ${Math.floor(d / 30)} شهر`;
}

function pulseIcon(content: string): string {
  if (/اتفاقي|توافق|تعاون|شراكة/u.test(content)) return '🤝';
  if (/فعالي|حدث|ملتقى|مؤتمر/u.test(content)) return '📅';
  if (/خبر|أعلن|أطلق/u.test(content)) return '📢';
  if (/انضم|أُسِّست|مؤسسة/u.test(content)) return '🏛️';
  if (/محاضر|درس|تعليم/u.test(content)) return '🎓';
  return '✦';
}

async function fetchPulseDetail(type: PulseUrlType, id: number): Promise<any> {
  if (type === 'institution') {
    const res = await fetch(`${API_BASE}/api/institutions/${id}`, { headers: getAuthHeaders() });
    const json = await res.json() as any;
    return json.data || json;
  }
  if (type === 'event') {
    const res = await fetch(`${API_BASE}/api/events/${id}`, { headers: getAuthHeaders() });
    if (res.ok) {
      const json = await res.json() as any;
      return json.data || json;
    }
    const all = await fetch(`${API_BASE}/api/events`, { headers: getAuthHeaders() });
    const allJson = await all.json() as any;
    return ((allJson.data || allJson) as any[]).find((e: any) => e.id === id) || null;
  }
  if (type === 'news') {
    const res = await fetch(`${API_BASE}/api/news/${id}`, { headers: getAuthHeaders() });
    if (res.ok) {
      const json = await res.json() as any;
      return json.data || json;
    }
    const all = await fetch(`${API_BASE}/api/news`, { headers: getAuthHeaders() });
    const allJson = await all.json() as any;
    return ((allJson.data || allJson) as any[]).find((n: any) => n.id === id) || null;
  }
  return null;
}

// ── ثوابت اللون ───────────────────────────────────────────────────────────────
const TEAL  = '#4E8D9C';
const MINT  = '#EDF7BD';
const NAVY  = '#281C59';
const GOLD  = '#f5c842';

// ════════════════════════════════════════════════════════════════
// ── مكون البوب-أب ───────────────────────────────────────────
// ════════════════════════════════════════════════════════════════
export default function PulseDetailPopup({
  item,
  onClose,
}: {
  item: PulseItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { type, id } = parsePulseUrl(item.url);

  useEffect(() => {
    if (id !== null && type !== 'other') {
      fetchPulseDetail(type, id)
        .then(d => { setDetail(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isEventEnded = type === 'event' && detail
    ? new Date(detail.end_datetime || detail.start_datetime || 0) < new Date()
    : false;

  const icon = pulseIcon(item.content);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5,3,20,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, #1a1650 0%, #0e0c2e 100%)',
        border: `1.5px solid ${item.is_featured ? GOLD + '66' : 'rgba(78,141,156,0.35)'}`,
        borderRadius: 24,
        maxWidth: 580, width: '100%',
        padding: '32px 28px',
        position: 'relative',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        maxHeight: '90vh', overflowY: 'auto',
        direction: 'rtl', fontFamily: 'Tajawal, sans-serif',
      }}>
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, left: 14,
            background: 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: '50%',
            width: 34, height: 34, cursor: 'pointer',
            color: '#aaa', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>

        {/* أيقونة + توقيت */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: '2.4rem' }}>{icon}</span>
          <div>
            {item.is_featured === 1 && (
              <div style={{
                background: GOLD, color: '#1a1a1a',
                fontSize: '0.65rem', fontWeight: 800,
                padding: '2px 10px', borderRadius: 20,
                display: 'inline-block', marginBottom: 4,
              }}>✦ نبضة مميزة</div>
            )}
            <div style={{ color: '#6e6a99', fontSize: '0.78rem' }}>
              ⏱ {timeAgo(item.pulse_date || item.created_at || '')}
            </div>
          </div>
        </div>

        {/* صورة النبضة */}
        {item.image_url && (
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 20, maxHeight: 200 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt="" style={{ width: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* نص النبضة */}
        <p style={{
          color: '#e0dcff', fontSize: '1.05rem', lineHeight: 1.75,
          margin: '0 0 24px', fontWeight: 500,
        }}>
          {item.content}
        </p>

        {/* تفاصيل النوع */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#556' }}>
            جارٍ تحميل التفاصيل…
          </div>
        ) : detail ? (
          <div style={{
            background: 'rgba(78,141,156,0.07)',
            border: '1px solid rgba(78,141,156,0.2)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 24,
          }}>
            {/* مؤسسة */}
            {type === 'institution' && (
              <>
                {detail.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.logo_url} alt="" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 10, marginBottom: 10 }} />
                )}
                <h3 style={{ color: MINT, margin: '0 0 6px', fontSize: '1.05rem' }}>
                  {detail.name_ar || detail.name}
                </h3>
                {detail.city && (
                  <p style={{ color: '#8888aa', margin: '0 0 4px', fontSize: '0.85rem' }}>
                    📍 {detail.city}{detail.country ? `، ${detail.country}` : ''}
                  </p>
                )}
                {detail.description && (
                  <p style={{ color: '#a0a0cc', margin: '8px 0 0', fontSize: '0.87rem', lineHeight: 1.6 }}>
                    {detail.description}
                  </p>
                )}
              </>
            )}

            {/* فعالية */}
            {type === 'event' && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <h3 style={{ color: MINT, margin: 0, fontSize: '1.05rem', flex: 1 }}>
                    {detail.title}
                  </h3>
                  {isEventEnded && (
                    <span style={{
                      background: 'rgba(248,113,113,0.15)',
                      border: '1px solid rgba(248,113,113,0.4)',
                      color: '#f87171', fontSize: '0.72rem', fontWeight: 700,
                      padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>
                      ⏹ انتهت الفعالية
                    </span>
                  )}
                </div>
                {detail.description && (
                  <p style={{ color: '#a0a0cc', margin: '0 0 10px', fontSize: '0.87rem', lineHeight: 1.65 }}>
                    {detail.description}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {detail.start_datetime && (
                    <span style={{ color: '#8888aa', fontSize: '0.82rem' }}>🗓 يبدأ: {fmtDate(detail.start_datetime)}</span>
                  )}
                  {detail.end_datetime && (
                    <span style={{ color: '#8888aa', fontSize: '0.82rem' }}>🏁 ينتهي: {fmtDate(detail.end_datetime)}</span>
                  )}
                  {detail.location && (
                    <span style={{ color: '#8888aa', fontSize: '0.82rem' }}>📍 {detail.location}</span>
                  )}
                  {detail.is_online && !detail.location && (
                    <span style={{ color: TEAL, fontSize: '0.82rem' }}>🌐 فعالية إلكترونية</span>
                  )}
                </div>
              </>
            )}

            {/* خبر */}
            {type === 'news' && (
              <>
                {detail.image_url && (
                  <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 12, maxHeight: 160 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={detail.image_url} alt="" style={{ width: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <h3 style={{ color: MINT, margin: '0 0 10px', fontSize: '1.05rem' }}>
                  {detail.title}
                </h3>
                {detail.content && (
                  <p style={{ color: '#a0a0cc', margin: 0, fontSize: '0.87rem', lineHeight: 1.7 }}>
                    {detail.content.slice(0, 300)}{detail.content.length > 300 ? '…' : ''}
                  </p>
                )}
                {detail.published_at && (
                  <div style={{ color: '#6e6a99', fontSize: '0.78rem', marginTop: 10 }}>
                    📅 {fmtDate(detail.published_at)}
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}

        {/* أزرار التنقل */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 22px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 30, cursor: 'pointer',
            color: '#aaa', fontFamily: 'Tajawal, sans-serif',
            fontWeight: 600, fontSize: '0.9rem',
          }}>
            إغلاق
          </button>

          {type === 'institution' && item.url && (
            <button onClick={() => { router.push(item.url!); onClose(); }} style={{
              padding: '10px 24px',
              background: `linear-gradient(135deg,${TEAL},${NAVY})`,
              border: 'none', borderRadius: 30, cursor: 'pointer',
              color: '#fff', fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700, fontSize: '0.9rem',
            }}>
              🏛️ عرض المؤسسة →
            </button>
          )}

          {type === 'event' && item.url && !isEventEnded && (
            <button onClick={() => { router.push(item.url!); onClose(); }} style={{
              padding: '10px 24px',
              background: `linear-gradient(135deg,${TEAL},${NAVY})`,
              border: 'none', borderRadius: 30, cursor: 'pointer',
              color: '#fff', fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700, fontSize: '0.9rem',
            }}>
              📅 عرض الفعالية →
            </button>
          )}

          {type === 'news' && item.url && (
            <button onClick={() => { router.push(item.url!); onClose(); }} style={{
              padding: '10px 24px',
              background: `linear-gradient(135deg,${TEAL},${NAVY})`,
              border: 'none', borderRadius: 30, cursor: 'pointer',
              color: '#fff', fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700, fontSize: '0.9rem',
            }}>
              📢 قراءة الخبر كاملاً →
            </button>
          )}

          {type === 'other' && item.url && (
            <button onClick={() => { router.push(item.url!); onClose(); }} style={{
              padding: '10px 24px',
              background: `linear-gradient(135deg,${TEAL},${NAVY})`,
              border: 'none', borderRadius: 30, cursor: 'pointer',
              color: '#fff', fontFamily: 'Tajawal, sans-serif',
              fontWeight: 700, fontSize: '0.9rem',
            }}>
              عرض التفاصيل →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}