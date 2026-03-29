'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C   = { teal: '#4E8D9C', navy: '#281C59', mint: '#EDF7BD', green: '#85C79A', bg: '#080520' };

const PUBLIC_BASE = 'https://hadmaj.pages.dev';

const BLOCK_TYPES = [
  { id: 'hero',    label: 'بطل / رئيسي',   icon: '🌟', color: '#6366f1' },
  { id: 'text',    label: 'نص',             icon: '📝', color: '#3b82f6' },
  { id: 'cta',     label: 'زر دعوة',        icon: '🎯', color: '#10b981' },
  { id: 'form',    label: 'نموذج تواصل',   icon: '📋', color: '#8b5cf6' },
  { id: 'image',   label: 'صورة',           icon: '🖼️', color: '#f59e0b' },
  { id: 'features',label: 'مميزات',         icon: '✨', color: '#ec4899' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'مسودة',    color: '#9ca3af' },
  published: { label: 'منشور',    color: '#10b981' },
  archived:  { label: 'مؤرشف',  color: '#6b7280' },
};

const blankBlock = (type = 'text') => ({
  type,
  title:    type === 'hero' ? 'عنوان رئيسي' : '',
  subtitle: '',
  text:     '',
  buttonLabel: type === 'cta' ? 'ابدأ الآن' : '',
  buttonUrl:   '',
});

const blankPage = () => ({ title: '', meta_title: '', meta_description: '', status: 'draft' });

