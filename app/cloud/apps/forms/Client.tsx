'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A', bg: '#080520' };

const FIELD_TYPES = [
  { type: 'text',     label: 'نص قصير' },
  { type: 'textarea', label: 'نص طويل' },
  { type: 'email',    label: 'بريد إلكتروني' },
  { type: 'phone',    label: 'هاتف' },
  { type: 'number',   label: 'رقم' },
  { type: 'date',     label: 'تاريخ' },
  { type: 'select',   label: 'قائمة منسدلة' },
  { type: 'radio',    label: 'اختيار واحد' },
  { type: 'checkbox', label: 'اختيار متعدد' },
];

function newField(type = 'text') {
  return { id: Date.now().toString(), type, label: '', required: false, options: [] as string[] };
}

export default function FormsClient() {
  const router = useRouter();
  const [forms, setForms]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formTitle, setFormTitle]   = useState('');
  const [formDesc, setFormDesc]     = useState('');
  const [fields, setFields]         = useState<any[]>([]);
  const [saving, setSaving]         = useState(false);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h   = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    const res  = await fetch(`${API}/api/cloud/forms`, { headers: h });
    const data = await res.json();
    setForms(data.data || []);
    setLoading(false);
  };

  const addField = (type: string) => setFields(f => [...f, newField(type)]);
  const removeField = (id: string) => setFields(f => f.filter(x => x.id !== id));
  const updateField = (id: string, key: string, val: any) =>
    setFields(f => f.map(x => x.id === id ? { ...x, [key]: val } : x));

  const createForm = async () => {
    if (!formTitle.trim()) return alert('العنوان مطلوب');
    setSaving(true);
    const res  = await fetch(`${API}/api/cloud/forms`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ title: formTitle, description: formDesc, fields, is_public: 1 }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setShowCreate(false); setFormTitle(''); setFormDesc(''); setFields([]);
      fetchForms();
    } else alert(data.error || 'حدث خطأ');
  };

  const deleteForm = async (id: number) => {
    if (!confirm('حذف النموذج وكل ردوده؟')) return;
    await fetch(`${API}/api/cloud/forms/${id}`, { method: 'DELETE', headers: h });
    fetchForms();
  };

  const shareLink = (id: number) => {
    const url = `${window.location.origin}/cloud/apps/forms/public/${id}`;
    navigator.clipboard.writeText(url).then(() => alert('تم نسخ الرابط: ' + url)).catch(() => alert(url));
  };

  return (
    <div style={{ minHeight:'100vh', background: C.bg, fontFamily:'Cairo,sans-serif', direction:'rtl' }}>
      {/* Nav */}
      <nav style={{ background:'rgba(8,5,32,.95)', borderBottom:`1px solid ${C.teal}30`, padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Link href="/cloud" style={{ color: C.mint, textDecoration:'none', fontWeight:700 }}>☁️ السحابة</Link>
          <span style={{ color:'rgba(255,255,255,.3)' }}>›</span>
          <span style={{ color:'#fff', fontWeight:700 }}>📋 نماذج التسجيل</span>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          background: C.teal, color:'#fff', border:'none', borderRadius:40,
          padding:'9px 22px', cursor:'pointer', fontWeight:700, fontFamily:'Cairo,sans-serif',
        }}>+ نموذج جديد</button>
      </nav>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 24px' }}>
        {/* Create Panel */}
        {showCreate && (
          <div style={{ background:'white', borderRadius:20, padding:28, marginBottom:28, boxShadow:`0 8px 28px ${C.navy}18` }}>
            <h2 style={{ color:C.navy, margin:'0 0 20px', fontSize:'1.1rem' }}>✦ إنشاء نموذج جديد</h2>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div>
                <label style={{ fontSize:'.85rem', color:'#555', display:'block', marginBottom:6 }}>عنوان النموذج *</label>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${C.teal}40`, outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }}
                  placeholder="مثال: نموذج الانضمام" />
              </div>
              <div>
                <label style={{ fontSize:'.85rem', color:'#555', display:'block', marginBottom:6 }}>الوصف</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${C.teal}40`, outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }}
                  placeholder="وصف مختصر..." />
              </div>
            </div>

            {/* Field Builder */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontWeight:700, color:C.navy, fontSize:'.92rem' }}>الحقول ({fields.length})</span>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {FIELD_TYPES.slice(0, 5).map(ft => (
                    <button key={ft.type} onClick={() => addField(ft.type)} style={{
                      background:`${C.teal}12`, color:C.teal, border:`1px solid ${C.teal}30`,
                      borderRadius:20, padding:'4px 12px', cursor:'pointer', fontSize:'.8rem',
                      fontFamily:'Cairo,sans-serif',
                    }}>+ {ft.label}</button>
                  ))}
                  <select onChange={e => { if(e.target.value) addField(e.target.value); e.target.value=''; }}
                    style={{ padding:'4px 28px 4px 12px', borderRadius:20, border:`1px solid ${C.teal}30`, fontSize:'.8rem', outline:'none', fontFamily:'Cairo,sans-serif',
                      appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%234E8D9C' d='M8 11L2 5h12z'/%3E%3C/svg%3E\")",
                      backgroundRepeat:'no-repeat', backgroundPosition:'left 8px center', backgroundSize:'12px',
                    }}>
                    <option value="">+ المزيد</option>
                    {FIELD_TYPES.slice(5).map(ft => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
                  </select>
                </div>
              </div>

              {fields.length === 0 ? (
                <div style={{ border:`2px dashed ${C.teal}25`, borderRadius:14, padding:28, textAlign:'center', color:'#bbb', fontSize:'.9rem' }}>
                  اضغط "+ حقل" لإضافة سؤال
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {fields.map((f, idx) => (
                    <div key={f.id} style={{ background:'#f9fafb', border:`1px solid #e5e7eb`, borderRadius:12, padding:14 }}>
                      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom: (f.type==='select'||f.type==='radio'||f.type==='checkbox') ? 10 : 0 }}>
                        <span style={{ background:`${C.teal}15`, color:C.teal, padding:'3px 10px', borderRadius:20, fontSize:'.75rem', whiteSpace:'nowrap' }}>
                          {FIELD_TYPES.find(t => t.type===f.type)?.label || f.type}
                        </span>
                        <input value={f.label} onChange={e => updateField(f.id, 'label', e.target.value)}
                          placeholder="نص السؤال..."
                          style={{ flex:1, padding:'7px 12px', borderRadius:8, border:'1px solid #ddd', outline:'none', fontSize:'.88rem', fontFamily:'Cairo,sans-serif' }} />
                        <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.82rem', color:'#666', cursor:'pointer', whiteSpace:'nowrap' }}>
                          <input type="checkbox" checked={f.required} onChange={e => updateField(f.id, 'required', e.target.checked)} />
                          إلزامي
                        </label>
                        <button onClick={() => removeField(f.id)} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:'.85rem' }}>✕</button>
                      </div>
                      {(f.type==='select'||f.type==='radio'||f.type==='checkbox') && (
                        <div>
                          <input
                            placeholder="الخيارات (افصل بفاصلة: خيار1, خيار2)"
                            defaultValue={f.options.join(', ')}
                            onBlur={e => updateField(f.id, 'options', e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean))}
                            style={{ width:'100%', padding:'7px 12px', borderRadius:8, border:'1px solid #ddd', outline:'none', fontSize:'.85rem', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setShowCreate(false); setFields([]); setFormTitle(''); }} style={{
                background:'#f3f4f6', color:'#555', border:'none', borderRadius:40, padding:'10px 20px', cursor:'pointer', fontFamily:'Cairo,sans-serif',
              }}>إلغاء</button>
              <button onClick={createForm} disabled={saving} style={{
                background:C.navy, color:'#fff', border:'none', borderRadius:40, padding:'10px 24px',
                cursor:'pointer', fontWeight:700, fontFamily:'Cairo,sans-serif', opacity:saving?0.6:1,
              }}>{saving ? '...' : 'حفظ النموذج'}</button>
            </div>
          </div>
        )}

        {/* Forms List */}
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:'rgba(255,255,255,.4)' }}>جاري التحميل...</div>
        ) : forms.length === 0 ? (
          <div style={{ textAlign:'center', padding:80, border:`2px dashed rgba(255,255,255,.1)`, borderRadius:24 }}>
            <div style={{ fontSize:'3rem', opacity:.3, marginBottom:12 }}>📋</div>
            <div style={{ color:'rgba(255,255,255,.4)', fontSize:'1rem' }}>لا توجد نماذج بعد</div>
            <button onClick={() => setShowCreate(true)} style={{
              marginTop:18, background:C.teal, color:'#fff', border:'none', borderRadius:40,
              padding:'10px 24px', cursor:'pointer', fontFamily:'Cairo,sans-serif', fontWeight:700,
            }}>+ إنشاء أول نموذج</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:20 }}>
            {forms.map((form: any) => (
              <div key={form.id} style={{
                background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.1)`,
                borderRadius:18, padding:22, display:'flex', flexDirection:'column', gap:12,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:'1rem' }}>{form.title}</div>
                    {form.description && <div style={{ color:'rgba(255,255,255,.5)', fontSize:'.82rem', marginTop:4 }}>{form.description}</div>}
                  </div>
                  <span style={{
                    background: form.status==='active' ? '#10b98120' : '#ef444420',
                    color: form.status==='active' ? '#10b981' : '#ef4444',
                    padding:'2px 10px', borderRadius:20, fontSize:'.78rem', fontWeight:700,
                  }}>{form.status==='active' ? 'نشط' : 'مغلق'}</span>
                </div>

                <div style={{ display:'flex', gap:16, fontSize:'.82rem' }}>
                  <span style={{ color:'rgba(255,255,255,.5)' }}>📊 {form.submissions_count} رد</span>
                  <span style={{ color:'rgba(255,255,255,.5)' }}>👁 {form.views} مشاهدة</span>
                </div>

                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <Link href={`/cloud/apps/forms/${form.id}`} style={{
                    background:`${C.teal}20`, color:C.teal, textDecoration:'none',
                    padding:'6px 14px', borderRadius:20, fontSize:'.82rem', fontWeight:600,
                  }}>✏️ تعديل</Link>
                  <button onClick={() => shareLink(form.id)} style={{
                    background:'#6366f120', color:'#818cf8', border:'none', borderRadius:20,
                    padding:'6px 14px', cursor:'pointer', fontSize:'.82rem', fontFamily:'Cairo,sans-serif',
                  }}>🔗 مشاركة</button>
                  <button onClick={() => deleteForm(form.id)} style={{
                    background:'#ef444415', color:'#ef4444', border:'none', borderRadius:20,
                    padding:'6px 14px', cursor:'pointer', fontSize:'.82rem', fontFamily:'Cairo,sans-serif',
                  }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
