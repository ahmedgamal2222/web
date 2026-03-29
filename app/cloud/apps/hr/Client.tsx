'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal:'#4E8D9C', navy:'#281C59', mint:'#EDF7BD', bg:'#080520' };

const LEAVE_TYPES = [
  { id:'annual',    label:'إجازة سنوية',    color:'#3b82f6' },
  { id:'sick',      label:'إجازة مرضية',    color:'#ef4444' },
  { id:'unpaid',    label:'إجازة بدون راتب', color:'#f59e0b' },
  { id:'emergency', label:'طارئة',           color:'#8b5cf6' },
  { id:'other',     label:'أخرى',            color:'#6b7280' },
];
const STATUS_COLORS: Record<string,string> = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444' };
const STATUS_LABELS: Record<string,string> = { pending:'قيد الانتظار', approved:'موافَق عليها', rejected:'مرفوضة' };

const blankLeave = () => ({
  type: 'annual', from_date:'', to_date:'', reason:'',
});

export default function HrClient() {
  const router = useRouter();
  const [leaves, setLeaves]         = useState<any[]>([]);
  const [summary, setSummary]       = useState<any>({});
  const [filterStatus, setFilterStatus] = useState('');
  const [onlyMine, setOnlyMine]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(blankLeave());
  const [saving, setSaving]         = useState(false);
  const [user, setUser]             = useState<any>(null);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    try { setUser(JSON.parse(u)); } catch {}
    load();
  }, [filterStatus, onlyMine]);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterStatus) p.set('status', filterStatus);
    if (onlyMine) p.set('mine', '1');
    const res = await fetch(`${API}/api/cloud/hr/leaves?${p}`, { headers: h });
    const d = await res.json();
    if (d.success) { setLeaves(d.data||[]); setSummary(d.summary||{}); }
    setLoading(false);
  };

  const submit = async () => {
    if (!form.from_date || !form.to_date) return alert('اختر التواريخ');
    setSaving(true);
    await fetch(`${API}/api/cloud/hr/leaves`, { method:'POST', headers:h, body:JSON.stringify(form) });
    setSaving(false);
    setShowModal(false);
    setForm(blankLeave());
    load();
  };

  const review = async (id:number, status:'approved'|'rejected') => {
    await fetch(`${API}/api/cloud/hr/leaves/${id}/review`, { method:'PUT', headers:h, body:JSON.stringify({status}) });
    load();
  };

  const daysBetween = (a:string, b:string) => {
    const d1 = new Date(a), d2 = new Date(b);
    return Math.ceil((d2.getTime()-d1.getTime())/(1000*60*60*24))+1;
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'Cairo,sans-serif', direction:'rtl' }}>
      <nav style={{ background:'rgba(8,5,32,.95)', borderBottom:`1px solid ${C.teal}30`, padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/cloud" style={{ color:'rgba(255,255,255,.45)', textDecoration:'none', fontSize:'.85rem' }}>السحابة</Link>
          <span style={{ color:'rgba(255,255,255,.2)' }}>›</span>
          <span style={{ color:'#fff', fontWeight:700 }}>👥 الموارد البشرية (HR)</span>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background:C.teal, color:'#fff', border:'none', borderRadius:40, padding:'8px 20px', cursor:'pointer', fontWeight:700, fontFamily:'Cairo,sans-serif' }}>+ طلب إجازة</button>
      </nav>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 24px' }}>
        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
          {[
            { key:'pending',  label:'قيد الانتظار', emoji:'⏳', color:'#f59e0b' },
            { key:'approved', label:'موافَق عليها',  emoji:'✅', color:'#10b981' },
            { key:'rejected', label:'مرفوضة',        emoji:'❌', color:'#ef4444' },
          ].map(s => (
            <div key={s.key} onClick={() => setFilterStatus(filterStatus===s.key?'':s.key)}
              style={{ background: filterStatus===s.key ? `${s.color}25` : 'rgba(255,255,255,.04)', border:`1px solid ${filterStatus===s.key?s.color:'rgba(255,255,255,.07)'}`, borderRadius:14, padding:18, cursor:'pointer' }}>
              <div style={{ fontSize:'1.8rem' }}>{s.emoji}</div>
              <div style={{ color:s.color, fontWeight:800, fontSize:'1.4rem', margin:'4px 0 2px' }}>{summary[s.key]||0}</div>
              <div style={{ color:'rgba(255,255,255,.5)', fontSize:'.8rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:18 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,.6)', fontSize:'.88rem', cursor:'pointer' }}>
            <input type="checkbox" checked={onlyMine} onChange={e=>setOnlyMine(e.target.checked)} />
            طلباتي فقط
          </label>
          {filterStatus && (
            <button onClick={() => setFilterStatus('')} style={{ background:'rgba(255,255,255,.07)', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', color:'rgba(255,255,255,.6)', fontSize:'.82rem', fontFamily:'Cairo,sans-serif' }}>
              ✕ إزالة الفلتر
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'rgba(255,255,255,.3)' }}>جاري التحميل...</div>
        ) : leaves.length===0 ? (
          <div style={{ border:`2px dashed rgba(255,255,255,.1)`, borderRadius:18, padding:60, textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem', opacity:.3 }}>📋</div>
            <p style={{ color:'rgba(255,255,255,.4)', marginTop:10 }}>لا توجد طلبات إجازة</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {leaves.map((l: any) => {
              const lType = LEAVE_TYPES.find(t=>t.id===l.type) || LEAVE_TYPES[0];
              const days  = l.from_date && l.to_date ? daysBetween(l.from_date, l.to_date) : '?';
              return (
                <div key={l.id} style={{ background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.09)`, borderRadius:14, padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ background:`${lType.color}20`, color:lType.color, padding:'4px 12px', borderRadius:20, fontSize:'.8rem', fontWeight:600 }}>{lType.label}</span>
                      <span style={{ color:'#fff', fontWeight:600 }}>{l.employee_name || 'موظف'}</span>
                      <span style={{ color:'rgba(255,255,255,.4)', fontSize:'.82rem' }}>
                        {l.from_date} → {l.to_date}
                        <span style={{ color:C.mint, marginRight:6 }}>({days} أيام)</span>
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{
                        background:`${STATUS_COLORS[l.status]||'#6b7280'}20`,
                        color: STATUS_COLORS[l.status]||'#6b7280',
                        padding:'4px 12px', borderRadius:20, fontSize:'.78rem', fontWeight:600,
                      }}>{STATUS_LABELS[l.status]||l.status}</span>
                      {l.status==='pending' && (
                        <>
                          <button onClick={()=>review(l.id,'approved')} style={{ background:'#10b98115', color:'#10b981', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontSize:'.8rem', fontFamily:'Cairo,sans-serif' }}>✓ موافقة</button>
                          <button onClick={()=>review(l.id,'rejected')} style={{ background:'#ef444415', color:'#ef4444', border:'none', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontSize:'.8rem', fontFamily:'Cairo,sans-serif' }}>✕ رفض</button>
                        </>
                      )}
                    </div>
                  </div>
                  {l.reason && <p style={{ color:'rgba(255,255,255,.45)', fontSize:'.85rem', margin:'10px 0 0' }}>{l.reason}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
          <div style={{ background:'#0f0b2a', border:`1px solid ${C.teal}40`, borderRadius:20, padding:28, width:'100%', maxWidth:460 }}>
            <h3 style={{ color:'#fff', margin:'0 0 20px', fontWeight:800 }}>طلب إجازة جديد</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                style={{ padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif' }}>
                {LEAVE_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:'.8rem', color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }}>من تاريخ</label>
                  <input type="date" value={form.from_date} onChange={e=>setForm(f=>({...f,from_date:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize:'.8rem', color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }}>إلى تاريخ</label>
                  <input type="date" value={form.to_date} onChange={e=>setForm(f=>({...f,to_date:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', boxSizing:'border-box' as const }} />
                </div>
              </div>
              <textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}
                rows={3} placeholder="سبب الإجازة (اختياري)"
                style={{ padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.06)', color:'#fff', outline:'none', fontFamily:'Cairo,sans-serif', resize:'vertical', fontSize:'.9rem' }} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={submit} disabled={saving} style={{ flex:1, padding:'11px', borderRadius:40, border:'none', background:C.teal, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Cairo,sans-serif', opacity:saving?.6:1 }}>{saving?'...':'إرسال الطلب'}</button>
              <button onClick={()=>setShowModal(false)} style={{ padding:'11px 20px', borderRadius:40, border:`1px solid rgba(255,255,255,.2)`, background:'transparent', color:'rgba(255,255,255,.6)', cursor:'pointer', fontFamily:'Cairo,sans-serif' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
