'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A', bg: '#080520', card: '#10103a' };
const PUBLIC_BASE = 'https://hadmaj.com';

// ─── Block type registry ─────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { id: 'hero',         label: 'بطل / Hero',         icon: '🌟', color: '#6366f1' },
  { id: 'text',         label: 'نص / Text',           icon: '📝', color: '#3b82f6' },
  { id: 'cta',          label: 'زر CTA',              icon: '🎯', color: '#10b981' },
  { id: 'features',     label: 'مميزات / Features',   icon: '✨', color: '#ec4899' },
  { id: 'image',        label: 'صورة / Image',        icon: '🖼️', color: '#f59e0b' },
  { id: 'video',        label: 'فيديو / Video',       icon: '🎬', color: '#ef4444' },
  { id: 'gallery',      label: 'معرض / Gallery',      icon: '🗃️', color: '#8b5cf6' },
  { id: 'stats',        label: 'إحصائيات',            icon: '📊', color: '#06b6d4' },
  { id: 'testimonials', label: 'آراء العملاء',        icon: '💬', color: '#f97316' },
  { id: 'faq',          label: 'أسئلة شائعة',         icon: '❓', color: '#84cc16' },
  { id: 'form',         label: 'نموذج تواصل',        icon: '📋', color: '#a855f7' },
  { id: 'divider',      label: 'فاصل',               icon: '➖', color: '#6b7280' },
  { id: 'spacer',       label: 'مسافة',              icon: '↕️', color: '#9ca3af' },
  { id: 'html',         label: 'HTML مخصص',          icon: '💻', color: '#14b8a6' },
] as const;

type BlockTypeId = typeof BLOCK_TYPES[number]['id'];

const FORM_FIELD_TYPES = [
  { id: 'text',     label: 'نص قصير' },
  { id: 'textarea', label: 'نص طويل' },
  { id: 'email',    label: 'بريد إلكتروني' },
  { id: 'tel',      label: 'رقم هاتف' },
  { id: 'number',   label: 'رقم' },
  { id: 'select',   label: 'قائمة اختيار' },
  { id: 'checkbox', label: 'مربع اختيار' },
  { id: 'radio',    label: 'اختيار واحد' },
  { id: 'date',     label: 'تاريخ' },
  { id: 'file',     label: 'رفع ملف' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'مسودة',   color: '#9ca3af' },
  published: { label: 'منشور',   color: '#10b981' },
  archived:  { label: 'مؤرشف',  color: '#6b7280' },
};

