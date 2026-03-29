'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A', bg: '#080520', card: '#0d0b2e' };

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

const iS: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.85rem', boxSizing: 'border-box' };
const lS: React.CSSProperties = { display: 'block', fontSize: '.74rem', color: 'rgba(255,255,255,.48)', marginBottom: 4, fontWeight: 600 };

function ftMeta(type: string) {
  return FIELD_TYPES.find(f => f.type === type) || { label: type, icon: '❓', color: '#9ca3af' };
}
function CanvasBtn({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: danger ? 'rgba(239,68,68,.12)' : 'rgba(255,255,255,.07)', border: 'none', color: danger ? '#ef4444' : '#9ca3af', borderRadius: 5, width: 24, height: 24, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '.77rem', opacity: disabled ? .3 : 1, fontFamily: 'Cairo,sans-serif' }}>
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function FormDetailClient() {
  const pathname = usePathname();
  const id = pathname.split('/').pop();
  const router = useRouter();

  const [form, setForm]               = useState<any>(null);
  const [fields, setFields]           = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subTotal, setSubTotal]       = useState(0);
  const [tab, setTab]                 = useState<'editor' | 'submissions' | 'settings'>('editor');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [saved, setSaved]             = useState(false);
  const [copied, setCopied]           = useState(false);

  // Settings
  const [formTitle, setFormTitle]     = useState('');
  const [formDesc, setFormDesc]       = useState('');
  const [successMsg, setSuccessMsg]   = useState('تم إرسال النموذج بنجاح، شكراً لك!');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#4E8D9C');
  const [bgColorForm, setBgColorForm] = useState('#080520');
  const [cardBg, setCardBg]           = useState('#10103a');

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!id || id === 'default') return;
    if (!localStorage.getItem('user')) { router.push('/login'); return; }
    loadForm();
  }, [id]);

  const loadForm = async () => {
    setLoading(true);
    const [fRes, sRes] = await Promise.all([
      fetch(`${API}/api/cloud/forms/${id}`, { headers: h }),
      fetch(`${API}/api/cloud/forms/${id}/submissions?limit=200`, { headers: h }),
    ]);
    const fData = await fRes.json();
    const sData = await sRes.json();
    if (fData.success && fData.data) {
      const d = fData.data;
      setForm(d);
      setFields(d.fields || []);
      setFormTitle(d.title || '');
      setFormDesc(d.description || '');
      const s = d.settings || {};
      setSuccessMsg(s.success_message || 'تم إرسال النموذج بنجاح، شكراً لك!');
      setRedirectUrl(s.redirect_url || '');
      setAccentColor(s.accent_color || '#4E8D9C');
      setBgColorForm(s.bg_color || '#080520');
      setCardBg(s.card_bg || '#10103a');
    }
    if (sData.success) { setSubmissions(sData.data || []); setSubTotal(sData.total || 0); }
    setLoading(false);
  };

  const saveForm = async () => {
    const unlabeled = fields.filter(f => f.type !== 'divider' && !f.label?.trim());
    if (unlabeled.length) return alert(`يرجى إضافة تسمية لجميع الحقول:\n${unlabeled.map((_: any, i: number) => `حقل ${i + 1}`).join(', ')}`);
    setSaving(true);
    await fetch(`${API}/api/cloud/forms/${id}`, {
      method: 'PUT', headers: h,
      body: JSON.stringify({
        title: formTitle, description: formDesc, fields,
        settings: { success_message: successMsg, redirect_url: redirectUrl, accent_color: accentColor, bg_color: bgColorForm, card_bg: cardBg },
      }),
    });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const toggleStatus = async () => {
    const ns = form?.status === 'active' ? 'closed' : 'active';
    await fetch(`${API}/api/cloud/forms/${id}`, { method: 'PUT', headers: h, body: JSON.stringify({ status: ns }) });
    setForm((f: any) => ({ ...f, status: ns }));
  };

  const copyLink = () => {
    const url = `${window.location.origin}/cloud/apps/forms/public/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };

  // Field operations
  const addField = (type: string) => {
    const meta = ftMeta(type);
    const f = { id: Date.now().toString(), type, label: '', placeholder: '', required: false, options: (type === 'select' || type === 'radio' || type === 'checkbox') ? ['خيار 1', 'خيار 2'] : [], helpText: '', width: 'full' };
    setFields(prev => { const next = [...prev, f]; setActiveField(f.id); return next; });
  };
  const updateField = (fid: string, key: string, val: any) => setFields(f => f.map(x => x.id === fid ? { ...x, [key]: val } : x));
  const removeField = (fid: string) => { setFields(f => f.filter(x => x.id !== fid)); setActiveField(null); };
  const moveField = (fid: string, dir: -1 | 1) => {
    setFields(prev => {
      const arr = [...prev]; const i = arr.findIndex(x => x.id === fid); const j = i + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]]; return arr;
    });
  };
  const dupField = (fid: string) => {
    setFields(prev => {
      const i = prev.findIndex(x => x.id === fid);
      const copy = { ...prev[i], id: Date.now().toString() };
      const arr = [...prev]; arr.splice(i + 1, 0, copy);
      setActiveField(copy.id); return arr;
    });
  };

  const af = activeField ? fields.find(f => f.id === activeField) : null;

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', fontFamily: 'Cairo,sans-serif' }}>⏳ جاري التحميل...</div>;
  if (!form) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', fontFamily: 'Cairo,sans-serif' }}>النموذج غير موجود</div>;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo,sans-serif', direction: 'rtl', color: '#e8f4f8' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(8,5,32,.97)', borderBottom: `1px solid ${C.teal}28`, padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, height: 54 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/cloud/apps/forms" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontSize: '.83rem' }}>📋 النماذج ←</Link>
          <span style={{ color: 'rgba(255,255,255,.2)' }}>|</span>
          <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="عنوان النموذج" style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'Cairo,sans-serif', fontWeight: 700, fontSize: '.93rem', width: 220 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggleStatus} style={{ background: form.status === 'active' ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)', color: form.status === 'active' ? '#ef4444' : '#10b981', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '.82rem', fontFamily: 'Cairo,sans-serif' }}>
            {form.status === 'active' ? '🔒 إغلاق' : '🟢 فتح'}
          </button>
          <button onClick={copyLink} style={{ background: copied ? 'rgba(16,185,129,.12)' : 'rgba(99,102,241,.12)', color: copied ? '#10b981' : '#818cf8', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '.82rem', fontFamily: 'Cairo,sans-serif' }}>
            {copied ? '✓ تم النسخ' : '🔗 رابط الاستجابة'}
          </button>
          <button onClick={saveForm} disabled={saving} style={{ background: saved ? 'rgba(16,185,129,.2)' : `linear-gradient(135deg,${C.teal},${C.navy})`, color: saved ? '#10b981' : '#fff', border: 'none', borderRadius: 8, padding: '7px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'Cairo,sans-serif', opacity: saving ? .7 : 1, fontSize: '.85rem' }}>
            {saving ? '⏳...' : saved ? '✓ تم الحفظ' : '💾 حفظ'}
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid rgba(255,255,255,.07)`, padding: '0 20px', display: 'flex', gap: 0 }}>
        {[
          { key: 'editor', label: '✏️ محرر الحقول' },
          { key: 'settings', label: '⚙️ الإعدادات والمظهر' },
          { key: 'submissions', label: `📊 الردود (${subTotal})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{ background: 'none', border: 'none', color: tab === t.key ? C.mint : 'rgba(255,255,255,.45)', padding: '13px 18px', cursor: 'pointer', fontSize: '.86rem', fontWeight: tab === t.key ? 700 : 400, borderBottom: tab === t.key ? `2px solid ${C.teal}` : '2px solid transparent', fontFamily: 'Cairo,sans-serif' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── EDITOR TAB ── */}
      {tab === 'editor' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '190px 1fr 295px', height: 'calc(100vh - 106px)', overflow: 'hidden' }}>

          {/* LEFT — palette */}
          <div style={{ borderLeft: `1px solid ${C.teal}18`, background: 'rgba(5,3,22,.9)', overflowY: 'auto', padding: 12 }}>
            <div style={{ fontSize: '.67rem', fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 10 }}>أنواع الحقول</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {FIELD_TYPES.map(ft => (
                <button key={ft.type} onClick={() => addField(ft.type)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${ft.color}0f`, color: ft.color, border: `1px solid ${ft.color}22`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem', textAlign: 'right' }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${ft.color}22`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${ft.color}0f`)}
                >
                  <span>{ft.icon}</span><span>{ft.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CENTER — canvas */}
          <div style={{ background: 'rgba(255,255,255,.01)', overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,.18)', gap: 10, paddingTop: 80 }}>
                <div style={{ fontSize: '2.8rem' }}>📋</div>
                <p style={{ textAlign: 'center', lineHeight: 1.7 }}>اختر نوع حقل من القائمة اليمنى<br />لإضافته للنموذج</p>
              </div>
            ) : fields.map((f, i) => {
              const meta = ftMeta(f.type);
              const isActive = activeField === f.id;
              if (f.type === 'divider') return (
                <div key={f.id} onClick={() => setActiveField(f.id)} style={{ border: `2px solid ${isActive ? '#6b7280' : 'rgba(255,255,255,.06)'}`, borderRadius: 10, padding: '9px 12px', background: isActive ? 'rgba(107,114,128,.08)' : 'rgba(255,255,255,.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.14)' }} />
                  <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{f.label || 'فاصل'}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.14)' }} />
                  <div style={{ display: 'flex', gap: 3 }}>
                    <CanvasBtn onClick={e => { e.stopPropagation(); moveField(f.id, -1); }} disabled={i === 0}>↑</CanvasBtn>
                    <CanvasBtn onClick={e => { e.stopPropagation(); moveField(f.id, 1); }} disabled={i === fields.length - 1}>↓</CanvasBtn>
                    <CanvasBtn onClick={e => { e.stopPropagation(); removeField(f.id); }} danger>✕</CanvasBtn>
                  </div>
                </div>
              );
              return (
                <div key={f.id} onClick={() => setActiveField(f.id)} style={{ border: `2px solid ${isActive ? meta.color : 'rgba(255,255,255,.07)'}`, borderRadius: 11, padding: '10px 13px', background: isActive ? `${meta.color}0c` : 'rgba(255,255,255,.025)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span style={{ color: meta.color, fontSize: '.73rem', fontWeight: 700, flexShrink: 0 }}>{meta.label}</span>
                      {f.label ? (
                        <span style={{ color: '#e2e8f0', fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>— {f.label}</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '.73rem', fontStyle: 'italic', flexShrink: 0 }}>⚠ بدون تسمية</span>
                      )}
                      {f.required && <span style={{ color: '#ef4444', fontSize: '.72rem', flexShrink: 0 }}>*</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      <CanvasBtn onClick={e => { e.stopPropagation(); moveField(f.id, -1); }} disabled={i === 0}>↑</CanvasBtn>
                      <CanvasBtn onClick={e => { e.stopPropagation(); moveField(f.id, 1); }} disabled={i === fields.length - 1}>↓</CanvasBtn>
                      <CanvasBtn onClick={e => { e.stopPropagation(); dupField(f.id); }}>⧉</CanvasBtn>
                      <CanvasBtn onClick={e => { e.stopPropagation(); removeField(f.id); }} danger>✕</CanvasBtn>
                    </div>
                  </div>
                  {f.placeholder && <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.25)', marginTop: 3 }}>placeholder: {f.placeholder}</div>}
                  {(f.options || []).length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                      {(f.options || []).slice(0, 5).map((o: string, oi: number) => (
                        <span key={oi} style={{ background: `${meta.color}15`, color: meta.color, padding: '1px 7px', borderRadius: 7, fontSize: '.69rem' }}>{o}</span>
                      ))}
                      {(f.options || []).length > 5 && <span style={{ color: 'rgba(255,255,255,.22)', fontSize: '.69rem' }}>+{(f.options || []).length - 5}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT — field properties */}
          <div style={{ borderRight: `1px solid ${C.teal}18`, background: 'rgba(5,3,22,.9)', overflowY: 'auto', padding: 14 }}>
            {!af ? (
              <div style={{ color: 'rgba(255,255,255,.2)', textAlign: 'center', paddingTop: 60, fontSize: '.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎛️</div>
                انقر على حقل في الوسط<br />لتعديل خصائصه
              </div>
            ) : (
              <FieldEditor field={af} meta={ftMeta(af.type)} onChange={(k, v) => updateField(af.id, k, v)} onRemove={() => removeField(af.id)} />
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 20px' }}>
          <SectionCard title="⚙️ إعدادات النموذج">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lS}>عنوان النموذج *</label>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} style={iS} />
              </div>
              <div>
                <label style={lS}>وصف النموذج</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)} style={iS} />
              </div>
              <div>
                <label style={lS}>رسالة النجاح بعد الإرسال</label>
                <input value={successMsg} onChange={e => setSuccessMsg(e.target.value)} style={iS} />
              </div>
              <div>
                <label style={lS}>رابط إعادة التوجيه (اختياري)</label>
                <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://..." style={iS} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="🎨 مظهر وألوان النموذج">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { label: 'اللون الرئيسي (Accent)', val: accentColor, set: setAccentColor },
                { label: 'لون الخلفية', val: bgColorForm, set: setBgColorForm },
                { label: 'خلفية بطاقة النموذج', val: cardBg, set: setCardBg },
              ].map((c, idx) => (
                <div key={idx}>
                  <label style={lS}>{c.label}</label>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                    <input type="color" value={c.val} onChange={e => c.set(e.target.value)} style={{ width: 34, height: 28, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, background: 'none' }} />
                    <input value={c.val} onChange={e => c.set(e.target.value)} style={{ ...iS, flex: 1 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={lS}>نسق مسبق</label>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {[
                  { name: 'ليلي', accent: '#4E8D9C', bg: '#080520', card: '#10103a' },
                  { name: 'أخضر', accent: '#10b981', bg: '#022c1a', card: '#053320' },
                  { name: 'بنفسجي', accent: '#8b5cf6', bg: '#0d0520', card: '#1a0f35' },
                  { name: 'برتقالي', accent: '#f97316', bg: '#1a0a00', card: '#2a1200' },
                  { name: 'فاتح', accent: '#3b82f6', bg: '#f0f4ff', card: '#ffffff' },
                ].map(p => (
                  <button key={p.name} onClick={() => { setAccentColor(p.accent); setBgColorForm(p.bg); setCardBg(p.card); }}
                    style={{ background: p.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.8rem' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <button onClick={saveForm} disabled={saving} style={{ width: '100%', padding: '13px', borderRadius: 12, background: `linear-gradient(135deg,${C.teal},${C.navy})`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Cairo,sans-serif', opacity: saving ? .7 : 1 }}>
            {saving ? '⏳ جاري الحفظ...' : saved ? '✓ تم الحفظ بنجاح' : '💾 حفظ الإعدادات'}
          </button>
        </div>
      )}

      {/* ── SUBMISSIONS TAB ── */}
      {tab === 'submissions' && (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px' }}>
          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', border: '2px dashed rgba(255,255,255,.08)', borderRadius: 18, color: 'rgba(255,255,255,.3)' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>📭</div>
              <div>لا توجد ردود بعد</div>
            </div>
          ) : (
            <>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', marginBottom: 16 }}>{subTotal} رد إجمالاً</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {submissions.map((s: any) => (
                  <div key={s.id} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${C.teal}18`, borderRadius: 14, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${C.teal},${C.navy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.9rem' }}>
                          {s.submitter_name?.charAt(0) || '#'}
                        </div>
                        <div>
                          {s.submitter_name && <div style={{ color: '#fff', fontWeight: 600, fontSize: '.9rem' }}>{s.submitter_name}</div>}
                          {s.submitter_email && <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.78rem' }}>{s.submitter_email}</div>}
                          {!s.submitter_name && !s.submitter_email && <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '.82rem' }}>مجهول</div>}
                        </div>
                      </div>
                      <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.77rem' }}>{new Date(s.created_at).toLocaleString('ar-EG')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
                      {Object.entries(s.data || {}).map(([key, val]: any) => {
                        const fd = fields.find((f: any) => f.id === key);
                        const meta = fd ? ftMeta(fd.type) : null;
                        return (
                          <div key={key} style={{ background: 'rgba(255,255,255,.035)', borderRadius: 9, padding: '9px 12px', border: `1px solid ${meta?.color || C.teal}15` }}>
                            <div style={{ color: meta?.color || 'rgba(255,255,255,.4)', fontSize: '.72rem', marginBottom: 3, fontWeight: 600 }}>
                              {meta?.icon} {fd?.label || key}
                            </div>
                            <div style={{ color: '#e2e8f0', fontSize: '.85rem', wordBreak: 'break-word' }}>
                              {Array.isArray(val) ? val.join('، ') : String(val)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid rgba(78,141,156,.2)`, borderRadius: 16, padding: '20px 22px', marginBottom: 18 }}>
      <div style={{ fontWeight: 700, color: '#fff', marginBottom: 16, fontSize: '.92rem' }}>{title}</div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FIELD EDITOR — right panel
// ════════════════════════════════════════════════════════════════════════════
function FieldEditor({ field, meta, onChange, onRemove }: { field: any; meta: any; onChange: (k: string, v: any) => void; onRemove: () => void }) {
  const isSt: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,.13)', background: 'rgba(255,255,255,.045)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box', fontSize: '.83rem' };
  const lSt: React.CSSProperties = { display: 'block', fontSize: '.73rem', color: 'rgba(255,255,255,.45)', marginBottom: 4, fontWeight: 600 };
  const Sec = (t: string) => <div style={{ fontSize: '.67rem', fontWeight: 800, color: meta.color, textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 7, marginTop: 12, paddingBottom: 4, borderBottom: `1px solid ${meta.color}28` }}>{t}</div>;

  const [optText, setOptText] = useState((field.options || []).join('\n'));
  useEffect(() => { setOptText((field.options || []).join('\n')); }, [field.id]);
  const applyOpts = () => onChange('options', optText.split('\n').map((s: string) => s.trim()).filter(Boolean));

  if (field.type === 'divider') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: 'solid 1px rgba(255,255,255,.08)' }}>
        <span style={{ fontSize: '1.1rem' }}>➖</span>
        <span style={{ fontWeight: 800, color: '#fff', fontSize: '.88rem' }}>فاصل قسم</span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lSt}>تسمية الفاصل (اختياري)</label>
        <input value={field.label || ''} onChange={e => onChange('label', e.target.value)} placeholder="مثال: معلومات الاتصال" style={isSt} />
      </div>
      <button onClick={onRemove} style={{ marginTop: 14, width: '100%', background: 'rgba(239,68,68,.09)', color: '#ef4444', border: '1px solid rgba(239,68,68,.18)', borderRadius: 8, padding: '8px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }}>🗑 حذف</button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${meta.color}25` }}>
        <span style={{ color: meta.color, fontSize: '1.1rem' }}>{meta.icon}</span>
        <span style={{ fontWeight: 800, color: '#fff', fontSize: '.88rem' }}>{meta.label}</span>
      </div>

      {Sec('التسمية والمحتوى')}

      <div style={{ marginBottom: 9 }}>
        <label style={{ ...lSt, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>التسمية (Label)</span>
          <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          value={field.label || ''}
          onChange={e => onChange('label', e.target.value)}
          placeholder="مثال: الاسم الكامل / رقم الجوال / البريد الإلكتروني..."
          style={{ ...isSt, borderColor: !field.label?.trim() ? '#ef4444' : 'rgba(255,255,255,.13)', transition: 'border-color .2s' }}
        />
        {!field.label?.trim() && (
          <div style={{ color: '#ef4444', fontSize: '.71rem', marginTop: 3 }}>⚠ التسمية مطلوبة — يراها المستجيب</div>
        )}
      </div>

      {field.type !== 'rating' && (
        <div style={{ marginBottom: 9 }}>
          <label style={lSt}>Placeholder (نص داخل الحقل)</label>
          <input value={field.placeholder || ''} onChange={e => onChange('placeholder', e.target.value)} placeholder="مثال: أدخل اسمك الكامل هنا..." style={isSt} />
        </div>
      )}

      <div style={{ marginBottom: 9 }}>
        <label style={lSt}>نص مساعد (يظهر أسفل الحقل)</label>
        <input value={field.helpText || ''} onChange={e => onChange('helpText', e.target.value)} placeholder="توضيح إضافي للمستجيب" style={isSt} />
      </div>

      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (<>
        {Sec('الخيارات')}
        <div style={{ marginBottom: 4 }}>
          <label style={lSt}>الخيارات — كل سطر = خيار واحد</label>
          <textarea
            value={optText}
            onChange={e => setOptText(e.target.value)}
            onBlur={applyOpts}
            rows={6}
            placeholder={'خيار 1\nخيار 2\nخيار 3\nأضف المزيد...'}
            style={{ ...isSt, resize: 'vertical' }}
          />
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.25)', marginTop: 3 }}>اضغط خارج الحقل لتطبيق الخيارات</div>
        </div>
        {(field.options || []).length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6, marginBottom: 4 }}>
            {(field.options || []).map((o: string, i: number) => (
              <span key={i} style={{ background: `${meta.color}15`, color: meta.color, padding: '2px 9px', borderRadius: 8, fontSize: '.71rem' }}>{o}</span>
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
        <label style={lSt}>عرض الحقل في الصف</label>
        <div style={{ display: 'flex', gap: 7 }}>
          {[{ v: 'full', l: 'عرض كامل' }, { v: 'half', l: 'نصف العرض' }].map(opt => (
            <button key={opt.v} onClick={() => onChange('width', opt.v)}
              style={{ flex: 1, padding: '6px', borderRadius: 7, border: `1px solid ${(field.width || 'full') === opt.v ? meta.color : 'rgba(255,255,255,.12)'}`, background: (field.width || 'full') === opt.v ? `${meta.color}18` : 'transparent', color: (field.width || 'full') === opt.v ? meta.color : 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem' }}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '12px 0' }} />
      <button onClick={onRemove} style={{ width: '100%', background: 'rgba(239,68,68,.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,.16)', borderRadius: 8, padding: '8px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }}>🗑 حذف هذا الحقل</button>
    </div>
  );
}
