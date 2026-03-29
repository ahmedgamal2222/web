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
      <svg width="36" height="36" viewBox="0 0 54 54" fill="none">
        <defs><radialGradient id="rg_cd" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD"/><stop offset="42%" stopColor="#85C79A"/><stop offset="100%" stopColor="#4E8D9C"/></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)"/>
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_cd)"/>
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.9"/>
      </svg>
      <div>
        <div style={{ fontSize:'1.05rem',fontWeight:900,background:'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize:'0.58rem',color:'#4E8D9C',letterSpacing:'0.3em',fontWeight:700,textTransform:'uppercase' }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

const CATEGORIES: Record<string,{label:string;icon:string;color:string}> = {
  social:{label:'اجتماعية',icon:'🤝',color:'#85C79A'},cultural:{label:'ثقافية',icon:'🎭',color:'#FFD700'},
  educational:{label:'تعليمية',icon:'📚',color:'#4E8D9C'},charitable:{label:'خيرية',icon:'❤️',color:'#FF8BA0'},
  environmental:{label:'بيئية',icon:'🌿',color:'#6DBF67'},media:{label:'إعلامية',icon:'📡',color:'#B47FE6'},
  general:{label:'عامة',icon:'⭐',color:'#EDF7BD'},
};
const STATUS_LABELS: Record<string,{label:string;color:string}> = {
  open:{label:'🟢 مفتوحة',color:'#85C79A'},active:{label:'🔵 نشطة',color:'#4E8D9C'},
  completed:{label:'✅ مكتملة',color:'#9ab0c0'},cancelled:{label:'🔴 ملغاة',color:'#ff8080'},
};

interface Campaign {
  id:number;title:string;description?:string;goal?:string;category:string;status:string;
  start_date?:string;end_date?:string;image_url?:string;location?:string;tags?:string;
  creator_institution_name?:string;creator_institution_logo?:string;
  creator_institution_id?:number;members?:any[];updates?:any[];created_at:string;
}

export default function CampaignDetailPage() {
  const [campaign, setCampaign] = useState<Campaign|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');
  const [joinDone, setJoinDone] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState<'info'|'members'|'updates'>('info');

  useEffect(() => {
    const sid = getSessionId();
    if (sid) {
      fetch(`${API_BASE}/api/auth/me`, { headers:{'X-Session-ID':sid} })
        .then(r=>r.json()).then(d=>{ if(d.success) setSession(d.data); }).catch(()=>{});
    }
    const parts = window.location.pathname.split('/').filter(Boolean);
    const id = parts[parts.length-1];
    if (!id || id==='default') { setError('معرّف الحملة غير صحيح'); setLoading(false); return; }
    fetch(`${API_BASE}/api/campaigns/${id}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setCampaign(d.data); else setError(d.error||'الحملة غير موجودة'); })
      .catch(()=>setError('فشل في تحميل الحملة'))
      .finally(()=>setLoading(false));
  },[]);

  const formatDate = (s?:string) => s ? new Date(s).toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'}) : '';

  async function handleJoin() {
    const sid = getSessionId();
    if (!sid || !campaign) return;
    setJoining(true);
    try {
      const r = await fetch(`${API_BASE}/api/campaigns/${campaign.id}/join`, {
        method:'POST', headers:{'Content-Type':'application/json','X-Session-ID':sid},
        body: JSON.stringify({ message: joinMsg }),
      });
      const d = await r.json();
      setJoinDone(d.success ? d.message : (d.error || 'حدث خطأ'));
    } catch { setJoinDone('حدث خطأ'); }
    setJoining(false);
  }

  async function handlePostUpdate() {
    const sid = getSessionId();
    if (!sid || !campaign || !updateText.trim()) return;
    setPosting(true);
    try {
      const r = await fetch(`${API_BASE}/api/campaigns/${campaign.id}/updates`, {
        method:'POST', headers:{'Content-Type':'application/json','X-Session-ID':sid},
        body: JSON.stringify({ content: updateText }),
      });
      const d = await r.json();
      if (d.success) {
        setUpdateText('');
        const parts = window.location.pathname.split('/').filter(Boolean);
        const id = parts[parts.length-1];
        fetch(`${API_BASE}/api/campaigns/${id}`).then(r=>r.json()).then(d=>{ if(d.success) setCampaign(d.data); });
      }
    } catch {}
    setPosting(false);
  }

  const canJoin = session && (session.role==='institution_admin' || session.role==='admin') && campaign?.status!=='completed' && campaign?.status!=='cancelled';
  const canPost = session && campaign?.members?.some((m:any) => m.institution_id === session.institution_id && m.status==='approved');

  return (
    <div style={{ minHeight:'100vh',background:'#080520',color:'#e8f4f8',fontFamily:"'Cairo',sans-serif",direction:'rtl' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.tab-btn{transition:all .18s;cursor:pointer;border:none;}`}</style>
      <div style={{ position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0 }}>
        {[...Array(50)].map((_,i)=><div key={i} style={{ position:'absolute',borderRadius:'50%',background:'white',opacity:Math.random()*.35+.05,width:Math.random()*2+1,height:Math.random()*2+1,top:`${Math.random()*100}%`,left:`${Math.random()*100}%` }}/>)}
      </div>

      {/* Nav */}
      <header style={{ position:'sticky',top:0,zIndex:100,height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',background:'rgba(8,5,32,.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(78,141,156,.2)' }}>
        <GalaxyLogo />
        <nav style={{ display:'flex',gap:4 }}>
          {[{href:'/news',label:'الأخبار'},{href:'/campaigns',label:'الحملات',active:true},{href:'/marketplace',label:'السوق'},{href:'/services',label:'الخدمات'},{href:'/library',label:'المكتبة'},{href:'/forum',label:'المنتدى'}].map(l=>(
            <Link key={l.href} href={l.href} style={{ padding:'6px 13px',borderRadius:20,textDecoration:'none',fontSize:'.81rem',fontWeight:600,color:(l as any).active?C.navy:'#9ca3af',background:(l as any).active?`linear-gradient(135deg,${C.teal},${C.green})`:'transparent',border:(l as any).active?'none':'1px solid rgba(255,255,255,.07)' }}>{l.label}</Link>
          ))}
        </nav>
      </header>

      <main style={{ position:'relative',zIndex:1,maxWidth:920,margin:'0 auto',padding:'40px 20px 80px' }}>
        {/* Back */}
        <Link href="/campaigns" style={{ display:'inline-flex',alignItems:'center',gap:8,color:C.teal,textDecoration:'none',fontSize:'.88rem',fontWeight:600,marginBottom:28,padding:'7px 18px',borderRadius:28,border:`1px solid ${C.teal}30`,transition:'all .2s' }}>
          → العودة للحملات
        </Link>

        {loading && (
          <div style={{ textAlign:'center',padding:'80px 0' }}>
            <div style={{ width:40,height:40,border:`3px solid ${C.teal}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 14px' }}/>
            <p style={{ color:C.teal }}>جاري تحميل الحملة...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign:'center',padding:'60px 20px',background:'rgba(255,80,80,.06)',borderRadius:20,border:'1px solid rgba(255,80,80,.2)' }}>
            <div style={{ fontSize:'3rem',marginBottom:12 }}>⚠️</div>
            <p style={{ color:'#ff8080' }}>{error}</p>
          </div>
        )}

        {campaign && !loading && (() => {
          const cat = CATEGORIES[campaign.category] || CATEGORIES.general;
          const st = STATUS_LABELS[campaign.status] || { label: campaign.status, color: '#9ab0c0' };
          const tags = campaign.tags ? JSON.parse(campaign.tags) : [];
          return (
            <div style={{ animation:'fadeUp .4s ease' }}>
              {/* Hero */}
              <div style={{ borderRadius:24,overflow:'hidden',border:'1px solid rgba(78,141,156,.2)',marginBottom:28 }}>
                <div style={{ height:280,background:`linear-gradient(135deg,rgba(78,141,156,.3),rgba(40,28,89,.6))`,position:'relative' }}>
                  {campaign.image_url ? (
                    <img src={campaign.image_url} alt={campaign.title} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                  ) : (
                    <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'6rem' }}>{cat.icon}</div>
                  )}
                  <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 40%,rgba(8,5,32,.92))' }}/>
                  <div style={{ position:'absolute',bottom:24,right:24,left:24 }}>
                    <div style={{ display:'flex',gap:10,marginBottom:12 }}>
                      <span style={{ padding:'5px 14px',borderRadius:16,background:`${cat.color}20`,color:cat.color,border:`1px solid ${cat.color}40`,fontSize:'.82rem',fontWeight:700,backdropFilter:'blur(8px)' }}>{cat.icon} {cat.label}</span>
                      <span style={{ padding:'5px 14px',borderRadius:16,background:`${st.color}20`,color:st.color,border:`1px solid ${st.color}40`,fontSize:'.82rem',fontWeight:700,backdropFilter:'blur(8px)' }}>{st.label}</span>
                    </div>
                    <h1 style={{ fontSize:'clamp(1.4rem,4vw,2rem)',fontWeight:900,color:'#fff',margin:0 }}>{campaign.title}</h1>
                  </div>
                </div>
                {/* Info bar */}
                <div style={{ padding:'20px 24px',background:'rgba(255,255,255,.03)',display:'flex',gap:20,flexWrap:'wrap',alignItems:'center',borderTop:'1px solid rgba(78,141,156,.15)' }}>
                  {campaign.creator_institution_name && (
                    <Link href={campaign.creator_institution_id?`/institutions/${campaign.creator_institution_id}`:'/campaigns'} style={{ display:'flex',alignItems:'center',gap:8,textDecoration:'none' }}>
                      {campaign.creator_institution_logo ? <img src={campaign.creator_institution_logo} alt="" style={{ width:28,height:28,borderRadius:'50%',objectFit:'cover' }}/> : <div style={{ width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.navy})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'.8rem',fontWeight:700 }}>{campaign.creator_institution_name.charAt(0)}</div>}
                      <span style={{ color:C.teal,fontSize:'.88rem',fontWeight:700 }}>{campaign.creator_institution_name}</span>
                    </Link>
                  )}
                  {campaign.location && <span style={{ color:'#8db0c0',fontSize:'.85rem' }}>📍 {campaign.location}</span>}
                  {campaign.start_date && <span style={{ color:'#8db0c0',fontSize:'.85rem' }}>📅 {formatDate(campaign.start_date)}</span>}
                  {campaign.end_date && <span style={{ color:'#8db0c0',fontSize:'.85rem' }}>⏳ {formatDate(campaign.end_date)}</span>}
                  <span style={{ color:'#8db0c0',fontSize:'.85rem' }}>👥 {campaign.members?.length||0} شريك</span>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex',gap:4,marginBottom:28,padding:'6px',background:'rgba(255,255,255,.03)',borderRadius:14,border:'1px solid rgba(78,141,156,.15)',width:'fit-content' }}>
                {(['info','members','updates'] as const).map(t => (
                  <button key={t} className="tab-btn" onClick={()=>setTab(t)}
                    style={{ padding:'8px 22px',borderRadius:10,fontSize:'.88rem',fontWeight:700,color:tab===t?C.navy:'#9ab0c0',background:tab===t?`linear-gradient(135deg,${C.teal},${C.green})`:'transparent' }}>
                    {t==='info'?'📋 عن الحملة':t==='members'?`👥 الشركاء (${campaign.members?.length||0})`:`📣 التحديثات (${campaign.updates?.length||0})`}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {tab==='info' && (
                <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.15)',borderRadius:20,padding:'28px 32px',animation:'fadeUp .3s ease' }}>
                  {campaign.description && (
                    <div style={{ marginBottom:28 }}>
                      <h3 style={{ color:C.teal,fontWeight:700,marginBottom:12,fontSize:'1rem' }}>📝 عن الحملة</h3>
                      <p style={{ color:'#c8d8e8',lineHeight:1.85,whiteSpace:'pre-wrap' }}>{campaign.description}</p>
                    </div>
                  )}
                  {campaign.goal && (
                    <div style={{ marginBottom:28,padding:'20px',background:'rgba(133,199,154,.06)',borderRadius:16,border:'1px solid rgba(133,199,154,.2)' }}>
                      <h3 style={{ color:C.green,fontWeight:700,marginBottom:10,fontSize:'1rem' }}>🎯 الهدف المشترك</h3>
                      <p style={{ color:'#c8d8e8',lineHeight:1.85,margin:0 }}>{campaign.goal}</p>
                    </div>
                  )}
                  {tags.length>0 && (
                    <div>
                      <h3 style={{ color:'#8db0c0',fontWeight:700,marginBottom:10,fontSize:'.9rem' }}>🏷️ التصنيفات</h3>
                      <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                        {tags.map((t:string)=>(
                          <span key={t} style={{ padding:'4px 14px',borderRadius:16,background:'rgba(78,141,156,.1)',color:C.teal,border:'1px solid rgba(78,141,156,.25)',fontSize:'.8rem' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Join */}
                  {canJoin && !joinDone && (
                    <div style={{ marginTop:32,padding:'24px',background:'rgba(78,141,156,.06)',borderRadius:16,border:'1px solid rgba(78,141,156,.2)' }}>
                      <h3 style={{ color:C.teal,fontWeight:700,marginBottom:14,fontSize:'.95rem' }}>🚀 انضم لهذه الحملة</h3>
                      <textarea value={joinMsg} onChange={e=>setJoinMsg(e.target.value)} rows={3} placeholder="أضف رسالة توضيحية لطلب الانضمام (اختياري)..."
                        style={{ width:'100%',padding:'12px 16px',borderRadius:12,border:'1px solid rgba(78,141,156,.3)',background:'rgba(78,141,156,.07)',color:'#e8f4f8',fontFamily:"'Cairo',sans-serif",fontSize:'.9rem',resize:'vertical',outline:'none',boxSizing:'border-box' }}/>
                      <button onClick={handleJoin} disabled={joining}
                        style={{ marginTop:12,padding:'11px 28px',borderRadius:24,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:700,fontSize:'.9rem',border:'none',cursor:joining?'not-allowed':'pointer',opacity:joining?.7:1 }}>
                        {joining?'جارٍ الإرسال...':'📨 إرسال طلب الانضمام'}
                      </button>
                    </div>
                  )}
                  {joinDone && (
                    <div style={{ marginTop:24,padding:'14px 20px',background:'rgba(133,199,154,.1)',borderRadius:14,border:'1px solid rgba(133,199,154,.3)',color:C.green,fontWeight:600 }}>✅ {joinDone}</div>
                  )}
                </div>
              )}

              {tab==='members' && (
                <div style={{ animation:'fadeUp .3s ease' }}>
                  {(!campaign.members || campaign.members.length===0) ? (
                    <div style={{ textAlign:'center',padding:'40px',background:'rgba(78,141,156,.04)',borderRadius:20,border:'1px solid rgba(78,141,156,.12)',color:'#8db0c0' }}>لا يوجد شركاء بعد</div>
                  ) : (
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16 }}>
                      {campaign.members.map((m:any) => (
                        <Link key={m.id} href={`/institutions/${m.institution_id}`} style={{ textDecoration:'none' }}>
                          <div style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.18)',borderRadius:16,transition:'all .2s' }}>
                            {m.institution_logo
                              ? <img src={m.institution_logo} alt="" style={{ width:40,height:40,borderRadius:'50%',objectFit:'cover' }}/>
                              : <div style={{ width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.navy})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:'1rem',flexShrink:0 }}>{(m.institution_name||'?').charAt(0)}</div>
                            }
                            <div>
                              <div style={{ color:'#f0f8ff',fontWeight:700,fontSize:'.9rem' }}>{m.institution_name}</div>
                              <div style={{ color: m.role==='lead'?C.mint:C.teal,fontSize:'.75rem',fontWeight:600 }}>{m.role==='lead'?'🌟 القائد':'🤝 شريك'}</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab==='updates' && (
                <div style={{ animation:'fadeUp .3s ease' }}>
                  {/* Post update */}
                  {session && (
                    <div style={{ marginBottom:24,padding:'20px',background:'rgba(78,141,156,.06)',borderRadius:16,border:'1px solid rgba(78,141,156,.18)' }}>
                      <textarea value={updateText} onChange={e=>setUpdateText(e.target.value)} rows={3} placeholder="شارك تحديثاً عن الحملة..."
                        style={{ width:'100%',padding:'12px 16px',borderRadius:12,border:'1px solid rgba(78,141,156,.3)',background:'rgba(78,141,156,.07)',color:'#e8f4f8',fontFamily:"'Cairo',sans-serif",fontSize:'.9rem',resize:'vertical',outline:'none',boxSizing:'border-box' }}/>
                      <button onClick={handlePostUpdate} disabled={posting||!updateText.trim()}
                        style={{ marginTop:10,padding:'9px 22px',borderRadius:20,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:700,fontSize:'.88rem',border:'none',cursor:posting?'not-allowed':'pointer',opacity:posting?.7:1 }}>
                        {posting?'جارٍ النشر...':'📣 نشر التحديث'}
                      </button>
                    </div>
                  )}
                  {(!campaign.updates || campaign.updates.length===0) ? (
                    <div style={{ textAlign:'center',padding:'40px',background:'rgba(78,141,156,.04)',borderRadius:20,border:'1px solid rgba(78,141,156,.12)',color:'#8db0c0' }}>لا توجد تحديثات بعد</div>
                  ) : (
                    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                      {campaign.updates.map((u:any)=>(
                        <div key={u.id} style={{ padding:'18px 20px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.15)',borderRadius:16 }}>
                          <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:10 }}>
                            <div style={{ width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${C.teal},${C.navy})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'.8rem',fontWeight:700 }}>{(u.institution_name||u.user_name||'?').charAt(0)}</div>
                            <div>
                              <div style={{ color:C.teal,fontWeight:700,fontSize:'.85rem' }}>{u.institution_name||u.user_name}</div>
                              <div style={{ color:'#6a8090',fontSize:'.72rem' }}>{new Date(u.created_at).toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                            </div>
                          </div>
                          <p style={{ color:'#c8d8e8',lineHeight:1.7,margin:0,whiteSpace:'pre-wrap' }}>{u.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </main>
    </div>
  );
}
