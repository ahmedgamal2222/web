'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { mint: '#EDF7BD', green: '#85C79A', teal: '#4E8D9C', navy: '#281C59' };

function getSessionId() {
  if (typeof window !== 'undefined') return localStorage.getItem('sessionId') || '';
  return '';
}

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display:'flex',alignItems:'center',gap:14,textDecoration:'none',userSelect:'none' }}>
      <svg width="42" height="42" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_mkt" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD"/><stop offset="42%" stopColor="#85C79A"/><stop offset="100%" stopColor="#4E8D9C"/></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)"/>
        <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)"/>
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_mkt)"/>
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92"/>
      </svg>
      <div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #4fc3f7, #ffffff, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '1px', fontFamily: "'Tajawal', sans-serif" }}>Ø§Ù„Ù…Ø¬Ø±Ø© Ø§Ù„Ø­Ø¶Ø§Ø±ÙŠØ©</div>
        <div style={{ fontSize: '0.72rem', color: '#8aa4bc', display: 'block', marginTop: -2, fontFamily: "'Tajawal', sans-serif" }}>ÙƒÙˆÙƒØ¨Ø© Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª Ø§Ù„Ù…Ø¶ÙŠØ¦Ø©</div>
      </div>
    </Link>
  );
}

const NAV_LINKS = [
  { href: '/pulse', label:'Ø§Ù„Ø£Ø®Ø¨Ø§Ø±' }, { href:'/campaigns', label:'Ø§Ù„Ø­Ù…Ù„Ø§Øª' },
  { href:'/marketplace', label:'Ø§Ù„Ø³ÙˆÙ‚ Ø§Ù„Ø±Ù‚Ù…ÙŠ', active:true }, { href:'/cloud', label:'â˜ï¸ Ø§Ù„Ø³Ø­Ø§Ø¨Ø©' },
  { href:'/services', label:'Ø§Ù„Ø®Ø¯Ù…Ø§Øª' }, { href:'/library', label:'Ø§Ù„Ù…ÙƒØªØ¨Ø©' },
  { href:'/forum', label:'Ø§Ù„Ù…Ù†ØªØ¯Ù‰' }, { href:'/podcast', label:'Ø§Ù„Ø¨ÙˆØ¯ÙƒØ§Ø³Øª' },
];

const CATEGORIES = [
  { key:'all',      label:'Ø§Ù„ÙƒÙ„',            icon:'ðŸŒ', color:C.teal,   desc:'' },
  { key:'service',  label:'Ø§Ù„Ø®Ø¯Ù…Ø§Øª',          icon:'âš™ï¸', color:'#85C79A', desc:'Ø®Ø¯Ù…Ø§Øª Ù…Ø¤Ø³Ø³ÙŠØ© Ù…ØªÙ†ÙˆØ¹Ø©' },
  { key:'program',  label:'Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬',           icon:'ðŸ“‹', color:'#4E8D9C', desc:'Ø¨Ø±Ø§Ù…Ø¬ ÙˆØ£Ù†Ø´Ø·Ø© Ù…Ù†Ø¸Ù…Ø©' },
  { key:'subscription',label:'Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª',    icon:'ðŸ”„', color:'#B47FE6', desc:'Ø§Ø´ØªØ±Ø§ÙƒØ§Øª Ø¯ÙˆØ±ÙŠØ©' },
  { key:'digital_product',label:'Ù…Ù†ØªØ¬Ø§Øª Ø±Ù‚Ù…ÙŠØ©',icon:'ðŸ’¾', color:'#EDF7BD', desc:'Ù…Ù„ÙØ§Øª ÙˆØ£Ø¯ÙˆØ§Øª Ø±Ù‚Ù…ÙŠØ©' },
  { key:'course',   label:'Ø§Ù„Ø¯ÙˆØ±Ø§Øª',           icon:'ðŸŽ“', color:'#FFD700', desc:'Ø¯ÙˆØ±Ø§Øª ØªØ¯Ø±ÙŠØ¨ÙŠØ© ÙˆØªØ¹Ù„ÙŠÙ…ÙŠØ©' },
  { key:'tool',     label:'Ø§Ù„Ø£Ø¯ÙˆØ§Øª',            icon:'ðŸ› ï¸', color:'#FF9B4E', desc:'' },
];

