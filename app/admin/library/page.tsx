'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const C = {
  primary: '#281C59',
  teal: '#4E8D9C',
  green: '#85C79A',
  mint: '#EDF7BD',
};

const CATEGORIES = [
  { value: 'institution_book', label: 'كتب المؤسسات', color: '#85C79A' },
  { value: 'sector_book',      label: 'كتب القطاع',   color: '#FFD700' },
  { value: 'report',           label: 'تقارير',        color: '#FF9B4E' },
  { value: 'subscription',     label: 'اشتراكات',      color: '#C084FC' },
];

interface Book {
  id: number;
  title: string;
  author?: string;
  category: string;
  institution_name_ar?: string;
  institution_id?: number;
  year?: number;
  pages?: number;
  language: string;
  is_free: number;
  downloads: number;
  status: string;
  file_url?: string;
  external_url?: string;
  cover_url?: string;
  description?: string;
  tags?: string;
  created_at: string;
}

const emptyForm = {
  title: '',
  title_en: '',
  author: '',
  description: '',
  category: 'institution_book' as string,
  institution_id: '',
  file_url: '',
  external_url: '',
  cover_url: '',
  year: '',
  pages: '',
  language: 'ar' as string,
  tags: '',
  is_free: true,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: C.primary }}>{label}</label>
      <div style={{ display: 'contents' }}>{children}</div>
    </div>
  );
}

const iStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.teal}40`,
  fontSize: '0.9rem', outline: 'none', color: C.primary, width: '100%', boxSizing: 'border-box',
};

export default function AdminLibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [total, setTotal] = useState(0);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH = { 'X-Session-ID': sid };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') { router.push('/login?redirect=/admin/library'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [booksRes, instRes] = await Promise.all([
        fetch(`${API_BASE}/api/library?limit=200`, { headers: authH }),
        fetch(`${API_BASE}/api/institutions?limit=200`, { headers: authH }),
      ]);
      const bd = await booksRes.json();
      const id = await instRes.json();
      setBooks(bd.data || []);
      setTotal(bd.total || 0);
      setInstitutions(id.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('العنوان مطلوب'); return; }
    setSubmitting(true); setErr('');
    try {
      const tagsArr = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const res = await fetch(`${API_BASE}/api/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({
          title: form.title,
          title_en: form.title_en || undefined,
          author: form.author || undefined,
          description: form.description || undefined,
          category: form.category,
          institution_id: form.institution_id ? Number(form.institution_id) : undefined,
          file_url: form.file_url || undefined,
          external_url: form.external_url || undefined,
          cover_url: form.cover_url || undefined,
          year: form.year ? Number(form.year) : undefined,
          pages: form.pages ? Number(form.pages) : undefined,
          language: form.language,
          tags: tagsArr,
          is_free: form.is_free,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'فشل الإنشاء');
      setShowCreate(false);
      setForm(emptyForm);
      setSuccess('✓ تم إضافة الكتاب بنجاح');
      setTimeout(() => setSuccess(''), 3000);
      loadAll();
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`حذف "${title}"؟`)) return;
    try {
      await fetch(`${API_BASE}/api/library/${id}`, { method: 'DELETE', headers: authH });
      setBooks(prev => prev.filter(b => b.id !== id));
      setSuccess('✓ تم الحذف');
      setTimeout(() => setSuccess(''), 2000);
    } catch { alert('فشل الحذف'); }
  };

  const filtered = books.filter(b => {
    if (catFilter !== 'all' && b.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.institution_name_ar || '').toLowerCase().includes(q);
    }
    return true;
  });

  const catLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;
  const catColor = (cat: string) => CATEGORIES.find(c => c.value === cat)?.color || C.teal;

  return (
    <div className="admin-page" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>📚 إدارة المكتبة الحضارية</h1>
          <p style={{ opacity: 0.75, margin: '6px 0 0', fontSize: '0.9rem' }}>إدارة الكتب والتقارير والمصادر المعرفية</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin" style={{ padding: '10px 20px', borderRadius: 30, background: 'rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            ← لوحة الأدمن
          </Link>
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 24px', borderRadius: 30, background: C.green, color: C.primary, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
            + إضافة كتاب
          </button>
        </div>
      </div>

      {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#15803d', fontWeight: 600 }}>{success}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'إجمالي', val: total, color: C.teal, icon: '📚' },
          ...CATEGORIES.map(cat => ({
            label: cat.label,
            val: books.filter(b => b.category === cat.value).length,
            color: cat.color,
            icon: cat.value === 'institution_book' ? '🏛️' : cat.value === 'sector_book' ? '🌟' : cat.value === 'report' ? '📊' : '🔗',
          }))
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', boxShadow: `0 3px 12px ${C.primary}12`, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
            <div style={{ fontSize: '0.78rem', color: C.teal, marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: 'white', borderRadius: 14, padding: '16px 20px', marginBottom: 20, boxShadow: `0 3px 12px ${C.primary}08`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 بحث بالعنوان أو المؤلف أو المؤسسة..."
          style={{ flex: 1, padding: '9px 14px', borderRadius: 30, border: `1.5px solid ${C.teal}40`, fontSize: '0.9rem', outline: 'none', minWidth: 180 }}
        />
        <button onClick={() => setCatFilter('all')} style={{ padding: '8px 16px', borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: catFilter === 'all' ? 700 : 400, background: catFilter === 'all' ? C.teal : `${C.teal}12`, color: catFilter === 'all' ? 'white' : C.teal, fontSize: '0.85rem' }}>الكل ({books.length})</button>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCatFilter(cat.value)} style={{ padding: '8px 14px', borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: catFilter === cat.value ? 700 : 400, background: catFilter === cat.value ? cat.color : `${cat.color}15`, color: catFilter === cat.value ? '#fff' : cat.color, fontSize: '0.82rem' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Books table */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /> جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 16, color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>📭</div>
          <div>لا توجد نتائج</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 14px ${C.primary}10`, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الكتاب</th>
                  <th>الفئة</th>
                  <th>المؤلف</th>
                  <th>المؤسسة</th>
                  <th>السنة</th>
                  <th>التحميلات</th>
                  <th>النوع</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(book => (
                  <tr key={book.id}>
                    <td style={{ color: '#999', fontSize: '0.82rem' }}>{book.id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: C.primary, maxWidth: 220 }}>{book.title}</div>
                      {(book.file_url || book.external_url) && (
                        <a href={book.file_url || book.external_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: C.teal, textDecoration: 'none' }}>🔗 فتح الرابط</a>
                      )}
                    </td>
                    <td>
                      <span style={{ background: `${catColor(book.category)}20`, color: catColor(book.category), padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {catLabel(book.category)}
                      </span>
                    </td>
                    <td style={{ color: '#555', fontSize: '0.88rem' }}>{book.author || '—'}</td>
                    <td style={{ fontSize: '0.85rem', color: C.teal }}>{book.institution_name_ar || '—'}</td>
                    <td style={{ fontSize: '0.85rem', color: '#666' }}>{book.year || '—'}</td>
                    <td style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>{book.downloads}</td>
                    <td>
                      {book.is_free
                        ? <span style={{ color: '#15803d', fontSize: '0.8rem', fontWeight: 700 }}>مجاني</span>
                        : <span style={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 700 }}>اشتراك</span>}
                    </td>
                    <td>
                      <button onClick={() => handleDelete(book.id, book.title)} style={{ padding: '5px 14px', borderRadius: 20, border: 'none', background: '#ff505015', color: '#ff5050', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                        🗑 حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, direction: 'rtl', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '32px 36px', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 24px 80px ${C.primary}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: C.primary, margin: 0, fontSize: '1.3rem' }}>📚 إضافة كتاب / مصدر معرفي</h2>
              <button onClick={() => { setShowCreate(false); setErr(''); setForm(emptyForm); }} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            {err && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: 16 }}>{err}</div>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="العنوان بالعربية *">
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="عنوان الكتاب" style={iStyle} />
                </Field>
                <Field label="العنوان بالإنجليزية">
                  <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} placeholder="Title in English" style={iStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="الفئة *">
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={iStyle}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="المؤلف">
                  <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="اسم المؤلف" style={iStyle} />
                </Field>
              </div>

              <Field label="الوصف">
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="وصف مختصر للكتاب..." style={{ ...iStyle, resize: 'vertical' }} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="المؤسسة">
                  <select value={form.institution_id} onChange={e => setForm({ ...form, institution_id: e.target.value })} style={iStyle}>
                    <option value="">— عامة —</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name_ar || i.name}</option>)}
                  </select>
                </Field>
                <Field label="سنة النشر">
                  <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2024" min="1900" max="2099" style={iStyle} />
                </Field>
                <Field label="عدد الصفحات">
                  <input type="number" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} placeholder="0" min="1" style={iStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="اللغة">
                  <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} style={iStyle}>
                    <option value="ar">العربية</option>
                    <option value="en">الإنجليزية</option>
                    <option value="other">أخرى</option>
                  </select>
                </Field>
                <Field label="النوع">
                  <select value={form.is_free ? 'free' : 'paid'} onChange={e => setForm({ ...form, is_free: e.target.value === 'free' })} style={iStyle}>
                    <option value="free">مجاني</option>
                    <option value="paid">يتطلب اشتراك</option>
                  </select>
                </Field>
              </div>

              <Field label="رابط الملف (PDF أو مستند)">
                <input value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." style={iStyle} />
              </Field>

              <Field label="رابط خارجي (موقع اشتراك)">
                <input value={form.external_url} onChange={e => setForm({ ...form, external_url: e.target.value })} placeholder="https://..." style={iStyle} />
              </Field>

              <Field label="رابط صورة الغلاف">
                <input value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." style={iStyle} />
              </Field>

              <Field label="الوسوم (مفصولة بفاصلة)">
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="قيادة، إدارة، تطوير..." style={iStyle} />
              </Field>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', borderRadius: 12, background: submitting ? '#ccc' : `linear-gradient(135deg, ${C.teal}, ${C.green})`, border: 'none', color: C.primary, fontWeight: 800, fontSize: '0.95rem', cursor: submitting ? 'default' : 'pointer' }}>
                  {submitting ? 'جاري الإضافة...' : '+ إضافة للمكتبة'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setErr(''); setForm(emptyForm); }} style={{ padding: '12px 20px', borderRadius: 12, background: '#f3f4f6', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 600 }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
