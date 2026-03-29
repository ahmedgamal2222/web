'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A', bg: '#080520', card: '#0d0b2e' };

// ─── Field types registry ────────────────────────────────────────────────────
const FIELD_TYPES = [
  { type: 'text',     label: 'نص قصير',         icon: '✏️',  color: '#3b82f6' },
  { type: 'textarea', label: 'نص طويل',          icon: '📄',  color: '#6366f1' },
  { type: 'email',    label: 'بريد إلكتروني',    icon: '📧',  color: '#10b981' },
  { type: 'phone',    label: 'رقم هاتف',         icon: '📱',  color: '#f59e0b' },
  { type: 'number',   label: 'رقم',              icon: '🔢',  color: '#ec4899' },
  { type: 'date',     label: 'تاريخ',            icon: '📅',  color: '#14b8a6' },
  { type: 'select',   label: 'قائمة اختيار',     icon: '📋',  color: '#8b5cf6' },
  { type: 'radio',    label: 'اختيار واحد',      icon: '🔘',  color: '#f97316' },
  { type: 'checkbox', label: 'اختيار متعدد',     icon: '☑️',  color: '#06b6d4' },
  { type: 'file',     label: 'رفع ملف',          icon: '📎',  color: '#84cc16' },
  { type: 'rating',   label: 'تقييم بالنجوم',    icon: '⭐',  color: '#f59e0b' },
  { type: 'divider',  label: 'فاصل',             icon: '➖',  color: '#6b7280' },
];

// shared dark input style
const iS: React.CSSProperties = {
  width: '100%', padding: '9px 13px', borderRadius: 9,
  border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)',
  color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif',
  fontSize: '.88rem', boxSizing: 'border-box',
};
const lS: React.CSSProperties = {
  display: 'block', fontSize: '.75rem', color: 'rgba(255,255,255,.48)',
  marginBottom: 5, fontWeight: 600,
};

function ftMeta(type: string) {
  return FIELD_TYPES.find(f => f.type === type) || { label: type, icon: '❓', color: '#9ca3af' };
}