interface MarketplaceItem {
  id:number; title:string; description?:string; category:string;
  price:number; currency:string; image_url?:string; external_url?:string;
  contact_info?:string; tags?:string; features?:string; is_free:number;
  institution_name?:string; institution_logo?:string; institution_id?:number;
  created_at:string;
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [isFree, setIsFree] = useState('');
  const [session, setSession] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  useEffect(() => {
    const sid = getSessionId();
    if (sid) {
      fetch(`${API_BASE}/api/auth/me`, { headers:{'X-Session-ID':sid} })
        .then(r=>r.json()).then(d=>{ if(d.success && d.user) setSession(d.user); }).catch(()=>{});
    }
  },[]);

  const fetchItems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (isFree) params.set('is_free', isFree);
    fetch(`${API_BASE}/api/marketplace?${params}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success){ setItems(d.data||[]); setTotal(d.total||0); }})
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[category, search, isFree, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const canCreate = session?.role === 'admin' || session?.role === 'institution_admin';
  const catMeta = (k: string) => CATEGORIES.find(c=>c.key===k) || CATEGORIES[0];

  const formatPrice = (item: MarketplaceItem) =>
    item.is_free ? 'ðŸ†“ Ù…Ø¬Ø§Ù†ÙŠ' : item.price === 0 ? 'ØªÙˆØ§ØµÙ„ Ù„Ù„Ø³Ø¹Ø±' : `${item.price} ${item.currency}`;

  return (
    <div style={{ minHeight:'100vh',background:'#080520',color:'#e8f4f8',fontFamily:"'Cairo',sans-serif",direction:'rtl' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .mkt-card{transition:transform .22s,box-shadow .22s;}
        .mkt-card:hover{transform:translateY(-6px);box-shadow:0 18px 50px rgba(78,141,156,.28)!important;}
        .filter-btn{transition:all .18s;cursor:pointer;border:none;}
        .filter-btn:hover{transform:translateY(-2px);}
        select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%234E8D9C' d='M8 11L2 5h12z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:left 12px center;background-size:14px;}
        input::placeholder{color:#566778;}
      `}</style>

      {/* Stars */}
      <div style={{ position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0 }}>
        {[...Array(55)].map((_,i)=><div key={i} style={{ position:'absolute',borderRadius:'50%',background:'white',opacity:Math.random()*.4+.04,width:Math.random()*2+1,height:Math.random()*2+1,top:`${Math.random()*100}%`,left:`${Math.random()*100}%` }}/>)}
      </div>

      {/* Nav */}
      <header style={{ position:'sticky',top:0,zIndex:100,height:72,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',background:'rgba(8,5,32,.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(78,141,156,.2)',boxShadow:'0 2px 32px rgba(0,0,0,0.5)' }}>
        <GalaxyLogo />
        <nav style={{ display:'flex',gap:6 }}>
          {NAV_LINKS.map(l=>(
            <Link key={l.href} href={l.href} style={{ padding:'8px 16px',borderRadius:24,textDecoration:'none',fontSize:'0.85rem',fontWeight:600,color:(l as any).active?'#fff':'#9ca3af',background:(l as any).active?`linear-gradient(135deg,${C.teal},${C.green})`:'transparent',border:(l as any).active?'none':'1px solid rgba(255,255,255,.06)',transition:'all 0.2s' }}>{l.label}</Link>
          ))}
        </nav>
        <div style={{ display:'flex',gap:8 }}>
          {!session
            ? <Link href="/login" style={{ padding:'7px 18px',borderRadius:22,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:700,fontSize:'.83rem',textDecoration:'none' }}>Ø¯Ø®ÙˆÙ„</Link>
            : <Link href="/profile" style={{ display:'flex',alignItems:'center',gap:8,textDecoration:'none',padding:'5px 12px',borderRadius:20,background:'rgba(78,141,156,.12)',border:'1px solid rgba(78,141,156,.25)' }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.navy})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:700,color:'#fff' }}>{session.name?.charAt(0)||'U'}</div>
                <span style={{ color:C.teal,fontSize:'.82rem',fontWeight:600 }}>{session.name}</span>
              </Link>
          }
        </div>
      </header>

