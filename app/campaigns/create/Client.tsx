'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
        <defs><radialGradient id="rg_cc" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#EDF7BD"/><stop offset="42%" stopColor="#85C79A"/><stop offset="100%" stopColor="#4E8D9C"/></radialGradient></defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)"/>
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_cc)"/>
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.9"/>
      </svg>
      <div>
        <div style={{ fontSize:'1.05rem',fontWeight:900,background:'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize:'0.58rem',color:'#4E8D9C',letterSpacing:'0.3em',fontWeight:700,textTransform:'uppercase' }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

const FIELD_STYLE = {
  width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(78,141,156,.3)',
  background:'rgba(78,141,156,.07)', color:'#e8f4f8', fontFamily:"'Cairo',sans-serif",
  fontSize:'.92rem', outline:'none', boxSizing:'border-box' as const,
};
const SELECT_STYLE = {
  ...FIELD_STYLE,
  cursor:'pointer',
  paddingLeft:'40px',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%234E8D9C' d='M8 11L2 5h12z'/%3E%3C/svg%3E\")",
  backgroundRepeat:'no-repeat',
  backgroundPosition:'left 14px center',
  backgroundSize:'14px',
  appearance:'none' as const,
};
const LABEL_STYLE = { display:'block', color:'#9ab0c0', fontSize:'.82rem', fontWeight:700, marginBottom:6, letterSpacing:'.02em' };

export default function CampaignCreatePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', goal: '', category: 'general',
    start_date: '', end_date: '', location: '', image_url: '',
    max_members: '', tags: [] as string[],
  });

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { setAuthLoading(false); return; }
    fetch(`${API_BASE}/api/auth/me`, { headers:{'X-Session-ID':sid} })
      .then(r=>r.json()).then(d=>{ if(d.success) setSession(d.data); })
      .catch(()=>{}).finally(()=>setAuthLoading(false));
  },[]);

  function set(k: string, v: string) { setForm(p=>({...p,[k]:v})); }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(p=>({...p, tags:[...p.tags, t]}));
      setTagInput('');
    }
  }
  function removeTag(t: string) { setForm(p=>({...p, tags:p.tags.filter(x=>x!==t)})); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setSuccess('');
    if (!form.title.trim()) { setErr('عنوان الحملة مطلوب'); return; }
    const sid = getSessionId();
    if (!sid) { setErr('يجب تسجيل الدخول أولاً'); return; }
    setSubmitting(true);
    try {
      const body: any = {
        title: form.title, description: form.description||undefined, goal: form.goal||undefined,
        category: form.category, location: form.location||undefined,
        image_url: form.image_url||undefined, tags: form.tags,
      };
      if (form.start_date) body.start_date = form.start_date;
      if (form.end_date) body.end_date = form.end_date;
      if (form.max_members) body.max_members = Number(form.max_members);

      const r = await fetch(`${API_BASE}/api/campaigns`, {
        method:'POST', headers:{'Content-Type':'application/json','X-Session-ID':sid},
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) {
        setSuccess('تم إطلاق الحملة بنجاح 🚀');
        setTimeout(() => { if (d.data?.id) router.push(`/campaigns/${d.data.id}`); else router.push('/campaigns'); }, 1500);
      } else {
        setErr(d.error || 'حدث خطأ في إنشاء الحملة');
      }
    } catch { setErr('حدث خطأ في الاتصال'); }
    setSubmitting(false);
  }

  if (authLoading) return (
    <div style={{ minHeight:'100vh',background:'#080520',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ width:36,height:36,border:`3px solid ${C.teal}`,borderTopColor:'transparent',borderRadius:'50%' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!session || (session.role!=='admin' && session.role!=='institution_admin')) return (
    <div style={{ minHeight:'100vh',background:'#080520',display:'flex',alignItems:'center',justifyContent:'center',color:'#e8f4f8',fontFamily:"'Cairo',sans-serif",direction:'rtl' }}>
      <div style={{ textAlign:'center',padding:'40px',background:'rgba(255,80,80,.06)',borderRadius:20,border:'1px solid rgba(255,80,80,.2)' }}>
        <div style={{ fontSize:'3rem',marginBottom:14 }}>🔒</div>
        <p style={{ color:'#ff8080',fontSize:'1.1rem',marginBottom:20 }}>يجب أن تكون أدمن مؤسسة لإطلاق حملة</p>
        <Link href="/login" style={{ padding:'11px 28px',borderRadius:24,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:700,textDecoration:'none' }}>تسجيل الدخول</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh',background:'#080520',color:'#e8f4f8',fontFamily:"'Cairo',sans-serif",direction:'rtl' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,textarea:focus,select:focus{border-color:#4E8D9C!important;box-shadow:0 0 0 3px rgba(78,141,156,.15);} input::placeholder,textarea::placeholder{color:#566778;}`}</style>
      <div style={{ position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0 }}>
        {[...Array(40)].map((_,i)=><div key={i} style={{ position:'absolute',borderRadius:'50%',background:'white',opacity:Math.random()*.3+.04,width:Math.random()*2+1,height:Math.random()*2+1,top:`${Math.random()*100}%`,left:`${Math.random()*100}%` }}/>)}
      </div>

      <header style={{ position:'sticky',top:0,zIndex:100,height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',background:'rgba(8,5,32,.96)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(78,141,156,.2)' }}>
        <GalaxyLogo />
        <Link href="/campaigns" style={{ color:C.teal,textDecoration:'none',fontSize:'.88rem',fontWeight:600,padding:'7px 18px',borderRadius:22,border:`1px solid ${C.teal}35` }}>→ الحملات</Link>
      </header>

      <main style={{ position:'relative',zIndex:1,maxWidth:700,margin:'0 auto',padding:'48px 20px 80px' }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={{ fontSize:'2.8rem',marginBottom:12 }}>🚀</div>
          <h1 style={{ fontSize:'clamp(1.6rem,4vw,2.2rem)',fontWeight:900,margin:'0 0 10px',background:`linear-gradient(130deg,${C.mint},${C.green},${C.teal})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>إطلاق حملة مشتركة</h1>
          <p style={{ color:'#8db0c0',fontSize:'.95rem' }}>ادعُ المؤسسات للتكاتف في مبادرة مشتركة ذات أثر حضاري</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(78,141,156,.18)',borderRadius:24,padding:'36px 40px',display:'flex',flexDirection:'column',gap:24 }}>

          {/* Title */}
          <div>
            <label style={LABEL_STYLE}>عنوان الحملة *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="مثال: حملة محو الأمية الرقمية في المنطقة الشمالية" style={FIELD_STYLE} required/>
          </div>

          {/* Description */}
          <div>
            <label style={LABEL_STYLE}>وصف الحملة</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={4} placeholder="صف أهداف الحملة ومبرراتها ومراحلها..."
              style={{ ...FIELD_STYLE, resize:'vertical', lineHeight:1.7 }}/>
          </div>

          {/* Goal */}
          <div>
            <label style={LABEL_STYLE}>الهدف المشترك</label>
            <textarea value={form.goal} onChange={e=>set('goal',e.target.value)} rows={3} placeholder="ما الذي تريد تحقيقه بشكل مشترك مع الشركاء؟"
              style={{ ...FIELD_STYLE, resize:'vertical' }}/>
          </div>

          {/* Category + Location row */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
            <div>
              <label style={LABEL_STYLE}>نوع الحملة</label>
              <select value={form.category} onChange={e=>set('category',e.target.value)} style={SELECT_STYLE}>
                <option value="general">⭐ عامة</option>
                <option value="social">🤝 اجتماعية</option>
                <option value="cultural">🎭 ثقافية</option>
                <option value="educational">📚 تعليمية</option>
                <option value="charitable">❤️ خيرية</option>
                <option value="environmental">🌿 بيئية</option>
                <option value="media">📡 إعلامية</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>الموقع الجغرافي</label>
              <input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="مثال: الرياض، المنطقة الشمالية..." style={FIELD_STYLE}/>
            </div>
          </div>

          {/* Dates row */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
            <div>
              <label style={LABEL_STYLE}>تاريخ البداية</label>
              <input type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)}
                style={{ ...FIELD_STYLE, colorScheme:'dark' }}/>
            </div>
            <div>
              <label style={LABEL_STYLE}>تاريخ النهاية</label>
              <input type="date" value={form.end_date} onChange={e=>set('end_date',e.target.value)}
                style={{ ...FIELD_STYLE, colorScheme:'dark' }}/>
            </div>
          </div>

          {/* Image + max_members */}
          <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr',gap:16 }}>
            <div>
              <label style={LABEL_STYLE}>رابط صورة الغلاف</label>
              <input value={form.image_url} onChange={e=>set('image_url',e.target.value)} placeholder="https://..." style={FIELD_STYLE}/>
            </div>
            <div>
              <label style={LABEL_STYLE}>الحد الأقصى للشركاء</label>
              <input type="number" value={form.max_members} onChange={e=>set('max_members',e.target.value)} placeholder="∞ غير محدود" min="1"
                style={FIELD_STYLE}/>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={LABEL_STYLE}>الوسوم</label>
            <div style={{ display:'flex',gap:8,marginBottom:10 }}>
              <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault();addTag();} }}
                placeholder="أضف وسماً واضغط Enter"
                style={{ ...FIELD_STYLE, flex:1 }}/>
              <button type="button" onClick={addTag}
                style={{ padding:'0 18px',borderRadius:12,background:`rgba(78,141,156,.15)`,color:C.teal,border:`1px solid rgba(78,141,156,.3)`,cursor:'pointer',fontWeight:700,whiteSpace:'nowrap',fontFamily:"'Cairo',sans-serif" }}>+ إضافة</button>
            </div>
            {form.tags.length>0 && (
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {form.tags.map(t=>(
                  <span key={t} style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:16,background:'rgba(78,141,156,.12)',color:C.teal,border:'1px solid rgba(78,141,156,.25)',fontSize:'.82rem' }}>
                    {t}
                    <button type="button" onClick={()=>removeTag(t)} style={{ background:'none',border:'none',color:'#ff8080',cursor:'pointer',padding:0,fontSize:'.9rem',lineHeight:1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Errors */}
          {err && <div style={{ padding:'12px 18px',borderRadius:12,background:'rgba(255,80,80,.08)',border:'1px solid rgba(255,80,80,.25)',color:'#ff8080',fontSize:'.9rem' }}>⚠️ {err}</div>}
          {success && <div style={{ padding:'12px 18px',borderRadius:12,background:'rgba(133,199,154,.1)',border:'1px solid rgba(133,199,154,.3)',color:C.green,fontSize:'.9rem' }}>{success}</div>}

          {/* Submit */}
          <button type="submit" disabled={submitting}
            style={{ padding:'14px 32px',borderRadius:28,background:`linear-gradient(135deg,${C.teal},${C.navy})`,color:'#fff',fontWeight:800,fontSize:'1.05rem',border:'none',cursor:submitting?'not-allowed':'pointer',opacity:submitting?.7:1,boxShadow:'0 4px 20px rgba(78,141,156,.35)',fontFamily:"'Cairo',sans-serif",transition:'all .2s' }}>
            {submitting ? '⏳ جارٍ الإنشاء...' : '🚀 إطلاق الحملة'}
          </button>
        </form>
      </main>
    </div>
  );
}
