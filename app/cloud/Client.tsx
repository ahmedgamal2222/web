'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  bg: '#080520',
};

const CATEGORIES = [
  { id: '',            icon: '🌐', label: 'الكل' },
  { id: 'erp',         icon: '🏭', label: 'ERP' },
  { id: 'crm',         icon: '🤝', label: 'CRM' },
  { id: 'hr',          icon: '👥', label: 'HR' },
  { id: 'funnel',      icon: '🌪️', label: 'Funnels' },
  { id: 'landing_page',icon: '🖥️', label: 'Landing Pages' },
  { id: 'form',        icon: '📋', label: 'Registration Forms' },
  { id: 'tool',        icon: '🛠️', label: 'أدوات أخرى' },
];

const CAT_COLORS: Record<string, string> = {
  erp: '#6366f1', crm: '#0ea5e9', hr: '#10b981',
  funnel: '#f59e0b', landing_page: '#ef4444',
  form: '#8b5cf6', tool: '#64748b',
};

const PRICING_LABELS: Record<string, { label: string; color: string }> = {
  free:         { label: 'مجاني',      color: '#10b981' },
  subscription: { label: 'اشتراك شهري', color: COLORS.teal },
  one_time:     { label: 'دفعة واحدة',  color: '#8b5cf6' },
};

