'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { fetchPulse, PulseItem } from '@/lib/api';
import PulseDetailPopup, { parsePulseUrl } from '@/components/PulseDetailPopup';

// ── نبضة المجرة – Wall Page ──────────────────────────────────────────────────

const COLORS = {
  bg: '#0a0618',
  card: '#13103a',
  cardHover: '#1a1650',
  border: 'rgba(78,141,156,0.20)',
  teal: '#4E8D9C',
  mint: '#EDF7BD',
  green: '#85C79A',
  navy: '#281C59',
  gold: '#f5c842',
  featured: '#1c1840',
};

// خريطة أيقونات بناءً على محتوى النبضة
function pulseIcon(content: string): string {
  if (/اتفاقي|توافق|تعاون|شراكة/u.test(content)) return '🤝';
  if (/فعالي|حدث|ملتقى|مؤتمر/u.test(content)) return '📅';
  if (/خبر|أعلن|أطلق/u.test(content)) return '📢';
  if (/انضم|أُسِّست|مؤسسة/u.test(content)) return '🏛️';
  if (/محاضر|درس|تعليم/u.test(content)) return '🎓';
  return '✦';
}

// تحويل التاريخ لعربي نسبي
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  const mo = Math.floor(d / 30);
  return `منذ ${mo} شهر`;
}

// ── بطاقة نبضة ──────────────────────────────────────────────────────────────
function PulseCard({ item, index, onOpen }: { item: PulseItem; index: number; onOpen: (item: PulseItem) => void }) {
  const isFeatured = !!item.is_featured;
  const icon = pulseIcon(item.content);
  const { type } = parsePulseUrl(item.url);

  const typeLabel =
    type === 'institution' ? '🏛️ مؤسسة' :
    type === 'event'       ? '📅 فعالية' :
    type === 'news'        ? '📢 خبر' : null;

  return (
    <article
      onClick={() => onOpen(item)}
      style={{
        background: isFeatured ? COLORS.featured : COLORS.card,
        border: `1px solid ${isFeatured ? COLORS.gold + '55' : COLORS.border}`,
        borderRadius: 16,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.18s, box-shadow 0.18s',
        animationDelay: `${index * 40}ms`,
        cursor: 'pointer',
      }}
      className="pulse-card"
    >
      {/* شارة مميزة */}
      {isFeatured && (
        <div style={{
          position: 'absolute', top: 12, left: 14,
          background: COLORS.gold, color: '#1a1a1a',
          fontSize: '0.65rem', fontWeight: 700,
          padding: '2px 10px', borderRadius: 20,
        }}>
          ✦ مميز
        </div>
      )}

      {/* صورة */}
      {item.image_url && (
        <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 160 }}>
          <img
            src={item.image_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      )}

      {/* محتوى */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{
          fontSize: '1.8rem', lineHeight: 1,
          flexShrink: 0, marginTop: 2,
        }}>
          {icon}
        </span>
        <p style={{
          color: '#e2e0ff',
          fontSize: '0.95rem',
          lineHeight: 1.65,
          margin: 0,
          fontFamily: 'Tajawal, sans-serif',
        }}>
          {item.content}
        </p>
      </div>

      {/* توقيت + نوع */}
      <div style={{
        fontSize: '0.75rem',
        color: '#6e6a99',
        marginTop: 'auto',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: COLORS.teal }}>⏱</span>
        {timeAgo(item.pulse_date || item.created_at || '')}
        {typeLabel && (
          <span style={{
            marginRight: 'auto', color: COLORS.teal,
            fontSize: '0.7rem',
            background: 'rgba(78,141,156,0.1)',
            padding: '2px 10px', borderRadius: 20,
          }}>{typeLabel}</span>
        )}
      </div>
    </article>
  );
}

