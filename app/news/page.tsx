'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { uploadImage } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  darkCard: '#1e1650',
};

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url: string;
  category: string;
  published_at: string;
  institution_id: number;
  institution_name: string;
  institution_name_ar: string;
}

interface EventItem {
  id: number;
  title: string;
  description: string;
  type: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  is_online: boolean;
  online_url: string;
  institution_id: number;
  institution_name: string;
  institution_name_ar: string;
}

interface AgreementItem {
  id: number;
  title?: string;
  type?: string;
  status?: string;
  created_at: string;
  signed_at?: string;
  start_date?: string;
  end_date?: string;
  institution_name?: string;
  institution_name_ar?: string;
  partner_name?: string;
  partner_name_ar?: string;
}

interface AdItem {
  id: number;
  institution_id: number;
  institution_name?: string;
  institution_name_ar?: string;
  title: string;
  content?: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  target_type?: 'all' | 'country' | 'city';
  target_value?: string;
}


function GalaxyLogo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', userSelect: 'none' }}>
      <svg width="42" height="42" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_news" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD" /><stop offset="42%" stopColor="#85C79A" /><stop offset="100%" stopColor="#4E8D9C" /></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
        <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_news)" />
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92" />
      </svg>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, background: 'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize: '0.7rem', color: '#4E8D9C', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase' }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<'news' | 'events' | 'agreements' | 'ads'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [allAds, setAllAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
  });
  const [user, setUser] = useState<any>(null);
  const [coins, setCoins] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adSuccess, setAdSuccess] = useState(false);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setCoins(u.coins ?? 500);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'news') {
        const response = await fetch(`${API_BASE}/api/news?limit=20&search=${filters.search}&category=${filters.category}`);
        const data = await response.json();
        setNews(data.data || []);
      } else if (activeTab === 'events') {
        const response = await fetch(`${API_BASE}/api/events?limit=20&search=${filters.search}&type=${filters.category}`);
        const data = await response.json();
        setEvents(data.data || []);
      } else if (activeTab === 'agreements') {
        const response = await fetch(`${API_BASE}/api/agreements?limit=50`);
        const data = await response.json();
        setAgreements(data.data || []);
      } else if (activeTab === 'ads') {
        const response = await fetch(`${API_BASE}/api/ads?limit=100`);
        const data = await response.json();
        setAllAds(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdSuccess = () => {
    setShowAdModal(false);
    setAdSuccess(true);
    setCoins(c => c - 20);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      u.coins = (u.coins ?? 500) - 20;
      localStorage.setItem('user', JSON.stringify(u));
    }
    setTimeout(() => setAdSuccess(false), 5000);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightMint}30, #f8fafc)`,
      direction: 'rtl',
      fontFamily: "'Cairo', 'Tahoma', sans-serif",
    }}>
      {/* شريط التنقل */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(8,5,32,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(78,141,156,0.2)', boxShadow: '0 2px 32px rgba(0,0,0,0.5)' }}>
        <GalaxyLogo />
        <nav style={{ display: 'flex', gap: 6 }}>
          {([
            { href: '/news', label: 'الأخبار', active: true },
            { href: '/services', label: 'الخدمات' },
            { href: '/library', label: 'المكتبة' },
            { href: '/forum', label: 'المنتدى' },
            { href: '/podcast', label: 'البودكاست' },
          ] as Array<{ href: string; label: string; active?: boolean }>).map(link => (
            <Link key={link.href} href={link.href} style={{ padding: '8px 16px', borderRadius: 24, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, color: link.active ? '#fff' : '#9ca3af', background: link.active ? `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})` : 'transparent', border: link.active ? 'none' : '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}>{link.label}</Link>
          ))}
        </nav>
      </header>
    <div style={{
      maxWidth: 1320,
      margin: '0 auto',
      padding: '28px 24px',
    }}>
      {/* الهيدر */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkNavy}, #1a2a6c)`,
        borderRadius: 24,
        padding: '40px 48px',
        marginBottom: 28,
        color: 'white',
        boxShadow: `0 8px 32px ${COLORS.darkNavy}50`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 12, letterSpacing: '0.01em', lineHeight: 1.3 }}>
              ❆ الأخبار والفعاليات والاتفاقيات
            </h1>
            <p style={{ maxWidth: 580, opacity: 0.85, fontSize: '1.05rem', lineHeight: 1.7, fontWeight: 400 }}>
              تابع آخر أخبار وفعاليات واتفاقيات وإعلانات المؤسسات في المجرة الحضارية
            </p>
          </div>
        </div>
      </div>

      {/* أزرار التبويب */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {([
          { key: 'news', label: '📰 الأخبار' },
          { key: 'events', label: '📅 الفعاليات' },
          { key: 'agreements', label: '🔗 الاتفاقيات' },
          { key: 'ads', label: '📢 الإعلانات' },
        ] as const).filter(tab => !(tab.key === 'ads' && user?.role === 'admin')).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 40,
              border: activeTab === tab.key ? 'none' : `2px solid ${COLORS.teal}30`,
              background: activeTab === tab.key
                ? `linear-gradient(135deg, ${COLORS.teal}, #3a7a8a)`
                : 'white',
              color: activeTab === tab.key ? 'white' : COLORS.teal,
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === tab.key
                ? `0 6px 20px ${COLORS.teal}40`
                : `0 2px 8px ${COLORS.darkNavy}10`,
              minWidth: 130,
              transition: 'all 0.25s ease',
              letterSpacing: '0.02em',
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>



      {/* شريط البحث والفلترة — يخفي لتبويبي الاتفاقيات والإعلانات */}
      {(activeTab === 'news' || activeTab === 'events') && (
      <div style={{
        background: 'white',
        borderRadius: 18,
        padding: '18px 24px',
        marginBottom: 28,
        boxShadow: `0 4px 16px ${COLORS.darkNavy}12`,
        border: `1px solid ${COLORS.teal}15`,
      }}>
        <div style={{
          display: 'flex',
          gap: 15,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="🔍 بحث..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 30,
              border: `2px solid ${COLORS.teal}40`,
              background: 'white',
              color: COLORS.darkNavy,
              fontSize: '1rem',
              outline: 'none',
              fontFamily: "'Cairo', sans-serif",
              minWidth: 0,
            }}
          />

          {activeTab === 'news' && (
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                padding: '12px 18px',
                borderRadius: 30,
                border: `2px solid ${COLORS.teal}40`,
                background: 'white',
                color: COLORS.darkNavy,
                fontSize: '1rem',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '170px',
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              <option value="all">📁 جميع التصنيفات</option>
              <option value="announcement">📢 إعلانات</option>
              <option value="achievement">🏆 إنجازات</option>
              <option value="event">🎉 فعاليات</option>
            </select>
          )}

          {activeTab === 'events' && (
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                padding: '12px 18px',
                borderRadius: 30,
                border: `2px solid ${COLORS.teal}40`,
                background: 'white',
                color: COLORS.darkNavy,
                fontSize: '1rem',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '170px',
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              <option value="all">📁 جميع الفعاليات</option>
              <option value="conference">🎯 مؤتمرات</option>
              <option value="workshop">🔧 ورش عمل</option>
              <option value="lecture">📚 محاضرات</option>
              <option value="seminar">💬 ندوات</option>
            </select>
          )}

          <Link href={`/${activeTab === 'news' ? 'news' : 'events'}/create`} style={{
            background: `linear-gradient(135deg, ${COLORS.teal}, #3a7a8a)`,
            color: 'white',
            padding: '12px 28px',
            borderRadius: 40,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            whiteSpace: 'nowrap',
            boxShadow: `0 4px 14px ${COLORS.teal}40`,
            letterSpacing: '0.02em',
          }}>
            + إضافة {activeTab === 'news' ? 'خبر' : 'فعالية'}
          </Link>
        </div>
      </div>
      )}

      {/* المحتوى */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '1.1rem', color: COLORS.teal, fontWeight: 600 }}>⏳ جاري التحميل...</div>
      ) : (
        <>
          {/* الأخبار */}
          {activeTab === 'news' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
              {news.length === 0 ? <EmptyState label="أخبار" /> : news.map(item => (
                <NewsCard key={item.id} news={item} formatDate={formatDate} />
              ))}
            </div>
          )}

          {/* الفعاليات */}
          {activeTab === 'events' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
              {events.length === 0 ? <EmptyState label="فعاليات" /> : events.map(item => (
                <EventCard key={item.id} event={item} formatDate={formatDate} />
              ))}
            </div>
          )}

          {/* الاتفاقيات */}
          {activeTab === 'agreements' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
              {agreements.length === 0 ? <EmptyState label="اتفاقيات" /> : agreements.map(ag => (
                <AgreementCard key={ag.id} ag={ag} />
              ))}
            </div>
          )}

          {/* الإعلانات */}
          {activeTab === 'ads' && (
            <>
              {/* نجاح إنشاء الإعلان */}
              {adSuccess && (
                <div style={{
                  background: `${COLORS.softGreen}20`,
                  border: `1px solid ${COLORS.softGreen}`,
                  borderRadius: 16,
                  padding: '14px 20px',
                  marginBottom: 20,
                  color: COLORS.darkNavy,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  ✅ تم نشر الإعلان بنجاح! سيظهر على الشاشات الحضارية قريباً.
                </div>
              )}

              {/* زر إنشاء إعلان — لأصحاب المؤسسات فقط */}
              {user?.institution_id && user?.role !== 'admin' && (
                <div style={{ marginBottom: 20 }}>
                  <button
                    onClick={() => setShowAdModal(true)}
                    style={{
                      background: COLORS.teal,
                      color: 'white',
                      border: 'none',
                      borderRadius: 40,
                      padding: '13px 28px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: `0 6px 20px ${COLORS.teal}40`,
                    }}
                  >
                    📢 إنشاء إعلان جديد
                    <span style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 30,
                      padding: '3px 12px',
                      fontSize: '0.85rem',
                    }}>
                      {coins} كوين
                    </span>
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {allAds.length === 0 ? <EmptyState label="إعلانات" /> : allAds.map(ad => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>

              {/* مودال إنشاء إعلان */}
              {showAdModal && user?.institution_id && (
                <AdCreateModal
                  institutionId={user.institution_id}
                  coins={coins}
                  onClose={() => setShowAdModal(false)}
                  onSuccess={handleAdSuccess}
                />
              )}
            </>
          )}
        </>
      )}

    </div>
    </div>
  );
}

