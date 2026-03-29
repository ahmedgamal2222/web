'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal:'#4E8D9C', navy:'#281C59', mint:'#EDF7BD', bg:'#080520' };

export default function PublicFormClient() {
  const pathname = usePathname();
  const formId = pathname.split('/').pop();
  const [form, setForm]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [successMsg, setSuccessMsg] = useState('تم إرسال النموذج بنجاح، شكراً لك!');
  const [values, setValues] = useState<Record<string,any>>({});
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!formId || formId === 'default') return;
    fetch(`${API}/api/cloud/forms/${formId}`).then(r => r.json()).then(data => {
      if (data.success) {
        setForm(data.data);
        const settings = data.data.settings || {};
        if (settings.success_message) setSuccessMsg(settings.success_message);
        if (settings.redirect_url) {
          setTimeout(() => { window.location.href = settings.redirect_url; }, 3000);
        }
        const init: Record<string,any> = {};
        (data.data.fields||[]).forEach((f: any) => {
          init[f.id] = f.type === 'checkbox' ? [] : '';
        });
        setValues(init);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [formId]);

  const setValue = (id: string, type: string, val: any, checked?: boolean) => {
    if (type === 'checkbox') {
      setValues(v => {
        const arr: string[] = [...(v[id] || [])];
        if (checked) { if (!arr.includes(val)) arr.push(val); }
        else { const i = arr.indexOf(val); if (i>=0) arr.splice(i,1); }
        return { ...v, [id]: arr };
      });
    } else {
      setValues(v => ({ ...v, [id]: val }));
    }
    setErrors(e => { const n={...e}; delete n[id]; return n; });
  };

  const validate = () => {
    const e: Record<string,string> = {};
    (form?.fields||[]).forEach((f: any) => {
      if (!f.required) return;
      const v = values[f.id];
      if (!v || (Array.isArray(v) && v.length===0) || String(v).trim()==='') {
        e[f.id] = 'هذا الحقل مطلوب';
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const res = await fetch(`${API}/api/public/forms/${formId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: values, submitter_name: name, submitter_email: email }),
    });
    const d = await res.json();
    if (d.success) {
      setSubmitted(true);
      const redirUrl = d.redirect_url;
      if (redirUrl) { setTimeout(() => { window.location.href = redirUrl; }, 2500); }
    } else {
      alert(d.error || 'حدث خطأ، حاول مجدداً');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.4)', fontFamily:'Cairo,sans-serif' }}>
      جاري التحميل...
    </div>
  );

  if (!form) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.4)', fontFamily:'Cairo,sans-serif', textAlign:'center' }}>
      <div><div style={{ fontSize:'3rem', opacity:.3 }}>🔍</div><p>النموذج غير موجود أو غير متاح</p></div>
    </div>
  );

  if (form.status === 'closed') return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.4)', fontFamily:'Cairo,sans-serif', textAlign:'center' }}>
      <div><div style={{ fontSize:'3rem', opacity:.3 }}>🔒</div><p>هذا النموذج مغلق حالياً</p></div>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cairo,sans-serif', direction:'rtl' }}>
      <div style={{ textAlign:'center', padding:60 }}>
        <div style={{ fontSize:'4rem', marginBottom:16 }}>✅</div>
        <h2 style={{ color:C.mint, fontWeight:800, fontSize:'1.5rem', margin:'0 0 12px' }}>{successMsg}</h2>
        <p style={{ color:'rgba(255,255,255,.4)', fontSize:'.88rem' }}>يمكنك إغلاق هذه الصفحة الآن</p>
      </div>
    </div>
  );

  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${hasErr ? '#ef4444' : 'rgba(255,255,255,.2)'}`,
    background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontSize:'.93rem',
    fontFamily:'Cairo,sans-serif', boxSizing:'border-box',
  });

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Cairo,sans-serif', direction:'rtl', padding:'40px 16px' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <div style={{ background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.1)`, borderRadius:20, padding:32 }}>
          <h1 style={{ color:'#fff', fontWeight:800, fontSize:'1.4rem', marginBottom:8, marginTop:0 }}>{form.title}</h1>
          {form.description && <p style={{ color:'rgba(255,255,255,.5)', margin:'0 0 28px', lineHeight:1.7 }}>{form.description}</p>}

          <div style={{ display:'flex', gap:12, marginBottom:24 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'.82rem', color:'rgba(255,255,255,.5)', display:'block', marginBottom:5 }}>الاسم</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="اختياري" style={inputStyle(false)} />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'.82rem', color:'rgba(255,255,255,.5)', display:'block', marginBottom:5 }}>البريد الإلكتروني</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="اختياري" style={inputStyle(false)} />
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {(form.fields||[]).map((f: any) => (
              <div key={f.id}>
                <label style={{ display:'block', marginBottom:7, color:'rgba(255,255,255,.85)', fontWeight:500, fontSize:'.93rem' }}>
                  {f.label}
                  {f.required && <span style={{ color:'#ef4444', marginRight:4 }}>*</span>}
                </label>

                {(f.type==='text'||f.type==='email'||f.type==='phone'||f.type==='number') && (
                  <input type={f.type==='phone'?'tel':f.type} value={values[f.id]||''} onChange={e=>setValue(f.id,f.type,e.target.value)}
                    style={inputStyle(!!errors[f.id])} />
                )}
                {f.type==='textarea' && (
                  <textarea value={values[f.id]||''} onChange={e=>setValue(f.id,f.type,e.target.value)} rows={3}
                    style={{ ...inputStyle(!!errors[f.id]), resize:'vertical' }} />
                )}
                {f.type==='date' && (
                  <input type="date" value={values[f.id]||''} onChange={e=>setValue(f.id,f.type,e.target.value)}
                    style={inputStyle(!!errors[f.id])} />
                )}
                {f.type==='select' && (
                  <select value={values[f.id]||''} onChange={e=>setValue(f.id,f.type,e.target.value)}
                    style={{ ...inputStyle(!!errors[f.id]), cursor:'pointer' }}>
                    <option value="">-- اختر --</option>
                    {(f.options||[]).map((o: string) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {f.type==='radio' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {(f.options||[]).map((o: string) => (
                      <label key={o} style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,.75)', cursor:'pointer', fontSize:'.9rem' }}>
                        <input type="radio" name={f.id} value={o} checked={values[f.id]===o} onChange={()=>setValue(f.id,f.type,o)} />
                        {o}
                      </label>
                    ))}
                  </div>
                )}
                {f.type==='checkbox' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {(f.options||[]).map((o: string) => (
                      <label key={o} style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,.75)', cursor:'pointer', fontSize:'.9rem' }}>
                        <input type="checkbox" checked={(values[f.id]||[]).includes(o)} onChange={e=>setValue(f.id,f.type,o,e.target.checked)} />
                        {o}
                      </label>
                    ))}
                  </div>
                )}
                {errors[f.id] && <p style={{ color:'#ef4444', fontSize:'.78rem', marginTop:4 }}>{errors[f.id]}</p>}
              </div>
            ))}
          </div>

          <button onClick={submit} disabled={submitting}
            style={{ marginTop:28, width:'100%', padding:'13px 0', borderRadius:12, border:'none', background:C.teal, color:'#fff', fontWeight:800, fontSize:'1rem', cursor: submitting?'not-allowed':'pointer', fontFamily:'Cairo,sans-serif', opacity: submitting?0.7:1 }}>
            {submitting ? 'جاري الإرسال...' : 'إرسال'}
          </button>
        </div>
      </div>
    </div>
  );
}
