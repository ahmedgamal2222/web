'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { uploadImage } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
  darkCard: '#1e1650',
};

const CATEGORIES = [
  { value: 'all', label: 'الكل', icon: '📚', color: COLORS.teal },
  { value: 'institution_book', label: 'كتب المؤسسات', icon: '🏛️', color: '#85C79A' },
  { value: 'sector_book', label: 'كتب القطاع الحضاري', icon: '🌟', color: '#FFD700' },
  { value: 'report', label: 'التقارير', icon: '📊', color: '#FF9B4E' },
  { value: 'subscription', label: 'اشتراكات خارجية', icon: '🔗', color: '#C084FC' },
];

const CATEGORY_LABEL: Record<string, string> = {
  institution_book: 'كتب المؤسسات',
  sector_book: 'كتب القطاع الحضاري',
  report: 'تقرير',
  subscription: 'اشتراك خارجي',
};

const CATEGORY_COLOR: Record<string, string> = {
  institution_book: '#85C79A',
  sector_book: '#FFD700',
  report: '#FF9B4E',
  subscription: '#C084FC',
};

interface Book {
  id: number;
  title: string;
  title_en?: string;
  author?: string;
  description?: string;
  category: string;
  institution_id?: number;
  institution_name_ar?: string;
  institution_name?: string;
  logo_url?: string;
  file_url?: string;
  external_url?: string;
  cover_url?: string;
  year?: number;
  pages?: number;
  language: string;
  tags?: string;
  is_free: number;
  downloads: number;
  created_at: string;
}

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none', textDecoration: 'none' }}>
      <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
        <svg width="46" height="46" viewBox="0 0 54 54" fill="none">
          <defs>
            <radialGradient id="rg_core_lib" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EDF7BD" />
              <stop offset="42%" stopColor="#85C79A" />
              <stop offset="100%" stopColor="#4E8D9C" />
            </radialGradient>
          </defs>
          <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
          <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
          <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_core_lib)" />
          <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, lineHeight: 1.1, background: 'linear-gradient(130deg, #EDF7BD 0%, #85C79A 48%, #4E8D9C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          المجرة الحضارية
        </div>
        <div style={{ fontSize: '0.75rem', color: '#4E8D9C', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9 }}>
          Civilization Galaxy
        </div>
      </div>
    </Link>
  );
}

