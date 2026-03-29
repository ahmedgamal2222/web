'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { mint: '#EDF7BD', green: '#85C79A', teal: '#4E8D9C', navy: '#281C59' };

function getSessionId() {
  if (typeof window !== 'undefined') return localStorage.getItem('sessionId') || '';
  return '';
}

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display:'flex',alignItems:'center',gap:12,textDecoration:'none',userSelect:'none' }}>
      <svg width="38" height="38" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_camp" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD"/><stop offset="42%" stopColor="#85C79A"/><stop offset="100%" stopColor="#4E8D9C"/></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)"/>
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_camp)"/>
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.9"/>
      </svg>
      <div>
        <div style={{ fontSize:'1.1rem',fontWeight:900,background:'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize:'0.6rem',color:'#4E8D9C',letterSpacing:'0.3em',fontWeight:700,textTransform:'uppercase' }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

const NAV_LINKS = [
  { href:'/news', label:'الأخبار' }, { href:'/campaigns', label:'الحملات', active:true },
  { href:'/marketplace', label:'السوق الرقمي' }, { href:'/services', label:'الخدمات' },
  { href:'/library', label:'المكتبة' }, { href:'/forum', label:'المنتدى' },
];

const CATEGORIES: Record<string, { label:string; icon:string; color:string }> = {
  all:           { label:'الكل', icon:'🌐', color: C.teal },
  social:        { label:'اجتماعية', icon:'🤝', color:'#85C79A' },
  cultural:      { label:'ثقافية', icon:'🎭', color:'#FFD700' },
  educational:   { label:'تعليمية', icon:'📚', color:'#4E8D9C' },
  charitable:    { label:'خيرية', icon:'❤️', color:'#FF8BA0' },
  environmental: { label:'بيئية', icon:'🌿', color:'#6DBF67' },
  media:         { label:'إعلامية', icon:'📡', color:'#B47FE6' },
  general:       { label:'عامة', icon:'⭐', color:'#EDF7BD' },
};

const STATUS_LABELS: Record<string, { label:string; color:string }> = {
  open:      { label:'مفتوحة', color:'#85C79A' },
  active:    { label:'نشطة', color:'#4E8D9C' },
  completed: { label:'مكتملة', color:'#9ab0c0' },
  cancelled: { label:'ملغاة', color:'#ff8080' },
};

interface Campaign {
  id: number; title: string; description?: string; goal?: string;
  category: string; status: string; start_date?: string; end_date?: string;
  image_url?: string; location?: string; tags?: string;
  creator_institution_name?: string; creator_institution_logo?: string;
  members_count?: number; created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const sid = getSessionId();
    if (sid) {
      fetch(`${API_BASE}/api/auth/me`, { headers: { 'X-Session-ID': sid } })
        .then(r => r.json()).then(d => { if (d.success) setSession(d.data); }).catch(() => {});
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [category, status]);

  function fetchCampaigns() {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', limit: '20' });
    if (category !== 'all') params.set('category', category);
    if (status) params.set('status', status);
    fetch(`${API_BASE}/api/campaigns?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCampaigns(d.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  const filtered = search
    ? campaigns.filter(c => c.title.includes(search) || c.description?.includes(search))
    : campaigns;

  const formatDate = (s?: string) => s
    ? new Date(s).toLocaleDateString('ar-EG', { year:'numeric', month:'short', day:'numeric' })
    : '';

  const canCreate = session?.role === 'admin' || session?.role === 'institution_admin';

  return (
    <div style={{ minHeight:'100vh', background:'#080520', color:'#e8f4f8', fontFamily:"'Cairo',sans-serif", direction:'rtl' }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .camp-card { transition: transform .22s, box-shadow .22s; }
        .camp-card:hover { transform:translateY(-5px); box-shadow:0 16px 48px rgba(78,141,156,.25) !important; }
        .cat-btn { transition: all .18s; cursor:pointer; border:none; }
        .cat-btn:hover { transform:translateY(-2px); }
        select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%234E8D9C' d='M8 11L2 5h12z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:left 12px center; background-size:14px; }
      `}</style>

      {/* Stars */}
      <div style={{ position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0 }}>
        {[...Array(50)].map((_,i) => (
          <div key={i} style={{ position:'absolute',borderRadius:'50%',background:'white',opacity:Math.random()*.4+.05,width:Math.random()*2+1,height:Math.random()*2+1,top:`${Math.random()*100}%`,left:`${Math.random()*100}%` }}/>
        ))}
      </div>

      {/* Nav */}
      <header style={{ position:'sticky',top:0,zIndex:100,height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',background:'rgba(8,5,32,.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(78,141,156,.2)' }}>
        <GalaxyLogo />
        <nav style={{ display:'flex',gap:4,flexWrap:'nowrap',overflowX:'auto' }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{ padding:'6px 14px',borderRadius:20,textDecoration:'none',fontSize:'.82rem',fontWeight:600,whiteSpace:'nowrap',color:(l as any).active ? C.navy : '#9ca3af',background:(l as any).active ? `linear-gradient(135deg,${C.teal},${C.green})` : 'transparent',border:(l as any).active ? 'none' : '1px solid rgba(255,255,255,.07)' }}>{l.label}</Link>
          ))}
        </nav>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          {!session ? (
            <Link href="/login" style={{ padding:'7px 18px',borderRadius:22,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:700,fontSize:'.84rem',textDecoration:'none' }}>دخول</Link>
          ) : (
            <Link href="/profile" style={{ display:'flex',alignItems:'center',gap:8,textDecoration:'none',padding:'5px 12px',borderRadius:20,background:'rgba(78,141,156,.12)',border:'1px solid rgba(78,141,156,.25)' }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.navy})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:700,color:'#fff' }}>{session.name?.charAt(0)||'U'}</div>
              <span style={{ color:C.teal,fontSize:'.83rem',fontWeight:600 }}>{session.name}</span>
            </Link>
          )}
        </div>
      </header>

      <main style={{ position:'relative',zIndex:1,maxWidth:1200,margin:'0 auto',padding:'40px 20px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign:'center',marginBottom:48 }}>
          <div style={{ fontSize:'3rem',marginBottom:16 }}>🚀</div>
          <h1 style={{ fontSize:'clamp(1.8rem,5vw,2.8rem)',fontWeight:900,lineHeight:1.3,margin:'0 0 14px',background:`linear-gradient(130deg,${C.mint},${C.green},${C.teal})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
            الحملات المشتركة
          </h1>
          <p style={{ fontSize:'1.05rem',color:'#8db0c0',maxWidth:600,margin:'0 auto 28px',lineHeight:1.7 }}>
            مساحة للفعل الجماعي — تكاتف المؤسسات في حملات ذات أهداف مشتركة لتحقيق أثر حضاري حقيقي
          </p>
          {canCreate && (
            <Link href="/campaigns/create" style={{ display:'inline-flex',alignItems:'center',gap:10,padding:'12px 28px',borderRadius:30,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:700,fontSize:'1rem',textDecoration:'none',boxShadow:'0 4px 20px rgba(78,141,156,.35)' }}>
              <span style={{ fontSize:'1.2rem' }}>+</span> إطلاق حملة جديدة
            </Link>
          )}
        </div>

        {/* Filters */}
        <div style={{ display:'flex',gap:12,marginBottom:32,flexWrap:'wrap',alignItems:'center' }}>
          {/* Search */}
          <div style={{ flex:1,minWidth:220,position:'relative' }}>
            <span style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#4E8D9C',fontSize:'1rem',pointerEvents:'none' }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن حملة..."
              style={{ width:'100%',padding:'10px 42px 10px 16px',borderRadius:24,border:'1px solid rgba(78,141,156,.3)',background:'rgba(78,141,156,.07)',color:'#e8f4f8',fontSize:'.9rem',fontFamily:"'Cairo',sans-serif",outline:'none',boxSizing:'border-box' }}/>
          </div>
          {/* Status */}
          <select value={status} onChange={e=>setStatus(e.target.value)}
            style={{ padding:'10px 40px 10px 16px',borderRadius:24,border:'1px solid rgba(78,141,156,.3)',background:'rgba(8,5,32,.9)',color:'#e8f4f8',fontSize:'.88rem',fontFamily:"'Cairo',sans-serif",cursor:'pointer',outline:'none',minWidth:160 }}>
            <option value="">جميع الحالات</option>
            <option value="open">مفتوحة</option>
            <option value="active">نشطة</option>
            <option value="completed">مكتملة</option>
          </select>
        </div>

        {/* Category pills */}
        <div style={{ display:'flex',gap:8,marginBottom:36,flexWrap:'wrap' }}>
          {Object.entries(CATEGORIES).map(([key, meta]) => (
            <button key={key} className="cat-btn" onClick={() => setCategory(key)}
              style={{ padding:'8px 18px',borderRadius:24,fontSize:'.85rem',fontWeight:600,color: category===key ? '#080520' : '#9ab0c0',background: category===key ? meta.color : 'rgba(255,255,255,.04)',border: category===key ? 'none' : '1px solid rgba(255,255,255,.08)' }}>
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:'center',padding:'60px 0' }}>
            <div style={{ width:36,height:36,border:`3px solid ${C.teal}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 12px' }}/>
            <p style={{ color:C.teal }}>جاري تحميل الحملات...</p>
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center',padding:'60px 20px',background:'rgba(78,141,156,.05)',borderRadius:20,border:'1px solid rgba(78,141,156,.15)' }}>
                <div style={{ fontSize:'3rem',marginBottom:12 }}>🌌</div>
                <p style={{ color:'#8db0c0',fontSize:'1.05rem' }}>لا توجد حملات بعد. كن أول من يطلق حملة!</p>
              </div>
            ) : (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:24 }}>
                {filtered.map((camp, idx) => {
                  const cat = CATEGORIES[camp.category] || CATEGORIES.general;
                  const st = STATUS_LABELS[camp.status] || { label: camp.status, color: '#9ab0c0' };
                  const tags = camp.tags ? JSON.parse(camp.tags) : [];
                  return (
                    <Link key={camp.id} href={`/campaigns/${camp.id}`} style={{ textDecoration:'none' }}>
                      <div className="camp-card" style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.18)',borderRadius:20,overflow:'hidden',animation:`fadeUp .4s ease ${idx*.06}s both` }}>
                        {/* Image */}
                        <div style={{ height:180,background:'linear-gradient(135deg,rgba(78,141,156,.2),rgba(40,28,89,.5))',position:'relative',overflow:'hidden' }}>
                          {camp.image_url
                            ? <img src={camp.image_url} alt={camp.title} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                            : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'4rem' }}>{cat.icon}</div>
                          }
                          <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 50%,rgba(8,5,32,.7))' }}/>
                          <span style={{ position:'absolute',top:12,right:12,padding:'4px 12px',borderRadius:16,background:`${cat.color}20`,color:cat.color,border:`1px solid ${cat.color}40`,fontSize:'.78rem',fontWeight:700,backdropFilter:'blur(8px)' }}>
                            {cat.icon} {cat.label}
                          </span>
                          <span style={{ position:'absolute',top:12,left:12,padding:'4px 12px',borderRadius:16,background:`${st.color}20`,color:st.color,border:`1px solid ${st.color}40`,fontSize:'.78rem',fontWeight:700,backdropFilter:'blur(8px)' }}>
                            {st.label}
                          </span>
                        </div>
                        {/* Body */}
                        <div style={{ padding:'18px 20px' }}>
                          <h3 style={{ fontSize:'1.05rem',fontWeight:800,color:'#f0f8ff',margin:'0 0 8px',lineHeight:1.4 }}>{camp.title}</h3>
                          {camp.description && (
                            <p style={{ fontSize:'.85rem',color:'#8db0c0',lineHeight:1.6,margin:'0 0 14px',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>
                              {camp.description}
                            </p>
                          )}
                          {/* Meta */}
                          <div style={{ display:'flex',gap:14,fontSize:'.78rem',color:'#6a8090',marginBottom:12,flexWrap:'wrap' }}>
                            {camp.members_count !== undefined && (
                              <span>👥 {camp.members_count} مؤسسة شريكة</span>
                            )}
                            {camp.location && <span>📍 {camp.location}</span>}
                            {camp.start_date && <span>📅 {formatDate(camp.start_date)}</span>}
                          </div>
                          {/* Institution */}
                          {camp.creator_institution_name && (
                            <div style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 12px',background:'rgba(78,141,156,.08)',borderRadius:12,border:'1px solid rgba(78,141,156,.15)' }}>
                              {camp.creator_institution_logo
                                ? <img src={camp.creator_institution_logo} alt="" style={{ width:22,height:22,borderRadius:'50%',objectFit:'cover' }}/>
                                : <div style={{ width:22,height:22,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.navy})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:700,color:'#fff' }}>{camp.creator_institution_name.charAt(0)}</div>
                              }
                              <span style={{ fontSize:'.78rem',color:C.teal,fontWeight:600 }}>{camp.creator_institution_name}</span>
                            </div>
                          )}
                          {/* Tags */}
                          {tags.length > 0 && (
                            <div style={{ display:'flex',gap:6,marginTop:12,flexWrap:'wrap' }}>
                              {tags.slice(0,3).map((t: string) => (
                                <span key={t} style={{ padding:'2px 10px',borderRadius:12,background:'rgba(133,199,154,.1)',color:C.green,border:'1px solid rgba(133,199,154,.2)',fontSize:'.72rem' }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