      <main style={{ position:'relative',zIndex:1,maxWidth:1300,margin:'0 auto',padding:'40px 24px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign:'center',marginBottom:52 }}>
          <div style={{ fontSize:'3.5rem',marginBottom:14 }}>ðŸ›’</div>
          <h1 style={{ fontSize:'clamp(2rem,5vw,3rem)',fontWeight:900,lineHeight:1.2,margin:'0 0 14px',background:`linear-gradient(130deg,${C.mint} 0%,${C.green} 45%,${C.teal} 100%)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
            Ø§Ù„Ø³ÙˆÙ‚ Ø§Ù„Ø±Ù‚Ù…ÙŠ
          </h1>
          <p style={{ fontSize:'1.05rem',color:'#8db0c0',maxWidth:640,margin:'0 auto 28px',lineHeight:1.75 }}>
            Ù…Ø³Ø§Ø­Ø© Ù…ØªÙƒØ§Ù…Ù„Ø© Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ØŒ Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§ØªØŒ Ø§Ù„Ø®Ø¯Ù…Ø§ØªØŒ ÙˆØ§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ø±Ù‚Ù…ÙŠØ© â€” ØªØ¹Ø²ÙŠØ² Ø§Ù„Ø§Ø³ØªØ¯Ø§Ù…Ø© Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯ÙŠØ© Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ø¬Ø±Ø© Ø§Ù„Ø­Ø¶Ø§Ø±ÙŠØ©
          </p>
          {canCreate && (
            <Link href="/marketplace/create" style={{ display:'inline-flex',alignItems:'center',gap:10,padding:'13px 30px',borderRadius:32,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:700,fontSize:'1rem',textDecoration:'none',boxShadow:'0 4px 24px rgba(78,141,156,.38)' }}>
              <span style={{ fontSize:'1.2rem' }}>+</span> Ø£Ø¶Ù Ø¹Ø±Ø¶Ùƒ Ù„Ù„Ø³ÙˆÙ‚
            </Link>
          )}
        </div>

        {/* Stats bar */}
        <div style={{ display:'flex',gap:16,marginBottom:36,justifyContent:'center',flexWrap:'wrap' }}>
          {[{label:'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¹Ø±ÙˆØ¶',val:total,icon:'ðŸ“¦'},{label:'Ù…Ø¬Ø§Ù†ÙŠØ©',val:'âˆž',icon:'ðŸ†“'},{label:'Ù…Ø¤Ø³Ø³Ø© Ù…Ø´Ø§Ø±ÙƒØ©',val:'10+',icon:'ðŸ›ï¸'}].map(s=>(
            <div key={s.label} style={{ padding:'14px 24px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.18)',borderRadius:16,textAlign:'center',minWidth:140 }}>
              <div style={{ fontSize:'1.6rem',marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:'1.4rem',fontWeight:900,color:C.teal }}>{s.val}</div>
              <div style={{ fontSize:'.75rem',color:'#6a8090' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Category pills */}
        <div style={{ display:'flex',gap:10,marginBottom:28,flexWrap:'wrap',justifyContent:'center' }}>
          {CATEGORIES.map(cat=>(
            <button key={cat.key} className="filter-btn" onClick={()=>{setCategory(cat.key);setPage(1);}}
              style={{ padding:'9px 20px',borderRadius:26,fontSize:'.86rem',fontWeight:600,color:category===cat.key?'#080520':'#9ab0c0',background:category===cat.key?cat.color:'rgba(255,255,255,.04)',border:category===cat.key?'none':'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',gap:6 }}>
              <span>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div style={{ display:'flex',gap:12,marginBottom:36,flexWrap:'wrap',alignItems:'center' }}>
          <div style={{ flex:1,minWidth:240,position:'relative' }}>
            <span style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:C.teal,fontSize:'1rem',pointerEvents:'none' }}>ðŸ”</span>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Ø§Ø¨Ø­Ø« ÙÙŠ Ø§Ù„Ø³ÙˆÙ‚..."
              style={{ width:'100%',padding:'10px 42px 10px 16px',borderRadius:24,border:'1px solid rgba(78,141,156,.3)',background:'rgba(78,141,156,.07)',color:'#e8f4f8',fontSize:'.9rem',fontFamily:"'Cairo',sans-serif",outline:'none',boxSizing:'border-box' as const }}/>
          </div>
          <select value={isFree} onChange={e=>{setIsFree(e.target.value);setPage(1);}}
            style={{ padding:'10px 40px 10px 16px',borderRadius:24,border:'1px solid rgba(78,141,156,.3)',background:'rgba(8,5,32,.9)',color:'#e8f4f8',fontSize:'.88rem',fontFamily:"'Cairo',sans-serif",cursor:'pointer',outline:'none',minWidth:150 }}>
            <option value="">Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ø³Ø¹Ø§Ø±</option>
            <option value="true">Ù…Ø¬Ø§Ù†ÙŠ ÙÙ‚Ø· ðŸ†“</option>
            <option value="false">Ù…Ø¯ÙÙˆØ¹ ÙÙ‚Ø· ðŸ’°</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:'center',padding:'60px 0' }}>
            <div style={{ width:36,height:36,border:`3px solid ${C.teal}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 12px' }}/>
            <p style={{ color:C.teal }}>Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø³ÙˆÙ‚...</p>
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <>
            {items.length === 0 ? (
              <div style={{ textAlign:'center',padding:'60px 20px',background:'rgba(78,141,156,.05)',borderRadius:20,border:'1px solid rgba(78,141,156,.15)' }}>
                <div style={{ fontSize:'3rem',marginBottom:12 }}>ðŸ›ï¸</div>
                <p style={{ color:'#8db0c0',fontSize:'1.05rem' }}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ø±ÙˆØ¶ ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„ÙØ¦Ø© Ø¨Ø¹Ø¯.</p>
                {canCreate && (
                  <Link href="/marketplace/create" style={{ display:'inline-block',marginTop:20,padding:'10px 24px',borderRadius:24,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:700,fontSize:'.9rem',textDecoration:'none' }}>ÙƒÙ† Ø£ÙˆÙ„ Ù…Ù† ÙŠØ¶ÙŠÙ Ø¹Ø±Ø¶Ø§Ù‹</Link>
                )}
              </div>
            ) : (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:24 }}>
                {items.map((item, idx) => {
                  const cat = catMeta(item.category);
                  const tags = item.tags ? JSON.parse(item.tags) : [];
                  const features = item.features ? JSON.parse(item.features) : [];
                  return (
                    <Link key={item.id} href={`/marketplace/${item.id}`} style={{ textDecoration:'none' }}>
                      <div className="mkt-card" style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.18)',borderRadius:22,overflow:'hidden',height:'100%',display:'flex',flexDirection:'column',animation:`fadeUp .4s ease ${idx*.05}s both` }}>
                        {/* Image */}
                        <div style={{ height:170,background:`linear-gradient(135deg,rgba(78,141,156,.2),rgba(40,28,89,.5))`,position:'relative',overflow:'hidden',flexShrink:0 }}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.title} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                            : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'4rem' }}>{cat.icon}</div>
                          }
                          <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 50%,rgba(8,5,32,.6))' }}/>
                          {/* Category badge */}
                          <span style={{ position:'absolute',top:12,right:12,padding:'4px 12px',borderRadius:16,background:`${cat.color}22`,color:cat.color,border:`1px solid ${cat.color}40`,fontSize:'.75rem',fontWeight:700,backdropFilter:'blur(8px)' }}>
                            {cat.icon} {cat.label}
                          </span>
                          {/* Price badge */}
                          <span style={{ position:'absolute',bottom:12,left:12,padding:'5px 14px',borderRadius:16,backdropFilter:'blur(12px)',background: item.is_free ? 'rgba(133,199,154,.25)' : 'rgba(78,141,156,.22)',color: item.is_free ? C.green : C.mint,border:`1px solid ${item.is_free?'rgba(133,199,154,.35)':'rgba(237,247,189,.3)'}`,fontSize:'.82rem',fontWeight:800 }}>
                            {formatPrice(item)}
                          </span>
                        </div>
                        {/* Body */}
                        <div style={{ padding:'18px 20px',display:'flex',flexDirection:'column',flex:1 }}>
                          <h3 style={{ fontSize:'1rem',fontWeight:800,color:'#f0f8ff',margin:'0 0 8px',lineHeight:1.4 }}>{item.title}</h3>
                          {item.description && (
                            <p style={{ fontSize:'.83rem',color:'#8db0c0',lineHeight:1.65,margin:'0 0 12px',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',flex:1 }}>
                              {item.description}
                            </p>
                          )}
                          {/* Features preview */}
                          {features.length>0 && (
                            <div style={{ marginBottom:12 }}>
                              {features.slice(0,2).map((f:string)=>(
                                <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:6,fontSize:'.78rem',color:'#a0bcc8',marginBottom:4 }}>
                                  <span style={{ color:C.green,flexShrink:0 }}>âœ“</span>{f}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Institution */}
                          {item.institution_name && (
                            <div style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 12px',background:'rgba(78,141,156,.07)',borderRadius:12,border:'1px solid rgba(78,141,156,.14)',marginTop:'auto' }}>
                              {item.institution_logo
                                ? <img src={item.institution_logo} alt="" style={{ width:22,height:22,borderRadius:'50%',objectFit:'cover' }}/>
                                : <div style={{ width:22,height:22,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.navy})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:700,color:'#fff',flexShrink:0 }}>{item.institution_name.charAt(0)}</div>
                              }
                              <span style={{ fontSize:'.78rem',color:C.teal,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.institution_name}</span>
                            </div>
                          )}
                          {tags.length>0 && (
                            <div style={{ display:'flex',gap:5,marginTop:10,flexWrap:'wrap' }}>
                              {tags.slice(0,3).map((t:string)=>(
                                <span key={t} style={{ padding:'2px 9px',borderRadius:12,background:'rgba(78,141,156,.09)',color:'#7aacbc',fontSize:'.7rem' }}>{t}</span>
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

            {/* Pagination */}
            {total > LIMIT && (
              <div style={{ display:'flex',gap:8,justifyContent:'center',marginTop:40,alignItems:'center' }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={{ padding:'9px 20px',borderRadius:20,border:`1px solid rgba(78,141,156,.3)`,background:'rgba(78,141,156,.07)',color:C.teal,cursor:page===1?'not-allowed':'pointer',opacity:page===1?.4:1,fontFamily:"'Cairo',sans-serif",fontWeight:600 }}>â† Ø§Ù„Ø³Ø§Ø¨Ù‚</button>
                <span style={{ color:'#8db0c0',fontSize:'.88rem' }}>ØµÙØ­Ø© {page} Ù…Ù† {Math.ceil(total/LIMIT)}</span>
                <button onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/LIMIT)}
                  style={{ padding:'9px 20px',borderRadius:20,border:`1px solid rgba(78,141,156,.3)`,background:'rgba(78,141,156,.07)',color:C.teal,cursor:page>=Math.ceil(total/LIMIT)?'not-allowed':'pointer',opacity:page>=Math.ceil(total/LIMIT)?.4:1,fontFamily:"'Cairo',sans-serif",fontWeight:600 }}>Ø§Ù„ØªØ§Ù„ÙŠ â†’</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