// ============================================================
// بطاقة الخبر
// ============================================================
function NewsCard({ news, formatDate }: any) {
  return (
    <Link href={`/news/${news.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
        transition: 'all 0.3s',
        height: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 15px 30px ${COLORS.darkNavy}40`;
      }}
      >
        {news.image_url && (
          <div style={{
            height: 200,
            background: `url(${news.image_url}) center/cover`,
          }} />
        )}

        <div style={{ padding: '22px 24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            gap: 8,
          }}>
            <span style={{
              background: `${COLORS.teal}18`,
              color: COLORS.teal,
              padding: '5px 13px',
              borderRadius: 20,
              fontSize: '0.82rem',
              fontWeight: 600,
            }}>
              {news.category === 'announcement' ? '📢 إعلان' :
               news.category === 'achievement' ? '🏆 إنجاز' : '📰 خبر'}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#888', flexShrink: 0 }}>
              {formatDate(news.published_at)}
            </span>
          </div>

          <h3 style={{
            color: COLORS.darkNavy,
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: 10,
            lineHeight: 1.5,
          }}>
            {news.title}
          </h3>

          <p style={{
            color: '#555',
            fontSize: '0.95rem',
            marginBottom: 18,
            lineHeight: 1.75,
          }}>
            {news.content.substring(0, 120)}...
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 14,
            borderTop: `1px solid ${COLORS.teal}20`,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {news.institution_name_ar?.charAt(0) || news.institution_name?.charAt(0)}
            </div>
            <span style={{ fontSize: '0.9rem', color: COLORS.darkNavy, fontWeight: 600 }}>
              {news.institution_name_ar || news.institution_name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// بطاقة الفعالية
// ============================================================
function EventCard({ event, formatDate }: any) {
  const isUpcoming = new Date(event.start_datetime) > new Date();
  const isOngoing = new Date(event.start_datetime) <= new Date() && 
                    new Date(event.end_datetime) >= new Date();

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
        transition: 'all 0.3s',
        height: '100%',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 15px 30px ${COLORS.darkNavy}40`;
      }}
      >
        {/* شريط الحالة */}
        <div style={{
          position: 'absolute',
          top: 14,
          right: 14,
          padding: '5px 13px',
          borderRadius: 20,
          background: isOngoing ? COLORS.softGreen :
                      isUpcoming ? COLORS.teal : '#9E9E9E',
          color: 'white',
          fontSize: '0.82rem',
          fontWeight: 700,
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {isOngoing ? '🔴 جاري الآن' :
           isUpcoming ? '⏳ قادم' : '✅ منتهي'}
        </div>

        {/* التاريخ */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
          color: 'white',
          padding: '18px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {new Date(event.start_datetime).toLocaleDateString('ar-EG', { day: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>
            {new Date(event.start_datetime).toLocaleDateString('ar-EG', { month: 'long' })}
          </div>
        </div>

        <div style={{ padding: '22px 24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <span style={{
              background: `${COLORS.lightMint}60`,
              color: COLORS.teal,
              padding: '5px 13px',
              borderRadius: 20,
              fontSize: '0.82rem',
              fontWeight: 600,
            }}>
              {event.type === 'conference' ? '🎯 مؤتمر' :
               event.type === 'workshop' ? '🔧 ورشة' :
               event.type === 'lecture' ? '📚 محاضرة' : '💬 فعالية'}
            </span>
          </div>

          <h3 style={{
            color: COLORS.darkNavy,
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: 10,
            lineHeight: 1.5,
          }}>
            {event.title}
          </h3>

          <p style={{
            color: '#555',
            fontSize: '0.95rem',
            marginBottom: 16,
            lineHeight: 1.7,
          }}>
            {event.description?.substring(0, 100)}...
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 16,
            fontSize: '0.9rem',
            color: '#555',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⏰</span>
              <span>{formatDate(event.start_datetime)}</span>
            </div>
            
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            )}

            {event.is_online && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🌐</span>
                <span style={{ color: COLORS.teal, fontWeight: 600 }}>عبر الإنترنت</span>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 14,
            borderTop: `1px solid ${COLORS.teal}20`,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.softGreen}, ${COLORS.teal})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {event.institution_name_ar?.charAt(0) || event.institution_name?.charAt(0)}
            </div>
            <span style={{ fontSize: '0.9rem', color: COLORS.darkNavy, fontWeight: 600 }}>
              {event.institution_name_ar || event.institution_name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// بطاقة الاتفاقية
// ============================================================
function AgreementCard({ ag }: { ag: AgreementItem }) {
  const statusColors: Record<string, string> = {
    active: COLORS.softGreen,
    pending: '#FFC107',
    expired: '#9E9E9E',
    signed: COLORS.teal,
  };
  const statusLabels: Record<string, string> = {
    active: '✅ نشطة',
    pending: '⏳ قيد الانتظار',
    expired: '❌ منتهية',
    signed: '✍️ موقّعة',
  };
  const sc = statusColors[ag.status || 'pending'] || '#9E9E9E';
  const sl = statusLabels[ag.status || 'pending'] || ag.status || '';
  const dateField = ag.signed_at || ag.start_date || ag.created_at;

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: '24px',
      boxShadow: `0 4px 16px ${COLORS.darkNavy}12`,
      border: `1px solid ${sc}30`,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <h3 style={{ margin: 0, color: COLORS.darkNavy, fontSize: '1.1rem', fontWeight: 700, flex: 1, lineHeight: 1.5 }}>
          🔗 {ag.title || `اتفاقية #${ag.id}`}
        </h3>
        <span style={{ background: sc + '20', color: sc, padding: '4px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 }}>
          {sl}
        </span>
      </div>
      {ag.type && (
        <span style={{ background: `${COLORS.teal}15`, color: COLORS.teal, padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, display: 'inline-block', width: 'fit-content' }}>
          {ag.type}
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: '#555' }}>
        {(ag.institution_name_ar || ag.institution_name) ? (
          <div style={{ display: 'flex', gap: 8 }}><span>🏛️</span><span>{ag.institution_name_ar || ag.institution_name}</span></div>
        ) : null}
        {(ag.partner_name_ar || ag.partner_name) ? (
          <div style={{ display: 'flex', gap: 8 }}><span>🤝</span><span>{ag.partner_name_ar || ag.partner_name}</span></div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, color: COLORS.teal, fontWeight: 600, marginTop: 2 }}>
          <span>📅</span>
          <span>{new Date(dateField).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        {ag.end_date && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span>🏁</span>
            <span>تنتهي: {new Date(ag.end_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// بطاقة الإعلان
// ============================================================
function AdCard({ ad }: { ad: AdItem }) {
  const now = new Date();
  const start = new Date(ad.start_date);
  const end = new Date(ad.end_date);
  const isActive = now >= start && now <= end;
  const isExpired = now > end;
  const statusColor = isActive ? COLORS.softGreen : isExpired ? '#9E9E9E' : '#FFC107';
  const statusLabel = isActive ? '✅ نشط' : isExpired ? '❌ منتهي' : '⏳ قادم';

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: `0 4px 16px ${COLORS.darkNavy}12`,
      border: `1px solid ${statusColor}30`,
    }}>
      {ad.image_url && (
        <div style={{ height: 170, background: `url(${ad.image_url}) center/cover no-repeat` }} />
      )}
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
          <h3 style={{ margin: 0, color: COLORS.darkNavy, fontSize: '1.1rem', fontWeight: 700, flex: 1, lineHeight: 1.5 }}>{ad.title}</h3>
          <span style={{ background: statusColor + '20', color: statusColor, padding: '4px 11px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, marginRight: 6 }}>
            {statusLabel}
          </span>
        </div>
        {ad.content && (
          <p style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#555', lineHeight: 1.65 }}>
            {ad.content.substring(0, 100)}{ad.content.length > 100 ? '...' : ''}
          </p>
        )}
        {(ad.institution_name_ar || ad.institution_name) && (
          <div style={{ fontSize: '0.88rem', color: COLORS.teal, marginBottom: 8, display: 'flex', gap: 6, fontWeight: 600 }}>
            <span>🏛️</span><span>{ad.institution_name_ar || ad.institution_name}</span>
          </div>
        )}
        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: 8 }}>
          📅 {new Date(ad.start_date).toLocaleDateString('ar-EG')} ← {new Date(ad.end_date).toLocaleDateString('ar-EG')}
        </div>
        {ad.target_type && ad.target_type !== 'all' && (
          <div style={{ fontSize: '0.82rem', color: COLORS.teal, background: `${COLORS.teal}10`, padding: '4px 12px', borderRadius: 20, display: 'inline-block', fontWeight: 600 }}>
            {ad.target_type === 'country' ? `🏳️ ${ad.target_value}` : `🏙️ ${ad.target_value}`}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Ad Create Modal
// ============================================================
const AD_COST = 20;

function AdCreateModal({
  institutionId,
  coins,
  onClose,
  onSuccess,
}: {
  institutionId: number;
  coins: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    image_url: '',
    start_date: '',
    end_date: '',
    target_type: 'all' as 'all' | 'country' | 'city',
    target_value: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [detectedLocation, setDetectedLocation] = useState<{ country: string | null; city: string | null; region: string | null } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const API_BASE_MODAL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  const canAfford = coins >= AD_COST;

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
      const res = await fetch(`${API_BASE_MODAL}/api/ads/location`, { headers: { 'X-Session-ID': sid } });
      const data = await res.json();
      if (data.success) setDetectedLocation(data.data);
    } catch { /* ignore */ } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!canAfford) return;
    if (!form.title || !form.start_date || !form.end_date) { setErr('يرجى ملء الحقول المطلوبة'); return; }
    setSubmitting(true); setErr('');
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        setUploadProgress(1);
        const uploaded = await uploadImage(imageFile, (p: number) => setUploadProgress(p));
        imageUrl = uploaded.url;
        setUploadProgress(100);
      }
      const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
      const res = await fetch(`${API_BASE_MODAL}/api/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify({ ...form, image_url: imageUrl, institution_id: institutionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'فشل إنشاء الإعلان');
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const iSt: React.CSSProperties = {
    width: '100%', padding: '11px 15px',
    background: 'white',
    border: `1.5px solid ${COLORS.teal}40`,
    borderRadius: 10, color: COLORS.darkNavy, fontSize: '1rem',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Cairo', sans-serif",
    lineHeight: 1.6,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20, direction: 'rtl',
    }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'white', borderRadius: 24, padding: 32,
        width: '100%', maxWidth: 540,
        boxShadow: `0 20px 60px ${COLORS.darkNavy}30`,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: COLORS.darkNavy, letterSpacing: '0.01em' }}>📢 إنشاء إعلان جديد</h2>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: '1.1rem', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Coins balance */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `${COLORS.teal}10`, borderRadius: 12, padding: '12px 16px', marginBottom: 20,
        }}>
          <span style={{ color: '#555', fontSize: '0.95rem' }}>رصيدك الحالي</span>
          <span style={{ color: coins >= AD_COST ? COLORS.teal : '#e53935', fontWeight: 800, fontSize: '1.05rem' }}>
            {coins} كوين
          </span>
        </div>

        {!canAfford ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#e53935', marginBottom: 20 }}>
              رصيدك غير كافٍ ({coins} / {AD_COST} كوين مطلوب)
            </p>
            <a
              href="https://paypal.me/hadmaj?amount=30"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', background: '#0070ba', color: 'white',
                padding: '12px 28px', borderRadius: 30, textDecoration: 'none',
                fontWeight: 700, fontSize: '1rem',
              }}
            >
              💳 تجديد الاشتراك — 30$ عبر PayPal
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {err && (
              <div style={{ background: '#fdecea', border: '1px solid #e53935', borderRadius: 10, padding: '11px 16px', color: '#c62828', fontSize: '0.95rem', fontWeight: 500 }}>
                {err}
              </div>
            )}

            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.9rem', color: COLORS.teal, fontWeight: 700 }}>عنوان الإعلان *</label>
              <input type="text" value={form.title} onChange={set('title')} required placeholder="اكتب عنوان الإعلان" style={iSt} />
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.9rem', color: COLORS.teal, fontWeight: 700 }}>نص الإعلان</label>
              <textarea value={form.content} onChange={set('content')} placeholder="تفاصيل الإعلان..." rows={3} style={{ ...iSt, resize: 'vertical' }} />
            </div>

            {/* Image upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.9rem', color: COLORS.teal, fontWeight: 700 }}>صورة الإعلان</label>
              {imagePreview && (
                <div style={{ height: 140, background: `url(${imagePreview}) center/cover`, borderRadius: 10, marginBottom: 6 }} />
              )}
              <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: '0.92rem', fontFamily: "'Cairo', sans-serif" }} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ background: '#e0e0e0', borderRadius: 10, height: 6, overflow: 'hidden' }}>
                  <div style={{ background: COLORS.teal, height: '100%', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                </div>
              )}
              {!imageFile && (
                <>
                  <label style={{ fontSize: '0.85rem', color: '#888', marginTop: 2 }}>أو ادخل رابط الصورة مباشرة</label>
                  <input type="url" value={form.image_url} onChange={set('image_url')} placeholder="https://..." style={iSt} />
                </>
              )}
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.9rem', color: COLORS.teal, fontWeight: 700 }}>تاريخ البداية *</label>
                <input type="date" value={form.start_date} onChange={set('start_date')} required style={iSt} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.9rem', color: COLORS.teal, fontWeight: 700 }}>تاريخ النهاية *</label>
                <input type="date" value={form.end_date} onChange={set('end_date')} required style={iSt} />
              </div>
            </div>

            {/* Targeting */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.9rem', color: COLORS.teal, fontWeight: 700 }}>نطاق الاستهداف</label>
              <select value={form.target_type} onChange={e => setForm(p => ({ ...p, target_type: e.target.value as any, target_value: '' }))} style={iSt}>
                <option value="all">🌍 الكل</option>
                <option value="country">🏳️ دولة محددة</option>
                <option value="city">🏙️ مدينة محددة</option>
              </select>
            </div>

            {form.target_type !== 'all' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: COLORS.teal, fontWeight: 700 }}>
                  {form.target_type === 'country' ? 'كود الدولة (ISO)' : 'اسم المدينة'}
                </label>

                {/* زر اكتشاف الموقع */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={fetchLocation}
                    disabled={locationLoading}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      border: `1.5px solid ${COLORS.teal}`,
                      background: locationLoading ? `${COLORS.teal}10` : `${COLORS.teal}15`,
                      color: COLORS.teal, cursor: locationLoading ? 'default' : 'pointer',
                      fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap',
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {locationLoading ? '⏳ جاري الاكتشاف...' : '📍 اكتشاف موقعك'}
                  </button>
                  {detectedLocation?.country && (
                    <button
                      type="button"
                      onClick={() => setForm(p => ({
                        ...p,
                        target_value: form.target_type === 'country'
                          ? (detectedLocation.country || '')
                          : (detectedLocation.city || ''),
                      }))}
                      style={{
                        padding: '6px 14px', borderRadius: 20,
                        border: `1px solid ${COLORS.softGreen}`,
                        background: `${COLORS.softGreen}15`,
                        color: COLORS.teal, cursor: 'pointer', fontSize: '0.88rem',
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      {form.target_type === 'country'
                        ? `✓ استخدام: ${detectedLocation.country}`
                        : detectedLocation.city
                          ? `✓ استخدام: ${detectedLocation.city}`
                          : 'لا توجد مدينة مكتشفة'}
                    </button>
                  )}
                </div>

                {/* معلومات الموقع المكتشف */}
                {detectedLocation && (
                  <div style={{
                    background: `${COLORS.teal}08`, border: `1px solid ${COLORS.teal}30`,
                    borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', color: COLORS.teal,
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>📡 موقعك المكتشف:</div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', color: '#555' }}>
                      {detectedLocation.country && <span>🏳️ <b>الدولة:</b> {detectedLocation.country}</span>}
                      {detectedLocation.city && <span>🏙️ <b>المدينة:</b> {detectedLocation.city}</span>}
                      {detectedLocation.region && <span>📍 <b>المنطقة:</b> {detectedLocation.region}</span>}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  value={form.target_value}
                  onChange={set('target_value')}
                  placeholder={form.target_type === 'country' ? 'مثال: SA أو EG أو AE' : 'مثال: Riyadh أو Cairo'}
                  style={iSt}
                />
                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                  {form.target_type === 'country'
                    ? '⚠️ أدخل كود الدولة ISO: SA، EG، AE، IQ...'
                    : '⚠️ أدخل اسم المدينة بالإنجليزية'}
                </div>
              </div>
            )}

            {/* Cost summary */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fffde7', borderRadius: 10, padding: '10px 14px',
              border: '1px solid #ffe082',
            }}>
              <span style={{ fontSize: '0.9rem', color: '#555' }}>تكلفة الإعلان</span>
              <span style={{ color: '#f9a825', fontWeight: 800, fontSize: '0.95rem' }}>{AD_COST} كوين ← يتبقى {coins - AD_COST} كوين</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '13px',
                background: submitting ? COLORS.teal + '80' : COLORS.teal,
                color: 'white', border: 'none', borderRadius: 40,
                fontSize: '1rem', fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
                boxShadow: `0 6px 20px ${COLORS.teal}40`,
              }}
            >
              {submitting ? 'جاري النشر...' : `✦ نشر الإعلان (${AD_COST} كوين)`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 24, gridColumn: '1/-1', boxShadow: `0 4px 16px ${COLORS.darkNavy}10` }}>
      <span style={{ fontSize: '4rem' }}>📭</span>
      <h3 style={{ color: COLORS.darkNavy, fontSize: '1.3rem', fontWeight: 700, marginTop: 16, marginBottom: 8 }}>لا توجد {label}</h3>
      <p style={{ color: '#888', fontSize: '1rem' }}>لا يوجد محتوى متاح حالياً</p>
    </div>
  );
}