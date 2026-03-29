'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadImage } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

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

function SectionBox({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${color}30`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ background: `${color}12`, borderBottom: `1px solid ${color}20`, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.05rem' }}>{icon}</span>
        <span style={{ fontWeight: 700, color, fontSize: '0.88rem' }}>{title}</span>
      </div>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function TabBtn({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${color}`, background: active ? color : 'transparent', color: active ? 'white' : color, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.18s' }}>
      {children}
    </button>
  );
}

interface UploadZoneProps {
  accept: string; icon: string; hint: string;
  file: File | null; progress: number; uploading: boolean;
  uploaded: boolean; uploadedUrl: string;
  onFile: (f: File) => void; onClear: () => void;
}
function UploadZone({ accept, icon, hint, file, progress, uploading, uploaded, uploadedUrl, onFile, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  if (uploaded && uploadedUrl) {
    return (
      <div style={{ padding: '13px 16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.4rem' }}>✅</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.85rem' }}>تم الرفع بنجاح</div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedUrl}</div>
        </div>
        <button type="button" onClick={onClear} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>تغيير</button>
      </div>
    );
  }

  if (uploading) {
    return (
      <div style={{ padding: '14px 16px', background: '#eff6ff', border: '1.5px dashed #93c5fd', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '1.1rem' }}>📤</span>
          <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600 }}>جاري الرفع... {progress}%</span>
        </div>
        <div style={{ background: '#dbeafe', borderRadius: 8, height: 7, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', height: '100%', width: `${progress}%`, borderRadius: 8, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      style={{ padding: '22px 16px', border: `2px dashed ${drag ? '#3b82f6' : '#d1d5db'}`, borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: drag ? '#eff6ff' : '#fafafa', transition: 'all 0.2s' }}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; onFile(f); } }} />
      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{icon}</div>
      {file ? (
        <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>{file.name} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({(file.size / 1024 / 1024).toFixed(1)} MB)</span></div>
      ) : (
        <>
          <div style={{ fontSize: '0.88rem', color: '#4b5563', fontWeight: 600, marginBottom: 3 }}>اسحب الملف هنا أو انقر للاختيار</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{hint}</div>
        </>
      )}
    </div>
  );
}

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
  const [pdfUpload, setPdfUpload] = useState<{ file: File | null; progress: number; uploading: boolean }>({ file: null, progress: 0, uploading: false });
  const [coverUpload, setCoverUpload] = useState<{ file: File | null; progress: number; uploading: boolean; preview: string }>({ file: null, progress: 0, uploading: false, preview: '' });
  const [fileTab, setFileTab] = useState<'upload' | 'url'>('upload');
  const [coverTab, setCoverTab] = useState<'upload' | 'url'>('url');

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH = { 'X-Session-ID': sid };

  const uploadFileToServer = (file: File, onProgress: (p: number) => void): Promise<string> =>
    new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('file', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/library/upload`);
      xhr.setRequestHeader('X-Session-ID', sid);
      xhr.upload.addEventListener('progress', (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); });
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { const d = JSON.parse(xhr.responseText); if (d.url) resolve(d.url); else reject(new Error(d.error || 'لا يوجد رابط')); }
          catch { reject(new Error('استجابة غير صالحة')); }
        } else {
          try { const er = JSON.parse(xhr.responseText); reject(new Error(er.error || `HTTP ${xhr.status}`)); }
          catch { reject(new Error(`فشل الرفع: HTTP ${xhr.status}`)); }
        }
      };
      xhr.onerror = () => reject(new Error('فشل الاتصال'));
      xhr.timeout = 120000;
      xhr.ontimeout = () => reject(new Error('انتهت مهلة الرفع'));
      xhr.send(fd);
    });

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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, direction: 'rtl', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto', boxShadow: `0 30px 100px ${C.primary}50` }}>

            {/* Modal Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.teal})`, borderRadius: '24px 24px 0 0', padding: '26px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>📚 إضافة كتاب / مصدر معرفي</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: '0.82rem' }}>أضف مصدراً معرفياً جديداً للمكتبة الحضارية</p>
              </div>
              <button onClick={() => { setShowCreate(false); setErr(''); setForm(emptyForm); setPdfUpload({ file: null, progress: 0, uploading: false }); setCoverUpload({ file: null, progress: 0, uploading: false, preview: '' }); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, width: 38, height: 38, color: 'white', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ padding: '28px 32px' }}>
              {err && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⚠️</span>{err}
                </div>
              )}

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* ── 1. المعلومات الأساسية ── */}
                <SectionBox icon="📋" title="المعلومات الأساسية" color={C.teal}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="العنوان بالعربية *">
                      <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="عنوان الكتاب" style={iStyle} />
                    </Field>
                    <Field label="العنوان بالإنجليزية">
                      <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} placeholder="Book Title" style={iStyle} />
                    </Field>
                    <Field label="المؤلف">
                      <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="اسم المؤلف" style={iStyle} />
                    </Field>
                    <Field label="الفئة *">
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={iStyle}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </Field>
                    <Field label="اللغة">
                      <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} style={iStyle}>
                        <option value="ar">العربية</option>
                        <option value="en">الإنجليزية</option>
                        <option value="other">أخرى</option>
                      </select>
                    </Field>
                    <Field label="النوع">
                      <select value={form.is_free ? 'free' : 'paid'} onChange={e => setForm({ ...form, is_free: e.target.value === 'free' })} style={iStyle}>
                        <option value="free">🆓 مجاني</option>
                        <option value="paid">🔒 يتطلب اشتراك</option>
                      </select>
                    </Field>
                  </div>
                </SectionBox>

                {/* ── 2. الوصف والمحتوى ── */}
                <SectionBox icon="📝" title="الوصف والمحتوى" color={C.primary}>
                  <Field label="الوصف">
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="وصف مختصر للكتاب أو المصدر المعرفي..." style={{ ...iStyle, resize: 'vertical' }} />
                  </Field>
                  <Field label="الوسوم (مفصولة بفاصلة)">
                    <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="مثال: قيادة، تنمية، إدارة، ثقافة..." style={iStyle} />
                  </Field>
                </SectionBox>

                {/* ── 3. ملف الكتاب ── */}
                <SectionBox icon="📄" title="ملف الكتاب" color="#FF9B4E">
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <TabBtn active={fileTab === 'upload'} color="#FF9B4E" onClick={() => setFileTab('upload')}>⬆️ رفع من الجهاز</TabBtn>
                    <TabBtn active={fileTab === 'url'} color="#FF9B4E" onClick={() => setFileTab('url')}>🔗 رابط URL</TabBtn>
                  </div>
                  {fileTab === 'upload' ? (
                    <UploadZone
                      accept=".pdf,.doc,.docx,.epub"
                      icon="📄"
                      hint="PDF, DOC, EPUB — الحد الأقصى 50MB"
                      file={pdfUpload.file}
                      progress={pdfUpload.progress}
                      uploading={pdfUpload.uploading}
                      uploaded={!!form.file_url && pdfUpload.file !== null}
                      uploadedUrl={form.file_url}
                      onFile={async (f) => {
                        setPdfUpload({ file: f, progress: 0, uploading: true });
                        try {
                          const url = await uploadFileToServer(f, (p) => setPdfUpload(prev => ({ ...prev, progress: p })));
                          setForm(prev => ({ ...prev, file_url: url }));
                          setPdfUpload(prev => ({ ...prev, uploading: false, progress: 100 }));
                        } catch (ex: any) {
                          setErr('فشل رفع الملف: ' + ex.message);
                          setPdfUpload({ file: null, progress: 0, uploading: false });
                        }
                      }}
                      onClear={() => { setPdfUpload({ file: null, progress: 0, uploading: false }); setForm(prev => ({ ...prev, file_url: '' })); }}
                    />
                  ) : (
                    <Field label="رابط الملف (PDF أو رابط مستند)">
                      <input value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." style={iStyle} />
                    </Field>
                  )}
                </SectionBox>

                {/* ── 4. صورة الغلاف ── */}
                <SectionBox icon="🖼️" title="صورة الغلاف" color={C.green}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <TabBtn active={coverTab === 'upload'} color={C.green} onClick={() => setCoverTab('upload')}>⬆️ رفع من الجهاز</TabBtn>
                    <TabBtn active={coverTab === 'url'} color={C.green} onClick={() => setCoverTab('url')}>🔗 رابط URL</TabBtn>
                  </div>
                  {coverTab === 'upload' ? (
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <UploadZone
                          accept="image/*"
                          icon="🖼️"
                          hint="JPG, PNG, WebP — الحد الأقصى 5MB"
                          file={coverUpload.file}
                          progress={coverUpload.progress}
                          uploading={coverUpload.uploading}
                          uploaded={!!form.cover_url && coverUpload.file !== null}
                          uploadedUrl={form.cover_url}
                          onFile={async (f) => {
                            const preview = URL.createObjectURL(f);
                            setCoverUpload({ file: f, progress: 0, uploading: true, preview });
                            try {
                              const result = await uploadImage(f, (p) => setCoverUpload(prev => ({ ...prev, progress: p })));
                              setForm(prev => ({ ...prev, cover_url: result.url }));
                              setCoverUpload(prev => ({ ...prev, uploading: false, progress: 100 }));
                            } catch (ex: any) {
                              setErr('فشل رفع الصورة: ' + ex.message);
                              setCoverUpload({ file: null, progress: 0, uploading: false, preview: '' });
                            }
                          }}
                          onClear={() => { setCoverUpload({ file: null, progress: 0, uploading: false, preview: '' }); setForm(prev => ({ ...prev, cover_url: '' })); }}
                        />
                      </div>
                      {(coverUpload.preview || form.cover_url) && (
                        <img src={coverUpload.preview || form.cover_url} alt="غلاف" style={{ width: 88, height: 124, objectFit: 'cover', borderRadius: 10, border: `2px solid ${C.green}40`, flexShrink: 0, boxShadow: '0 4px 12px #0002' }} />
                      )}
                    </div>
                  ) : (
                    <Field label="رابط صورة الغلاف">
                      <input value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." style={iStyle} />
                    </Field>
                  )}
                </SectionBox>

                {/* ── 5. تفاصيل إضافية ── */}
                <SectionBox icon="🏛️" title="تفاصيل إضافية" color={C.primary}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <Field label="المؤسسة">
                      <select value={form.institution_id} onChange={e => setForm({ ...form, institution_id: e.target.value })} style={iStyle}>
                        <option value="">— عامة —</option>
                        {institutions.map(i => <option key={i.id} value={i.id}>{i.name_ar || i.name}</option>)}
                      </select>
                    </Field>
                    <Field label="سنة النشر">
                      <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder={String(new Date().getFullYear())} min="1800" max="2099" style={iStyle} />
                    </Field>
                    <Field label="عدد الصفحات">
                      <input type="number" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} placeholder="0" min="1" style={iStyle} />
                    </Field>
                  </div>
                  <Field label="رابط خارجي (موقع اشتراك أو مصدر)">
                    <input value={form.external_url} onChange={e => setForm({ ...form, external_url: e.target.value })} placeholder="https://..." style={iStyle} />
                  </Field>
                </SectionBox>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                  <button type="submit" disabled={submitting || pdfUpload.uploading || coverUpload.uploading}
                    style={{ flex: 1, padding: '14px', borderRadius: 14, background: (submitting || pdfUpload.uploading || coverUpload.uploading) ? '#d1d5db' : `linear-gradient(135deg, ${C.primary}, ${C.teal})`, border: 'none', color: (submitting || pdfUpload.uploading || coverUpload.uploading) ? '#9ca3af' : 'white', fontWeight: 800, fontSize: '1rem', cursor: (submitting || pdfUpload.uploading || coverUpload.uploading) ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                    {pdfUpload.uploading ? `📤 رفع الملف ${pdfUpload.progress}%...` : coverUpload.uploading ? `📤 رفع الصورة ${coverUpload.progress}%...` : submitting ? '⏳ جاري الإضافة...' : '+ إضافة للمكتبة'}
                  </button>
                  <button type="button" onClick={() => { setShowCreate(false); setErr(''); setForm(emptyForm); setPdfUpload({ file: null, progress: 0, uploading: false }); setCoverUpload({ file: null, progress: 0, uploading: false, preview: '' }); }}
                    style={{ padding: '14px 24px', borderRadius: 14, background: '#f3f4f6', border: 'none', color: '#555', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>إلغاء</button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
