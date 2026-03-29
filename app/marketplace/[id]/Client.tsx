'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { mint: '#EDF7BD', green: '#85C79A', teal: '#4E8D9C', navy: '#281C59' };

const CATEGORIES: Record<string,{label:string;icon:string;color:string}> = {
  service:{label:'خدمة',icon:'⚙️',color:'#85C79A'}, program:{label:'برنامج',icon:'📋',color:'#4E8D9C'},
  subscription:{label:'اشتراك',icon:'🔄',color:'#B47FE6'}, digital_product:{label:'منتج رقمي',icon:'💾',color:'#EDF7BD'},
  course:{label:'دورة',icon:'🎓',color:'#FFD700'}, tool:{label:'أداة',icon:'🛠️',color:'#FF9B4E'},
};

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display:'flex',alignItems:'center',gap:12,textDecoration:'none',userSelect:'none' }}>
      <svg width="36" height="36" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_md" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD"/><stop offset="42%" stopColor="#85C79A"/><stop offset="100%" stopColor="#4E8D9C"/></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)"/>
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_md)"/>
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.9"/>
      </svg>
      <div>
        <div style={{ fontSize:'1.05rem',fontWeight:900,background:'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize:'0.58rem',color:'#4E8D9C',letterSpacing:'0.3em',fontWeight:700 }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

interface MktItem {
  id:number; title:string; description?:string; category:string; price:number; currency:string;
  image_url?:string; external_url?:string; contact_info?:string; tags?:string; features?:string;
  is_free:number; institution_name?:string; institution_logo?:string; institution_id?:number;
  institution_desc?:string; created_at:string; institution_type?:string;
}

export default function MarketplaceDetailPage() {
  const [item, setItem] = useState<MktItem|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const id = parts[parts.length-1];
    if (!id || id==='default') { setError('معرّف غير صحيح'); setLoading(false); return; }
    fetch(`${API_BASE}/api/marketplace/${id}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setItem(d.data); else setError(d.error||'العنصر غير موجود'); })
      .catch(()=>setError('فشل في التحميل'))
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div style={{ minHeight:'100vh',background:'#080520',color:'#e8f4f8',fontFamily:"'Cairo',sans-serif",direction:'rtl' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0 }}>
        {[...Array(50)].map((_,i)=><div key={i} style={{ position:'absolute',borderRadius:'50%',background:'white',opacity:Math.random()*.35+.04,width:Math.random()*2+1,height:Math.random()*2+1,top:`${Math.random()*100}%`,left:`${Math.random()*100}%` }}/>)}
      </div>
      <header style={{ position:'sticky',top:0,zIndex:100,height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',background:'rgba(8,5,32,.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(78,141,156,.2)' }}>
        <GalaxyLogo />
        <nav style={{ display:'flex',gap:4 }}>
          {[{href:'/news',label:'الأخبار'},{href:'/campaigns',label:'الحملات'},{href:'/marketplace',label:'السوق',active:true},{href:'/services',label:'الخدمات'},{href:'/library',label:'المكتبة'},{href:'/forum',label:'المنتدى'}].map(l=>(
            <Link key={l.href} href={l.href} style={{ padding:'6px 12px',borderRadius:20,textDecoration:'none',fontSize:'.8rem',fontWeight:600,color:(l as any).active?C.navy:'#9ca3af',background:(l as any).active?`linear-gradient(135deg,${C.teal},${C.green})`:'transparent',border:(l as any).active?'none':'1px solid rgba(255,255,255,.07)' }}>{l.label}</Link>
          ))}
        </nav>
      </header>

      <main style={{ position:'relative',zIndex:1,maxWidth:900,margin:'0 auto',padding:'40px 20px 80px' }}>
        <Link href="/marketplace" style={{ display:'inline-flex',alignItems:'center',gap:8,color:C.teal,textDecoration:'none',fontSize:'.88rem',fontWeight:600,marginBottom:28,padding:'7px 18px',borderRadius:28,border:`1px solid ${C.teal}30` }}>
          → العودة للسوق
        </Link>

        {loading && (<div style={{ textAlign:'center',padding:'80px 0' }}><div style={{ width:40,height:40,border:`3px solid ${C.teal}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto' }}/></div>)}
        {error && !loading && (<div style={{ textAlign:'center',padding:'60px',background:'rgba(255,80,80,.06)',borderRadius:20,border:'1px solid rgba(255,80,80,.2)' }}><div style={{ fontSize:'3rem',marginBottom:12 }}>⚠️</div><p style={{ color:'#ff8080' }}>{error}</p></div>)}

        {item && !loading && (() => {
          const cat = CATEGORIES[item.category] || { label:item.category, icon:'📦', color:C.teal };
          const tags: string[] = item.tags ? JSON.parse(item.tags) : [];
          const features: string[] = item.features ? JSON.parse(item.features) : [];
          const formatPrice = () => item.is_free ? '🆓 مجاني' : item.price === 0 ? 'اتصل لمعرفة السعر' : `${item.price} ${item.currency}`;
          return (
            <div style={{ animation:'fadeUp .4s ease' }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:28,alignItems:'start' }}>
                {/* Main */}
                <div>
                  <div style={{ borderRadius:20,overflow:'hidden',border:'1px solid rgba(78,141,156,.2)',marginBottom:24 }}>
                    <div style={{ height:260,background:'linear-gradient(135deg,rgba(78,141,156,.3),rgba(40,28,89,.6))',position:'relative' }}>
                      {item.image_url
                        ? <img src={item.image_url} alt={item.title} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                        : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'6rem' }}>{cat.icon}</div>
                      }
                      <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(8,5,32,.9))' }}/>
                      <span style={{ position:'absolute',top:14,right:14,padding:'6px 16px',borderRadius:18,background:`${cat.color}22`,color:cat.color,border:`1px solid ${cat.color}40`,fontSize:'.84rem',fontWeight:700,backdropFilter:'blur(8px)' }}>{cat.icon} {cat.label}</span>
                    </div>
                    <div style={{ padding:'24px 28px' }}>
                      <h1 style={{ fontSize:'clamp(1.4rem,4vw,1.9rem)',fontWeight:900,color:'#fff',lineHeight:1.35,margin:'0 0 14px' }}>{item.title}</h1>
                      {item.description && (
                        <p style={{ color:'#c8d8e8',lineHeight:1.9,fontSize:'1rem',whiteSpace:'pre-wrap' }}>{item.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.18)',borderRadius:18,padding:'22px 26px',marginBottom:20 }}>
                      <h3 style={{ color:C.teal,fontWeight:700,margin:'0 0 16px',fontSize:'1rem' }}>✨ المميزات والمحتويات</h3>
                      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10 }}>
                        {features.map(f=>(
                          <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:8,padding:'10px 14px',background:'rgba(133,199,154,.06)',borderRadius:12,border:'1px solid rgba(133,199,154,.15)' }}>
                            <span style={{ color:C.green,fontWeight:700,flexShrink:0 }}>✓</span>
                            <span style={{ color:'#c8d8e8',fontSize:'.88rem',lineHeight:1.5 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length>0 && (
                    <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                      {tags.map(t=><span key={t} style={{ padding:'5px 14px',borderRadius:16,background:'rgba(78,141,156,.1)',color:C.teal,border:'1px solid rgba(78,141,156,.25)',fontSize:'.82rem' }}>{t}</span>)}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                  {/* Price card */}
                  <div style={{ background:'rgba(255,255,255,.04)',border:'1px solid rgba(78,141,156,.25)',borderRadius:20,padding:'24px',textAlign:'center' }}>
                    <div style={{ fontSize:'2rem',fontWeight:900,color: item.is_free?C.green:C.mint,marginBottom:6 }}>{formatPrice()}</div>
                    {!item.is_free && item.price>0 && <div style={{ color:'#6a8090',fontSize:'.8rem',marginBottom:16 }}>سعر ثابت</div>}
                    {item.external_url && (
                      <a href={item.external_url} target="_blank" rel="noopener noreferrer"
                        style={{ display:'block',padding:'13px 24px',borderRadius:24,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:800,fontSize:'1rem',textDecoration:'none',marginBottom:10,boxShadow:'0 4px 18px rgba(78,141,156,.35)' }}>
                        🔗 زيارة الصفحة
                      </a>
                    )}
                    {item.contact_info && (
                      <div style={{ padding:'12px 16px',background:'rgba(78,141,156,.08)',borderRadius:14,border:'1px solid rgba(78,141,156,.2)',fontSize:'.85rem',color:'#c8d8e8',lineHeight:1.6 }}>
                        📞 {item.contact_info}
                      </div>
                    )}
                  </div>

                  {/* Institution card */}
                  {item.institution_name && (
                    <Link href={item.institution_id?`/institutions/${item.institution_id}`:'/marketplace'} style={{ textDecoration:'none' }}>
                      <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.18)',borderRadius:18,padding:'18px 20px',transition:'all .2s' }}>
                        <div style={{ fontSize:'.76rem',color:'#6a8090',fontWeight:600,marginBottom:12,letterSpacing:'.04em' }}>🏛️ مقدّم العرض</div>
                        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                          {item.institution_logo
                            ? <img src={item.institution_logo} alt="" style={{ width:44,height:44,borderRadius:'50%',objectFit:'cover' }}/>
                            : <div style={{ width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.navy})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:'1.1rem',flexShrink:0 }}>{(item.institution_name).charAt(0)}</div>
                          }
                          <div>
                            <div style={{ color:'#f0f8ff',fontWeight:800,fontSize:'.95rem' }}>{item.institution_name}</div>
                            {item.institution_type && <div style={{ color:C.teal,fontSize:'.75rem' }}>{item.institution_type}</div>}
                          </div>
                        </div>
                        {item.institution_desc && (
                          <p style={{ color:'#7a9aaa',fontSize:'.8rem',lineHeight:1.6,margin:'12px 0 0',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical' }}>{item.institution_desc}</p>
                        )}
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