export default function LandingClient() {
  const router = useRouter();
  const [pages, setPages]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [form, setForm]         = useState(blankPage());
  const [blocks, setBlocks]     = useState<any[]>([]);
  const [editBlocks, setEditBlocks] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [copied, setCopied]     = useState<number | null>(null);

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
      const res = await fetch(`${API}/api/cloud/landing-pages`, { headers: h });
      const d   = await res.json();
      if (d.success) setPages(d.data || []);
      else if (res.status === 401) router.push('/login');
    } catch {}
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(blankPage());
    setBlocks([]);
    setEditBlocks(false);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ title: p.title || '', meta_title: p.meta_title || '', meta_description: p.meta_description || '', status: p.status || 'draft' });
    try { setBlocks(JSON.parse(p.content || '[]')); } catch { setBlocks([]); }
    setEditBlocks(false);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) return alert('عنوان الصفحة مطلوب');
    setSaving(true);
    const body = { ...form, content: JSON.stringify(blocks) };
    if (editing) {
      await fetch(`${API}/api/cloud/landing-pages/${editing.id}`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
    } else {
      await fetch(`${API}/api/cloud/landing-pages`, { method: 'POST', headers: h, body: JSON.stringify(body) });
    }
    setSaving(false);
    setShowModal(false);
    load();
  };

  const remove = async (id: number, title: string) => {
    if (!confirm(`حذف الصفحة "${title}"؟`)) return;
    await fetch(`${API}/api/cloud/landing-pages/${id}`, { method: 'DELETE', headers: h });
    load();
  };

  const togglePublish = async (p: any) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published';
    await fetch(`${API}/api/cloud/landing-pages/${p.id}`, {
      method: 'PUT', headers: h, body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const copyLink = (p: any) => {
    const url = `${PUBLIC_BASE}/landing/${p.slug}`;
    navigator.clipboard?.writeText(url);
    setCopied(p.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const addBlock = (type: string) => setBlocks(b => [...b, blankBlock(type)]);
  const removeBlock = (i: number) => setBlocks(b => b.filter((_, idx) => idx !== i));
  const updateBlock = (i: number, key: string, val: string) =>
    setBlocks(b => b.map((block, idx) => idx === i ? { ...block, [key]: val } : block));
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    setBlocks(b => { const arr = [...b]; [arr[i], arr[j]] = [arr[j], arr[i]]; return arr; });
  };

  const inp = (label: string, key: string, placeholder = '', multiline = false) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '.82rem', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>{label}</label>
      {multiline ? (
        <textarea
          value={(form as any)[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box', fontSize: '.9rem', resize: 'vertical' }}
        />
      ) : (
        <input
          value={(form as any)[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', boxSizing: 'border-box', fontSize: '.9rem' }}
        />
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Cairo,sans-serif', direction: 'rtl', color: '#e8f4f8' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(8,5,32,.95)', borderBottom: `1px solid ${C.teal}30`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/cloud" style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none', fontSize: '.85rem' }}>السحابة ←</Link>
          <span style={{ color: 'rgba(255,255,255,.2)' }}>|</span>
          <span style={{ fontWeight: 700, color: C.mint, fontSize: '.95rem' }}>🖥️ صفحات الهبوط</span>
        </div>
        <Link href="/" style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: '.82rem' }}>✦ الرئيسية</Link>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, background: `linear-gradient(130deg,${C.mint},${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              صفحات الهبوط
            </h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.5)', fontSize: '.9rem' }}>
              صمّم صفحات هبوط جذابة لحملاتك التسويقية بدون أكواد
            </p>
          </div>
          <button onClick={openAdd} style={{ background: `linear-gradient(135deg,${C.teal},${C.navy})`, color: '#fff', border: 'none', borderRadius: 24, padding: '10px 22px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontWeight: 700, fontSize: '.92rem' }}>
            + صفحة جديدة
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 28 }}>
          {Object.entries(STATUS_LABELS).map(([key, s]) => (
            <div key={key} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: '14px 16px', border: `1px solid ${s.color}30` }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, marginBottom: 4 }}>
                {pages.filter(p => p.status === key).length}
              </div>
              <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.teal}30` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: C.teal, marginBottom: 4 }}>
              {pages.reduce((s, p) => s + (p.views || 0), 0)}
            </div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>إجمالي المشاهدات</div>
          </div>
        </div>

        {/* Pages grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.3)' }}>جاري التحميل...</div>
        ) : pages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🖥️</div>
            <p>لا توجد صفحات هبوط بعد</p>
            <button onClick={openAdd} style={{ marginTop: 16, background: `${C.teal}20`, color: C.teal, border: `1px solid ${C.teal}40`, borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif' }}>
              أنشئ أول صفحة
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {pages.map(p => {
              let blocksArr: any[] = [];
              try { blocksArr = JSON.parse(p.content || '[]'); } catch {}
              const s = STATUS_LABELS[p.status] || STATUS_LABELS.draft;
              return (
                <div key={p.id} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${C.teal}20`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{p.title}</div>
                      <span style={{ background: `${s.color}20`, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: '.75rem' }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: '1.6rem' }}>🖥️</div>
                  </div>

                  {blocksArr.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {blocksArr.map((block: any, i: number) => {
                        const bt = BLOCK_TYPES.find(t => t.id === block.type);
                        return (
                          <span key={i} style={{ background: `${bt?.color || C.teal}15`, color: bt?.color || C.teal, padding: '2px 8px', borderRadius: 10, fontSize: '.72rem' }}>
                            {bt?.icon} {bt?.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.78rem' }}>
                    <span>👁 {p.views || 0} مشاهدة</span>
                    <span>{blocksArr.length} بلوك</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => openEdit(p)} style={{ flex: 1, background: `${C.teal}15`, color: C.teal, border: `1px solid ${C.teal}30`, borderRadius: 10, padding: '7px 0', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.83rem' }}>
                      تعديل
                    </button>
                    <button onClick={() => togglePublish(p)} style={{ background: p.status === 'published' ? 'rgba(156,163,175,.1)' : 'rgba(16,185,129,.1)', color: p.status === 'published' ? '#9ca3af' : '#10b981', border: `1px solid ${p.status === 'published' ? '#9ca3af' : '#10b981'}30`, borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem' }}>
                      {p.status === 'published' ? '⏸ إيقاف' : '▶ نشر'}
                    </button>
                    {p.status === 'published' && (
                      <button onClick={() => copyLink(p)} style={{ background: copied === p.id ? 'rgba(16,185,129,.1)' : `${C.green}15`, color: copied === p.id ? '#10b981' : C.green, border: `1px solid ${copied === p.id ? '#10b981' : C.green}30`, borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.78rem' }}>
                        {copied === p.id ? '✓ تم' : '🔗 نسخ'}
                      </button>
                    )}
                    <button onClick={() => remove(p.id, p.title)} style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.83rem' }}>
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
          <div style={{ background: '#10103a', borderRadius: 20, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.teal}30` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: C.mint }}>{editing ? 'تعديل الصفحة' : 'صفحة هبوط جديدة'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {inp('عنوان الصفحة *', 'title', 'مثال: عرض لا يُقاوَم')}
            {inp('عنوان SEO', 'meta_title', 'اختياري - للمحركات')}
            {inp('وصف SEO', 'meta_description', 'وصف مختصر للمحركات', true)}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.82rem', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>الحالة</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: '#10103a', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.9rem' }}>
                {Object.entries(STATUS_LABELS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>

            {/* Block builder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.6)' }}>البلوكات ({blocks.length})</label>
                <button onClick={() => setEditBlocks(e => !e)} style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: '.8rem' }}>
                  {editBlocks ? 'إخفاء المحرر' : 'فتح المحرر'}
                </button>
              </div>

              {editBlocks && (
                <div style={{ border: `1px solid ${C.teal}20`, borderRadius: 12, padding: 14, background: 'rgba(255,255,255,.02)' }}>
                  {/* Add block palette */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {BLOCK_TYPES.map(bt => (
                      <button key={bt.id} onClick={() => addBlock(bt.id)} style={{ background: `${bt.color}15`, color: bt.color, border: `1px solid ${bt.color}30`, borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: '.75rem' }}>
                        {bt.icon} {bt.label}
                      </button>
                    ))}
                  </div>

                  {/* Blocks list */}
                  {blocks.map((block, i) => {
                    const bt = BLOCK_TYPES.find(t => t.id === block.type);
                    return (
                      <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${bt?.color || C.teal}25`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ color: bt?.color || C.teal, fontSize: '.8rem', fontWeight: 700 }}>{bt?.icon} {bt?.label}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => moveBlock(i, -1)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '.85rem' }}>↑</button>
                            <button onClick={() => moveBlock(i, 1)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '.85rem' }}>↓</button>
                            <button onClick={() => removeBlock(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '.85rem' }}>✕</button>
                          </div>
                        </div>
                        {['hero', 'cta', 'features'].includes(block.type) && (
                          <input value={block.title} onChange={e => updateBlock(i, 'title', e.target.value)} placeholder="العنوان"
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem', marginBottom: 6, boxSizing: 'border-box' }} />
                        )}
                        {['hero', 'text', 'features'].includes(block.type) && (
                          <textarea value={block.text} onChange={e => updateBlock(i, 'text', e.target.value)} placeholder="النص"
                            rows={2}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem', resize: 'vertical', boxSizing: 'border-box' }} />
                        )}
                        {['cta', 'hero'].includes(block.type) && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <input value={block.buttonLabel} onChange={e => updateBlock(i, 'buttonLabel', e.target.value)} placeholder="نص الزر"
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }} />
                            <input value={block.buttonUrl} onChange={e => updateBlock(i, 'buttonUrl', e.target.value)} placeholder="رابط الزر"
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', fontFamily: 'Cairo,sans-serif', fontSize: '.82rem' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {blocks.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '.85rem', padding: '16px 0' }}>
                      اختر نوع البلوك من الأعلى لإضافته
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 22 }}>
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
