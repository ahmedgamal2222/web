'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal:'#4E8D9C', navy:'#281C59', mint:'#EDF7BD', bg:'#080520' };

const FIELD_TYPES = [
  { type:'text',label:'نص قصير' }, { type:'textarea',label:'نص طويل' },
  { type:'email',label:'بريد' }, { type:'phone',label:'هاتف' },
  { type:'number',label:'رقم' }, { type:'date',label:'تاريخ' },
  { type:'select',label:'قائمة' }, { type:'radio',label:'اختيار واحد' },
  { type:'checkbox',label:'متعدد' },
];

export default function FormDetailClient() {
  const pathname = usePathname();
  const id = pathname.split('/').pop();
  const router = useRouter();
  const [form, setForm]               = useState<any>(null);
  const [fields, setFields]           = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subTotal, setSubTotal]       = useState(0);
  const [tab, setTab]                 = useState<'editor'|'submissions'>('editor');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [successMsg, setSuccessMsg]   = useState('تم إرسال النموذج بنجاح، شكراً لك!');
  const [redirectUrl, setRedirectUrl] = useState('');

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h   = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!id || id === 'default') return;
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    loadForm();
  }, [id]);

  const loadForm = async () => {
    setLoading(true);
    const [fRes, sRes] = await Promise.all([
      fetch(`${API}/api/cloud/forms/${id}`, { headers: h }),
      fetch(`${API}/api/cloud/forms/${id}/submissions?limit=100`, { headers: h }),
    ]);
    const fData = await fRes.json();
    const sData = await sRes.json();
    if (fData.success) {
      setForm(fData.data);
      setFields(fData.data.fields || []);
      const settings = fData.data.settings || {};
      setSuccessMsg(settings.success_message || 'تم إرسال النموذج بنجاح، شكراً لك!');
      setRedirectUrl(settings.redirect_url || '');
    }
    if (sData.success) { setSubmissions(sData.data || []); setSubTotal(sData.total || 0); }
    setLoading(false);
  };

  const saveForm = async () => {
    setSaving(true);
    await fetch(`${API}/api/cloud/forms/${id}`, {
      method: 'PUT', headers: h,
      body: JSON.stringify({
        fields,
        settings: { success_message: successMsg, redirect_url: redirectUrl },
        title: form?.title,
      }),
    });
    setSaving(false);
    setSuccessMsg(prev => prev);
    alert('تم الحفظ');
  };

  const updateField = (fid: string, key: string, val: any) =>
    setFields(f => f.map(x => x.id === fid ? {...x, [key]: val} : x));
  const removeField = (fid: string) => setFields(f => f.filter(x => x.id !== fid));
  const addField = (type: string) =>
    setFields(f => [...f, { id: Date.now().toString(), type, label:'', required:false, options:[] }]);

  const shareLink = () => {
    const url = `${window.location.origin}/cloud/apps/forms/public/${id}`;
    navigator.clipboard.writeText(url).catch(()=>{});
    alert('تم نسخ الرابط:\n' + url);
  };

  const toggleStatus = async () => {
    const newStatus = form?.status === 'active' ? 'closed' : 'active';
    await fetch(`${API}/api/cloud/forms/${id}`, { method:'PUT', headers:h, body: JSON.stringify({ status: newStatus }) });
    setForm((f: any) => ({ ...f, status: newStatus }));
  };

  if (loading) return <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.4)', fontFamily:'Cairo,sans-serif' }}>جاري التحميل...</div>;
  if (!form) return <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.4)', fontFamily:'Cairo,sans-serif' }}>النموذج غير موجود</div>;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Cairo,sans-serif', direction:'rtl' }}>
      <nav style={{ background:'rgba(8,5,32,.95)', borderBottom:`1px solid ${C.teal}30`, padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Link href="/cloud/apps/forms" style={{ color:C.mint, textDecoration:'none', fontWeight:700 }}>📋 النماذج</Link>
          <span style={{ color:'rgba(255,255,255,.3)' }}>›</span>
          <span style={{ color:'#fff', fontWeight:700, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{form.title}</span>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={toggleStatus} style={{
            background: form.status==='active' ? '#ef444415' : '#10b98115',
            color: form.status==='active' ? '#ef4444' : '#10b981',
            border:'none', borderRadius:40, padding:'7px 16px', cursor:'pointer', fontSize:'.85rem', fontFamily:'Cairo,sans-serif',
          }}>{form.status==='active' ? 'إغلاق النموذج' : 'فتح النموذج'}</button>
          <button onClick={shareLink} style={{ background:'#6366f120', color:'#818cf8', border:'none', borderRadius:40, padding:'7px 16px', cursor:'pointer', fontSize:'.85rem', fontFamily:'Cairo,sans-serif' }}>🔗 مشاركة</button>
          <button onClick={saveForm} disabled={saving} style={{ background:C.teal, color:'#fff', border:'none', borderRadius:40, padding:'8px 20px', cursor:'pointer', fontWeight:700, fontFamily:'Cairo,sans-serif', opacity:saving?0.6:1 }}>{saving ? '...' : 'حفظ'}</button>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{ borderBottom:`1px solid rgba(255,255,255,.08)`, padding:'0 24px', display:'flex', gap:0 }}>
        {[{ key:'editor', label:'✏️ بناء النموذج' }, { key:'submissions', label:`📊 الردود (${subTotal})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            background:'none', border:'none', color: tab===t.key ? C.mint : 'rgba(255,255,255,.5)',
            padding:'14px 20px', cursor:'pointer', fontSize:'.9rem', fontWeight: tab===t.key ? 700 : 400,
            borderBottom: tab===t.key ? `2px solid ${C.teal}` : '2px solid transparent',
            fontFamily:'Cairo,sans-serif',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 24px' }}>
        {tab === 'editor' ? (
          <div>
            {/* Add field types */}
            <div style={{ background:'rgba(255,255,255,.04)', borderRadius:14, padding:16, marginBottom:20 }}>
              <div style={{ color:'rgba(255,255,255,.5)', fontSize:'.82rem', marginBottom:10 }}>إضافة حقل:</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {FIELD_TYPES.map(ft => (
                  <button key={ft.type} onClick={() => addField(ft.type)} style={{
                    background:`${C.teal}15`, color:C.teal, border:`1px solid ${C.teal}30`,
                    borderRadius:20, padding:'5px 14px', cursor:'pointer', fontSize:'.82rem', fontFamily:'Cairo,sans-serif',
                  }}>+ {ft.label}</button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {fields.map((f) => (
                <div key={f.id} style={{ background:'rgba(255,255,255,.06)', border:`1px solid rgba(255,255,255,.1)`, borderRadius:14, padding:16 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ background:`${C.teal}20`, color:C.teal, padding:'3px 10px', borderRadius:20, fontSize:'.75rem', whiteSpace:'nowrap' }}>
                      {FIELD_TYPES.find(t=>t.type===f.type)?.label || f.type}
                    </span>
                    <input value={f.label} onChange={e => updateField(f.id,'label',e.target.value)}
                      placeholder="نص السؤال..."
                      style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.05)', color:'#fff', outline:'none', fontSize:'.9rem', fontFamily:'Cairo,sans-serif' }} />
                    <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.82rem', color:'rgba(255,255,255,.6)', cursor:'pointer', whiteSpace:'nowrap' }}>
                      <input type="checkbox" checked={f.required} onChange={e => updateField(f.id,'required',e.target.checked)} />
                      إلزامي
                    </label>
                    <button onClick={() => removeField(f.id)} style={{ background:'#ef444420', color:'#ef4444', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer' }}>✕</button>
                  </div>
                  {(f.type==='select'||f.type==='radio'||f.type==='checkbox') && (
                    <input className="mt-2"
                      placeholder="الخيارات (افصل بفاصلة: خيار1, خيار2)"
                      defaultValue={f.options?.join(', ')||''}
                      onBlur={e => updateField(f.id,'options', e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean))}
                      style={{ marginTop:10, width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.05)', color:'#fff', outline:'none', fontSize:'.85rem', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }} />
                  )}
                </div>
              ))}
              {fields.length === 0 && (
                <div style={{ border:`2px dashed rgba(255,255,255,.12)`, borderRadius:14, padding:40, textAlign:'center', color:'rgba(255,255,255,.3)' }}>
                  أضف حقلاً من الأزرار أعلاه
                </div>
              )}
            </div>

            {/* Settings */}
            <div style={{ marginTop:24, background:'rgba(255,255,255,.04)', borderRadius:14, padding:20 }}>
              <div style={{ color:'rgba(255,255,255,.7)', fontWeight:700, marginBottom:14, fontSize:'.92rem' }}>⚙️ إعدادات النموذج</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={{ fontSize:'.82rem', color:'rgba(255,255,255,.5)', display:'block', marginBottom:6 }}>رسالة النجاح</label>
                  <input value={successMsg} onChange={e => setSuccessMsg(e.target.value)}
                    style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:'.82rem', color:'rgba(255,255,255,.5)', display:'block', marginBottom:6 }}>إعادة التوجيه بعد الإرسال (اختياري)</label>
                  <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {submissions.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, border:`2px dashed rgba(255,255,255,.1)`, borderRadius:18 }}>
                <div style={{ fontSize:'2.5rem', opacity:.3, marginBottom:12 }}>📭</div>
                <div style={{ color:'rgba(255,255,255,.4)' }}>لا توجد ردود بعد</div>
              </div>
            ) : (
              <div>
                <div style={{ color:'rgba(255,255,255,.5)', marginBottom:16, fontSize:'.88rem' }}>{subTotal} رد إجمالاً</div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {submissions.map((s: any) => (
                    <div key={s.id} style={{ background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.1)`, borderRadius:14, padding:18 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <div>
                          {s.submitter_name && <span style={{ color:'#fff', fontWeight:600, fontSize:'.9rem' }}>{s.submitter_name}</span>}
                          {s.submitter_email && <span style={{ color:'rgba(255,255,255,.5)', fontSize:'.82rem', marginRight:8 }}>{s.submitter_email}</span>}
                        </div>
                        <span style={{ color:'rgba(255,255,255,.35)', fontSize:'.78rem' }}>
                          {new Date(s.created_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                        {Object.entries(s.data || {}).map(([key, val]: any) => {
                          const fieldDef = fields.find((f: any) => f.id === key);
                          return (
                            <div key={key} style={{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 12px' }}>
                              <div style={{ color:'rgba(255,255,255,.4)', fontSize:'.75rem', marginBottom:3 }}>{fieldDef?.label || key}</div>
                              <div style={{ color:'rgba(255,255,255,.85)', fontSize:'.88rem' }}>{Array.isArray(val) ? val.join('، ') : String(val)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