// ─── Blank block defaults ────────────────────────────────────────────────────
function blankBlock(type: BlockTypeId): any {
  const base: any = { type };
  switch (type) {
    case 'hero':     return { ...base, title: 'عنوانك الرئيسي', subtitle: 'وصف قصير وجذاب لخدمتك', buttonLabel: 'ابدأ الآن', buttonUrl: '#', bgGradient: 'linear-gradient(135deg,#080520 0%,#0f0a3a 50%,#4E8D9C22 100%)', minHeight: 60, align: 'center' };
    case 'text':     return { ...base, title: '', text: 'نص الفقرة هنا...', align: 'center', fontSize: 17 };
    case 'cta':      return { ...base, title: 'جاهز للانطلاق؟', subtitle: '', buttonLabel: 'سجل الآن', buttonUrl: '#', buttonColor: '#4E8D9C', btnStyle: 'filled', bgColor: '#1a1a4a' };
    case 'features': return { ...base, title: 'لماذا نحن؟', columns: 3, items: [{ icon: '⚡', title: 'سريع', text: 'أداء لا مثيل له' }, { icon: '🔒', title: 'آمن', text: 'حماية كاملة لبياناتك' }, { icon: '🎨', title: 'جميل', text: 'تصميم عصري احترافي' }] };
    case 'image':    return { ...base, imageUrl: '', title: '', imageHeight: 400, objectFit: 'cover', borderRadius: 0 };
    case 'video':    return { ...base, videoUrl: '', title: '', autoplay: false };
    case 'gallery':  return { ...base, title: 'معرض الصور', columns: 3, galleryItems: [{ imageUrl: '', caption: '' }] };
    case 'stats':    return { ...base, title: 'أرقامنا', items: [{ value: '1000+', label: 'عميل سعيد', icon: '🏆' }, { value: '99%', label: 'رضا العملاء', icon: '⭐' }, { value: '24/7', label: 'دعم فني', icon: '💬' }] };
    case 'testimonials': return { ...base, title: 'ماذا يقول عملاؤنا', items: [{ name: 'أحمد محمد', role: 'مدير تنفيذي', text: 'خدمة رائعة وتجربة استثنائية', avatar: '' }] };
    case 'faq':      return { ...base, title: 'الأسئلة الشائعة', items: [{ question: 'كيف أبدأ؟', answer: 'ببساطة سجل حسابك وابدأ مجاناً' }] };
    case 'form':     return { ...base, title: 'تواصل معنا', submitLabel: 'إرسال', successMsg: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', bgColor: 'transparent', formFields: [{ id: 'f1', type: 'text', label: 'الاسم الكامل', placeholder: 'أدخل اسمك', required: true }, { id: 'f2', type: 'email', label: 'البريد الإلكتروني', placeholder: 'example@domain.com', required: true }, { id: 'f3', type: 'textarea', label: 'الرسالة', placeholder: 'اكتب رسالتك هنا...', required: false }] };
    case 'divider':  return { ...base, style: 'line', color: 'rgba(78,141,156,0.3)' };
    case 'spacer':   return { ...base, height: 60 };
    case 'html':     return { ...base, rawHtml: '<div style="text-align:center;padding:40px;color:#fff">HTML مخصص</div>' };
    default:         return base;
  }
}

// ─── Shared input styles ──────────────────────────────────────────────────────
const iS: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box', fontSize: '.85rem' };
const lS: React.CSSProperties = { display: 'block', fontSize: '.75rem', color: 'rgba(255,255,255,.5)', marginBottom: 4, fontWeight: 600 };

function Btn2({ children, onClick, disabled, danger, title: ttl }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; disabled?: boolean; danger?: boolean; title?: string }) {
  return (
    <button title={ttl} onClick={onClick} disabled={disabled} style={{ background: danger ? 'rgba(239,68,68,.12)' : 'rgba(255,255,255,.07)', border: 'none', color: danger ? '#ef4444' : '#9ca3af', borderRadius: 5, width: 26, height: 26, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '.8rem', opacity: disabled ? .3 : 1, fontFamily: 'Cairo,sans-serif' }}>
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function LandingClient() {
  const router = useRouter();
  const [pages, setPages]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm]       = useState<any>({ title: '', meta_title: '', meta_description: '', status: 'draft' });
  const [blocks, setBlocks]   = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [saving, setSaving]   = useState(false);
  const [copied, setCopied]   = useState<number | null>(null);
  const [preview, setPreview] = useState(false);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const h = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!localStorage.getItem('user')) { router.push('/login'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/cloud/landing-pages`, { headers: h });
      const d = await res.json();
      if (d.success) setPages(d.data || []);
      else if (res.status === 401) router.push('/login');
    } catch {}
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm({ title: '', meta_title: '', meta_description: '', status: 'draft' }); setBlocks([]); setActiveIdx(null); setPreview(false); setOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ title: p.title || '', meta_title: p.meta_title || '', meta_description: p.meta_description || '', status: p.status || 'draft' });
    const b = Array.isArray(p.content) ? p.content : (() => { try { return JSON.parse(p.content || '[]'); } catch { return []; } })();
    setBlocks(b); setActiveIdx(null); setPreview(false); setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return alert('عنوان الصفحة مطلوب');
    setSaving(true);
    const body = { ...form, content: JSON.stringify(blocks) };
    const url = editing ? `${API}/api/cloud/landing-pages/${editing.id}` : `${API}/api/cloud/landing-pages`;
    await fetch(url, { method: editing ? 'PUT' : 'POST', headers: h, body: JSON.stringify(body) });
    setSaving(false); setOpen(false); load();
  };

  const remove = async (id: number, title: string) => {
    if (!confirm(`حذف الصفحة "${title}"؟`)) return;
    await fetch(`${API}/api/cloud/landing-pages/${id}`, { method: 'DELETE', headers: h });
    load();
  };

  const togglePublish = async (p: any) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published';
    await fetch(`${API}/api/cloud/landing-pages/${p.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ status: newStatus }) });
    load();
  };

  const copyLink = (p: any) => {
    navigator.clipboard?.writeText(`${PUBLIC_BASE}/landing/${p.slug}`);
    setCopied(p.id); setTimeout(() => setCopied(null), 2000);
  };

  // block CRUD
  const addBlock = (type: BlockTypeId) => { const nb = blankBlock(type); setBlocks(b => { const next = [...b, nb]; setActiveIdx(next.length - 1); return next; }); };
  const updateBlock = (i: number, patch: any) => setBlocks(b => b.map((bl, idx) => idx === i ? { ...bl, ...patch } : bl));
  const removeBlock = (i: number) => { setBlocks(b => b.filter((_, idx) => idx !== i)); setActiveIdx(null); };
  const duplicateBlock = (i: number) => { setBlocks(b => { const arr = [...b]; arr.splice(i + 1, 0, { ...b[i] }); setActiveIdx(i + 1); return arr; }); };
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    setBlocks(b => { const arr = [...b]; [arr[i], arr[j]] = [arr[j], arr[i]]; return arr; });
    setActiveIdx(j);
  };

  // items inside blocks
  const addItem = (bi: number, key: string, blank: any) => updateBlock(bi, { [key]: [...(blocks[bi][key] || []), blank] });
  const updateItem = (bi: number, key: string, ii: number, patch: any) => updateBlock(bi, { [key]: blocks[bi][key].map((it: any, idx: number) => idx === ii ? { ...it, ...patch } : it) });
  const removeItem = (bi: number, key: string, ii: number) => updateBlock(bi, { [key]: blocks[bi][key].filter((_: any, idx: number) => idx !== ii) });
  const moveItem = (bi: number, key: string, ii: number, dir: -1 | 1) => {
    const j = ii + dir;
    const arr = [...blocks[bi][key]];
    if (j < 0 || j >= arr.length) return;
    [arr[ii], arr[j]] = [arr[j], arr[ii]];
    updateBlock(bi, { [key]: arr });
  };

  const activeBlock = activeIdx !== null ? blocks[activeIdx] : null;
  const activeBT = activeBlock ? BLOCK_TYPES.find(t => t.id === activeBlock.type) : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo,sans-serif', direction: 'rtl', color: '#e8f4f8' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(8,5,32,.95)', borderBottom: `1px solid ${C.teal}33`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/cloud" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontSize: '.85rem' }}>السحابة ←</Link>
          <span style={{ color: 'rgba(255,255,255,.2)' }}>|</span>
          <span style={{ fontWeight: 700, color: C.mint, fontSize: '.95rem' }}>🖥️ صفحات الهبوط</span>
        </div>
        <Link href="/" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontSize: '.82rem' }}>✦ الرئيسية</Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, background: `linear-gradient(130deg,${C.mint},${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>صفحات الهبوط</h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.45)', fontSize: '.9rem' }}>صمّم صفحات هبوط احترافية — السحب والإعداد الكامل</p>
          </div>
          <button onClick={openAdd} style={{ background: `linear-gradient(135deg,${C.teal},${C.navy})`, color: '#fff', border: 'none', borderRadius: 24, padding: '11px 24px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700, fontSize: '.93rem', boxShadow: `0 4px 20px ${C.teal}50` }}>
            + صفحة جديدة
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
          {Object.entries(STATUS_LABELS).map(([key, s]) => (
            <div key={key} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '14px 18px', border: `1px solid ${s.color}30` }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, marginBottom: 4 }}>{pages.filter(p => p.status === key).length}</div>
              <div style={{ fontSize: '.77rem', color: 'rgba(255,255,255,.45)' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.teal}30` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: C.teal, marginBottom: 4 }}>{pages.reduce((s, p) => s + (p.views || 0), 0)}</div>
            <div style={{ fontSize: '.77rem', color: 'rgba(255,255,255,.45)' }}>المشاهدات</div>
          </div>
        </div>

        {/* Pages grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>⏳ جاري التحميل...</div>
        ) : pages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,.3)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🖥️</div>
            <p>لا توجد صفحات هبوط بعد</p>
            <button onClick={openAdd} style={{ marginTop: 16, background: `${C.teal}18`, color: C.teal, border: `1px solid ${C.teal}35`, borderRadius: 20, padding: '9px 22px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>أنشئ أول صفحة</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {pages.map(p => {
              const ba = Array.isArray(p.content) ? p.content : (() => { try { return JSON.parse(p.content || '[]'); } catch { return []; } })();
              const s = STATUS_LABELS[p.status] || STATUS_LABELS.draft;
              return (
                <div key={p.id} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${C.teal}22`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{p.title}</div>
                      <span style={{ background: `${s.color}20`, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: '.74rem' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: '1.8rem' }}>🖥️</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {ba.slice(0, 6).map((block: any, i: number) => {
                      const bt = BLOCK_TYPES.find(t => t.id === block.type);
                      return bt ? <span key={i} style={{ background: `${bt.color}15`, color: bt.color, padding: '2px 8px', borderRadius: 8, fontSize: '.7rem' }}>{bt.icon} {bt.label}</span> : null;
                    })}
                    {ba.length > 6 && <span style={{ color: 'rgba(255,255,255,.25)', fontSize: '.7rem' }}>+{ba.length - 6}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,.3)', fontSize: '.77rem' }}>
                    <span>👁 {p.views || 0}</span><span>{ba.length} بلوك</span>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    <button onClick={() => openEdit(p)} style={{ flex: 1, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: 10, padding: '7px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }}>✏️ تعديل</button>
                    <button onClick={() => togglePublish(p)} style={{ background: p.status === 'published' ? 'rgba(156,163,175,.1)' : 'rgba(16,185,129,.1)', color: p.status === 'published' ? '#9ca3af' : '#10b981', border: `1px solid ${p.status === 'published' ? 'rgba(156,163,175,.3)' : 'rgba(16,185,129,.3)'}`, borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem' }}>
                      {p.status === 'published' ? '⏸' : '▶'}
                    </button>
                    {p.status === 'published' && (
                      <button onClick={() => copyLink(p)} style={{ background: copied === p.id ? 'rgba(16,185,129,.1)' : `${C.green}15`, color: copied === p.id ? '#10b981' : C.green, border: `1px solid ${copied === p.id ? 'rgba(16,185,129,.3)' : `${C.green}30`}`, borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem' }}>
                        {copied === p.id ? '✓' : '🔗'}
                      </button>
                    )}
                    <button onClick={() => remove(p.id, p.title)} style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ FULL-SCREEN EDITOR MODAL ══════════ */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: C.bg }}>
          {/* top bar */}
          <div style={{ height: 54, background: 'rgba(8,5,32,.98)', borderBottom: `1px solid ${C.teal}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,.07)', border: 'none', color: '#9ca3af', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }}>← رجوع</button>
              <span style={{ color: C.mint, fontWeight: 700 }}>{editing ? 'تعديل: ' : 'جديد: '}<span style={{ color: '#fff' }}>{form.title || '...'}</span></span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPreview(p => !p)} style={{ background: preview ? `${C.teal}20` : 'rgba(255,255,255,.07)', border: `1px solid ${preview ? C.teal : 'transparent'}`, color: preview ? C.teal : '#9ca3af', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }}>
                {preview ? '✏️ تحرير' : '👁 معاينة'}
              </button>
              <button onClick={save} disabled={saving} style={{ background: `linear-gradient(135deg,${C.teal},${C.navy})`, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700, opacity: saving ? .7 : 1 }}>
                {saving ? '⏳...' : '💾 حفظ'}
              </button>
            </div>
          </div>

          {preview ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <PagePreview blocks={blocks} title={form.title} />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr 310px', overflow: 'hidden' }}>

              {/* LEFT — settings + palette */}
              <div style={{ borderLeft: `1px solid ${C.teal}20`, background: 'rgba(5,3,22,.9)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: 12, borderBottom: `1px solid ${C.teal}18` }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 800, color: C.teal, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>إعدادات الصفحة</div>
                  {(['title','meta_title'] as const).map(k => (
                    <div key={k} style={{ marginBottom: 9 }}>
                      <label style={lS}>{k === 'title' ? 'العنوان *' : 'عنوان SEO'}</label>
                      <input value={form[k] || ''} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))} style={iS} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 9 }}>
                    <label style={lS}>وصف SEO</label>
                    <textarea value={form.meta_description || ''} onChange={e => setForm((f: any) => ({ ...f, meta_description: e.target.value }))} rows={2} style={{ ...iS, resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <label style={lS}>الحالة</label>
                    <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))} style={{ ...iS, background: C.card }}>
                      {Object.entries(STATUS_LABELS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ padding: 12, flex: 1, overflowY: 'auto' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 800, color: C.teal, marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.08em' }}>إضافة عنصر</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {BLOCK_TYPES.map(bt => (
                      <button key={bt.id} onClick={() => addBlock(bt.id as BlockTypeId)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${bt.color}10`, color: bt.color, border: `1px solid ${bt.color}22`, borderRadius: 7, padding: '6px 9px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem', textAlign: 'right', transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${bt.color}22`)}
                        onMouseLeave={e => (e.currentTarget.style.background = `${bt.color}10`)}
                      >
                        <span>{bt.icon}</span><span>{bt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CENTER — canvas */}
              <div style={{ background: 'rgba(255,255,255,.015)', overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {blocks.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,.18)', gap: 12, paddingTop: 80 }}>
                    <div style={{ fontSize: '3rem' }}>📋</div>
                    <p>اختر عنصراً من القائمة اليمنى لإضافته للصفحة</p>
                  </div>
                ) : blocks.map((block, i) => {
                  const bt = BLOCK_TYPES.find(t => t.id === block.type);
                  const isActive = activeIdx === i;
                  return (
                    <div key={i} onClick={() => setActiveIdx(i)} style={{ border: `2px solid ${isActive ? bt?.color || C.teal : 'rgba(255,255,255,.07)'}`, borderRadius: 11, padding: '10px 12px', background: isActive ? `${bt?.color || C.teal}0c` : 'rgba(255,255,255,.025)', cursor: 'pointer', transition: 'all .15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: bt?.color || C.teal }}>{bt?.icon}</span>
                          <span style={{ color: bt?.color || C.teal, fontSize: '.8rem', fontWeight: 700 }}>{bt?.label}</span>
                          {block.title && <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.75rem' }}>— {String(block.title).substring(0, 24)}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <Btn2 onClick={e => { e.stopPropagation(); moveBlock(i, -1); }} disabled={i === 0} title="لأعلى">↑</Btn2>
                          <Btn2 onClick={e => { e.stopPropagation(); moveBlock(i, 1); }} disabled={i === blocks.length - 1} title="لأسفل">↓</Btn2>
                          <Btn2 onClick={e => { e.stopPropagation(); duplicateBlock(i); }} title="نسخ">⧉</Btn2>
                          <Btn2 onClick={e => { e.stopPropagation(); removeBlock(i); }} danger title="حذف">✕</Btn2>
                        </div>
                      </div>
                      <BlockMiniPreview block={block} />
                    </div>
                  );
                })}
              </div>

              {/* RIGHT — properties panel */}
              <div style={{ borderRight: `1px solid ${C.teal}20`, background: 'rgba(5,3,22,.9)', overflowY: 'auto', padding: 14 }}>
                {activeBlock === null ? (
                  <div style={{ color: 'rgba(255,255,255,.2)', textAlign: 'center', paddingTop: 60, fontSize: '.88rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎛️</div>
                    انقر على عنصر لتعديل خصائصه
                  </div>
                ) : (
                  <BlockEditor
                    block={activeBlock}
                    blockIdx={activeIdx!}
                    bt={activeBT}
                    onChange={(patch: any) => updateBlock(activeIdx!, patch)}
                    addItem={addItem} updateItem={updateItem} removeItem={removeItem} moveItem={moveItem}
                    blocks={blocks}
                  />
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mini preview chips in canvas ────────────────────────────────────────────
function BlockMiniPreview({ block }: { block: any }) {
  if (['text', 'hero'].includes(block.type)) return <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', marginTop: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{block.text || block.subtitle || ''}</div>;
  if (block.type === 'cta') return <div style={{ fontSize: '.75rem', color: '#10b981', marginTop: 4 }}>زر: {block.buttonLabel}</div>;
  if (['features', 'stats', 'testimonials', 'faq', 'gallery'].includes(block.type)) {
    const items = block.items || block.galleryItems || [];
    return <div style={{ fontSize: '.73rem', color: 'rgba(255,255,255,.25)', marginTop: 4 }}>{items.length} عنصر</div>;
  }
  if (block.type === 'form') return <div style={{ fontSize: '.73rem', color: '#a855f7', marginTop: 4 }}>{(block.formFields || []).length} حقل</div>;
  if (block.type === 'spacer') return <div style={{ fontSize: '.73rem', color: 'rgba(255,255,255,.25)', marginTop: 4 }}>↕ {block.height}px</div>;
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// BLOCK EDITOR — right panel
// ════════════════════════════════════════════════════════════════════════════
function BlockEditor({ block, blockIdx, bt, onChange, addItem, updateItem, removeItem, moveItem, blocks }: any) {
  const isSt: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,.13)', background: 'rgba(255,255,255,.045)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box', fontSize: '.83rem' };
  const lSt: React.CSSProperties = { display: 'block', fontSize: '.73rem', color: 'rgba(255,255,255,.48)', marginBottom: 4, fontWeight: 600 };
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => <div style={{ marginBottom: 9 }}><label style={lSt}>{label}</label>{children}</div>;
  const Inp = ({ label, k, placeholder, type: t = 'text' }: { label: string; k: string; placeholder?: string; type?: string }) => (
    <Row label={label}><input type={t} value={block[k] ?? ''} onChange={e => onChange({ [k]: e.target.value })} placeholder={placeholder} style={isSt} /></Row>
  );
  const Txta = ({ label, k, placeholder, rows = 3 }: { label: string; k: string; placeholder?: string; rows?: number }) => (
    <Row label={label}><textarea value={block[k] ?? ''} onChange={e => onChange({ [k]: e.target.value })} placeholder={placeholder} rows={rows} style={{ ...isSt, resize: 'vertical' }} /></Row>
  );
  const ColPicker = ({ label, k }: { label: string; k: string }) => (
    <Row label={label}>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <input type="color" value={block[k] || '#4E8D9C'} onChange={e => onChange({ [k]: e.target.value })} style={{ width: 34, height: 28, border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, background: 'none' }} />
        <input value={block[k] || ''} onChange={e => onChange({ [k]: e.target.value })} placeholder="#hex / rgba" style={{ ...isSt, flex: 1 }} />
      </div>
    </Row>
  );
  const Sel = ({ label, k, opts }: { label: string; k: string; opts: { v: string | number; l: string }[] }) => (
    <Row label={label}>
      <select value={block[k] ?? opts[0]?.v} onChange={e => onChange({ [k]: e.target.value })} style={{ ...isSt, background: C.card }}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </Row>
  );
  const Sec = (t: string) => <div style={{ fontSize: '.68rem', fontWeight: 800, color: bt?.color || '#4E8D9C', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, marginTop: 13, paddingBottom: 4, borderBottom: `1px solid ${bt?.color || '#4E8D9C'}28` }}>{t}</div>;
  const numRange = (label: string, k: string, min: number, max: number, step = 1) => (
    <Row label={`${label}: ${block[k] ?? min}`}>
      <input type="range" min={min} max={max} step={step} value={block[k] ?? min} onChange={e => onChange({ [k]: Number(e.target.value) })} style={{ width: '100%', accentColor: bt?.color || C.teal }} />
    </Row>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${bt?.color || C.teal}28` }}>
        <span style={{ color: bt?.color || C.teal, fontSize: '1.2rem' }}>{bt?.icon}</span>
        <span style={{ fontWeight: 800, color: '#fff', fontSize: '.9rem' }}>{bt?.label}</span>
      </div>

      {block.type === 'hero' && (<>
        {Sec('المحتوى')}
        <Inp label="العنوان الرئيسي" k="title" placeholder="عنوانك هنا" />
        <Txta label="العنوان الفرعي" k="subtitle" placeholder="وصف جذاب..." rows={2} />
        <Txta label="النص التفصيلي" k="text" rows={2} />
        {Sec('الزر')}
        <Inp label="نص الزر" k="buttonLabel" placeholder="ابدأ الآن" />
        <Inp label="رابط الزر" k="buttonUrl" placeholder="https://..." />
        {Sec('التصميم')}
        <Inp label="صورة خلفية / رئيسية (URL)" k="imageUrl" placeholder="https://..." />
        <Row label="خلفية CSS">
          <textarea value={block.bgGradient || ''} onChange={e => onChange({ bgGradient: e.target.value })} rows={2} style={{ ...isSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '.78rem' }} />
        </Row>
        <Sel label="محاذاة" k="align" opts={[{ v: 'center', l: 'وسط' }, { v: 'right', l: 'يمين' }, { v: 'left', l: 'يسار' }]} />
        {numRange('الارتفاع الأدنى (vh)', 'minHeight', 30, 100, 5)}
      </>)}

      {block.type === 'text' && (<>
        <Inp label="العنوان" k="title" placeholder="عنوان القسم" />
        <Txta label="النص" k="text" placeholder="محتوى الفقرة..." rows={6} />
        {numRange('حجم الخط', 'fontSize', 12, 32)}
        <Sel label="محاذاة" k="align" opts={[{ v: 'center', l: 'وسط' }, { v: 'right', l: 'يمين' }, { v: 'left', l: 'يسار' }]} />
        <ColPicker label="لون النص" k="textColor" />
      </>)}

      {block.type === 'cta' && (<>
        {Sec('المحتوى')}
        <Inp label="العنوان" k="title" />
        <Inp label="النص الفرعي" k="subtitle" />
        <Inp label="نص الزر" k="buttonLabel" placeholder="سجل الآن" />
        <Inp label="رابط الزر" k="buttonUrl" placeholder="https://..." />
        {Sec('التصميم')}
        <ColPicker label="لون الزر" k="buttonColor" />
        <Sel label="تصميم الزر" k="btnStyle" opts={[{ v: 'filled', l: 'ممتلئ' }, { v: 'outline', l: 'إطار' }, { v: 'ghost', l: 'شفاف' }]} />
        <ColPicker label="لون الخلفية" k="bgColor" />
      </>)}

      {block.type === 'features' && (<>
        <Inp label="العنوان" k="title" />
        <Sel label="عدد الأعمدة" k="columns" opts={[1,2,3,4].map(n => ({ v: n, l: `${n} أعمدة` }))} />
        <ColPicker label="خلفية البطاقة" k="cardBg" />
        {Sec('المميزات')}
        {(block.items || []).map((item: any, ii: number) => (
          <div key={ii} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: 9, marginBottom: 7, border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.72rem' }}>ميزة {ii + 1}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <Btn2 onClick={() => moveItem(blockIdx, 'items', ii, -1)} disabled={ii === 0}>↑</Btn2>
                <Btn2 onClick={() => moveItem(blockIdx, 'items', ii, 1)} disabled={ii === block.items.length - 1}>↓</Btn2>
                <Btn2 onClick={() => removeItem(blockIdx, 'items', ii)} danger>✕</Btn2>
              </div>
            </div>
            <input value={item.icon || ''} onChange={e => updateItem(blockIdx, 'items', ii, { icon: e.target.value })} placeholder="أيقونة" style={{ ...isSt, marginBottom: 5 }} />
            <input value={item.title || ''} onChange={e => updateItem(blockIdx, 'items', ii, { title: e.target.value })} placeholder="العنوان" style={{ ...isSt, marginBottom: 5 }} />
            <textarea value={item.text || ''} onChange={e => updateItem(blockIdx, 'items', ii, { text: e.target.value })} placeholder="الوصف" rows={2} style={{ ...isSt, resize: 'vertical' }} />
          </div>
        ))}
        <button onClick={() => addItem(blockIdx, 'items', { icon: '⭐', title: 'ميزة جديدة', text: '' })} style={{ background: `${bt?.color}14`, color: bt?.color, border: `1px solid ${bt?.color}28`, borderRadius: 7, padding: '6px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem', width: '100%' }}>+ إضافة ميزة</button>
      </>)}

      {block.type === 'image' && (<>
        <Inp label="رابط الصورة" k="imageUrl" placeholder="https://..." />
        <Inp label="تعليق / وصف" k="title" />
        {numRange('الارتفاع (px)', 'imageHeight', 100, 800, 20)}
        <Sel label="ملاءمة الصورة" k="objectFit" opts={[{ v: 'cover', l: 'cover' }, { v: 'contain', l: 'contain' }, { v: 'fill', l: 'fill' }]} />
        {numRange('حدود مدورة (px)', 'borderRadius', 0, 48, 2)}
      </>)}

      {block.type === 'video' && (<>
        <Inp label="رابط الفيديو (YouTube / مباشر)" k="videoUrl" placeholder="https://..." />
        <Inp label="العنوان" k="title" />
        <Row label="تشغيل تلقائي">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!block.autoplay} onChange={e => onChange({ autoplay: e.target.checked })} />
            <span style={{ color: '#fff', fontSize: '.83rem' }}>تفعيل التشغيل التلقائي</span>
          </label>
        </Row>
      </>)}

      {block.type === 'gallery' && (<>
        <Inp label="عنوان المعرض" k="title" />
        <Sel label="عدد الأعمدة" k="columns" opts={[2,3,4].map(n => ({ v: n, l: `${n} أعمدة` }))} />
        {Sec('الصور')}
        {(block.galleryItems || []).map((item: any, ii: number) => (
          <div key={ii} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 7, padding: 9, marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.72rem' }}>صورة {ii + 1}</span>
              <Btn2 onClick={() => removeItem(blockIdx, 'galleryItems', ii)} danger>✕</Btn2>
            </div>
            <input value={item.imageUrl || ''} onChange={e => updateItem(blockIdx, 'galleryItems', ii, { imageUrl: e.target.value })} placeholder="رابط الصورة" style={{ ...isSt, marginBottom: 5 }} />
            <input value={item.caption || ''} onChange={e => updateItem(blockIdx, 'galleryItems', ii, { caption: e.target.value })} placeholder="تعليق (اختياري)" style={isSt} />
          </div>
        ))}
        <button onClick={() => addItem(blockIdx, 'galleryItems', { imageUrl: '', caption: '' })} style={{ background: `${bt?.color}14`, color: bt?.color, border: `1px solid ${bt?.color}28`, borderRadius: 7, padding: '6px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem', width: '100%' }}>+ إضافة صورة</button>
      </>)}

      {block.type === 'stats' && (<>
        <Inp label="العنوان" k="title" />
        {Sec('الأرقام')}
        {(block.items || []).map((item: any, ii: number) => (
          <div key={ii} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 7, padding: 9, marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.72rem' }}>رقم {ii + 1}</span><Btn2 onClick={() => removeItem(blockIdx, 'items', ii)} danger>✕</Btn2></div>
            <input value={item.icon || ''} onChange={e => updateItem(blockIdx, 'items', ii, { icon: e.target.value })} placeholder="أيقونة" style={{ ...isSt, marginBottom: 5 }} />
            <input value={item.value || ''} onChange={e => updateItem(blockIdx, 'items', ii, { value: e.target.value })} placeholder="القيمة (مثال: 1000+)" style={{ ...isSt, marginBottom: 5 }} />
            <input value={item.label || ''} onChange={e => updateItem(blockIdx, 'items', ii, { label: e.target.value })} placeholder="التسمية" style={isSt} />
          </div>
        ))}
        <button onClick={() => addItem(blockIdx, 'items', { icon: '📊', value: '', label: '' })} style={{ background: `${bt?.color}14`, color: bt?.color, border: `1px solid ${bt?.color}28`, borderRadius: 7, padding: '6px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem', width: '100%' }}>+ إضافة رقم</button>
      </>)}

      {block.type === 'testimonials' && (<>
        <Inp label="العنوان" k="title" />
        {Sec('الآراء')}
        {(block.items || []).map((item: any, ii: number) => (
          <div key={ii} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 7, padding: 9, marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.72rem' }}>رأي {ii + 1}</span><Btn2 onClick={() => removeItem(blockIdx, 'items', ii)} danger>✕</Btn2></div>
            <input value={item.name || ''} onChange={e => updateItem(blockIdx, 'items', ii, { name: e.target.value })} placeholder="الاسم" style={{ ...isSt, marginBottom: 5 }} />
            <input value={item.role || ''} onChange={e => updateItem(blockIdx, 'items', ii, { role: e.target.value })} placeholder="المنصب" style={{ ...isSt, marginBottom: 5 }} />
            <textarea value={item.text || ''} onChange={e => updateItem(blockIdx, 'items', ii, { text: e.target.value })} placeholder="نص الرأي..." rows={3} style={{ ...isSt, resize: 'vertical', marginBottom: 5 }} />
            <input value={item.avatar || ''} onChange={e => updateItem(blockIdx, 'items', ii, { avatar: e.target.value })} placeholder="رابط الصورة الشخصية" style={isSt} />
          </div>
        ))}
        <button onClick={() => addItem(blockIdx, 'items', { name: '', role: '', text: '', avatar: '' })} style={{ background: `${bt?.color}14`, color: bt?.color, border: `1px solid ${bt?.color}28`, borderRadius: 7, padding: '6px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem', width: '100%' }}>+ إضافة رأي</button>
      </>)}

      {block.type === 'faq' && (<>
        <Inp label="العنوان" k="title" />
        {Sec('الأسئلة')}
        {(block.items || []).map((item: any, ii: number) => (
          <div key={ii} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 7, padding: 9, marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.72rem' }}>سؤال {ii + 1}</span><Btn2 onClick={() => removeItem(blockIdx, 'items', ii)} danger>✕</Btn2></div>
            <input value={item.question || ''} onChange={e => updateItem(blockIdx, 'items', ii, { question: e.target.value })} placeholder="السؤال" style={{ ...isSt, marginBottom: 5 }} />
            <textarea value={item.answer || ''} onChange={e => updateItem(blockIdx, 'items', ii, { answer: e.target.value })} placeholder="الإجابة" rows={3} style={{ ...isSt, resize: 'vertical' }} />
          </div>
        ))}
        <button onClick={() => addItem(blockIdx, 'items', { question: '', answer: '' })} style={{ background: `${bt?.color}14`, color: bt?.color, border: `1px solid ${bt?.color}28`, borderRadius: 7, padding: '6px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem', width: '100%' }}>+ إضافة سؤال</button>
      </>)}

      {block.type === 'form' && (<>
        {Sec('إعدادات النموذج')}
        <Inp label="عنوان النموذج" k="title" />
        <Inp label="نص زر الإرسال" k="submitLabel" placeholder="إرسال" />
        <Row label="رسالة النجاح">
          <textarea value={block.successMsg || ''} onChange={e => onChange({ successMsg: e.target.value })} rows={2} style={{ ...isSt, resize: 'vertical' }} />
        </Row>
        <ColPicker label="لون الخلفية" k="bgColor" />
        {Sec('حقول النموذج')}
        <div style={{ fontSize: '.71rem', color: 'rgba(255,255,255,.3)', marginBottom: 9 }}>أضف الحقول التي تريدها يدوياً — تحكم كامل في كل حقل</div>
        {(block.formFields || []).map((field: any, fi: number) => (
          <div key={field.id || fi} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 9, padding: 10, marginBottom: 9, border: '1px solid rgba(255,255,255,.09)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                <Btn2 onClick={() => moveItem(blockIdx, 'formFields', fi, -1)} disabled={fi === 0}>↑</Btn2>
                <Btn2 onClick={() => moveItem(blockIdx, 'formFields', fi, 1)} disabled={fi === (block.formFields?.length ?? 0) - 1}>↓</Btn2>
              </div>
              <span style={{ color: '#a855f7', fontSize: '.72rem', fontWeight: 700 }}>حقل {fi + 1}</span>
              <Btn2 onClick={() => removeItem(blockIdx, 'formFields', fi)} danger>✕</Btn2>
            </div>
            <div style={{ marginBottom: 5 }}>
              <label style={lSt}>نوع الحقل</label>
              <select value={field.type || 'text'} onChange={e => updateItem(blockIdx, 'formFields', fi, { type: e.target.value })} style={{ ...isSt, background: C.card }}>
                {FORM_FIELD_TYPES.map(ft => <option key={ft.id} value={ft.id}>{ft.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 5 }}>
              <label style={lSt}>التسمية (Label) *</label>
              <input value={field.label || ''} onChange={e => updateItem(blockIdx, 'formFields', fi, { label: e.target.value })} placeholder="مثال: الاسم الكامل" style={isSt} />
            </div>
            <div style={{ marginBottom: 5 }}>
              <label style={lSt}>Placeholder</label>
              <input value={field.placeholder || ''} onChange={e => updateItem(blockIdx, 'formFields', fi, { placeholder: e.target.value })} placeholder="نص توضيحي داخل الحقل" style={isSt} />
            </div>
            {(field.type === 'select' || field.type === 'radio') && (
              <div style={{ marginBottom: 5 }}>
                <label style={lSt}>الخيارات (كل سطر = خيار)</label>
                <textarea value={(field.options || []).join('\n')} onChange={e => updateItem(blockIdx, 'formFields', fi, { options: e.target.value.split('\n').filter((s: string) => s.trim()) })} rows={3} placeholder={'خيار 1\nخيار 2\nخيار 3'} style={{ ...isSt, resize: 'vertical' }} />
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!field.required} onChange={e => updateItem(blockIdx, 'formFields', fi, { required: e.target.checked })} />
              <span style={{ color: 'rgba(255,255,255,.55)', fontSize: '.78rem' }}>حقل إلزامي</span>
            </label>
          </div>
        ))}
        <button onClick={() => addItem(blockIdx, 'formFields', { id: Date.now().toString(), type: 'text', label: 'حقل جديد', placeholder: '', required: false })} style={{ background: '#a855f714', color: '#a855f7', border: '1px solid #a855f728', borderRadius: 7, padding: '7px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.8rem', width: '100%' }}>
          + إضافة حقل جديد
        </button>
      </>)}

      {block.type === 'divider' && (<>
        <Sel label="نوع الفاصل" k="style" opts={[{ v: 'line', l: 'خط' }, { v: 'dashed', l: 'متقطع' }, { v: 'dots', l: 'نقاط' }, { v: 'gradient', l: 'تدرج' }]} />
        <ColPicker label="اللون" k="color" />
      </>)}

      {block.type === 'spacer' && numRange('الارتفاع (px)', 'height', 10, 300, 10)}

      {block.type === 'html' && (
        <Row label="كود HTML مخصص">
          <textarea value={block.rawHtml || ''} onChange={e => onChange({ rawHtml: e.target.value })} rows={12} style={{ ...isSt, resize: 'vertical', fontFamily: 'monospace', fontSize: '.8rem' }} />
        </Row>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE PREVIEW
// ════════════════════════════════════════════════════════════════════════════
function PagePreview({ blocks, title }: { blocks: any[]; title: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080520', fontFamily: 'Cairo,sans-serif', direction: 'rtl', color: '#fff' }}>
      <div style={{ height: 38, background: 'rgba(8,5,32,.95)', borderBottom: '1px solid rgba(78,141,156,.18)', display: 'flex', alignItems: 'center', padding: '0 18px' }}>
        <span style={{ color: '#EDF7BD', fontSize: '.78rem', fontWeight: 700 }}>✦ معاينة — {title}</span>
      </div>
      {blocks.length === 0 && <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>لا يوجد محتوى للمعاينة</div>}
      {blocks.map((block, i) => <PreviewBlock key={i} block={block} />)}
    </div>
  );
}

function PreviewBlock({ block }: { block: any }) {
  const T = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A' };

  if (block.type === 'hero') return (
    <div style={{ minHeight: `${block.minHeight || 60}vh`, display: 'flex', flexDirection: 'column', alignItems: block.align === 'right' ? 'flex-end' : block.align === 'left' ? 'flex-start' : 'center', justifyContent: 'center', textAlign: (block.align || 'center') as any, padding: '80px 40px', background: block.bgGradient || `linear-gradient(135deg,#080520 0%,#0f0a3a 50%,${T.teal}22 100%)`, position: 'relative', overflow: 'hidden' }}>
      {block.imageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${block.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: .22 }} />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, width: '100%', margin: '0 auto' }}>
        {block.title && <h1 style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 18px', background: `linear-gradient(135deg,#fff 0%,${T.mint} 40%,${T.green} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{block.title}</h1>}
        {block.subtitle && <p style={{ fontSize: '1.25rem', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.8 }}>{block.subtitle}</p>}
        {block.text && <p style={{ fontSize: '1rem', color: '#64748b', margin: '0 0 28px' }}>{block.text}</p>}
        {block.buttonLabel && block.buttonUrl && <a href={block.buttonUrl} style={{ display: 'inline-block', padding: '14px 40px', borderRadius: 32, background: `linear-gradient(135deg,${T.teal},${T.green})`, color: '#fff', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', boxShadow: `0 8px 30px ${T.teal}55` }}>{block.buttonLabel}</a>}
      </div>
    </div>
  );

  if (block.type === 'text') return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px', textAlign: (block.align || 'center') as any }}>
      {block.title && <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 18px' }}>{block.title}</h2>}
      {block.text && <p style={{ fontSize: `${block.fontSize || 17}px`, color: block.textColor || '#94a3b8', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{block.text}</p>}
    </div>
  );

  if (block.type === 'cta') {
    const bc = block.buttonColor || T.teal;
    const isOutline = block.btnStyle === 'outline';
    return (
      <div style={{ textAlign: 'center', padding: '70px 32px', background: block.bgColor || '#1a1a4a', borderTop: `1px solid ${T.teal}22`, borderBottom: `1px solid ${T.teal}22` }}>
        {block.title && <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>{block.title}</h2>}
        {block.subtitle && <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: 32 }}>{block.subtitle}</p>}
        {block.buttonLabel && block.buttonUrl && <a href={block.buttonUrl} style={{ display: 'inline-block', padding: '15px 44px', borderRadius: 32, background: isOutline ? 'transparent' : bc, border: isOutline ? `2px solid ${bc}` : 'none', color: isOutline ? bc : '#fff', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', boxShadow: isOutline ? 'none' : `0 8px 30px ${bc}55` }}>{block.buttonLabel}</a>}
      </div>
    );
  }

  if (block.type === 'features') return (
    <div style={{ padding: '70px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 48px' }}>{block.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns || 3},1fr)`, gap: 24 }}>
        {(block.items || []).map((item: any, i: number) => (
          <div key={i} style={{ background: block.cardBg || 'rgba(255,255,255,.04)', border: `1px solid ${T.teal}22`, borderRadius: 18, padding: '32px 24px', textAlign: 'center' }}>
            {item.icon && <div style={{ fontSize: '2.4rem', marginBottom: 14 }}>{item.icon}</div>}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>{item.title}</h3>
            {item.text && <p style={{ fontSize: '.95rem', color: '#64748b', lineHeight: 1.8 }}>{item.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === 'image') return (
    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
      {block.imageUrl ? <img src={block.imageUrl} alt={block.title || ''} style={{ maxWidth: '100%', height: `${block.imageHeight || 400}px`, objectFit: (block.objectFit || 'cover') as any, borderRadius: `${block.borderRadius || 0}px`, display: 'inline-block' }} /> : <div style={{ height: `${block.imageHeight || 400}px`, maxWidth: 800, margin: '0 auto', background: 'rgba(255,255,255,.05)', borderRadius: `${block.borderRadius || 0}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.2rem' }}>🖼️ أدخل رابط الصورة</div>}
      {block.title && <p style={{ color: '#64748b', marginTop: 12, fontSize: '.9rem' }}>{block.title}</p>}
    </div>
  );

  if (block.type === 'video') {
    const url = block.videoUrl || '';
    const yt = url.includes('youtube.com') || url.includes('youtu.be');
    const ytId = yt ? (url.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/)?.[1] || '') : '';
    return (
      <div style={{ padding: '40px 32px', maxWidth: 900, margin: '0 auto' }}>
        {block.title && <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 24 }}>{block.title}</h2>}
        {yt && ytId ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 16, overflow: 'hidden' }}>
            <iframe src={`https://www.youtube.com/embed/${ytId}${block.autoplay ? '?autoplay=1&mute=1' : ''}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
          </div>
        ) : url ? (
          <video src={url} controls autoPlay={!!block.autoplay} style={{ width: '100%', borderRadius: 16 }} />
        ) : (
          <div style={{ height: 220, background: 'rgba(255,255,255,.05)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>🎬 أدخل رابط الفيديو</div>
        )}
      </div>
    );
  }

  if (block.type === 'gallery') return (
    <div style={{ padding: '60px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 36px' }}>{block.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns || 3},1fr)`, gap: 12 }}>
        {(block.galleryItems || []).map((item: any, i: number) => (
          <div key={i} style={{ borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
            {item.imageUrl ? <img src={item.imageUrl} alt={item.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>🖼️</div>}
            {item.caption && <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'linear-gradient(transparent,rgba(0,0,0,.65))', color: '#fff', fontSize: '.82rem', padding: '20px 10px 8px' }}>{item.caption}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === 'stats') return (
    <div style={{ padding: '70px 32px', background: 'rgba(78,141,156,.05)', borderTop: '1px solid rgba(78,141,156,.14)', borderBottom: '1px solid rgba(78,141,156,.14)' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 44px' }}>{block.title}</h2>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
        {(block.items || []).map((item: any, i: number) => (
          <div key={i} style={{ textAlign: 'center' }}>
            {item.icon && <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{item.icon}</div>}
            <div style={{ fontSize: '2.8rem', fontWeight: 900, background: `linear-gradient(135deg,${T.teal},${T.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>{item.value}</div>
            <div style={{ fontSize: '.95rem', color: '#64748b', marginTop: 6 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === 'testimonials') return (
    <div style={{ padding: '70px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 40px' }}>{block.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22 }}>
        {(block.items || []).map((item: any, i: number) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '28px 24px' }}>
            <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.85, marginBottom: 20, fontStyle: 'italic' }}>"{item.text}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.avatar ? <img src={item.avatar} alt={item.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${T.teal},${T.navy})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{item.name?.charAt(0)}</div>}
              <div><div style={{ color: '#fff', fontWeight: 700 }}>{item.name}</div>{item.role && <div style={{ fontSize: '.82rem', color: '#64748b' }}>{item.role}</div>}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (block.type === 'faq') return (
    <div style={{ padding: '70px 32px', maxWidth: 820, margin: '0 auto' }}>
      {block.title && <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', textAlign: 'center', margin: '0 0 40px' }}>{block.title}</h2>}
      {(block.items || []).map((item: any, i: number) => (
        <FaqItem key={i} item={item} teal={T.teal} green={T.green} />
      ))}
    </div>
  );

  if (block.type === 'form') return <LiveFormBlock block={block} />;

  if (block.type === 'divider') {
    const c = block.color || 'rgba(78,141,156,.3)';
    return (
      <div style={{ padding: '16px 32px' }}>
        {block.style === 'gradient' ? <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${c},transparent)` }} /> :
         block.style === 'dots' ? <div style={{ textAlign: 'center', color: c, letterSpacing: 12, fontSize: '1.2rem' }}>• • • • •</div> :
         <hr style={{ border: 'none', borderTop: `1.5px ${block.style === 'dashed' ? 'dashed' : 'solid'} ${c}` }} />}
      </div>
    );
  }

  if (block.type === 'spacer') return <div style={{ height: `${block.height || 60}px` }} />;
  if (block.type === 'html') return <div dangerouslySetInnerHTML={{ __html: block.rawHtml || '' }} />;
  return null;
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────
function FaqItem({ item, teal, green }: { item: any; teal: string; green: string }) {
  const [open2, setOpen2] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
      <button onClick={() => setOpen2(o => !o)} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'right', padding: '18px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Cairo,sans-serif' }}>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: '1.02rem', flex: 1 }}>{item.question}</span>
        <span style={{ color: teal, fontSize: '1.2rem', marginRight: 10, transition: 'transform .2s', transform: open2 ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open2 && <p style={{ color: '#94a3b8', lineHeight: 1.85, paddingBottom: 18, marginTop: 0 }}>{item.answer}</p>}
    </div>
  );
}

// ─── Live form block with full field rendering ────────────────────────────────
function LiveFormBlock({ block }: { block: any }) {
  const [vals, setVals] = useState<Record<string, any>>({});
  const [sent, setSent] = useState(false);
  const T = { teal: '#4E8D9C', navy: '#281C59', green: '#85C79A' };
  const ff: any[] = block.formFields || [];
  const fldS: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.055)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.95rem', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '70px 32px', background: block.bgColor && block.bgColor !== 'transparent' ? block.bgColor : undefined }}>
      <div style={{ maxWidth: 620, margin: '0 auto', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(78,141,156,.2)', borderRadius: 24, padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,.4)' }}>
        {block.title && <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', textAlign: 'center', margin: '0 0 32px' }}>{block.title}</h2>}
        {sent ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>✅</div>
            <p style={{ color: T.green, fontWeight: 700, fontSize: '1.1rem' }}>{block.successMsg || 'تم الإرسال بنجاح!'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {ff.map((field: any) => (
              <div key={field.id}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,.75)', fontSize: '.9rem', fontWeight: 700, marginBottom: 7 }}>
                  {field.label}{field.required && <span style={{ color: '#f87171', marginRight: 4 }}>*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea value={vals[field.id] || ''} onChange={e => setVals(v => ({ ...v, [field.id]: e.target.value }))} placeholder={field.placeholder} rows={4} style={{ ...fldS, resize: 'vertical' }} />
                ) : field.type === 'select' ? (
                  <select value={vals[field.id] || ''} onChange={e => setVals(v => ({ ...v, [field.id]: e.target.value }))} style={{ ...fldS, cursor: 'pointer' }}>
                    <option value="">— اختر —</option>
                    {(field.options || []).map((opt: string, oi: number) => <option key={oi} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'radio' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(field.options || []).map((opt: string, oi: number) => (
                      <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#94a3b8', fontSize: '.92rem' }}>
                        <input type="radio" name={field.id} value={opt} checked={vals[field.id] === opt} onChange={() => setVals(v => ({ ...v, [field.id]: opt }))} style={{ accentColor: T.teal }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#94a3b8', fontSize: '.92rem' }}>
                    <input type="checkbox" checked={!!vals[field.id]} onChange={e => setVals(v => ({ ...v, [field.id]: e.target.checked }))} style={{ accentColor: T.teal, width: 18, height: 18 }} />
                    {field.placeholder || field.label}
                  </label>
                ) : (
                  <input type={field.type || 'text'} value={vals[field.id] || ''} onChange={e => setVals(v => ({ ...v, [field.id]: e.target.value }))} placeholder={field.placeholder} style={fldS} />
                )}
              </div>
            ))}
            <button
              onClick={() => {
                const missing = ff.filter((f: any) => f.required && !vals[f.id]);
                if (missing.length) { alert(`يرجى ملء الحقول الإلزامية:\n${missing.map((f: any) => f.label).join('، ')}`); return; }
                setSent(true);
              }}
              style={{ padding: '14px', borderRadius: 12, background: `linear-gradient(135deg,${T.teal},${T.navy})`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', boxShadow: `0 6px 24px ${T.teal}45`, marginTop: 6 }}
            >
              {block.submitLabel || 'إرسال'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
