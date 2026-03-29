'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal:'#4E8D9C', navy:'#281C59', mint:'#EDF7BD', bg:'#080520' };

const STAGES = [
  { id:'lead',        label:'عميل محتمل',  color:'#6366f1' },
  { id:'qualified',   label:'مؤهَّل',       color:'#3b82f6' },
  { id:'proposal',    label:'عرض مقدَّم',  color:'#8b5cf6' },
  { id:'negotiation', label:'تفاوض',        color:'#f59e0b' },
  { id:'won',         label:'مُغلق ✔️',     color:'#10b981' },
  { id:'lost',        label:'خُسِر ✘',      color:'#ef4444' },
];
const SOURCES = ['موقع إلكتروني','إحالة','تواصل اجتماعي','مكالمة','فعالية','أخرى'];
const blank = () => ({ name:'', email:'', phone:'', company:'', stage:'lead', source:'', notes:'', value:'' });

export default function CrmClient() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [stageCounts, setStageCounts] = useState<any>({});
  const [filterStage, setFilterStage] = useState('');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [form, setForm]         = useState(blank());
  const [saving, setSaving]     = useState(false);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    load();
  }, [filterStage, search]);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStage) params.set('stage', filterStage);
    if (search) params.set('search', search);
    const res = await fetch(`${API}/api/cloud/crm/contacts?${params}`, { headers: h });
    const d = await res.json();
    if (d.success) {
      setContacts(d.data || []);
      setStageCounts(d.stage_counts || {});
    }
    setLoading(false);
  };

  const openAdd  = () => { setEditing(null); setForm(blank()); setShowModal(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name:c.name||'', email:c.email||'', phone:c.phone||'', company:c.company||'', stage:c.stage||'lead', source:c.source||'', notes:c.notes||'', value:String(c.value||'') });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return alert('الاسم مطلوب');
    setSaving(true);
    const body = { ...form, value: parseFloat(form.value) || 0 };
    if (editing) {
      await fetch(`${API}/api/cloud/crm/contacts/${editing.id}`, { method:'PUT', headers:h, body: JSON.stringify(body) });
    } else {
      await fetch(`${API}/api/cloud/crm/contacts`, { method:'POST', headers:h, body: JSON.stringify(body) });
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('حذف هذا العميل؟')) return;
    await fetch(`${API}/api/cloud/crm/contacts/${id}`, { method:'DELETE', headers:h });
    load();
  };

  const changeStage = async (id: number, stage: string) => {
    await fetch(`${API}/api/cloud/crm/contacts/${id}`, { method:'PUT', headers:h, body: JSON.stringify({ stage }) });
    load();
  };

  const inp = (key: string, type='text', placeholder='') => (
    <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
      placeholder={placeholder}
      style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const, fontSize:'.9rem' }} />
  );

  const totalValue = contacts.reduce((s, c) => s + (Number(c.value)||0), 0);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Cairo,sans-serif', direction:'rtl' }}>
      {/* Nav */}
      <nav style={{ background:'rgba(8,5,32,.95)', borderBottom:`1px solid ${C.teal}30`, padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/cloud" style={{ color:'rgba(255,255,255,.45)', textDecoration:'none', fontSize:'.85rem' }}>السحابة</Link>
          <span style={{ color:'rgba(255,255,255,.2)' }}>›</span>
          <span style={{ color:'#fff', fontWeight:700 }}>💼 إدارة العملاء (CRM)</span>
        </div>
        <button onClick={openAdd} style={{ background:C.teal, color:'#fff', border:'none', borderRadius:40, padding:'8px 20px', cursor:'pointer', fontWeight:700, fontFamily:'Cairo,sans-serif' }}>+ عميل جديد</button>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:26 }}>
          {STAGES.map(s => (
            <div key={s.id} onClick={() => setFilterStage(filterStage===s.id?'':s.id)}
              style={{ background: filterStage===s.id ? `${s.color}25` : 'rgba(255,255,255,.04)', border:`1px solid ${filterStage===s.id?s.color:'rgba(255,255,255,.07)'}`, borderRadius:14, padding:'14px 16px', cursor:'pointer', transition:'.2s' }}>
              <div style={{ color:s.color, fontWeight:700, fontSize:'1.3rem' }}>{stageCounts[s.id]||0}</div>
              <div style={{ color:'rgba(255,255,255,.55)', fontSize:'.8rem', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + total */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, gap:12 }}>
          <input value={search} onChange={e=>{ setSearch(e.target.value); }} placeholder="🔍 بحث بالاسم أو الشركة..."
            style={{ flex:1, maxWidth:320, padding:'9px 14px', borderRadius:30, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.05)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', fontSize:'.88rem' }}
            onKeyDown={e => e.key==='Enter' && load()} />
          <span style={{ color:'rgba(255,255,255,.35)', fontSize:'.82rem' }}>
            إجمالي القيم: <strong style={{ color:C.mint }}>{totalValue.toLocaleString('ar')} ₴</strong>
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,.3)' }}>جاري التحميل...</div>
        ) : contacts.length===0 ? (
          <div style={{ border:`2px dashed rgba(255,255,255,.1)`, borderRadius:18, padding:60, textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem', opacity:.3 }}>👥</div>
            <p style={{ color:'rgba(255,255,255,.4)', marginTop:10 }}>لا يوجد عملاء بعد</p>
          </div>
        ) : (
          <div style={{ background:'rgba(255,255,255,.04)', border:`1px solid rgba(255,255,255,.08)`, borderRadius:16, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:`1px solid rgba(255,255,255,.08)` }}>
                  {['الاسم','الشركة','البريد / الهاتف','المرحلة','القيمة','الإجراءات'].map(h2 => (
                    <th key={h2} style={{ padding:'12px 16px', color:'rgba(255,255,255,.4)', fontWeight:600, fontSize:'.82rem', textAlign:'right' }}>{h2}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map((c: any) => {
                  const stage = STAGES.find(s => s.id===c.stage) || STAGES[0];
                  return (
                    <tr key={c.id} style={{ borderBottom:`1px solid rgba(255,255,255,.05)`, transition:'.15s' }}>
                      <td style={{ padding:'12px 16px', color:'#fff', fontWeight:600 }}>{c.name}</td>
                      <td style={{ padding:'12px 16px', color:'rgba(255,255,255,.55)', fontSize:'.88rem' }}>{c.company||'—'}</td>
                      <td style={{ padding:'12px 16px', color:'rgba(255,255,255,.55)', fontSize:'.82rem' }}>
                        {c.email && <div>{c.email}</div>}
                        {c.phone && <div style={{ color:'rgba(255,255,255,.35)' }}>{c.phone}</div>}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <select defaultValue={c.stage} onChange={e => changeStage(c.id, e.target.value)}
                          style={{ background:`${stage.color}20`, color:stage.color, border:`1px solid ${stage.color}50`, borderRadius:20, padding:'4px 10px', fontSize:'.78rem', cursor:'pointer', fontFamily:'Cairo,sans-serif', outline:'none' }}>
                          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:'12px 16px', color:C.mint, fontWeight:600 }}>
                        {c.value ? `${Number(c.value).toLocaleString('ar')} ₴` : '—'}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => openEdit(c)} style={{ background:'rgba(255,255,255,.07)', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'rgba(255,255,255,.7)', fontSize:'.8rem' }}>✏️</button>
                          <button onClick={() => remove(c.id)} style={{ background:'#ef444415', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'#ef4444', fontSize:'.8rem' }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
          <div style={{ background:'#0f0b2a', border:`1px solid ${C.teal}40`, borderRadius:20, padding:28, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontWeight:800 }}>{editing ? 'تعديل عميل' : 'عميل جديد'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>{inp('name','text','الاسم الكامل *')}</div>
                <div>{inp('company','text','الشركة / المؤسسة')}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>{inp('email','email','البريد الإلكتروني')}</div>
                <div>{inp('phone','tel','رقم الهاتف')}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <select value={form.stage} onChange={e => setForm(f=>({...f,stage:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <select value={form.source} onChange={e => setForm(f=>({...f,source:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }}>
                    <option value="">-- المصدر --</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>{inp('value','number','القيمة المتوقعة للصفقة')}</div>
              <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={3} placeholder="ملاحظات..."
                style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const, resize:'vertical', fontSize:'.9rem' }} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'11px 0', borderRadius:40, border:'none', background:C.teal, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Cairo,sans-serif', opacity:saving?.6:1 }}>{saving?'...':'حفظ'}</button>
              <button onClick={()=>setShowModal(false)} style={{ padding:'11px 20px', borderRadius:40, border:`1px solid rgba(255,255,255,.2)`, background:'transparent', color:'rgba(255,255,255,.6)', cursor:'pointer', fontFamily:'Cairo,sans-serif' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
