'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', userSelect: 'none' }}>
      <svg width="38" height="38" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_nd" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD" /><stop offset="42%" stopColor="#85C79A" /><stop offset="100%" stopColor="#4E8D9C" /></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_nd)" />
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.9" />
      </svg>
      <div>
        <div style={{ fontSize: '1.15rem', fontWeight: 900, background: 'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize: '0.65rem', color: '#4E8D9C', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase' }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  announcement: '📢 إعلان',
  achievement: '🏆 إنجاز',
  event: '🎉 فعالية',
  news: '📰 خبر',
  general: '📋 عام',
};

const CATEGORY_COLORS: Record<string, string> = {
  announcement: '#FF9B4E',
  achievement: '#FFD700',
  event: '#85C79A',
  news: '#4E8D9C',
  general: '#9ab0c0',
};

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  category?: string;
  published_at?: string;
  created_at: string;
  institution_id?: number;
  institution_name?: string;
  institution_name_ar?: string;
  institution_logo?: string;
}

export default function NewsDetailPage() {
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedNews, setRelatedNews] = useState<{ title: string; url: string; source: string; published_at: string; summary?: string; relevance_score?: number }[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [aiSource, setAiSource] = useState<string>('');

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id || id === 'default') {
      setError('معرّف الخبر غير صحيح');
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/news/${id}`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.success && d.data) {
          setNews(d.data);
          // Fetch related news
          setRelatedLoading(true);
          fetch(`${API_BASE}/api/news/${id}/related`)
            .then(r2 => r2.json())
            .then((rd: any) => { if (rd.success && rd.data) { setRelatedNews(rd.data); setAiSource(rd.source || ''); } })
            .catch(() => {})
            .finally(() => setRelatedLoading(false));
        }
        else setError(d.error || 'الخبر غير موجود');
      })
      .catch(() => setError('فشل في تحميل الخبر'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: '#080520', color: '#e8f4f8', fontFamily: "'Cairo', sans-serif", direction: 'rtl' }}>
      {/* Stars */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {typeof window !== 'undefined' && [...Array(60)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'white', opacity: Math.random() * 0.45 + 0.05, width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }} />
        ))}
      </div>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(8,5,32,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(78,141,156,0.2)' }}>
        <GalaxyLogo />
        <nav style={{ display: 'flex', gap: 6 }}>
          {[{ href: '/news', label: 'الأخبار', active: true }, { href: '/services', label: 'الخدمات' }, { href: '/library', label: 'المكتبة' }, { href: '/forum', label: 'المنتدى' }, { href: '/podcast', label: 'البودكاست' }].map(l => (
            <Link key={l.href} href={l.href} style={{ padding: '7px 14px', borderRadius: 20, textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, color: (l as any).active ? COLORS.darkNavy : '#9ca3af', background: (l as any).active ? `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})` : 'transparent', border: (l as any).active ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>{l.label}</Link>
          ))}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 840, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Back */}
        <Link href="/news" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: COLORS.teal, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, marginBottom: 28, padding: '8px 18px', borderRadius: 30, border: `1px solid ${COLORS.teal}30`, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.teal; e.currentTarget.style.background = `${COLORS.teal}12`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${COLORS.teal}30`; e.currentTarget.style.background = 'transparent'; }}
        >
          → العودة إلى الأخبار
        </Link>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${COLORS.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: COLORS.teal }}>جاري تحميل الخبر...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,80,80,0.06)', borderRadius: 20, border: '1px solid rgba(255,80,80,0.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#ff8080' }}>{error}</p>
          </div>
        )}

        {/* Article */}
        {news && !loading && (
          <article style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(78,141,156,0.2)', borderRadius: 24, overflow: 'hidden' }}>
            {/* Image */}
            {news.image_url && (
              <div style={{ width: '100%', height: 380, position: 'relative', overflow: 'hidden' }}>
                <img src={news.image_url} alt={news.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(8,5,32,0.9) 100%)' }} />
              </div>
            )}

            <div style={{ padding: '36px 40px' }}>
              {/* Category + Date */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                {news.category && (
                  <span style={{ background: `${CATEGORY_COLORS[news.category] || COLORS.teal}20`, color: CATEGORY_COLORS[news.category] || COLORS.teal, border: `1px solid ${CATEGORY_COLORS[news.category] || COLORS.teal}40`, padding: '5px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700 }}>
                    {CATEGORY_LABELS[news.category] || news.category}
                  </span>
                )}
                <span style={{ fontSize: '0.85rem', color: '#6a8090' }}>
                  📅 {formatDate(news.published_at || news.created_at)}
                </span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, lineHeight: 1.4, color: '#fff', marginBottom: 28 }}>
                {news.title}
              </h1>

              {/* Institution */}
              {(news.institution_name_ar || news.institution_name) && (
                <Link href={news.institution_id ? `/institutions/${news.institution_id}` : '/news'} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: 'rgba(78,141,156,0.08)', border: '1px solid rgba(78,141,156,0.2)', borderRadius: 40, padding: '8px 16px', marginBottom: 32 }}>
                  {news.institution_logo ? (
                    <img src={news.institution_logo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                      {(news.institution_name_ar || news.institution_name || '?').charAt(0)}
                    </div>
                  )}
                  <span style={{ fontSize: '0.9rem', color: COLORS.teal, fontWeight: 600 }}>
                    {news.institution_name_ar || news.institution_name}
                  </span>
                </Link>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(78,141,156,0.15)', marginBottom: 28 }} />

              {/* Content */}
              <div style={{ fontSize: '1.05rem', lineHeight: 1.9, color: '#c8d8e8', whiteSpace: 'pre-wrap' }}>
                {news.content}
              </div>
            </div>
          </article>

          {/* Related News from AI */}
          <section style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: `0 0 20px ${COLORS.teal}40` }}>🤖</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>أخبار ذات صلة — AI</h2>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#6a8090' }}>
                  تم تحليلها وترتيبها بواسطة الذكاء الاصطناعي (Cloudflare Workers AI)
                  {aiSource === 'ai_cache' && <span style={{ color: COLORS.teal, marginRight: 8 }}>⚡ من الذاكرة</span>}
                  {aiSource === 'ai_live' && <span style={{ color: COLORS.softGreen, marginRight: 8 }}>🔄 تحليل مباشر</span>}
                </p>
              </div>
            </div>

            {relatedLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(78,141,156,0.12)', borderRadius: 16, padding: 20, height: 160 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ width: 50, height: 10, borderRadius: 6, background: 'rgba(78,141,156,0.15)', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ width: 30, height: 10, borderRadius: 6, background: 'rgba(78,141,156,0.1)', animation: 'pulse 1.5s infinite' }} />
                    </div>
                    <div style={{ width: '90%', height: 14, borderRadius: 6, background: 'rgba(78,141,156,0.12)', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '70%', height: 14, borderRadius: 6, background: 'rgba(78,141,156,0.1)', marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '100%', height: 10, borderRadius: 6, background: 'rgba(78,141,156,0.06)', animation: 'pulse 1.5s infinite' }} />
                    <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
                  </div>
                ))}
              </div>
            ) : relatedNews.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {relatedNews.map((item, i) => {
                  const score = item.relevance_score || 0;
                  const scoreColor = score >= 0.7 ? '#22c55e' : score >= 0.4 ? '#f59e0b' : '#6b7280';
                  const scorePercent = Math.round(score * 100);
                  return (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${score >= 0.7 ? `${COLORS.teal}30` : 'rgba(78,141,156,0.12)'}`, borderRadius: 16, padding: '18px 20px', textDecoration: 'none', transition: 'all 0.25s', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.teal; e.currentTarget.style.background = 'rgba(78,141,156,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = score >= 0.7 ? `${COLORS.teal}30` : 'rgba(78,141,156,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {/* Relevance score badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: `${COLORS.teal}15`, color: COLORS.teal, padding: '2px 8px', borderRadius: 8, fontWeight: 600, fontSize: '0.72rem' }}>
                          {item.source || 'مصدر خارجي'}
                        </span>
                        {scorePercent > 0 && (
                          <span style={{ fontSize: '0.68rem', color: scoreColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, background: `${scoreColor}12`, padding: '2px 8px', borderRadius: 8 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: scoreColor, display: 'inline-block' }} />
                            {scorePercent}% صلة
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e0eaf0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.title}
                      </div>

                      {/* AI Summary */}
                      {item.summary && (
                        <div style={{ fontSize: '0.78rem', color: '#8a9aaa', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          💡 {item.summary}
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#6a8090' }}>
                        {item.published_at ? (
                          <span>{new Date(item.published_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                        ) : <span />}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: COLORS.teal, opacity: 0.8 }}>↗ اقرأ المزيد</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(78,141,156,0.1)', color: '#6a8090', fontSize: '0.9rem' }}>
                لا توجد أخبار ذات صلة حالياً
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}