// ── شريط الفلاتر ─────────────────────────────────────────────────────────────
function FilterBar({
  filter, setFilter,
}: {
  filter: 'all' | 'featured';
  setFilter: (f: 'all' | 'featured') => void;
}) {
  const btn = (value: 'all' | 'featured', label: string) => (
    <button
      onClick={() => setFilter(value)}
      style={{
        padding: '8px 22px',
        border: 'none',
        borderRadius: 30,
        cursor: 'pointer',
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: 700,
        fontSize: '0.9rem',
        transition: 'all 0.18s',
        background: filter === value
          ? `linear-gradient(135deg,${COLORS.teal},${COLORS.navy})`
          : 'rgba(255,255,255,0.06)',
        color: filter === value ? '#fff' : '#aaa',
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {btn('all', 'الكل')}
      {btn('featured', '✦ المميزة')}
    </div>
  );
}

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function PulseClient() {
  const [items, setItems]  = useState<PulseItem[]>([]);
  const [total, setTotal]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'featured'>('all');
  const [page, setPage]   = useState(0);
  const [selected, setSelected] = useState<PulseItem | null>(null);
  const LIMIT = 30;

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const offset = reset ? 0 : page * LIMIT;
    const res = await fetchPulse({
      limit: LIMIT,
      offset,
      featured: filter === 'featured' ? true : undefined,
    });
    setItems(prev => reset ? res.data : [...prev, ...res.data]);
    setTotal(res.total);
    if (reset) setPage(0);
    setLoading(false);
  }, [filter, page]);

  // أول تحميل + تغيير الفلتر
  useEffect(() => {
    load(true);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // تحديث تلقائي كل 30 ثانية
  useEffect(() => {
    const id = setInterval(() => load(true), 30_000);
    return () => clearInterval(id);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      direction: 'rtl',
      fontFamily: 'Tajawal, sans-serif',
      paddingBottom: 60,
    }}>
      {/* ── هيدر ── */}
      <div style={{
        background: `linear-gradient(180deg, ${COLORS.navy}cc 0%, ${COLORS.bg} 100%)`,
        padding: '40px 24px 32px',
        borderBottom: `1px solid ${COLORS.border}`,
        marginBottom: 32,
      }}>
        {/* ── لوجو + ناف ── */}
        <div style={{
          maxWidth: 1200, margin: '0 auto 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          {/* الشعار */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', userSelect: 'none' }}>
            <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
              <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
                <defs>
                  <radialGradient id="rg_pulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EDF7BD" />
                    <stop offset="42%" stopColor="#85C79A" />
                    <stop offset="100%" stopColor="#4E8D9C" />
                  </radialGradient>
                  <radialGradient id="rg_halo_pulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4E8D9C" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#4E8D9C" stopOpacity="0" />
                  </radialGradient>
                  <filter id="f_glow_pulse" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="2.8" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <circle cx="27" cy="27" r="26" fill="url(#rg_halo_pulse)" />
                <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
                <ellipse cx="27" cy="27" rx="18" ry="6.5" stroke="#85C79A" strokeWidth="0.65" strokeDasharray="2 4" fill="none" opacity="0.45" transform="rotate(40 27 27)" />
                <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_pulse)" filter="url(#f_glow_pulse)" />
                <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92" />
                <circle cx="25.2" cy="25.2" r="1.2" fill="white" opacity="0.5" />
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '1px',
                background: 'linear-gradient(90deg, #4fc3f7, #ffffff, #7c4dff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                المجرة الحضارية
              </div>
              <div style={{ fontSize: '0.72rem', color: '#8aa4bc', display: 'block', marginTop: -2 }}>
                كوكبة المؤسسات المضيئة
              </div>
            </div>
          </Link>

          {/* الناف بار */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {([
              { href: '/',         icon: '🌌', label: 'الرئيسية' },
              // { href: '/services', icon: '🛠️', label: 'الخدمات' },
              // { href: '/institutions', icon: '🏛️', label: 'المؤسسات' },
              // { href: '/campaigns',    icon: '🚀', label: 'الحملات' },
              // { href: '/marketplace',  icon: '🛒', label: 'السوق الرقمي' },
              // { href: '/cloud',        icon: '☁️', label: 'SAAS' },
              // { href: '/library',      icon: '📚', label: 'المكتبة' },
              // { href: '/forum',        icon: '💬', label: 'المنتدى' },
              // { href: '/podcast',      icon: '🎙️', label: 'البودكاست' },
            ] as Array<{ href: string; icon: string; label: string }>).map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 40,
                  color: '#9ca3af',
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = '#EDF7BD';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(237,247,189,0.25)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(237,247,189,0.06)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── عنوان ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{
            margin: '0 0 8px',
            background: `linear-gradient(135deg, ${COLORS.mint}, ${COLORS.teal}, #c9b7ff)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 900,
          }}>
            💫 نبض المجرة
          </h1>
          <p style={{ color: '#8888aa', margin: '0 0 24px', fontSize: '1rem' }}>
            أحداث المجرة الحضارية لحظةً بلحظة — اتفاقيات، فعاليات، أخبار
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <FilterBar filter={filter} setFilter={f => { setFilter(f); }} />
            <span style={{ color: '#556', fontSize: '0.8rem', marginRight: 'auto' }}>
              {total} نبضة · يتحدث كل 30 ث
            </span>
          </div>
        </div>
      </div>

      {/* ── شبكة البطاقات ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        {loading && items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#556' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>💫</div>
            <p>جارٍ تحميل نبضات المجرة…</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#556' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌌</div>
            <p>لا توجد نبضات حتى الآن</p>
          </div>
        ) : (
          <>
            {/* بطاقة مميزة كبيرة إن وجدت */}
            {items[0]?.is_featured ? (
              <div style={{ marginBottom: 28 }}>
                <article
                  onClick={() => setSelected(items[0])}
                  style={{
                  background: `linear-gradient(135deg, ${COLORS.featured}, ${COLORS.navy}88)`,
                  border: `1.5px solid ${COLORS.gold}55`,
                  borderRadius: 20,
                  padding: '28px 32px',
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  cursor: 'pointer',
                }}>
                  {items[0].image_url && (
                    <img
                      src={items[0].image_url}
                      alt=""
                      style={{
                        width: 140, height: 100, objectFit: 'cover',
                        borderRadius: 12, flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{
                      display: 'inline-block',
                      background: COLORS.gold, color: '#1a1a1a',
                      fontSize: '0.7rem', fontWeight: 800,
                      padding: '3px 14px', borderRadius: 20, marginBottom: 10,
                    }}>
                      ✦ آخر نبضة مميزة
                    </div>
                    <p style={{
                      color: '#e6e2ff', fontSize: '1.1rem',
                      lineHeight: 1.7, margin: '0 0 12px',
                      fontFamily: 'Tajawal, sans-serif',
                    }}>
                      <span style={{ fontSize: '1.6rem', marginLeft: 8 }}>
                        {pulseIcon(items[0].content)}
                      </span>
                      {items[0].content}
                    </p>
                    <div style={{ color: '#6e6a99', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                      ⏱ {timeAgo(items[0].pulse_date || items[0].created_at || '')}
                      <span style={{ color: COLORS.teal, background: 'rgba(78,141,156,0.15)', padding: '2px 12px', borderRadius: 20, fontSize: '0.75rem' }}>
                        انقر لعرض التفاصيل
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            ) : null}

            {/* شبكة البقية */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18,
            }}>
              {items.slice(items[0]?.is_featured ? 1 : 0).map((item, i) => (
                <PulseCard key={item.id} item={item} index={i} onOpen={setSelected} />
              ))}
            </div>

            {/* تحميل المزيد */}
            {items.length < total && (
              <div style={{ textAlign: 'center', marginTop: 36 }}>
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchPulse({
                      limit: LIMIT,
                      offset: nextPage * LIMIT,
                      featured: filter === 'featured' ? true : undefined,
                    }).then(res => {
                      setItems(prev => [...prev, ...res.data]);
                      setTotal(res.total);
                    });
                  }}
                  disabled={loading}
                  style={{
                    background: `linear-gradient(135deg,${COLORS.teal},${COLORS.navy})`,
                    color: '#fff',
                    border: 'none',
                    padding: '12px 40px',
                    borderRadius: 30,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Tajawal, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'جارٍ التحميل…' : `عرض المزيد (${total - items.length} نبضة)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .pulse-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(78,141,156,0.15);
        }
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .pulse-card {
          animation: fadeSlideIn 0.35s ease both;
        }
      `}</style>

      {/* ── بوب-أب التفاصيل ── */}
      {selected && <PulseDetailPopup item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
