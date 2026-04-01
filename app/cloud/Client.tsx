'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORY_ROUTES: Record<string, string> = {
  erp:          '/cloud/apps/erp',
  crm:          '/cloud/apps/crm',
  hr:           '/cloud/apps/hr',
  form:         '/cloud/apps/forms',
  funnel:       '/cloud/apps/funnel',
  landing_page: '/cloud/apps/landing',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  bg: '#080520',
};

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display:'flex',alignItems:'center',gap:14,textDecoration:'none',userSelect:'none' }}>
      <svg width="42" height="42" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_cloud" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD"/><stop offset="42%" stopColor="#85C79A"/><stop offset="100%" stopColor="#4E8D9C"/></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)"/>
        <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)"/>
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_cloud)"/>
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92"/>
      </svg>
      <div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #4fc3f7, #ffffff, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '1px', fontFamily: "'Tajawal', sans-serif" }}>Ø§Ù„Ù…Ø¬Ø±Ø© Ø§Ù„Ø­Ø¶Ø§Ø±ÙŠØ©</div>
        <div style={{ fontSize: '0.72rem', color: '#8aa4bc', display: 'block', marginTop: -2, fontFamily: "'Tajawal', sans-serif" }}>ÙƒÙˆÙƒØ¨Ø© Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª Ø§Ù„Ù…Ø¶ÙŠØ¦Ø©</div>
      </div>
    </Link>
  );
}

const CLOUD_NAV = [
  { href: '/pulse', label:'Ø§Ù„Ø£Ø®Ø¨Ø§Ø±' }, { href:'/campaigns', label:'Ø§Ù„Ø­Ù…Ù„Ø§Øª' },
  { href:'/marketplace', label:'Ø§Ù„Ø³ÙˆÙ‚ Ø§Ù„Ø±Ù‚Ù…ÙŠ' }, { href:'/cloud', label:'â˜ï¸ SAAS', active:true },
  { href:'/services', label:'Ø§Ù„Ø®Ø¯Ù…Ø§Øª' }, { href:'/library', label:'Ø§Ù„Ù…ÙƒØªØ¨Ø©' },
  { href:'/forum', label:'Ø§Ù„Ù…Ù†ØªØ¯Ù‰' }, { href:'/podcast', label:'Ø§Ù„Ø¨ÙˆØ¯ÙƒØ§Ø³Øª' },
];

const CATEGORIES = [
  { id: '',            icon: 'ðŸŒ', label: 'Ø§Ù„ÙƒÙ„' },
  { id: 'erp',         icon: 'ðŸ­', label: 'ERP' },
  { id: 'crm',         icon: 'ðŸ¤', label: 'CRM' },
  { id: 'hr',          icon: 'ðŸ‘¥', label: 'HR' },
  { id: 'funnel',      icon: 'ðŸŒªï¸', label: 'Funnels' },
  { id: 'landing_page',icon: 'ðŸ–¥ï¸', label: 'Landing Pages' },
  { id: 'form',        icon: 'ðŸ“‹', label: 'Registration Forms' },
  { id: 'tool',        icon: 'ðŸ› ï¸', label: 'Ø£Ø¯ÙˆØ§Øª Ø£Ø®Ø±Ù‰' },
];

const CAT_COLORS: Record<string, string> = {
  erp: '#6366f1', crm: '#0ea5e9', hr: '#10b981',
  funnel: '#f59e0b', landing_page: '#ef4444',
  form: '#8b5cf6', tool: '#64748b',
};

