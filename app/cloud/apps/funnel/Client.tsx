'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A', bg: '#080520' };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'مسودة',    color: '#9ca3af' },
  active:    { label: 'نشط',      color: '#10b981' },
  paused:    { label: 'متوقف',   color: '#f59e0b' },
  archived:  { label: 'مؤرشف',  color: '#6b7280' },
};

const STEP_TYPES = [
  { id: 'landing',       label: 'صفحة هبوط',    icon: '🖥️' },
  { id: 'lead_capture',  label: 'التقاط العملاء',  icon: '📋' },
  { id: 'offer',         label: 'عرض / OTO',    icon: '💰' },
  { id: 'upsell',        label: 'بيع إضافي',    icon: '📈' },
  { id: 'confirmation',  label: 'تأكيد',         icon: '✅' },
  { id: 'email',         label: 'بريد إلكتروني', icon: '✉️' },
];

const blankStep = () => ({ type: 'landing', title: '', url: '' });
const blankFunnel = () => ({ name: '', status: 'draft' });

export default function FunnelClient() {
  const router = useRouter();
  const [funnels, setFunnels]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [editSteps, setEditSteps] = useState(false);
  const [form, setForm]         = useState(blankFunnel());
  const [steps, setSteps]       = useState<any[]>([]);
  const [saving, setSaving]     = useState(false);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h   = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/cloud/funnels`, { headers: h });
      const d   = await res.json();
      if (d.success) setFunnels(d.data || []);
      else if (res.status === 401) router.push('/login');
    } catch {}
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(blankFunnel());
    setSteps([]);
    setEditSteps(false);
    setShowModal(true);
  };

  const openEdit = (f: any) => {
    setEditing(f);
    setForm({ name: f.name || '', status: f.status || 'draft' });
    try { setSteps(JSON.parse(f.steps || '[]')); } catch { setSteps([]); }
    setEditSteps(false);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return alert('اسم القمع مطلوب');
    setSaving(true);
    const body = { ...form, steps };
    if (editing) {
      await fetch(`${API}/api/cloud/funnels/${editing.id}`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
    } else {
      await fetch(`${API}/api/cloud/funnels`, { method: 'POST', headers: h, body: JSON.stringify(body) });
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const remove = async (id: number, name: string) => {
    if (!confirm(`حذف قمع المبيعات "${name}"؟`)) return;
    await fetch(`${API}/api/cloud/funnels/${id}`, { method: 'DELETE', headers: h });
    load();
  };

  const addStep = () => setSteps(s => [...s, blankStep()]);
  const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, key: string, val: string) =>
    setSteps(s => s.map((step, idx) => idx === i ? { ...step, [key]: val } : step));

  const inp = (label: string, key: string, placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '.82rem', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>{label}</label>
      <input
        value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box', fontSize: '.9rem' }}
      />
    </div>
  );

  const shareLink = (f: any) => `${typeof window !== 'undefined' ? window.location.origin : ''}/funnel/${f.id}`;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo,sans-serif', direction: 'rtl', color: '#e8f4f8' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(8,5,32,.95)', borderBottom: `1px solid ${C.teal}30`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/cloud" style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none', fontSize: '.85rem' }}>السحابة ←</Link>
          <span style={{ color: 'rgba(255,255,255,.2)' }}>|</span>
          <span style={{ fontWeight: 700, color: C.mint, fontSize: '.95rem' }}>🌪️ قمع المبيعات</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: '.82rem' }}>✦ الرئيسية</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, background: `linear-gradient(130deg,${C.mint},${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              قمع المبيعات
            </h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.5)', fontSize: '.9rem' }}>
              أنشئ مسارات مبيعات متعددة الخطوات لتحويل الزوار إلى عملاء
            </p>
          </div>
          <button onClick={openAdd} style={{ background: `linear-gradient(135deg,${C.teal},${C.navy})`, color: '#fff', border: 'none', borderRadius: 24, padding: '10px 22px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700, fontSize: '.92rem' }}>
            + قمع جديد
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 28 }}>
          {Object.entries(STATUS_LABELS).map(([key, s]) => (
            <div key={key} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: '14px 16px', border: `1px solid ${s.color}30` }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, marginBottom: 4 }}>
                {funnels.filter(f => f.status === key).length}
              </div>
              <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.teal}30` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: C.teal, marginBottom: 4 }}>{funnels.length}</div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>المجموع</div>
          </div>
        </div>

        {/* Funnels Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>جاري التحميل...</div>
        ) : funnels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🌪️</div>
            <p>لا توجد أقماع مبيعات بعد</p>
            <button onClick={openAdd} style={{ marginTop: 16, background: `${C.teal}20`, color: C.teal, border: `1px solid ${C.teal}40`, borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
              أنشئ أول قمع
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {funnels.map(f => {
              let stepsArr: any[] = [];
              try { stepsArr = JSON.parse(f.steps || '[]'); } catch {}
              const s = STATUS_LABELS[f.status] || STATUS_LABELS.draft;
              return (
                <div key={f.id} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${C.teal}20`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Top */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{f.name}</div>
                      <span style={{ background: `${s.color}20`, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: '.75rem' }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: '1.6rem' }}>🌪️</div>
                  </div>

                  {/* Steps preview */}
                  {stepsArr.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {stepsArr.map((step: any, i: number) => {
                        const st = STEP_TYPES.find(t => t.id === step.type);
                        return (
                          <span key={i} style={{ background: `${C.teal}15`, color: C.teal, padding: '2px 8px', borderRadius: 10, fontSize: '.72rem' }}>
                            {st?.icon} {step.title || st?.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Views + date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.78rem' }}>
                    <span>👁 {f.views || 0} مشاهدة</span>
                    <span>{stepsArr.length} خطوات</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(f)} style={{ flex: 1, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: 10, padding: '7px 0', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.83rem' }}>
                      تعديل
                    </button>
                    <button onClick={() => { navigator.clipboard?.writeText(shareLink(f)); alert('تم نسخ الرابط!'); }} style={{ background: `${C.green}15`, color: C.green, border: `1px solid ${C.green}30`, borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.83rem' }}>
                      🔗 مشاركة
                    </button>
                    <button onClick={() => remove(f.id, f.name)} style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.83rem' }}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#10103a', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.teal}30` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: C.mint }}>{editing ? 'تعديل القمع' : 'قمع جديد'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {inp('اسم القمع *', 'name', 'مثال: قمع المنتج X')}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.82rem', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>الحالة</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: '#10103a', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.9rem' }}>
                {Object.entries(STATUS_LABELS).map(([k, s]) => (
                  <option key={k} value={k}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Steps builder */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}>الخطوات ({steps.length})</label>
                <button onClick={() => setEditSteps(e => !e)} style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: '.8rem' }}>
                  {editSteps ? 'إخفاء' : 'عرض / تعديل الخطوات'}
                </button>
              </div>

              {editSteps && (
                <div style={{ border: `1px solid ${C.teal}20`, borderRadius: 12, padding: 14, background: 'rgba(255,255,255,.03)' }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${C.teal}20`, color: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', flexShrink: 0 }}>{i + 1}</div>
                      <select value={step.type} onChange={e => updateStep(i, 'type', e.target.value)}
                        style={{ background: '#10103a', border: '1px solid rgba(255,255,255,.15)', color: '#fff', borderRadius: 6, padding: '6px 8px', fontFamily: 'Cairo,sans-serif', fontSize: '.8rem' }}>
                        {STEP_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                      </select>
                      <input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} placeholder="عنوان الخطوة"
                        style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 6, padding: '6px 10px', fontFamily: 'Cairo,sans-serif', fontSize: '.8rem', outline: 'none' }} />
                      <button onClick={() => removeStep(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                    </div>
                  ))}
                  <button onClick={addStep} style={{ width: '100%', background: `${C.teal}12`, color: C.teal, border: `1px dashed ${C.teal}40`, borderRadius: 8, padding: '7px 0', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.85rem', marginTop: 4 }}>
                    + إضافة خطوة
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 20 }}>
              <button onClick={save} disabled={saving} style={{ background: `linear-gradient(135deg,${C.teal},${C.navy})`, color: '#fff', border: 'none', borderRadius: 24, padding: '10px 24px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700, opacity: saving ? .6 : 1 }}>
                {saving ? '...' : editing ? 'تحديث' : 'إنشاء'}
              </button>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,.07)', color: '#ccc', border: 'none', borderRadius: 24, padding: '10px 20px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
