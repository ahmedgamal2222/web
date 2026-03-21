'use client';

import { useEffect, useState,useMemo } from 'react';
import Link from 'next/link';

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
      
      const response = await fetch(`/api/services?${params}`, {
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
          const cats = [...new Set(result.data.map((s: Service) => s.category))];
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
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: -20,
          left: -20,
          width: 200,
          height: 200,
          background: COLORS.teal,
          opacity: 0.2,
          borderRadius: '50%',
        }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: 15 }}>
          ✦ سوق الخدمات
        </h1>
        <p style={{ maxWidth: 600, opacity: 0.9 }}>
          منصة تجمع مقدمي الخدمات والمستفيدين في المجرة الحضارية
        </p>
        
        {/* شريط البحث */}
        <div style={{
          marginTop: 30,
          maxWidth: 600,
        }}>
          <input
            type="text"
            placeholder="🔍 ابحث عن خدمة..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: 40,
              border: 'none',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* شريط الفلاتر */}
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
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            style={filterSelectStyle}
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
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value, page: 1 })}
            style={filterInputStyle}
          />

          <input
            type="number"
            placeholder="أعلى سعر"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: 1 })}
            style={filterInputStyle}
          />

          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            style={filterSelectStyle}
          >
            <option value="newest">🕐 الأحدث</option>
            <option value="rating">⭐ الأعلى تقييماً</option>
            <option value="price_asc">💰 السعر: من الأقل</option>
            <option value="price_desc">💰 السعر: من الأعلى</option>
          </select>
<Link href="/services/requests" style={{
  background: COLORS.softGreen,
  color: COLORS.darkNavy,
  padding: '12px 25px',
  borderRadius: 40,
  textDecoration: 'none',
  fontWeight: 600,
  marginRight: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
}}>
  <span>📋</span>
  طلباتي
</Link>
{/* رابط الطلبات الواردة */}
<Link href="/services/provider-requests" style={{
  background: COLORS.teal,
  color: 'white',
  padding: '12px 25px',
  borderRadius: 40,
  textDecoration: 'none',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
}}>
  <span>📨</span>
  الطلبات الواردة
</Link>
          <Link href="/services/create" style={{
            background: COLORS.teal,
            color: 'white',
            padding: '12px 25px',
            borderRadius: 40,
            textDecoration: 'none',
            fontWeight: 600,
            marginRight: 'auto',
          }}>
            + إضافة خدمة
          </Link>
        </div>
      </div>

      {/* شبكة الخدمات */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <div style={{
            width: 50,
            height: 50,
            margin: '0 auto 20px',
            border: `3px solid ${COLORS.teal}20`,
            borderTopColor: COLORS.teal,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p>جاري تحميل الخدمات...</p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {/* إذا لم توجد نتائج */}
          {services.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'white',
              borderRadius: 30,
            }}>
              <span style={{ fontSize: '4rem' }}>🔍</span>
              <h3 style={{ color: COLORS.darkNavy, margin: '20px 0' }}>لا توجد خدمات</h3>
              <p style={{ color: '#666' }}>حاول تغيير معايير البحث أو أضف خدمة جديدة</p>
              <Link href="/services/create" style={{
                display: 'inline-block',
                marginTop: 20,
                padding: '12px 30px',
                background: COLORS.teal,
                color: 'white',
                textDecoration: 'none',
                borderRadius: 40,
              }}>
                إضافة خدمة جديدة
              </Link>
            </div>
          )}

          {/* أزرار التنقل بين الصفحات */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              marginTop: 40,
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={paginationButtonStyle(page === 1)}
              >
                ←
              </button>
              <span style={{
                padding: '10px 20px',
                background: COLORS.lightMint,
                borderRadius: 40,
                color: COLORS.darkNavy,
              }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={paginationButtonStyle(page === totalPages)}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
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
            fontSize: '0.7rem',
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
            fontSize: '0.7rem',
          }}>
            {service.category}
          </span>
        </div>

        {/* المحتوى */}
        <div style={{ padding: '20px' }}>
          <h3 style={{
            color: COLORS.darkNavy,
            fontSize: '1.1rem',
            marginBottom: 10,
            height: '3.3rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {service.title}
          </h3>

          <p style={{
            color: '#666',
            fontSize: '0.9rem',
            marginBottom: 15,
            lineHeight: 1.6,
            height: '4.5rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}>
            {service.description}
          </p>

          {/* مقدم الخدمة */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 15,
            padding: '10px 0',
            borderTop: `1px solid ${COLORS.teal}20`,
            borderBottom: `1px solid ${COLORS.teal}20`,
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
              fontWeight: 600,
            }}>
              {service.provider_name_ar?.charAt(0) || service.provider_name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.darkNavy }}>
                {service.provider_name_ar || service.provider_name || 'مقدم خدمة'}
              </div>
              {service.institution_name && (
                <div style={{ fontSize: '0.6rem', color: '#666' }}>
                  {service.institution_name}
                </div>
              )}
            </div>
          </div>

          {/* السعر والتقييم */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: COLORS.teal }}>
                {service.price} {service.currency}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#666' }}>
                ⏱️ {service.delivery_time} يوم
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: `${COLORS.lightMint}40`,
              padding: '5px 10px',
              borderRadius: 20,
            }}>
              <span style={{ color: '#FFD700' }}>⭐</span>
              <span style={{ fontWeight: 600, color: COLORS.darkNavy }}>
                {service.rating > 0 ? service.rating.toFixed(1) : 'جديد'}
              </span>
              {service.reviews_count > 0 && (
                <span style={{ fontSize: '0.7rem', color: '#666' }}>
                  ({service.reviews_count})
                </span>
              )}
            </div>
          </div>

          {/* ✅ عرض الوسوم بعد التحويل */}
          {tags.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
              marginTop: 15,
            }}>
              {tags.slice(0, 3).map(tag => (
                <span key={tag} style={{
                  padding: '2px 8px',
                  background: COLORS.lightMint,
                  borderRadius: 12,
                  fontSize: '0.6rem',
                  color: COLORS.teal,
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
const filterSelectStyle = {
  padding: '10px 15px',
  borderRadius: 30,
  border: `2px solid ${COLORS.teal}40`,
  background: 'white',
  color: COLORS.darkNavy,
  fontSize: '0.9rem',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '150px',
};

const filterInputStyle = {
  padding: '10px 15px',
  borderRadius: 30,
  border: `2px solid ${COLORS.teal}40`,
  background: 'white',
  color: COLORS.darkNavy,
  fontSize: '0.9rem',
  outline: 'none',
  width: '120px',
};

const paginationButtonStyle = (disabled: boolean) => ({
  padding: '10px 20px',
  borderRadius: 40,
  border: `2px solid ${COLORS.teal}`,
  background: disabled ? 'transparent' : COLORS.teal,
  color: disabled ? COLORS.teal : 'white',
  cursor: disabled ? 'default' : 'pointer',
  fontSize: '1rem',
  fontWeight: 600,
  transition: 'all 0.3s',
});