const PRICING_LABELS: Record<string, { label: string; color: string }> = {
  free:         { label: 'Ù…Ø¬Ø§Ù†ÙŠ',      color: '#10b981' },
  subscription: { label: 'Ø§Ø´ØªØ±Ø§Ùƒ Ø´Ù‡Ø±ÙŠ', color: COLORS.teal },
  one_time:     { label: 'Ø¯ÙØ¹Ø© ÙˆØ§Ø­Ø¯Ø©',  color: '#8b5cf6' },
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

  useEffect(() => {
    const sid = localStorage.getItem('sessionId');
    if (!sid) return;
    fetch(`${API_BASE}/api/saas/my-subscriptions`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success) setSubscribed(d.data || []); })
      .catch(() => {});
  }, []);

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
      else alert(data.error || 'Ø­Ø¯Ø« Ø®Ø·Ø£');
    } catch { alert('Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„'); }
    finally { setSubLoading(null); }
  };

  const reset = () => { setCategory(''); setPricing(''); setSearch(''); setPage(1); };
  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      {/* â”€â”€â”€ Nav â”€â”€â”€ */}
      <header style={{ position:'sticky',top:0,zIndex:50,height:72,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',background:'rgba(8,5,32,0.96)',backdropFilter:'blur(24px)',borderBottom:`1px solid ${COLORS.teal}30`,boxShadow:'0 2px 32px rgba(0,0,0,0.5)',fontFamily:"'Tajawal', sans-serif" }}>
        <GalaxyLogo />
        <nav style={{ display:'flex',gap:6 }}>
          {CLOUD_NAV.map(l=>(
            <Link key={l.href} href={l.href} style={{ padding:'8px 16px',borderRadius:24,textDecoration:'none',fontSize:'0.85rem',fontWeight:600,color:(l as any).active?'#fff':'#9ca3af',background:(l as any).active?`linear-gradient(135deg,${COLORS.teal},${COLORS.softGreen})`:'transparent',border:(l as any).active?'none':'1px solid rgba(255,255,255,0.06)',transition:'all 0.2s' }}>{l.label}</Link>
          ))}
        </nav>
      </header>

      {/* â”€â”€â”€ Hero â”€â”€â”€ */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, #0f0a3a 50%, ${COLORS.teal}22 100%)`,
        padding: '60px 24px 50px', textAlign: 'center',
        borderBottom: `1px solid ${COLORS.teal}30`,
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>â˜ï¸</div>
        <h1 style={{ color: COLORS.lightMint, fontSize: '2.2rem', fontWeight: 800, margin: '0 0 12px' }}>
          Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ø³Ø­Ø§Ø¨ÙŠØ©
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', maxWidth: 600, margin: '0 auto 30px' }}>
          Ù…Ù†Ø¸ÙˆÙ…Ø© SAAS Ù…ØªÙƒØ§Ù…Ù„Ø© ØªØ¬Ø¹Ù„ Ø§Ù„Ù…Ø¬Ø±Ø© Ø§Ù„Ø­Ø¶Ø§Ø±ÙŠØ© Ù„ÙŠØ³Øª ÙÙ‚Ø· Ø­Ø§Ø¶Ù†Ø© Ø¹Ù„Ø§Ù‚Ø§ØªØŒ Ø¨Ù„ Ù…Ø²ÙˆØ¯ Ø¨Ù†ÙŠØ© ØªØ´ØºÙŠÙ„ÙŠØ© Ù„Ù„Ù…Ø¤Ø³Ø³Ø§Øª
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

      {/* â”€â”€â”€ Filters Bar â”€â”€â”€ */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '20px 24px',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="ðŸ” Ø§Ø¨Ø­Ø« Ø¹Ù† ØªØ·Ø¨ÙŠÙ‚..."
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
          <option value="">ÙƒÙ„ Ø¨Ø§Ù‚Ø§Øª Ø§Ù„ØªØ³Ø¹ÙŠØ±</option>
          <option value="free">Ù…Ø¬Ø§Ù†ÙŠ</option>
          <option value="subscription">Ø§Ø´ØªØ±Ø§Ùƒ</option>
          <option value="one_time">Ø¯ÙØ¹Ø© ÙˆØ§Ø­Ø¯Ø©</option>
        </select>
        {(category || pricing || search) && (
          <button onClick={reset} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)', padding: '10px 16px', borderRadius: 40,
            cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Cairo, sans-serif',
          }}>âœ• Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙÙ„ØªØ±</button>
        )}
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginRight: 'auto' }}>
          {total} ØªØ·Ø¨ÙŠÙ‚
        </span>
      </div>

      {/* â”€â”€â”€ Grid â”€â”€â”€ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.3 }}>â˜ï¸</div>
            Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...
          </div>
        ) : apps.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 24,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>ðŸ”</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>
              Ù„Ø§ ØªÙˆØ¬Ø¯ ØªØ·Ø¨ÙŠÙ‚Ø§Øª Ø¨Ø¹Ø¯ â€” ØªØ±Ù‚Ø¨ Ø¥Ø·Ù„Ø§Ù‚ Ø§Ù„Ù…Ù†Ø¸ÙˆÙ…Ø© Ø§Ù„Ø³Ø­Ø§Ø¨ÙŠØ©
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
            {CATEGORIES.find(c => c.id === app.category)?.icon || 'â˜ï¸'}
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
              }}>âœ“ {f}</span>
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
              {app.pricing_model === 'free' ? 'Ù…Ø¬Ø§Ù†ÙŠ' : (
                <>
                  {app.price_monthly > 0 && `$${app.price_monthly}/Ø´Ù‡Ø±`}
                  {app.price_yearly > 0 && app.price_monthly > 0 && ' Â· '}
                  {app.price_yearly > 0 && `$${app.price_yearly}/Ø³Ù†Ø©`}
                  {app.price_monthly === 0 && app.price_yearly === 0 && '-'}
                </>
              )}
            </div>
            <div style={{ color: pricing.color, fontSize: '0.75rem', marginTop: 1 }}>{pricing.label}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {isSubscribed && CATEGORY_ROUTES[app.category] && (
              <Link href={CATEGORY_ROUTES[app.category]} style={{
                background: '#10b98118', color: '#10b981', border: '1px solid #10b98140',
                borderRadius: 40, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 700,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>Ø§ÙØªØ­ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ â†</Link>
            )}
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
              {isLoading ? '...' : isSubscribed ? 'âœ“ Ù…Ø´ØªØ±Ùƒ' : 'Ø§Ø´ØªØ±Ùƒ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