export default function CloudClient() {
  const router = useRouter();
  const [apps, setApps]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('');
  const [pricing, setPricing]   = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [subscribed, setSubscribed] = useState<number[]>([]);
  const [subLoading, setSubLoading] = useState<number | null>(null);
  const limit = 12;

  useEffect(() => { fetchApps(); }, [category, pricing, search, page]);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (category) params.set('category', category);
      if (pricing)  params.set('pricing', pricing);
      if (search)   params.set('search', search);
      const res  = await fetch(`${API_BASE}/api/saas?${params}`);
      const data = await res.json();
      setApps(data.data || []);
      setTotal(data.total || 0);
    } catch { setApps([]); }
    finally { setLoading(false); }
  };

  const handleSubscribe = async (appId: number) => {
    const sessionId = localStorage.getItem('sessionId') || '';
    if (!sessionId) { router.push('/login'); return; }
    setSubLoading(appId);
    try {
      const res = await fetch(`${API_BASE}/api/saas/${appId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
        body: JSON.stringify({ plan: 'monthly' }),
      });
      const data = await res.json();
      if (data.success) setSubscribed(prev => [...prev, appId]);
      else alert(data.error || 'حدث خطأ');
    } catch { alert('حدث خطأ في الاتصال'); }
    finally { setSubLoading(null); }
  };

  const reset = () => { setCategory(''); setPricing(''); setSearch(''); setPage(1); };
  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      {/* ─── Nav ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,5,32,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${COLORS.teal}30`,
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/" style={{ color: COLORS.lightMint, textDecoration: 'none', fontSize: '1.1rem', fontWeight: 700 }}>
          ✦ المجرة الحضارية
        </Link>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { href: '/campaigns',   label: '🚀 الحملات' },
            { href: '/marketplace', label: '🛒 الماركت' },
            { href: '/cloud',       label: '☁️ SAAS' },
            { href: '/news',        label: '📰 الأخبار' },
            { href: '/services',    label: '🛠️ الخدمات' },
          ].map(link => (
            <Link key={link.href} href={link.href} style={{
              color: link.href === '/cloud' ? COLORS.lightMint : 'rgba(255,255,255,0.7)',
              textDecoration: 'none', fontSize: '0.85rem',
              borderBottom: link.href === '/cloud' ? `2px solid ${COLORS.teal}` : 'none',
              paddingBottom: 2,
            }}>{link.label}</Link>
          ))}
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, #0f0a3a 50%, ${COLORS.teal}22 100%)`,
        padding: '60px 24px 50px', textAlign: 'center',
        borderBottom: `1px solid ${COLORS.teal}30`,
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>☁️</div>
        <h1 style={{ color: COLORS.lightMint, fontSize: '2.2rem', fontWeight: 800, margin: '0 0 12px' }}>
          الخدمات السحابية
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', maxWidth: 600, margin: '0 auto 30px' }}>
          منظومة SAAS متكاملة تجعل المجرة الحضارية ليست فقط حاضنة علاقات، بل مزود بنية تشغيلية للمؤسسات
        </p>
        {/* Category pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 700, margin: '0 auto' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => { setCategory(cat.id); setPage(1); }} style={{
              background: category === cat.id ? COLORS.teal : 'rgba(255,255,255,0.08)',
              color: category === cat.id ? 'white' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${category === cat.id ? COLORS.teal : 'rgba(255,255,255,0.15)'}`,
              padding: '8px 18px', borderRadius: 40, cursor: 'pointer',
              fontSize: '0.88rem', fontWeight: category === cat.id ? 700 : 400,
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Cairo, sans-serif',
            }}>
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Filters Bar ─── */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '20px 24px',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍 ابحث عن تطبيق..."
          style={{
            flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 40,
            background: 'rgba(255,255,255,0.07)', border: `1px solid ${COLORS.teal}40`,
            color: 'white', fontSize: '0.9rem', outline: 'none',
            fontFamily: 'Cairo, sans-serif',
          }}
        />
        <select value={pricing} onChange={e => { setPricing(e.target.value); setPage(1); }} style={{
          padding: '10px 40px 10px 16px', borderRadius: 40,
          background: 'rgba(255,255,255,0.07)', border: `1px solid ${COLORS.teal}40`,
          color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
          fontFamily: 'Cairo, sans-serif', appearance: 'none',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%234E8D9C' d='M8 11L2 5h12z'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat', backgroundPosition: 'left 14px center', backgroundSize: '14px',
        }}>
          <option value="">كل باقات التسعير</option>
          <option value="free">مجاني</option>
          <option value="subscription">اشتراك</option>
          <option value="one_time">دفعة واحدة</option>
        </select>
        {(category || pricing || search) && (
          <button onClick={reset} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)', padding: '10px 16px', borderRadius: 40,
            cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Cairo, sans-serif',
          }}>✕ إلغاء الفلتر</button>
        )}
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginRight: 'auto' }}>
          {total} تطبيق
        </span>
      </div>

      {/* ─── Grid ─── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.3 }}>☁️</div>
            جاري التحميل...
          </div>
        ) : apps.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 24,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>🔍</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>
              لا توجد تطبيقات بعد — ترقب إطلاق المنظومة السحابية
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {apps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                isSubscribed={subscribed.includes(app.id)}
                isLoading={subLoading === app.id}
                onSubscribe={() => handleSubscribe(app.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: 38, height: 38, borderRadius: '50%',
                background: page === p ? COLORS.teal : 'rgba(255,255,255,0.07)',
                color: page === p ? 'white' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${page === p ? COLORS.teal : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Cairo, sans-serif',
              }}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppCard({ app, isSubscribed, isLoading, onSubscribe }: any) {
  const catColor = CAT_COLORS[app.category] || COLORS.teal;
  const pricing  = PRICING_LABELS[app.pricing_model] || { label: app.pricing_model, color: COLORS.teal };
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? COLORS.teal + '60' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 20, overflow: 'hidden',
        transition: 'all 0.25s', transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 16px 40px ${catColor}25` : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Cover / icon area */}
      <div style={{
        height: 130,
        background: app.cover_url
          ? `url(${app.cover_url}) center/cover`
          : `linear-gradient(135deg, ${catColor}33, ${catColor}15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {app.icon_url ? (
          <img src={app.icon_url} alt={app.name} style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>
            {CATEGORIES.find(c => c.id === app.category)?.icon || '☁️'}
          </span>
        )}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: `${catColor}dd`, color: 'white',
          padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
        }}>
          {CATEGORIES.find(c => c.id === app.category)?.label || app.category}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <h3 style={{ color: 'white', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
            {app.name_ar || app.name}
          </h3>
          {app.name_ar && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: 2 }}>{app.name}</div>
          )}
        </div>

        {app.description_ar && (
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '0.87rem',
            lineHeight: 1.6, margin: 0, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {app.description_ar}
          </p>
        )}

        {/* Features */}
        {app.features?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {app.features.slice(0, 3).map((f: string, i: number) => (
              <span key={i} style={{
                background: `${catColor}18`, color: catColor,
                padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem',
              }}>✓ {f}</span>
            ))}
            {app.features.length > 3 && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                +{app.features.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price + Subscribe */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div>
            <div style={{ color: pricing.color, fontWeight: 800, fontSize: '0.95rem' }}>
              {app.pricing_model === 'free' ? 'مجاني' : (
                <>
                  {app.price_monthly > 0 && `$${app.price_monthly}/شهر`}
                  {app.price_yearly > 0 && app.price_monthly > 0 && ' · '}
                  {app.price_yearly > 0 && `$${app.price_yearly}/سنة`}
                  {app.price_monthly === 0 && app.price_yearly === 0 && '-'}
                </>
              )}
            </div>
            <div style={{ color: pricing.color, fontSize: '0.75rem', marginTop: 1 }}>{pricing.label}</div>
          </div>

          <button
            onClick={onSubscribe}
            disabled={isSubscribed || isLoading}
            style={{
              background: isSubscribed ? '#10b981' : COLORS.teal,
              color: 'white', border: 'none', borderRadius: 40,
              padding: '8px 18px', cursor: isSubscribed ? 'default' : 'pointer',
              fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Cairo, sans-serif',
              opacity: isLoading ? 0.6 : 1, transition: 'all 0.2s',
            }}
          >
            {isLoading ? '...' : isSubscribed ? '✓ مشترك' : 'اشترك'}
          </button>
        </div>
      </div>
    </div>
  );
}