function BookCover({ book }: { book: Book }) {
  const catColor = CATEGORY_COLOR[book.category] || COLORS.teal;
  const initials = book.title.substring(0, 2);

  if (book.cover_url) {
    return (
      <div style={{ position: 'relative', width: '100%', paddingBottom: '140%', overflow: 'hidden', borderRadius: '12px 12px 0 0', flexShrink: 0 }}>
        <Image src={book.cover_url} alt={book.title} fill style={{ objectFit: 'cover' }} />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', paddingBottom: '140%', borderRadius: '12px 12px 0 0', position: 'relative', flexShrink: 0,
      background: `linear-gradient(135deg, ${COLORS.darkCard}, ${catColor}22)`,
      border: `1px solid ${catColor}30`,
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ fontSize: '2rem', opacity: 0.4 }}>📖</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: catColor, opacity: 0.6, direction: 'rtl' }}>{initials}</div>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 30%, ${catColor}18, transparent 70%)` }} />
      </div>
    </div>
  );
}

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const catColor = CATEGORY_COLOR[book.category] || COLORS.teal;
  const tags: string[] = (() => { try { return JSON.parse(book.tags || '[]'); } catch { return []; } })();

  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(160deg, rgba(30,22,80,0.97) 0%, rgba(40,28,89,0.9) 100%)`,
        border: `1px solid ${catColor}28`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        position: 'relative' as const,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.012)';
        e.currentTarget.style.boxShadow = `0 16px 48px ${catColor}28, 0 4px 20px rgba(0,0,0,0.4)`;
        e.currentTarget.style.borderColor = `${catColor}60`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)';
        e.currentTarget.style.borderColor = `${catColor}28`;
      }}
    >
      <BookCover book={book} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: `${catColor}20`, color: catColor, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
            {CATEGORY_LABEL[book.category] || book.category}
          </span>
          {book.is_free ? (
            <span style={{ background: 'rgba(133,199,154,0.15)', color: '#85C79A', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>مجاني</span>
          ) : (
            <span style={{ background: 'rgba(255,155,78,0.15)', color: '#FF9B4E', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>اشتراك</span>
          )}
        </div>

        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.4, margin: 0 }}>
          {book.title}
        </h3>

        {book.author && (
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>✍️ {book.author}</p>
        )}

        {book.description && (
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
            {book.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${catColor}18` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {book.year && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{book.year}</span>}
            {book.pages && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{book.pages} صفحة</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: '0.75rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {book.downloads}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const catColor = CATEGORY_COLOR[book.category] || COLORS.teal;
  const tags: string[] = (() => { try { return JSON.parse(book.tags || '[]'); } catch { return []; } })();

  const handleDownload = () => {
    const url = book.file_url || book.external_url;
    if (url) window.open(url, '_blank');
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div style={{ background: 'linear-gradient(145deg, #1a1240, #0f0a2e)', border: `1px solid ${catColor}35`, borderRadius: 24, maxWidth: 600, width: '100%', maxHeight: '85vh', overflow: 'auto', boxShadow: `0 32px 100px rgba(0,0,0,0.7), 0 0 60px ${catColor}18` }}>
        <div style={{ height: 5, background: `linear-gradient(90deg, ${catColor}, ${COLORS.softGreen})` }} />
        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ background: `${catColor}25`, color: catColor, padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>
                  {CATEGORY_LABEL[book.category] || book.category}
                </span>
                {book.is_free ? (
                  <span style={{ background: 'rgba(133,199,154,0.2)', color: '#85C79A', padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>مجاني</span>
                ) : (
                  <span style={{ background: 'rgba(255,155,78,0.2)', color: '#FF9B4E', padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>اشتراك مطلوب</span>
                )}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.3, marginBottom: 6 }}>{book.title}</h2>
              {book.title_en && <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>{book.title_en}</p>}
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '8px 14px', cursor: 'pointer', color: '#fff', fontSize: '1rem', marginRight: 8, flexShrink: 0 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'المؤلف', value: book.author || '—' },
              { label: 'السنة', value: book.year?.toString() || '—' },
              { label: 'الصفحات', value: book.pages ? `${book.pages} صفحة` : '—' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#4E8D9C', fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {book.description && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: '#a0aec0', margin: 0 }}>{book.description}</p>
            </div>
          )}

          {book.institution_name_ar && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: 'rgba(78,141,156,0.08)', borderRadius: 12, border: '1px solid rgba(78,141,156,0.2)' }}>
              {book.logo_url && <Image src={book.logo_url} alt={book.institution_name_ar} width={32} height={32} style={{ borderRadius: 8, objectFit: 'contain' }} />}
              <span style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>{book.institution_name_ar}</span>
            </div>
          )}

          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {tags.map(tag => (
                <span key={tag} style={{ background: 'rgba(133,199,154,0.1)', color: '#85C79A', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>#{tag}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            {(book.file_url || book.external_url) && (
              <button
                onClick={handleDownload}
                style={{ flex: 1, padding: '14px 24px', background: `linear-gradient(135deg, ${catColor}, #85C79A)`, border: 'none', borderRadius: 14, cursor: 'pointer', color: '#1a1240', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 24px ${catColor}40`, transition: 'all 0.2s' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {book.file_url ? 'تحميل الكتاب' : 'فتح الرابط'}
              </button>
            )}
            <button onClick={onClose} style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', title_en: '', author: '', description: '',
    file_url: '', external_url: '', cover_url: '',
    year: '', pages: '', tags: '', is_free: true,
    language: 'ar',
  });
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [pdfUpload, setPdfUpload]   = useState<{ file: File | null; progress: number; uploading: boolean }>({ file: null, progress: 0, uploading: false });
  const [coverUpload, setCoverUpload] = useState<{ file: File | null; progress: number; uploading: boolean; preview: string }>({ file: null, progress: 0, uploading: false, preview: '' });
  const [fileTab, setFileTab]   = useState<'upload' | 'url'>('upload');
  const [coverTab, setCoverTab] = useState<'upload' | 'url'>('url');
  const limit = 24;

  useEffect(() => {
    const uStr = localStorage.getItem('user');
    if (uStr) { try { setUser(JSON.parse(uStr)); } catch { /* */ } }
    fetchBooks();
  }, [activeCategory, search, page]);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';

  const uploadFileToServer = (file: File, onProgress: (p: number) => void): Promise<string> =>
    new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('file', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/library/upload`);
      xhr.setRequestHeader('X-Session-ID', sid);
      xhr.upload.addEventListener('progress', e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); });
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { const d = JSON.parse(xhr.responseText); if (d.url) resolve(d.url); else reject(new Error(d.error || 'لا يوجد رابط')); }
          catch { reject(new Error('استجابة غير صالحة')); }
        } else {
          try { const er = JSON.parse(xhr.responseText); reject(new Error(er.error || `HTTP ${xhr.status}`)); }
          catch { reject(new Error(`فشل HTTP ${xhr.status}`)); }
        }
      };
      xhr.onerror   = () => reject(new Error('فشل الاتصال'));
      xhr.timeout   = 120000;
      xhr.ontimeout = () => reject(new Error('انتهت مهلة الرفع'));
      xhr.send(fd);
    });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        page: String(page),
        ...(activeCategory !== 'all' && { category: activeCategory }),
        ...(search && { search }),
      });
      const res = await fetch(`${API_BASE}/api/library?${params}`);
      const data = await res.json();
      setBooks(data.data || []);
      setTotal(data.total || 0);
    } catch { setBooks([]); }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) { setCreateErr('العنوان مطلوب'); return; }
    setCreating(true); setCreateErr('');
    try {
      const tagsArr = createForm.tags ? createForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const res = await fetch(`${API_BASE}/api/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify({
          title: createForm.title,
          title_en: createForm.title_en || undefined,
          author: createForm.author || undefined,
          description: createForm.description || undefined,
          category: 'institution_book',
          institution_id: user?.institution_id || undefined,
          file_url: createForm.file_url || undefined,
          external_url: createForm.external_url || undefined,
          cover_url: createForm.cover_url || undefined,
          year: createForm.year ? Number(createForm.year) : undefined,
          pages: createForm.pages ? Number(createForm.pages) : undefined,
          language: createForm.language,
          tags: tagsArr,
          is_free: createForm.is_free,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'فشل الإضافة');
      setShowCreate(false);
      setCreateForm({ title: '', title_en: '', author: '', description: '', file_url: '', external_url: '', cover_url: '', year: '', pages: '', tags: '', is_free: true, language: 'ar' });
      setPdfUpload({ file: null, progress: 0, uploading: false });
      setCoverUpload({ file: null, progress: 0, uploading: false, preview: '' });
      setFileTab('upload'); setCoverTab('url');
      fetchBooks();
    } catch (ex: any) {
      setCreateErr(ex.message);
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const canAddBook = user && (user.role === 'institution_admin' || user.role === 'admin');

  return (
    <div style={{ minHeight: '100dvh', background: '#080520', color: '#fff', fontFamily: "'Cairo', sans-serif", direction: 'rtl' }}>
      {/* Stars background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(80)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'white', opacity: Math.random() * 0.5 + 0.05, width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite alternate`, animationDelay: `${Math.random() * 3}s` }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 60% at 50% 10%, rgba(78,141,156,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(133,199,154,0.06) 0%, transparent 60%)' }} />
      </div>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(8,5,32,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(78,141,156,0.2)', boxShadow: '0 2px 32px rgba(0,0,0,0.5)', gap: 12 }}>
        <GalaxyLogo />
        <nav style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'center' }}>
          {[{ href: '/news', label: 'الأخبار' }, { href: '/campaigns', label: 'الحملات' }, { href: '/marketplace', label: 'السوق الرقمي' }, { href: '/services', label: 'الخدمات' }, { href: '/library', label: 'المكتبة', active: true }, { href: '/forum', label: 'المنتدى' }, { href: '/podcast', label: 'البودكاست' }].map(link => (
            <Link key={link.href} href={link.href} style={{ padding: '8px 16px', borderRadius: 24, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, color: (link as any).active ? COLORS.darkNavy : '#9ca3af', background: (link as any).active ? `linear-gradient(135deg, ${COLORS.softGreen}, ${COLORS.teal})` : 'transparent', border: (link as any).active ? 'none' : '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{link.label}</Link>
          ))}
        </nav>

      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1320, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(78,141,156,0.1)', border: '1px solid rgba(78,141,156,0.3)', borderRadius: 40, padding: '8px 20px', marginBottom: 24 }}>
            <span style={{ fontSize: '1.2rem' }}>📚</span>
            <span style={{ fontSize: '0.85rem', color: COLORS.teal, fontWeight: 700, letterSpacing: '0.1em' }}>GALAXY LIBRARY</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', background: 'linear-gradient(135deg, #fff 0%, #EDF7BD 40%, #85C79A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            مكتبة المجرة الحضارية
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
            المستودع المعرفي للمؤسسات — كتب، تقارير، ومصادر معرفية منتقاة لبناء القطاع الحضاري
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            {[{ icon: '📖', label: 'كتب المؤسسات' }, { icon: '📊', label: 'تقارير القطاع' }, { icon: '🔗', label: 'اشتراكات خارجية' }].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b' }}>
                <span>{f.icon}</span><span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Add Book */}
        <form onSubmit={handleSearch} style={{ maxWidth: canAddBook ? 780 : 620, margin: '0 auto 40px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(78,141,156,0.28)', borderRadius: 60, padding: '6px 6px 6px 10px', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', transition: 'box-shadow 0.2s, border-color 0.2s' }}
            onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = COLORS.teal; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px rgba(0,0,0,0.35), 0 0 0 3px ${COLORS.teal}22, inset 0 1px 0 rgba(255,255,255,0.05)`; }}
            onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(78,141,156,0.28)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'; }}
          >
            {/* Icon */}
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 4, paddingLeft: 2, flexShrink: 0 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={COLORS.teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            {/* Input */}
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ابحث في الكتب والتقارير والمصادر المعرفية..."
              style={{ flex: 1, padding: '12px 4px', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.95rem', fontFamily: "'Cairo', sans-serif", outline: 'none', minWidth: 0 }}
            />
            {/* Search btn */}
            <button
              type="submit"
              style={{ padding: '11px 22px', background: `linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.softGreen} 100%)`, border: 'none', borderRadius: 50, cursor: 'pointer', color: COLORS.darkNavy, fontWeight: 800, fontSize: '0.88rem', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 4px 16px rgba(78,141,156,0.35)', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 22px rgba(78,141,156,0.55)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(78,141,156,0.35)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              بحث
            </button>
            {/* Add Book btn */}
            {canAddBook && (
              <>
                <div style={{ width: 1, background: 'rgba(78,141,156,0.25)', margin: '6px 2px', flexShrink: 0 }} />
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  style={{ padding: '11px 20px', background: `linear-gradient(135deg, ${COLORS.darkNavy} 0%, #3a2a8a 100%)`, border: `1px solid rgba(133,199,154,0.35)`, borderRadius: 50, cursor: 'pointer', color: COLORS.softGreen, fontWeight: 800, fontSize: '0.88rem', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.22s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.softGreen} 0%, ${COLORS.teal} 100%)`; e.currentTarget.style.color = COLORS.darkNavy; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = `0 6px 22px rgba(133,199,154,0.4)`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.darkNavy} 0%, #3a2a8a 100%)`; e.currentTarget.style.color = COLORS.softGreen; e.currentTarget.style.borderColor = 'rgba(133,199,154,0.35)'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08)'; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  إضافة كتاب
                </button>
              </>
            )}
          </div>
        </form>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 44 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => { setActiveCategory(cat.value); setPage(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: activeCategory === cat.value ? `linear-gradient(135deg, ${cat.color}35, ${cat.color}18)` : 'rgba(255,255,255,0.04)', border: `1px solid ${activeCategory === cat.value ? cat.color + '70' : 'rgba(255,255,255,0.08)'}`, borderRadius: 40, cursor: 'pointer', color: activeCategory === cat.value ? cat.color : '#9ca3af', fontSize: '0.88rem', fontWeight: 600, fontFamily: "'Cairo', sans-serif", transition: 'all 0.2s', boxShadow: activeCategory === cat.value ? `0 0 20px ${cat.color}20` : 'none' }}
            >
              <span>{cat.icon}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <div style={{ textAlign: 'center', marginBottom: 32, fontSize: '0.88rem', color: '#4b5563' }}>
            {total > 0 ? `${total} كتاب ومصدر معرفي` : 'لا توجد نتائج'}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 340, background: 'rgba(255,255,255,0.03)', borderRadius: 16, animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4b5563' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>📚</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>المكتبة تترقب إضافاتك</p>
            <p style={{ fontSize: '0.9rem', marginTop: 8, opacity: 0.7 }}>كن أول من يضيف كتاباً للمجرة الحضارية</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {books.map(book => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 48 }}>
            {page > 1 && (
              <button onClick={() => setPage(p => p - 1)} style={{ padding: '10px 22px', background: 'rgba(78,141,156,0.1)', border: '1px solid rgba(78,141,156,0.3)', borderRadius: 40, color: COLORS.teal, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>السابق</button>
            )}
            <span style={{ padding: '10px 20px', color: '#6b7280', fontSize: '0.9rem' }}>صفحة {page} من {totalPages}</span>
            {page < totalPages && (
              <button onClick={() => setPage(p => p + 1)} style={{ padding: '10px 22px', background: 'rgba(78,141,156,0.1)', border: '1px solid rgba(78,141,156,0.3)', borderRadius: 40, color: COLORS.teal, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>التالي</button>
            )}
          </div>
        )}
      </main>

      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}

      {/* Create Book Modal (institution_admin) */}
      {showCreate && (() => {
        const iS: React.CSSProperties = { width: '100%', padding: '11px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(78,141,156,0.28)', borderRadius: 10, color: '#fff', fontSize: '0.9rem', fontFamily: "'Cairo',sans-serif", outline: 'none', boxSizing: 'border-box' };
        const lS: React.CSSProperties = { fontSize: '0.78rem', color: COLORS.teal, fontWeight: 700, marginBottom: 6, display: 'block', letterSpacing: '0.03em' };
        const busy = pdfUpload.uploading || coverUpload.uploading || creating;

        const resetModal = () => {
          setShowCreate(false); setCreateErr('');
          setCreateForm({ title: '', title_en: '', author: '', description: '', file_url: '', external_url: '', cover_url: '', year: '', pages: '', tags: '', is_free: true, language: 'ar' });
          setPdfUpload({ file: null, progress: 0, uploading: false });
          setCoverUpload({ file: null, progress: 0, uploading: false, preview: '' });
          setFileTab('upload'); setCoverTab('url');
        };

        const TabPill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
          <button type="button" onClick={onClick} style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${active ? COLORS.teal : 'rgba(78,141,156,0.25)'}`, background: active ? `${COLORS.teal}22` : 'transparent', color: active ? COLORS.teal : '#6b7280', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Cairo',sans-serif", transition: 'all 0.18s' }}>{children}</button>
        );

        const ProgressBar = ({ pct, color }: { pct: number; color: string }) => (
          <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${COLORS.softGreen})`, borderRadius: 6, transition: 'width 0.3s ease' }} />
          </div>
        );

        return (
          <div onClick={e => e.target === e.currentTarget && resetModal()} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'linear-gradient(160deg, #1a1240 0%, #0d0820 100%)', border: '1px solid rgba(78,141,156,0.28)', borderRadius: 26, maxWidth: 620, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 60px rgba(78,141,156,0.08)' }}>

              {/* top accent */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.softGreen}, ${COLORS.teal})`, borderRadius: '26px 26px 0 0' }} />

              {/* Header */}
              <div style={{ padding: '26px 30px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>📚 إضافة كتاب لمؤسستك</h2>
                  <p style={{ color: '#4b5563', margin: '5px 0 0', fontSize: '0.82rem' }}>ارفع ملفاتك مباشرة أو أدخل الروابط</p>
                </div>
                <button onClick={resetModal} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, width: 36, height: 36, color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
              </div>

              <div style={{ padding: '20px 30px 30px' }}>
                {createErr && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '11px 16px', color: '#f87171', marginBottom: 18, fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>⚠️</span>{createErr}
                  </div>
                )}

                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* ── Basic Info ── */}
                  <div style={{ background: 'rgba(78,141,156,0.06)', border: '1px solid rgba(78,141,156,0.18)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 18px', borderBottom: '1px solid rgba(78,141,156,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.95rem' }}>📋</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: COLORS.teal }}>المعلومات الأساسية</span>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={lS}>العنوان بالعربية *</label>
                          <input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} required placeholder="عنوان الكتاب" style={iS} />
                        </div>
                        <div>
                          <label style={lS}>العنوان بالإنجليزية</label>
                          <input value={createForm.title_en} onChange={e => setCreateForm(p => ({ ...p, title_en: e.target.value }))} placeholder="Book Title" style={iS} />
                        </div>
                        <div>
                          <label style={lS}>المؤلف</label>
                          <input value={createForm.author} onChange={e => setCreateForm(p => ({ ...p, author: e.target.value }))} placeholder="اسم المؤلف" style={iS} />
                        </div>
                        <div>
                          <label style={lS}>اللغة</label>
                          <select value={createForm.language} onChange={e => setCreateForm(p => ({ ...p, language: e.target.value }))} style={{ ...iS, cursor: 'pointer' }}>
                            <option value="ar" style={{ background: '#1a1240' }}>العربية</option>
                            <option value="en" style={{ background: '#1a1240' }}>الإنجليزية</option>
                            <option value="other" style={{ background: '#1a1240' }}>أخرى</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={lS}>الوصف</label>
                        <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="وصف مختصر للكتاب..." style={{ ...iS, resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={lS}>سنة النشر</label>
                          <input type="number" value={createForm.year} onChange={e => setCreateForm(p => ({ ...p, year: e.target.value }))} placeholder={String(new Date().getFullYear())} min="1800" max="2099" style={iS} />
                        </div>
                        <div>
                          <label style={lS}>عدد الصفحات</label>
                          <input type="number" value={createForm.pages} onChange={e => setCreateForm(p => ({ ...p, pages: e.target.value }))} placeholder="200" min="1" style={iS} />
                        </div>
                        <div>
                          <label style={lS}>النوع</label>
                          <select value={createForm.is_free ? 'free' : 'paid'} onChange={e => setCreateForm(p => ({ ...p, is_free: e.target.value === 'free' }))} style={{ ...iS, cursor: 'pointer' }}>
                            <option value="free" style={{ background: '#1a1240' }}>🆓 مجاني</option>
                            <option value="paid" style={{ background: '#1a1240' }}>🔒 اشتراك</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={lS}>الوسوم (مفصولة بفاصلة)</label>
                        <input value={createForm.tags} onChange={e => setCreateForm(p => ({ ...p, tags: e.target.value }))} placeholder="قيادة، إدارة، ثقافة..." style={iS} />
                      </div>
                    </div>
                  </div>

                  {/* ── PDF Upload ── */}
                  <div style={{ background: 'rgba(255,155,78,0.05)', border: '1px solid rgba(255,155,78,0.2)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 18px', borderBottom: '1px solid rgba(255,155,78,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.95rem' }}>📄</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FF9B4E' }}>ملف الكتاب</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <TabPill active={fileTab === 'upload'} onClick={() => setFileTab('upload')}>⬆️ رفع</TabPill>
                        <TabPill active={fileTab === 'url'} onClick={() => setFileTab('url')}>🔗 رابط</TabPill>
                      </div>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      {fileTab === 'url' ? (
                        <input value={createForm.file_url} onChange={e => setCreateForm(p => ({ ...p, file_url: e.target.value }))} placeholder="https://..." style={iS} />
                      ) : createForm.file_url && pdfUpload.file ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(133,199,154,0.08)', border: '1px solid rgba(133,199,154,0.3)', borderRadius: 12 }}>
                          <span style={{ fontSize: '1.5rem' }}>✅</span>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, color: '#85C79A', fontSize: '0.85rem' }}>تم الرفع بنجاح</div>
                            <div style={{ fontSize: '0.72rem', color: '#4ade80', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{createForm.file_url}</div>
                          </div>
                          <button type="button" onClick={() => { setPdfUpload({ file: null, progress: 0, uploading: false }); setCreateForm(p => ({ ...p, file_url: '' })); }} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>تغيير</button>
                        </div>
                      ) : pdfUpload.uploading ? (
                        <div style={{ padding: '16px', background: 'rgba(255,155,78,0.06)', border: '1px dashed rgba(255,155,78,0.3)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: '1.1rem' }}>📤</span>
                            <span style={{ fontSize: '0.85rem', color: '#FF9B4E', fontWeight: 600 }}>جاري الرفع... {pdfUpload.progress}%</span>
                          </div>
                          <ProgressBar pct={pdfUpload.progress} color="#FF9B4E" />
                        </div>
                      ) : (
                        <label style={{ display: 'block', cursor: 'pointer' }}>
                          <input type="file" accept=".pdf,.doc,.docx,.epub" style={{ display: 'none' }} onChange={async e => {
                            const f = e.target.files?.[0]; if (!f) return;
                            e.target.value = '';
                            setPdfUpload({ file: f, progress: 0, uploading: true });
                            try {
                              const url = await uploadFileToServer(f, p => setPdfUpload(prev => ({ ...prev, progress: p })));
                              setCreateForm(prev => ({ ...prev, file_url: url }));
                              setPdfUpload(prev => ({ ...prev, uploading: false, progress: 100 }));
                            } catch (ex: any) {
                              setCreateErr('فشل رفع الملف: ' + ex.message);
                              setPdfUpload({ file: null, progress: 0, uploading: false });
                            }
                          }} />
                          <div style={{ padding: '24px 16px', border: '2px dashed rgba(255,155,78,0.3)', borderRadius: 12, textAlign: 'center', transition: 'all 0.2s', background: 'rgba(255,155,78,0.03)' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF9B4E'; e.currentTarget.style.background = 'rgba(255,155,78,0.07)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,155,78,0.3)'; e.currentTarget.style.background = 'rgba(255,155,78,0.03)'; }}
                          >
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
                            <div style={{ fontSize: '0.88rem', color: '#e5e7eb', fontWeight: 600, marginBottom: 4 }}>اسحب الملف هنا أو انقر للاختيار</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>PDF · DOC · EPUB — حتى 50MB</div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* ── Cover Upload ── */}
                  <div style={{ background: 'rgba(133,199,154,0.05)', border: '1px solid rgba(133,199,154,0.2)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 18px', borderBottom: '1px solid rgba(133,199,154,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.95rem' }}>🖼️</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: COLORS.softGreen }}>صورة الغلاف</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <TabPill active={coverTab === 'upload'} onClick={() => setCoverTab('upload')}>⬆️ رفع</TabPill>
                        <TabPill active={coverTab === 'url'} onClick={() => setCoverTab('url')}>🔗 رابط</TabPill>
                      </div>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      {coverTab === 'url' ? (
                        <input value={createForm.cover_url} onChange={e => setCreateForm(p => ({ ...p, cover_url: e.target.value }))} placeholder="https://..." style={iS} />
                      ) : createForm.cover_url && coverUpload.file ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {coverUpload.preview && <img src={coverUpload.preview} alt="غلاف" style={{ width: 64, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(133,199,154,0.4)', flexShrink: 0 }} />}
                          <div style={{ flex: 1, padding: '12px 14px', background: 'rgba(133,199,154,0.08)', border: '1px solid rgba(133,199,154,0.3)', borderRadius: 12 }}>
                            <div style={{ fontWeight: 700, color: '#85C79A', fontSize: '0.85rem', marginBottom: 4 }}>✅ تم رفع الغلاف</div>
                            <div style={{ fontSize: '0.72rem', color: '#4ade80', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{createForm.cover_url}</div>
                            <button type="button" onClick={() => { setCoverUpload({ file: null, progress: 0, uploading: false, preview: '' }); setCreateForm(p => ({ ...p, cover_url: '' })); }} style={{ marginTop: 8, padding: '3px 12px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}>تغيير</button>
                          </div>
                        </div>
                      ) : coverUpload.uploading ? (
                        <div style={{ padding: '16px', background: 'rgba(133,199,154,0.06)', border: '1px dashed rgba(133,199,154,0.3)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: '1.1rem' }}>🖼️</span>
                            <span style={{ fontSize: '0.85rem', color: COLORS.softGreen, fontWeight: 600 }}>جاري رفع الصورة... {coverUpload.progress}%</span>
                          </div>
                          <ProgressBar pct={coverUpload.progress} color={COLORS.softGreen} />
                        </div>
                      ) : (
                        <label style={{ display: 'block', cursor: 'pointer' }}>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                            const f = e.target.files?.[0]; if (!f) return;
                            e.target.value = '';
                            const preview = URL.createObjectURL(f);
                            setCoverUpload({ file: f, progress: 0, uploading: true, preview });
                            try {
                              const result = await uploadImage(f, p => setCoverUpload(prev => ({ ...prev, progress: p })));
                              setCreateForm(prev => ({ ...prev, cover_url: result.url }));
                              setCoverUpload(prev => ({ ...prev, uploading: false, progress: 100 }));
                            } catch (ex: any) {
                              setCreateErr('فشل رفع الصورة: ' + ex.message);
                              setCoverUpload({ file: null, progress: 0, uploading: false, preview: '' });
                            }
                          }} />
                          <div style={{ padding: '20px 16px', border: '2px dashed rgba(133,199,154,0.3)', borderRadius: 12, textAlign: 'center', transition: 'all 0.2s', background: 'rgba(133,199,154,0.03)' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.softGreen; e.currentTarget.style.background = 'rgba(133,199,154,0.07)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(133,199,154,0.3)'; e.currentTarget.style.background = 'rgba(133,199,154,0.03)'; }}
                          >
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🖼️</div>
                            <div style={{ fontSize: '0.88rem', color: '#e5e7eb', fontWeight: 600, marginBottom: 4 }}>اختر صورة الغلاف</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>JPG · PNG · WebP — حتى 5MB</div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* ── External URL ── */}
                  <div>
                    <label style={lS}>رابط خارجي (اشتراك / مصدر)</label>
                    <input value={createForm.external_url} onChange={e => setCreateForm(p => ({ ...p, external_url: e.target.value }))} placeholder="https://..." style={iS} />
                  </div>

                  {/* Submit */}
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button type="submit" disabled={busy}
                      style={{ flex: 1, padding: '13px 20px', borderRadius: 14, background: busy ? 'rgba(78,141,156,0.2)' : `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})`, border: 'none', color: busy ? '#6b7280' : COLORS.darkNavy, fontWeight: 800, fontSize: '0.95rem', cursor: busy ? 'default' : 'pointer', fontFamily: "'Cairo',sans-serif", transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {pdfUpload.uploading ? `📤 رفع الملف ${pdfUpload.progress}%` : coverUpload.uploading ? `🖼️ رفع الصورة ${coverUpload.progress}%` : creating ? '⏳ جاري الإضافة...' : '+ إضافة الكتاب'}
                    </button>
                    <button type="button" onClick={resetModal}
                      style={{ padding: '13px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontFamily: "'Cairo',sans-serif" }}>إلغاء</button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes twinkle { from { opacity: 0.1; transform: scale(1); } to { opacity: 0.6; transform: scale(1.2); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        ::placeholder { color: rgba(156,163,175,0.6); }
      `}</style>
    </div>
  );
}
