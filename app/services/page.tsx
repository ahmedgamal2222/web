'use client';

import { useEffect, useState,useMemo } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface Service {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  delivery_time: number;
  rating: number;
  reviews_count: number;
  provider_name: string;
  provider_name_ar: string;
  institution_name: string;
  image_url: string;
  tags: string[];
  status: string;
}

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', userSelect: 'none' }}>
      <svg width="42" height="42" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_svc" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD" /><stop offset="42%" stopColor="#85C79A" /><stop offset="100%" stopColor="#4E8D9C" /></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
        <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_svc)" />
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92" />
      </svg>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, background: 'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize: '0.7rem', color: '#4E8D9C', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase' }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchServices();
  }, [filters, page]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        ...(filters.minPrice && { min_price: filters.minPrice }),
        ...(filters.maxPrice && { max_price: filters.maxPrice }),
        ...(filters.sort && { sort: filters.sort }),
      });

      console.log('🔍 Fetching services with params:', params.toString());
      
      const response = await fetch(`${API_BASE}/api/services?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
      });
      
      const result = await response.json();
      console.log('📦 API Response:', result);

      if (result.success) {
        // ✅ هنا التصحيح المهم - نستخدم result.data
        setServices(result.data || []);
        setTotalPages(Math.ceil(result.total / 12));

        // استخراج التصنيفات الفريدة من النتائج
        if (result.data && result.data.length > 0) {
          const cats = [...new Set(result.data.map((s: Service) => s.category))] as string[];
          setCategories(cats);
        }
      } else {
        console.error('❌ API Error:', result.error);
        setServices([]);
      }

    } catch (error) {
      console.error('❌ Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return COLORS.softGreen;
      case 'pending': return '#FFC107';
      case 'inactive': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return 'نشط';
      case 'pending': return 'قيد المراجعة';
      case 'inactive': return 'غير نشط';
      default: return status;
    }
  };

  return (
    <div className="page-wrap">
      {/* شريط التنقل */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(8,5,32,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(78,141,156,0.2)', boxShadow: '0 2px 32px rgba(0,0,0,0.5)' }}>
        <GalaxyLogo />
        <nav style={{ display: 'flex', gap: 6 }}>
          {([
            { href: '/news', label: 'الأخبار' },
            { href: '/services', label: 'الخدمات', active: true },
            { href: '/library', label: 'المكتبة' },
            { href: '/forum', label: 'المنتدى' },
            { href: '/podcast', label: 'البودكاست' },
          ] as Array<{ href: string; label: string; active?: boolean }>).map(link => (
            <Link key={link.href} href={link.href} style={{ padding: '8px 16px', borderRadius: 24, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, color: link.active ? '#fff' : '#9ca3af', background: link.active ? `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})` : 'transparent', border: link.active ? 'none' : '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}>{link.label}</Link>
          ))}
        </nav>
      </header>
    <div className="page-inner">
      {/* الهيدر */}
      <div className="page-hero">
        <h1>✦ سوق الخدمات</h1>
        <p>منصة تجمع مقدمي الخدمات والمستفيدين في المجرة الحضارية</p>
        <div style={{ marginTop: 28, maxWidth: 560 }}>
          <input
            type="search"
            placeholder="🔍 ابحث عن خدمة..."
            value={filters.search}
            onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              borderRadius: 40,
              padding: '13px 22px',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              width: '100%',
              backdropFilter: 'blur(8px)',
            }}
          />
        </div>
      </div>

      {/* شريط الفلاتر */}
      <div className="filter-bar">
        <select
          value={filters.category}
          onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
          style={{ minWidth: 160 }}
        >
          <option value="all">📁 جميع التصنيفات</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="أقل سعر"
          value={filters.minPrice}
          onChange={(e) => { setFilters({ ...filters, minPrice: e.target.value }); setPage(1); }}
          style={{ width: 120 }}
        />

        <input
          type="number"
          placeholder="أعلى سعر"
          value={filters.maxPrice}
          onChange={(e) => { setFilters({ ...filters, maxPrice: e.target.value }); setPage(1); }}
          style={{ width: 120 }}
        />

        <select
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          style={{ minWidth: 160 }}
        >
          <option value="newest">🕐 الأحدث</option>
          <option value="rating">⭐ الأعلى تقييماً</option>
          <option value="price_asc">💰 السعر: من الأقل</option>
          <option value="price_desc">💰 السعر: من الأعلى</option>
        </select>

        <Link href="/services/requests"
          className="btn-ghost"
          style={{ textDecoration: 'none', marginRight: 'auto', fontSize: '0.9rem' }}
        >
          📋 طلباتي
        </Link>
        <Link href="/services/provider-requests"
          className="btn-ghost"
          style={{ textDecoration: 'none', fontSize: '0.9rem' }}
        >
          📨 الطلبات الواردة
        </Link>
        <Link href="/services/create"
          className="btn-primary"
          style={{ textDecoration: 'none', padding: '11px 22px', fontSize: '0.95rem', borderRadius: 12 }}
        >
          + إضافة خدمة
        </Link>
      </div>

      {/* شبكة الخدمات */}
      {loading ? (
        <div className="loading-page">
          <div className="spinner" />
          جاري تحميل الخدمات...
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {services.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '80px 20px',
              background: 'white', borderRadius: 24,
              boxShadow: '0 4px 16px rgba(40,28,89,0.08)',
            }}>
              <span style={{ fontSize: '4rem' }}>🔍</span>
              <h3 style={{ color: '#281C59', margin: '20px 0 8px', fontSize: '1.3rem', fontWeight: 700 }}>لا توجد خدمات</h3>
              <p style={{ color: '#888', fontSize: '1rem', marginBottom: 24 }}>حاول تغيير معايير البحث أو أضف خدمة جديدة</p>
              <Link href="/services/create" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px' }}>
                إضافة خدمة جديدة
              </Link>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 40, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline btn-sm"
                style={{ borderRadius: 10 }}
              >
                ←
              </button>
              <span style={{
                padding: '9px 22px',
                background: 'white',
                borderRadius: 10,
                color: '#281C59',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 2px 8px rgba(40,28,89,0.1)',
              }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline btn-sm"
                style={{ borderRadius: 10 }}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}

// ============================================================
// مكون بطاقة الخدمة
// ============================================================
// مكون بطاقة الخدمة - الجزء الخاص بالوسوم
function ServiceCard({ service }: { service: Service }) {
  
  // ✅ تحويل tags من نص JSON إلى مصفوفة
  const tags = useMemo(() => {
    if (!service.tags) return [];
    try {
      // إذا كانت tags نص JSON
      const parsed = typeof service.tags === 'string' 
        ? JSON.parse(service.tags) 
        : service.tags;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing tags:', e);
      return [];
    }
  }, [service.tags]);

  return (
    <Link href={`/services/${service.id}`} style={{ textDecoration: 'none' }}>
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
        {/* حالة الخدمة */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 2,
        }}>
          <span style={{
            background: service.status === 'active' ? COLORS.softGreen : '#FFC107',
            color: service.status === 'active' ? COLORS.darkNavy : '#000',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '0.85rem',
            fontWeight: 600,
          }}>
            {service.status === 'active' ? '✅ نشط' : '⏳ قيد المراجعة'}
          </span>
        </div>

        {/* الصورة */}
        <div style={{
          height: 160,
          background: service.image_url 
            ? `url(${service.image_url}) center/cover`
            : `linear-gradient(135deg, ${COLORS.lightMint}, ${COLORS.softGreen})`,
          position: 'relative',
        }}>
          {!service.image_url && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '3rem',
              opacity: 0.5,
            }}>
              🛠️
            </div>
          )}
          
          {/* تصنيف الخدمة */}
          <span style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '0.85rem',
          }}>
            {service.category}
          </span>
        </div>

        {/* محتوى البطاقة */}
        <div style={{ padding: '22px 24px' }}>
          <h3 style={{
            color: '#281C59',
            fontSize: '1.1rem',
            fontWeight: 700,
            marginBottom: 10,
            lineHeight: 1.5,
            height: '3.3rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {service.title}
          </h3>

          <p style={{
            color: '#555',
            fontSize: '0.93rem',
            marginBottom: 16,
            lineHeight: 1.7,
            height: '4.7rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}>
            {service.description}
          </p>

          {/* مقدم الخدمة */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16, padding: '12px 0',
            borderTop: '1px solid rgba(78,141,156,0.12)',
            borderBottom: '1px solid rgba(78,141,156,0.12)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4E8D9C, #281C59)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
            }}>
              {service.provider_name_ar?.charAt(0) || service.provider_name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#281C59' }}>
                {service.provider_name_ar || service.provider_name || 'مقدم خدمة'}
              </div>
              {service.institution_name && (
                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                  {service.institution_name}
                </div>
              )}
            </div>
          </div>

          {/* السعر والتقييم */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4E8D9C' }}>
                {service.price} {service.currency}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#888', marginTop: 2 }}>
                ⏱️ {service.delivery_time} يوم
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(237,247,189,0.6)',
              padding: '6px 12px', borderRadius: 20,
            }}>
              <span style={{ color: '#FFD700' }}>⭐</span>
              <span style={{ fontWeight: 700, color: '#281C59', fontSize: '0.95rem' }}>
                {service.rating > 0 ? service.rating.toFixed(1) : 'جديد'}
              </span>
              {service.reviews_count > 0 && (
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  ({service.reviews_count})
                </span>
              )}
            </div>
          </div>

          {/* الوسوم */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {tags.slice(0, 3).map(tag => (
                <span key={tag} style={{
                  padding: '3px 10px',
                  background: 'rgba(237,247,189,0.7)',
                  borderRadius: 12,
                  fontSize: '0.8rem',
                  color: '#3a7a8a',
                  fontWeight: 600,
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

const paginationButtonStyle = (disabled: boolean) => ({
  padding: '9px 18px',
  borderRadius: 10,
  border: `2px solid #4E8D9C`,
  background: disabled ? 'transparent' : '#4E8D9C',
  color: disabled ? '#4E8D9C' : 'white',
  cursor: disabled ? 'default' : 'pointer',
  fontSize: '1rem',
  fontWeight: 600,
  opacity: disabled ? 0.45 : 1,
  transition: 'all 0.25s',
});