'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
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

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<'news' | 'events'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'news') {
        const response = await fetch(`/api/news?limit=20&search=${filters.search}&category=${filters.category}`);
        const data = await response.json();
        setNews(data.data || []);
      } else {
        const response = await fetch(`/api/events?limit=20&search=${filters.search}&type=${filters.category}`);
        const data = await response.json();
        setEvents(data.data || []);
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
        <h1 style={{ fontSize: '2.5rem', marginBottom: 15 }}>
          ✦ الأخبار والفعاليات
        </h1>
        <p style={{ maxWidth: 600, opacity: 0.9 }}>
          تابع آخر أخبار وفعاليات المؤسسات في المجرة الحضارية
        </p>
      </div>

      {/* أزرار التبويب */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 30,
      }}>
        <button
          onClick={() => setActiveTab('news')}
          style={{
            flex: 1,
            padding: '15px',
            borderRadius: 40,
            border: 'none',
            background: activeTab === 'news' ? COLORS.teal : 'white',
            color: activeTab === 'news' ? 'white' : COLORS.teal,
            fontSize: '1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
          }}
        >
          📰 الأخبار
        </button>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            flex: 1,
            padding: '15px',
            borderRadius: 40,
            border: 'none',
            background: activeTab === 'events' ? COLORS.teal : 'white',
            color: activeTab === 'events' ? 'white' : COLORS.teal,
            fontSize: '1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 5px 15px ${COLORS.darkNavy}20`,
          }}
        >
          📅 الفعاليات
        </button>
      </div>

      {/* شريط البحث والفلترة */}
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

      {/* المحتوى */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>جاري التحميل...</div>
      ) : (
        <>
          {activeTab === 'news' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 20,
            }}>
              {news.map(item => (
                <NewsCard key={item.id} news={item} formatDate={formatDate} />
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 20,
            }}>
              {events.map(item => (
                <EventCard key={item.id} event={item} formatDate={formatDate} />
              ))}
            </div>
          )}

          {((activeTab === 'news' && news.length === 0) || 
            (activeTab === 'events' && events.length === 0)) && (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'white',
              borderRadius: 30,
            }}>
              <span style={{ fontSize: '4rem' }}>📭</span>
              <h3>لا توجد {activeTab === 'news' ? 'أخبار' : 'فعاليات'}</h3>
              <p>حاول تغيير معايير البحث</p>
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