export default function FormsClient() {
  const router = useRouter();
  const [forms, setForms]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  // form meta
  const [title, setTitle]           = useState('');
  const [desc, setDesc]             = useState('');
  const [accentColor, setAccentColor] = useState('#4E8D9C');
  const [bgColor, setBgColor]       = useState('#080520');
  const [cardBg, setCardBg]         = useState('#10103a');
  // fields
  const [fields, setFields]         = useState<any[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [copied, setCopied]         = useState<number | null>(null);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!localStorage.getItem('user')) { router.push('/login'); return; }
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/cloud/forms`, { headers: h });
      const d = await res.json();
      if (d.success) setForms(d.data || []);
      else if (res.status === 401) router.push('/login');
    } catch {}
    setLoading(false);
  };

  const openModal = () => {
    setTitle(''); setDesc(''); setFields([]);
    setAccentColor('#4E8D9C'); setBgColor('#080520'); setCardBg('#10103a');
    setActiveField(null); setModal(true);
  };

  const addField = (type: string) => {
    const meta = ftMeta(type);
    const f = {
      id: Date.now().toString(),
      type,
      label: type === 'divider' ? '' : `${meta.label}`,
      placeholder: '',
      required: false,
      options: (type === 'select' || type === 'radio' || type === 'checkbox') ? ['خيار 1', 'خيار 2'] : [],
      helpText: '',
      width: 'full', // 'full' | 'half'
    };
    setFields(prev => { const next = [...prev, f]; setActiveField(f.id); return next; });
  };

  const updateField = (id: string, key: string, val: any) =>
    setFields(f => f.map(x => x.id === id ? { ...x, [key]: val } : x));
  const removeField = (id: string) => { setFields(f => f.filter(x => x.id !== id)); setActiveField(null); };
  const moveField = (id: string, dir: -1 | 1) => {
    setFields(prev => {
      const arr = [...prev]; const i = arr.findIndex(x => x.id === id);
      const j = i + dir; if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]]; return arr;
    });
  };
  const dupField = (id: string) => {
    setFields(prev => {
      const i = prev.findIndex(x => x.id === id);
      const copy = { ...prev[i], id: Date.now().toString() };
      const arr = [...prev]; arr.splice(i + 1, 0, copy);
      setActiveField(copy.id); return arr;
    });
  };

  const createForm = async () => {
    if (!title.trim()) return alert('عنوان النموذج مطلوب');
    // validate labels
    const unlabeled = fields.filter(f => f.type !== 'divider' && !f.label.trim());
    if (unlabeled.length) return alert('يرجى إضافة تسمية (Label) لجميع الحقول قبل الحفظ');
    setSaving(true);
    const res = await fetch(`${API}/api/cloud/forms`, {
      method: 'POST', headers: h,
      body: JSON.stringify({
        title, description: desc, fields, is_public: 1,
        settings: { accent_color: accentColor, bg_color: bgColor, card_bg: cardBg },
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.success) { setModal(false); loadForms(); }
    else alert(d.error || 'حدث خطأ');
  };

  const deleteForm = async (id: number, t: string) => {
    if (!confirm(`حذف النموذج "${t}" وكل ردوده؟`)) return;
    await fetch(`${API}/api/cloud/forms/${id}`, { method: 'DELETE', headers: h });
    loadForms();
  };

  const copyLink = (id: number) => {
    const url = `${window.location.origin}/cloud/apps/forms/public/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const af = activeField ? fields.find(f => f.id === activeField) : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo,sans-serif', direction: 'rtl', color: '#e8f4f8' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(8,5,32,.97)', borderBottom: `1px solid ${C.teal}28`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/cloud" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontSize: '.85rem' }}>السحابة ←</Link>
          <span style={{ color: 'rgba(255,255,255,.2)' }}>|</span>
          <span style={{ fontWeight: 700, color: C.mint, fontSize: '.95rem' }}>📋 نماذج التسجيل</span>
        </div>
        <Link href="/" style={{ color: 'rgba(255,255,255,.35)', textDecoration: 'none', fontSize: '.82rem' }}>✦ الرئيسية</Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, background: `linear-gradient(130deg,${C.mint},${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>نماذج التسجيل</h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.4)', fontSize: '.88rem' }}>أنشئ نماذج احترافية كاملة التخصيص بدون كود</p>
          </div>
          <button onClick={openModal} style={{ background: `linear-gradient(135deg,${C.teal},${C.navy})`, color: '#fff', border: 'none', borderRadius: 24, padding: '11px 24px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700, fontSize: '.93rem', boxShadow: `0 4px 20px ${C.teal}50` }}>
            + نموذج جديد
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'إجمالي النماذج', val: forms.length, color: C.teal },
            { label: 'نماذج نشطة', val: forms.filter(f => f.status === 'active').length, color: '#10b981' },
            { label: 'إجمالي الردود', val: forms.reduce((s, f) => s + (f.submissions_count || 0), 0), color: '#6366f1' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '14px 18px', border: `1px solid ${s.color}28` }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: '.77rem', color: 'rgba(255,255,255,.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Forms grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,.3)' }}>⏳ جاري التحميل...</div>
        ) : forms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,.28)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>📋</div>
            <p style={{ marginBottom: 20 }}>لا توجد نماذج بعد</p>
            <button onClick={openModal} style={{ background: `${C.teal}18`, color: C.teal, border: `1px solid ${C.teal}35`, borderRadius: 20, padding: '9px 22px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>أنشئ أول نموذج</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {forms.map(form => (
              <div key={form.id} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${C.teal}20`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 5 }}>{form.title}</div>
                    {form.description && <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.8rem', lineHeight: 1.5 }}>{form.description}</div>}
                  </div>
                  <span style={{ background: form.status === 'active' ? '#10b98120' : '#ef444420', color: form.status === 'active' ? '#10b981' : '#ef4444', padding: '3px 10px', borderRadius: 20, fontSize: '.74rem', fontWeight: 700, marginRight: 8, flexShrink: 0 }}>
                    {form.status === 'active' ? 'نشط' : 'مغلق'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>
                  <span>📊 {form.submissions_count || 0} رد</span>
                  <span>👁 {form.views || 0} مشاهدة</span>
                  <span>🏷 {(form.fields || []).length} حقل</span>
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  <Link href={`/cloud/apps/forms/${form.id}`} style={{ flex: 1, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}28`, borderRadius: 10, padding: '7px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem', textAlign: 'center', textDecoration: 'none' }}>✏️ تعديل</Link>
                  <button onClick={() => copyLink(form.id)} style={{ background: copied === form.id ? '#10b98118' : '#6366f118', color: copied === form.id ? '#10b981' : '#818cf8', border: 'none', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }}>
                    {copied === form.id ? '✓' : '🔗'}
                  </button>
                  <button onClick={() => deleteForm(form.id, form.title)} style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: 'none', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════ CREATE MODAL ══════════ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: C.bg }}>
          {/* top bar */}
          <div style={{ height: 54, background: 'rgba(8,5,32,.98)', borderBottom: `1px solid ${C.teal}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,.07)', border: 'none', color: '#9ca3af', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.83rem' }}>← رجوع</button>
              <span style={{ color: C.mint, fontWeight: 700 }}>نموذج جديد: <span style={{ color: '#fff' }}>{title || '...'}</span></span>
            </div>
            <button onClick={createForm} disabled={saving} style={{ background: `linear-gradient(135deg,${C.teal},${C.navy})`, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 22px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700, opacity: saving ? .7 : 1 }}>
              {saving ? '⏳...' : '💾 حفظ النموذج'}
            </button>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr 300px', overflow: 'hidden' }}>

            {/* LEFT — field palette */}
            <div style={{ borderLeft: `1px solid ${C.teal}18`, background: 'rgba(5,3,22,.9)', overflowY: 'auto', padding: 12 }}>
              <div style={{ fontSize: '.68rem', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 10 }}>أنواع الحقول</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {FIELD_TYPES.map(ft => (
                  <button key={ft.type} onClick={() => addField(ft.type)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${ft.color}0f`, color: ft.color, border: `1px solid ${ft.color}22`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem', textAlign: 'right' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${ft.color}22`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${ft.color}0f`)}
                  >
                    <span style={{ fontSize: '.9rem' }}>{ft.icon}</span>
                    <span>{ft.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CENTER — canvas */}
            <div style={{ background: 'rgba(255,255,255,.012)', overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {/* Form meta card */}
              <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${C.teal}22`, borderRadius: 14, padding: '14px 16px', marginBottom: 6 }}>
                <div style={{ fontSize: '.7rem', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>بيانات النموذج</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lS}>عنوان النموذج *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: نموذج الانضمام" style={iS} />
                  </div>
                  <div>
                    <label style={lS}>وصف مختصر</label>
                    <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="يظهر أسفل العنوان للمستجيب" style={iS} />
                  </div>
                </div>
              </div>

              {/* Fields */}
              {fields.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,.18)', gap: 10, paddingTop: 60 }}>
                  <div style={{ fontSize: '2.8rem' }}>📋</div>
                  <p style={{ textAlign: 'center', lineHeight: 1.7 }}>اختر نوع حقل من القائمة اليمنى<br />لإضافته للنموذج</p>
                </div>
              ) : fields.map((f, i) => {
                const meta = ftMeta(f.type);
                const isActive = activeField === f.id;
                if (f.type === 'divider') return (
                  <div key={f.id} onClick={() => setActiveField(f.id)} style={{ border: `2px solid ${isActive ? meta.color : 'rgba(255,255,255,.07)'}`, borderRadius: 10, padding: '10px 14px', background: isActive ? `${meta.color}0c` : 'rgba(255,255,255,.02)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.15)' }} />
                    <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.72rem', margin: '0 10px' }}>فاصل</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.15)' }} />
                    <div style={{ display: 'flex', gap: 3, marginRight: 8 }}>
                      <CanvasBtn onClick={e => { e.stopPropagation(); moveField(f.id, -1); }} disabled={i === 0}>↑</CanvasBtn>
                      <CanvasBtn onClick={e => { e.stopPropagation(); moveField(f.id, 1); }} disabled={i === fields.length - 1}>↓</CanvasBtn>
                      <CanvasBtn onClick={e => { e.stopPropagation(); removeField(f.id); }} danger>✕</CanvasBtn>
                    </div>
                  </div>
                );
                return (
                  <div key={f.id} onClick={() => setActiveField(f.id)} style={{ border: `2px solid ${isActive ? meta.color : 'rgba(255,255,255,.07)'}`, borderRadius: 11, padding: '10px 14px', background: isActive ? `${meta.color}0c` : 'rgba(255,255,255,.025)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span style={{ color: meta.color, fontSize: '.75rem', fontWeight: 700 }}>{meta.label}</span>
                        {f.label ? (
                          <span style={{ color: '#fff', fontSize: '.82rem', fontWeight: 600 }}>— {f.label}</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontSize: '.75rem', fontStyle: 'italic' }}>⚠ بدون تسمية</span>
                        )}
                        {f.required && <span style={{ color: '#ef4444', fontSize: '.72rem' }}>*</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <CanvasBtn onClick={e => { e.stopPropagation(); moveField(f.id, -1); }} disabled={i === 0}>↑</CanvasBtn>
                        <CanvasBtn onClick={e => { e.stopPropagation(); moveField(f.id, 1); }} disabled={i === fields.length - 1}>↓</CanvasBtn>
                        <CanvasBtn onClick={e => { e.stopPropagation(); dupField(f.id); }}>⧉</CanvasBtn>
                        <CanvasBtn onClick={e => { e.stopPropagation(); removeField(f.id); }} danger>✕</CanvasBtn>
                      </div>
                    </div>
                    {f.placeholder && <div style={{ fontSize: '.74rem', color: 'rgba(255,255,255,.28)', marginTop: 4 }}>placeholder: {f.placeholder}</div>}
                    {(f.options || []).length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>{(f.options || []).slice(0, 5).map((o: string, oi: number) => <span key={oi} style={{ background: `${meta.color}15`, color: meta.color, padding: '1px 8px', borderRadius: 8, fontSize: '.7rem' }}>{o}</span>)}{(f.options || []).length > 5 && <span style={{ color: 'rgba(255,255,255,.25)', fontSize: '.7rem' }}>+{f.options.length - 5}</span>}</div>}
                  </div>
                );
              })}
            </div>

            {/* RIGHT — properties */}
            <div style={{ borderRight: `1px solid ${C.teal}18`, background: 'rgba(5,3,22,.9)', overflowY: 'auto', padding: 14 }}>
              {!af ? (
                <div style={{ padding: 14 }}>
                  {/* Appearance settings */}
                  <div style={{ fontSize: '.7rem', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12 }}>مظهر النموذج</div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lS}>اللون الرئيسي (Accent)</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: 34, height: 28, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, background: 'none' }} />
                      <input value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ ...iS, flex: 1 }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lS}>لون الخلفية</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 34, height: 28, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, background: 'none' }} />
                      <input value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ ...iS, flex: 1 }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={lS}>خلفية بطاقة النموذج</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="color" value={cardBg} onChange={e => setCardBg(e.target.value)} style={{ width: 34, height: 28, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, background: 'none' }} />
                      <input value={cardBg} onChange={e => setCardBg(e.target.value)} style={{ ...iS, flex: 1 }} />
                    </div>
                  </div>
                  {/* Color presets */}
                  <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>إعدادات مسبقة</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {[
                      { name: 'ليلي', accent: '#4E8D9C', bg: '#080520', card: '#10103a' },
                      { name: 'أخضر', accent: '#10b981', bg: '#022c1a', card: '#053320' },
                      { name: 'بنفسجي', accent: '#8b5cf6', bg: '#0d0520', card: '#1a0f35' },
                      { name: 'برتقالي', accent: '#f97316', bg: '#1a0a00', card: '#2a1200' },
                      { name: 'فاتح', accent: '#3b82f6', bg: '#f0f4ff', card: '#ffffff' },
                    ].map(p => (
                      <button key={p.name} onClick={() => { setAccentColor(p.accent); setBgColor(p.bg); setCardBg(p.card); }}
                        style={{ background: p.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.74rem' }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, color: 'rgba(255,255,255,.2)', textAlign: 'center', fontSize: '.8rem' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🎛️</div>
                    انقر على حقل في الوسط لتعديل خصائصه
                  </div>
                </div>
              ) : (
                <FieldEditor field={af} meta={ftMeta(af.type)} onChange={(k, v) => updateField(af.id, k, v)} onRemove={() => removeField(af.id)} />
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Canvas tiny button ───────────────────────────────────────────────────────
function CanvasBtn({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: danger ? 'rgba(239,68,68,.12)' : 'rgba(255,255,255,.07)', border: 'none', color: danger ? '#ef4444' : '#9ca3af', borderRadius: 5, width: 24, height: 24, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '.77rem', opacity: disabled ? .3 : 1, fontFamily: 'Cairo,sans-serif' }}>
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FIELD EDITOR — right panel
// ════════════════════════════════════════════════════════════════════════════
function FieldEditor({ field, meta, onChange, onRemove }: { field: any; meta: any; onChange: (k: string, v: any) => void; onRemove: () => void }) {
  const isSt: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,.13)', background: 'rgba(255,255,255,.045)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box', fontSize: '.83rem' };
  const lSt: React.CSSProperties = { display: 'block', fontSize: '.73rem', color: 'rgba(255,255,255,.45)', marginBottom: 4, fontWeight: 600 };
  const Sec = (t: string) => <div style={{ fontSize: '.67rem', fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 7, marginTop: 12, paddingBottom: 4, borderBottom: `1px solid ${meta.color}28` }}>{t}</div>;

  // local state for options textarea
  const [optText, setOptText] = useState((field.options || []).join('\n'));
  const applyOptions = () => onChange('options', optText.split('\n').map((s: string) => s.trim()).filter(Boolean));

  if (field.type === 'divider') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid rgba(255,255,255,.08)` }}>
        <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
        <span style={{ fontWeight: 800, color: '#fff', fontSize: '.88rem' }}>فاصل</span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lSt}>تسمية الفاصل (اختياري)</label>
        <input value={field.label || ''} onChange={e => onChange('label', e.target.value)} placeholder="مثال: معلومات إضافية" style={isSt} />
      </div>
      <button onClick={onRemove} style={{ marginTop: 16, width: '100%', background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '8px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }}>🗑 حذف الفاصل</button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${meta.color}25` }}>
        <span style={{ color: meta.color, fontSize: '1.1rem' }}>{meta.icon}</span>
        <span style={{ fontWeight: 800, color: '#fff', fontSize: '.88rem' }}>{meta.label}</span>
      </div>

      {Sec('التسمية والمحتوى')}
      <div style={{ marginBottom: 9 }}>
        <label style={lSt}>
          التسمية (Label) <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          value={field.label || ''}
          onChange={e => onChange('label', e.target.value)}
          placeholder={`مثال: ${meta.label === 'نص قصير' ? 'الاسم الكامل' : meta.label === 'بريد إلكتروني' ? 'عنوان بريدك الإلكتروني' : meta.label === 'رقم هاتف' ? 'رقم الجوال' : 'تسمية الحقل'}`}
          style={{ ...isSt, borderColor: !field.label.trim() ? '#ef4444' : 'rgba(255,255,255,.13)' }}
        />
        {!field.label.trim() && <div style={{ color: '#ef4444', fontSize: '.72rem', marginTop: 4 }}>⚠ التسمية مطلوبة</div>}
      </div>

      {field.type !== 'divider' && field.type !== 'rating' && (
        <div style={{ marginBottom: 9 }}>
          <label style={lSt}>Placeholder (نص توضيحي)</label>
          <input value={field.placeholder || ''} onChange={e => onChange('placeholder', e.target.value)} placeholder="النص الذي يظهر داخل الحقل قبل الإدخال" style={isSt} />
        </div>
      )}

      <div style={{ marginBottom: 9 }}>
        <label style={lSt}>نص مساعد (Help Text)</label>
        <input value={field.helpText || ''} onChange={e => onChange('helpText', e.target.value)} placeholder="توضيح إضافي يظهر أسفل الحقل" style={isSt} />
      </div>

      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (<>
        {Sec('الخيارات')}
        <div style={{ marginBottom: 4 }}>
          <label style={lSt}>الخيارات — كل سطر = خيار</label>
          <textarea
            value={optText}
            onChange={e => setOptText(e.target.value)}
            onBlur={applyOptions}
            rows={5}
            placeholder={'خيار 1\nخيار 2\nخيار 3'}
            style={{ ...isSt, resize: 'vertical' }}
          />
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.28)', marginTop: 3 }}>اضغط خارج الحقل لتطبيق الخيارات</div>
        </div>
        {/* live preview chips */}
        {(field.options || []).length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
            {(field.options || []).map((o: string, i: number) => (
              <span key={i} style={{ background: `${meta.color}15`, color: meta.color, padding: '2px 9px', borderRadius: 8, fontSize: '.72rem' }}>{o}</span>
            ))}
          </div>
        )}
      </>)}

      {Sec('الإعدادات')}
      <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginBottom: 10 }}>
        <input type="checkbox" checked={!!field.required} onChange={e => onChange('required', e.target.checked)} style={{ accentColor: meta.color, width: 15, height: 15 }} />
        <span style={{ color: 'rgba(255,255,255,.65)', fontSize: '.83rem' }}>حقل إلزامي</span>
      </label>

      <div style={{ marginBottom: 9 }}>
        <label style={lSt}>عرض الحقل</label>
        <div style={{ display: 'flex', gap: 7 }}>
          {[{ v: 'full', l: 'عرض كامل' }, { v: 'half', l: 'نصف عرض' }].map(opt => (
            <button key={opt.v} onClick={() => onChange('width', opt.v)}
              style={{ flex: 1, padding: '6px', borderRadius: 7, border: `1px solid ${field.width === opt.v ? meta.color : 'rgba(255,255,255,.13)'}`, background: field.width === opt.v ? `${meta.color}18` : 'transparent', color: field.width === opt.v ? meta.color : 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem' }}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {Sec('')}
      <button onClick={onRemove} style={{ marginTop: 6, width: '100%', background: 'rgba(239,68,68,.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,.18)', borderRadius: 8, padding: '8px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }}>🗑 حذف هذا الحقل</button>
    </div>
  );
}
