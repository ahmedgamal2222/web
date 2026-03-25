'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) setUser(JSON.parse(userStr));
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
      background: `linear-gradient(135deg, ${COLORS.lightMint}20, white)`,
      direction: 'rtl',
      padding: '20px',
    }}>
      {/* الهيدر */}
      <div style={{
        background: COLORS.darkNavy,
        borderRadius: 30,
        padding: '40px',
        marginBottom: 30,
        color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 15 }}>
              ❆ الأخبار والفعاليات والاتفاقيات
            </h1>
            <p style={{ maxWidth: 600, opacity: 0.9 }}>
              تابع آخر أخبار وفعاليات واتفاقيات وإعلانات المؤسسات في المجرة الحضارية
            </p>
          </div>
        </div>
      </div>

      {/* أزرار التبويب */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 30, flexWrap: 'wrap' }}>
        {([
          { key: 'news', label: '📰 الأخبار' },
          { key: 'events', label: '📅 الفعاليات' },
          { key: 'agreements', label: '🔗 الاتفاقيات' },
          { key: 'ads', label: '📢 الإعلانات' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '15px',
              borderRadius: 40,
              border: 'none',
              background: activeTab === tab.key ? COLORS.teal : 'white',
              color: activeTab === tab.key ? 'white' : COLORS.teal,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
              minWidth: 120,
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
        borderRadius: 20,
        padding: '20px',
        marginBottom: 30,
        boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
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
              padding: '12px 15px',
              borderRadius: 30,
              border: `2px solid ${COLORS.teal}40`,
              background: 'white',
              color: COLORS.darkNavy,
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />

          {activeTab === 'news' && (
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                padding: '12px 15px',
                borderRadius: 30,
                border: `2px solid ${COLORS.teal}40`,
                background: 'white',
                color: COLORS.darkNavy,
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '150px',
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
                padding: '12px 15px',
                borderRadius: 30,
                border: `2px solid ${COLORS.teal}40`,
                background: 'white',
                color: COLORS.darkNavy,
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '150px',
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
            background: COLORS.teal,
            color: 'white',
            padding: '12px 25px',
            borderRadius: 40,
            textDecoration: 'none',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            + إضافة {activeTab === 'news' ? 'خبر' : 'فعالية'}
          </Link>
        </div>
      </div>
      )}

      {/* المحتوى */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>جاري التحميل...</div>
      ) : (
        <>
          {/* الأخبار */}
          {activeTab === 'news' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
              {news.length === 0 ? <EmptyState label="أخبار" /> : news.map(item => (
                <NewsCard key={item.id} news={item} formatDate={formatDate} />
              ))}
            </div>
          )}

          {/* الفعاليات */}
          {activeTab === 'events' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
              {events.length === 0 ? <EmptyState label="فعاليات" /> : events.map(item => (
                <EventCard key={item.id} event={item} formatDate={formatDate} />
              ))}
            </div>
          )}

          {/* الاتفاقيات */}
          {activeTab === 'agreements' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
              {agreements.length === 0 ? <EmptyState label="اتفاقيات" /> : agreements.map(ag => (
                <AgreementCard key={ag.id} ag={ag} />
              ))}
            </div>
          )}

          {/* الإعلانات */}
          {activeTab === 'ads' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {allAds.length === 0 ? <EmptyState label="إعلانات" /> : allAds.map(ad => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </>
      )}

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

        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{
              background: `${COLORS.teal}20`,
              color: COLORS.teal,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.7rem',
            }}>
              {news.category === 'announcement' ? '📢 إعلان' :
               news.category === 'achievement' ? '🏆 إنجاز' : '📰 خبر'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#666' }}>
              {formatDate(news.published_at)}
            </span>
          </div>

          <h3 style={{
            color: COLORS.darkNavy,
            fontSize: '1.1rem',
            marginBottom: 10,
          }}>
            {news.title}
          </h3>

          <p style={{
            color: '#666',
            fontSize: '0.9rem',
            marginBottom: 15,
            lineHeight: 1.6,
          }}>
            {news.content.substring(0, 120)}...
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 15,
            borderTop: `1px solid ${COLORS.teal}20`,
          }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: COLORS.teal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.8rem',
            }}>
              {news.institution_name_ar?.charAt(0) || news.institution_name?.charAt(0)}
            </div>
            <span style={{ fontSize: '0.8rem', color: COLORS.darkNavy }}>
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
          top: 20,
          right: 20,
          padding: '4px 12px',
          borderRadius: 20,
          background: isOngoing ? COLORS.softGreen :
                      isUpcoming ? COLORS.teal : '#9E9E9E',
          color: 'white',
          fontSize: '0.7rem',
          fontWeight: 600,
          zIndex: 2,
        }}>
          {isOngoing ? '🔴 جاري الآن' :
           isUpcoming ? '⏳ قادم' : '✅ منتهي'}
        </div>

        {/* التاريخ */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkNavy})`,
          color: 'white',
          padding: '15px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {new Date(event.start_datetime).toLocaleDateString('ar-EG', { day: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            {new Date(event.start_datetime).toLocaleDateString('ar-EG', { month: 'long' })}
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{
              background: `${COLORS.lightMint}40`,
              color: COLORS.teal,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.7rem',
            }}>
              {event.type === 'conference' ? '🎯 مؤتمر' :
               event.type === 'workshop' ? '🔧 ورشة' :
               event.type === 'lecture' ? '📚 محاضرة' : '💬 فعالية'}
            </span>
          </div>

          <h3 style={{
            color: COLORS.darkNavy,
            fontSize: '1.1rem',
            marginBottom: 10,
          }}>
            {event.title}
          </h3>

          <p style={{
            color: '#666',
            fontSize: '0.9rem',
            marginBottom: 15,
          }}>
            {event.description?.substring(0, 100)}...
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 15,
            fontSize: '0.8rem',
            color: '#666',
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
                <span style={{ color: COLORS.teal }}>عبر الإنترنت</span>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 15,
            borderTop: `1px solid ${COLORS.teal}20`,
          }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: COLORS.softGreen,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.8rem',
            }}>
              {event.institution_name_ar?.charAt(0) || event.institution_name?.charAt(0)}
            </div>
            <span style={{ fontSize: '0.8rem', color: COLORS.darkNavy }}>
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
      padding: '22px',
      boxShadow: `0 5px 15px ${COLORS.darkNavy}15`,
      border: `1px solid ${sc}30`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ margin: 0, color: COLORS.darkNavy, fontSize: '1rem', flex: 1, lineHeight: 1.4 }}>
          🔗 {ag.title || `اتفاقية #${ag.id}`}
        </h3>
        <span style={{ background: sc + '20', color: sc, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
          {sl}
        </span>
      </div>
      {ag.type && (
        <span style={{ background: `${COLORS.teal}15`, color: COLORS.teal, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', display: 'inline-block', width: 'fit-content' }}>
          {ag.type}
        </span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.82rem', color: '#666' }}>
        {(ag.institution_name_ar || ag.institution_name) ? (
          <div style={{ display: 'flex', gap: 6 }}><span>🏛️</span><span>{ag.institution_name_ar || ag.institution_name}</span></div>
        ) : null}
        {(ag.partner_name_ar || ag.partner_name) ? (
          <div style={{ display: 'flex', gap: 6 }}><span>🤝</span><span>{ag.partner_name_ar || ag.partner_name}</span></div>
        ) : null}
        <div style={{ display: 'flex', gap: 6, color: COLORS.teal, marginTop: 4 }}>
          <span>📅</span>
          <span>{new Date(dateField).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        {ag.end_date && (
          <div style={{ display: 'flex', gap: 6 }}>
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
      boxShadow: `0 5px 15px ${COLORS.darkNavy}15`,
      border: `1px solid ${statusColor}30`,
    }}>
      {ad.image_url && (
        <div style={{ height: 160, background: `url(${ad.image_url}) center/cover no-repeat` }} />
      )}
      <div style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h3 style={{ margin: 0, color: COLORS.darkNavy, fontSize: '1rem', flex: 1 }}>{ad.title}</h3>
          <span style={{ background: statusColor + '20', color: statusColor, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginRight: 8 }}>
            {statusLabel}
          </span>
        </div>
        {ad.content && (
          <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
            {ad.content.substring(0, 100)}{ad.content.length > 100 ? '...' : ''}
          </p>
        )}
        {(ad.institution_name_ar || ad.institution_name) && (
          <div style={{ fontSize: '0.78rem', color: COLORS.teal, marginBottom: 6, display: 'flex', gap: 5 }}>
            <span>🏛️</span><span>{ad.institution_name_ar || ad.institution_name}</span>
          </div>
        )}
        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 6 }}>
          📅 {new Date(ad.start_date).toLocaleDateString('ar-EG')} ← {new Date(ad.end_date).toLocaleDateString('ar-EG')}
        </div>
        {ad.target_type && ad.target_type !== 'all' && (
          <div style={{ fontSize: '0.73rem', color: COLORS.teal, background: `${COLORS.teal}10`, padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>
            {ad.target_type === 'country' ? `🏳️ ${ad.target_value}` : `🏙️ ${ad.target_value}`}
          </div>
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
    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 30, gridColumn: '1/-1' }}>
      <span style={{ fontSize: '4rem' }}>📭</span>
      <h3 style={{ color: COLORS.darkNavy }}>لا توجد {label}</h3>
      <p style={{ color: '#888' }}>لا يوجد محتوى متاح حالياً</p>
    </div>
  );
}