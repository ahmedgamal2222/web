'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadImage } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

interface NewsItem {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  image_url?: string;
  category: string;
  published_at: string;
  institution_id: number;
  institution_name?: string;
  institution_name_ar?: string;
}

interface EventItem {
  id: number;
  title: string;
  description: string;
  type: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_online?: boolean;
  institution_id: number;
  institution_name?: string;
  institution_name_ar?: string;
}

const emptyNews = {
  title: '',
  subtitle: '',
  content: '',
  image_url: '',
  category: 'announcement',
  institution_id: '',
};

const emptyEvent = {
  title: '',
  description: '',
  type: 'conference',
  start_datetime: '',
  end_datetime: '',
  location: '',
  is_online: false,
  online_url: '',
  institution_id: '',
};

export default function AdminNewsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'news' | 'events'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // create news
  const [showCreateNews, setShowCreateNews] = useState(false);
  const [newsForm, setNewsForm] = useState(emptyNews);
  const [newsImgUploading, setNewsImgUploading] = useState(false);
  const [newsImgProgress, setNewsImgProgress] = useState(0);
  const [newsImgPreview, setNewsImgPreview] = useState('');

  // create event
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [eventImgUploading, setEventImgUploading] = useState(false);
  const [eventImgProgress, setEventImgProgress] = useState(0);
  const [eventImgPreview, setEventImgPreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingSubtitle, setEditingSubtitle] = useState<number | null>(null);
  const [subtitleValue, setSubtitleValue] = useState('');
  const [savingSubtitle, setSavingSubtitle] = useState(false);

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH = { 'X-Session-ID': sid, 'Content-Type': 'application/json' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login?redirect=/admin/news');
      return;
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [newsRes, eventsRes, instRes] = await Promise.all([
        fetch(`${API_BASE}/api/news?limit=200`, { headers: { 'X-Session-ID': sid } }),
        fetch(`${API_BASE}/api/events?limit=200`, { headers: { 'X-Session-ID': sid } }),
        fetch(`${API_BASE}/api/institutions?limit=200`, { headers: { 'X-Session-ID': sid } }),
      ]);
      const nd = await newsRes.json();
      const ed = await eventsRes.json();
      const id = await instRes.json();
      setNews(nd.data || nd.items || []);
      setEvents(ed.data || ed.items || []);
      setInstitutions(id.data || id.items || []);
    } catch (e) {
      setErr('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const deleteNews = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    await fetch(`${API_BASE}/api/news/${id}`, { method: 'DELETE', headers: authH });
    setNews(prev => prev.filter(n => n.id !== id));
  };

  const saveSubtitle = async (id: number) => {
    setSavingSubtitle(true);
    try {
      await fetch(`${API_BASE}/api/news/${id}`, {
        method: 'PATCH',
        headers: { ...authH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitle: subtitleValue }),
      });
      setNews(prev => prev.map(n => n.id === id ? { ...n, subtitle: subtitleValue } : n));
      setEditingSubtitle(null);
    } catch { setErr('فشل حفظ العنوان الفرعي'); }
    finally { setSavingSubtitle(false); }
  };

  const deleteEvent = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
    await fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE', headers: authH });
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleNewsImg = async (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setNewsImgPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setNewsImgUploading(true);
    try {
      const r = await uploadImage(file, setNewsImgProgress);
      setNewsForm(p => ({ ...p, image_url: r.url }));
    } catch (e: any) {
      setErr('فشل رفع الصورة: ' + e.message);
    } finally {
      setNewsImgUploading(false);
    }
  };

  const handleEventImg = async (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setEventImgPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setEventImgUploading(true);
    try {
      const r = await uploadImage(file, setEventImgProgress);
      setEventForm(p => ({ ...p, image_url: r.url } as any));
    } catch (e: any) {
      setErr('فشل رفع الصورة: ' + e.message);
    } finally {
      setEventImgUploading(false);
    }
  };

  const submitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) { setErr('العنوان والمحتوى مطلوبان'); return; }
    setSubmitting(true); setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/news`, {
        method: 'POST',
        headers: authH,
        body: JSON.stringify({ ...newsForm, institution_id: Number(newsForm.institution_id) || null }),
      });
      const d = await res.json();
      if (d.success || d.id) {
        setSuccessMsg('تم إنشاء الخبر بنجاح ✅');
        setShowCreateNews(false);
        setNewsForm(emptyNews);
        setNewsImgPreview('');
        loadAll();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErr(d.error || 'حدث خطأ');
      }
    } catch {
      setErr('فشل الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  const submitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.start_datetime) { setErr('العنوان وتاريخ البداية مطلوبان'); return; }
    setSubmitting(true); setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: authH,
        body: JSON.stringify({ ...eventForm, institution_id: Number(eventForm.institution_id) || null }),
      });
      const d = await res.json();
      if (d.success || d.id) {
        setSuccessMsg('تم إنشاء الفعالية بنجاح ✅');
        setShowCreateEvent(false);
        setEventForm(emptyEvent);
        setEventImgPreview('');
        loadAll();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErr(d.error || 'حدث خطأ');
      }
    } catch {
      setErr('فشل الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNews = news.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.institution_name_ar || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = events.filter(ev =>
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    (ev.institution_name_ar || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 16px',
    borderRadius: 10,
    border: `1.5px solid ${C.teal}40`,
    background: '#f8fafc',
    color: C.darkNavy,
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: "'Cairo', sans-serif",
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: '0.88rem',
    fontWeight: 700,
    color: C.darkNavy,
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.lightMint}30, #f8fafc)`, direction: 'rtl', fontFamily: "'Cairo','Tahoma',sans-serif", padding: '32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* شريط العودة */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <Link href="/admin" style={{ background: C.darkNavy, color: 'white', padding: '10px 20px', borderRadius: 40, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            ← لوحة التحكم
          </Link>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: C.darkNavy, margin: 0 }}>إدارة الأخبار والفعاليات 📰</h1>
        </div>

        {/* رسائل */}
        {successMsg && (
          <div style={{ background: `${C.softGreen}20`, border: `1px solid ${C.softGreen}`, borderRadius: 12, padding: '12px 20px', marginBottom: 20, color: C.darkNavy, fontWeight: 600 }}>{successMsg}</div>
        )}
        {err && (
          <div style={{ background: '#fee2e240', border: '1px solid #f87171', borderRadius: 12, padding: '12px 20px', marginBottom: 20, color: '#b91c1c', fontWeight: 600 }}>⚠️ {err}</div>
        )}

        {/* الأزرار والبحث */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* تبويبات */}
          <button onClick={() => setTab('news')} style={{ padding: '11px 24px', borderRadius: 40, border: 'none', background: tab === 'news' ? `linear-gradient(135deg, ${C.teal}, #3a7a8a)` : 'white', color: tab === 'news' ? 'white' : C.teal, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: tab === 'news' ? `0 4px 14px ${C.teal}40` : '0 2px 8px rgba(0,0,0,0.08)', fontFamily: "'Cairo',sans-serif" }}>
            📰 الأخبار ({news.length})
          </button>
          <button onClick={() => setTab('events')} style={{ padding: '11px 24px', borderRadius: 40, border: 'none', background: tab === 'events' ? `linear-gradient(135deg, ${C.teal}, #3a7a8a)` : 'white', color: tab === 'events' ? 'white' : C.teal, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: tab === 'events' ? `0 4px 14px ${C.teal}40` : '0 2px 8px rgba(0,0,0,0.08)', fontFamily: "'Cairo',sans-serif" }}>
            📅 الفعاليات ({events.length})
          </button>

          {/* بحث */}
          <input
            type="text"
            placeholder="🔍 بحث..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '11px 18px', borderRadius: 40, border: `1.5px solid ${C.teal}40`, background: 'white', color: C.darkNavy, fontSize: '0.95rem', outline: 'none', minWidth: 200, fontFamily: "'Cairo',sans-serif" }}
          />

          {/* زر إضافة */}
          <button
            onClick={() => { setErr(''); tab === 'news' ? setShowCreateNews(true) : setShowCreateEvent(true); }}
            style={{ padding: '11px 24px', borderRadius: 40, border: 'none', background: `linear-gradient(135deg, ${C.softGreen}, ${C.teal})`, color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: `0 4px 14px ${C.teal}40`, fontFamily: "'Cairo',sans-serif" }}
          >
            + {tab === 'news' ? 'خبر جديد' : 'فعالية جديدة'}
          </button>
        </div>

        {/* المحتوى */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.teal, fontWeight: 700, fontSize: '1.1rem' }}>⏳ جاري التحميل...</div>
        ) : tab === 'news' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredNews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '1rem' }}>لا توجد أخبار</div>
            ) : filteredNews.map(item => (
              <div key={item.id} style={{ background: 'white', borderRadius: 16, padding: '18px 22px', boxShadow: `0 3px 12px ${C.darkNavy}10`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {item.image_url && (
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: `url(${item.image_url}) center/cover`, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, color: C.darkNavy, fontSize: '1rem', marginBottom: 4 }}>{item.title}</div>
                  {editingSubtitle === item.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <input
                        value={subtitleValue}
                        onChange={e => setSubtitleValue(e.target.value)}
                        placeholder="العنوان الفرعي (لجلب أخبار مشابهة)..."
                        style={{ flex: 1, padding: '5px 10px', borderRadius: 8, border: `1px solid ${C.teal}40`, fontSize: '0.82rem', fontFamily: "'Cairo',sans-serif", outline: 'none' }}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && saveSubtitle(item.id)}
                      />
                      <button onClick={() => saveSubtitle(item.id)} disabled={savingSubtitle} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: C.teal, color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}>
                        {savingSubtitle ? '...' : '✓'}
                      </button>
                      <button onClick={() => setEditingSubtitle(null)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}>✗</button>
                    </div>
                  ) : item.subtitle ? (
                    <div
                      onClick={() => { setEditingSubtitle(item.id); setSubtitleValue(item.subtitle || ''); }}
                      style={{ fontSize: '0.82rem', color: C.teal, marginBottom: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      title="انقر للتعديل"
                    >
                      🏷 {item.subtitle} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>✏️</span>
                    </div>
                  ) : null}
                  <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ background: `${C.teal}18`, color: C.teal, padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>
                      {item.category === 'announcement' ? '📢 إعلان' : item.category === 'achievement' ? '🏆 إنجاز' : '📰 خبر'}
                    </span>
                    <span>{item.institution_name_ar || item.institution_name}</span>
                    <span>{new Date(item.published_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => { setEditingSubtitle(item.id); setSubtitleValue(item.subtitle || ''); }}
                    style={{ padding: '7px 16px', borderRadius: 20, background: `${C.softGreen}25`, color: C.softGreen, border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}
                    title="تعديل العنوان الفرعي"
                  >
                    🏷 subtitle
                  </button>
                  <Link href={`/news/${item.id}`} target="_blank" style={{ padding: '7px 16px', borderRadius: 20, background: `${C.teal}15`, color: C.teal, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                    👁 عرض
                  </Link>
                  <button
                    onClick={() => deleteNews(item.id)}
                    style={{ padding: '7px 16px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}
                  >
                    🗑 حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '1rem' }}>لا توجد فعاليات</div>
            ) : filteredEvents.map(item => (
              <div key={item.id} style={{ background: 'white', borderRadius: 16, padding: '18px 22px', boxShadow: `0 3px 12px ${C.darkNavy}10`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 64, height: 64, borderRadius: 10, background: `linear-gradient(135deg, ${C.teal}, ${C.darkNavy})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{new Date(item.start_datetime).getDate()}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{new Date(item.start_datetime).toLocaleDateString('ar-EG', { month: 'short' })}</div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, color: C.darkNavy, fontSize: '1rem', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ background: `${C.lightMint}60`, color: C.teal, padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>
                      {item.type === 'conference' ? '🎯 مؤتمر' : item.type === 'workshop' ? '🔧 ورشة' : item.type === 'lecture' ? '📚 محاضرة' : '💬 فعالية'}
                    </span>
                    <span>{item.institution_name_ar || item.institution_name}</span>
                    {item.location && <span>📍 {item.location}</span>}
                    {item.is_online && <span style={{ color: C.teal, fontWeight: 600 }}>🌐 عبر الإنترنت</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={`/events/${item.id}`} target="_blank" style={{ padding: '7px 16px', borderRadius: 20, background: `${C.teal}15`, color: C.teal, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
                    👁 عرض
                  </Link>
                  <button
                    onClick={() => deleteEvent(item.id)}
                    style={{ padding: '7px 16px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}
                  >
                    🗑 حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* مودال إنشاء خبر */}
        {showCreateNews && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowCreateNews(false); }}>
            <div style={{ background: 'white', borderRadius: 24, padding: '36px 40px', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', direction: 'rtl', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: C.darkNavy, margin: 0 }}>📰 إضافة خبر جديد</h2>
                <button onClick={() => setShowCreateNews(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <form onSubmit={submitNews} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>العنوان *</label>
                  <input required value={newsForm.title} onChange={e => setNewsForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان الخبر" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>العنوان الفرعي <span style={{ color: '#94a3b8', fontWeight: 400 }}>(يُستخدم لجلب أخبار مشابهة من الإنترنت)</span></label>
                  <input value={newsForm.subtitle} onChange={e => setNewsForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="كلمات مفتاحية أو عنوان فرعي لجلب أخبار ذات صلة..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>التصنيف</label>
                  <select value={newsForm.category} onChange={e => setNewsForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                    <option value="announcement">📢 إعلان</option>
                    <option value="achievement">🏆 إنجاز</option>
                    <option value="news">📰 خبر عام</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>المحتوى *</label>
                  <textarea required value={newsForm.content} onChange={e => setNewsForm(p => ({ ...p, content: e.target.value }))} placeholder="محتوى الخبر..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={labelStyle}>المؤسسة</label>
                  <select value={newsForm.institution_id} onChange={e => setNewsForm(p => ({ ...p, institution_id: e.target.value }))} style={inputStyle}>
                    <option value="">— اختر مؤسسة —</option>
                    {institutions.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>{inst.name_ar || inst.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>صورة الخبر</label>
                  {newsImgPreview && (
                    <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', maxHeight: 160 }}>
                      <img src={newsImgPreview} alt="" style={{ width: '100%', objectFit: 'cover', maxHeight: 160 }} />
                    </div>
                  )}
                  {newsImgUploading && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${newsImgProgress}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.softGreen})`, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: C.teal }}>{newsImgProgress}%</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleNewsImg(e.target.files[0])} style={{ ...inputStyle, padding: '8px 14px' }} />
                </div>
                {err && <div style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>⚠️ {err}</div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="submit" disabled={submitting || newsImgUploading} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', background: submitting ? '#94a3b8' : `linear-gradient(135deg, ${C.teal}, #3a7a8a)`, color: 'white', fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'Cairo',sans-serif" }}>
                    {submitting ? '⏳ جاري الحفظ...' : '✅ نشر الخبر'}
                  </button>
                  <button type="button" onClick={() => setShowCreateNews(false)} style={{ padding: '13px 24px', borderRadius: 12, border: `2px solid ${C.teal}40`, background: 'white', color: C.teal, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}>
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* مودال إنشاء فعالية */}
        {showCreateEvent && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowCreateEvent(false); }}>
            <div style={{ background: 'white', borderRadius: 24, padding: '36px 40px', maxWidth: 620, width: '100%', maxHeight: '90vh', overflowY: 'auto', direction: 'rtl', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: C.darkNavy, margin: 0 }}>📅 إضافة فعالية جديدة</h2>
                <button onClick={() => setShowCreateEvent(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <form onSubmit={submitEvent} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>العنوان *</label>
                  <input required value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان الفعالية" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>نوع الفعالية</label>
                  <select value={eventForm.type} onChange={e => setEventForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                    <option value="conference">🎯 مؤتمر</option>
                    <option value="workshop">🔧 ورشة عمل</option>
                    <option value="lecture">📚 محاضرة</option>
                    <option value="seminar">💬 ندوة</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>الوصف</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف الفعالية..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>تاريخ البداية *</label>
                    <input required type="datetime-local" value={eventForm.start_datetime} onChange={e => setEventForm(p => ({ ...p, start_datetime: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>تاريخ النهاية</label>
                    <input type="datetime-local" value={eventForm.end_datetime} onChange={e => setEventForm(p => ({ ...p, end_datetime: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>الموقع</label>
                  <input value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))} placeholder="مدينة، قاعة..." style={inputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="is_online" checked={eventForm.is_online} onChange={e => setEventForm(p => ({ ...p, is_online: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <label htmlFor="is_online" style={{ fontWeight: 700, color: C.darkNavy, cursor: 'pointer' }}>🌐 فعالية عبر الإنترنت</label>
                </div>
                {eventForm.is_online && (
                  <div>
                    <label style={labelStyle}>رابط البث المباشر</label>
                    <input value={eventForm.online_url} onChange={e => setEventForm(p => ({ ...p, online_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>المؤسسة</label>
                  <select value={eventForm.institution_id} onChange={e => setEventForm(p => ({ ...p, institution_id: e.target.value }))} style={inputStyle}>
                    <option value="">— اختر مؤسسة —</option>
                    {institutions.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>{inst.name_ar || inst.name}</option>
                    ))}
                  </select>
                </div>
                {err && <div style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>⚠️ {err}</div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="submit" disabled={submitting} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', background: submitting ? '#94a3b8' : `linear-gradient(135deg, ${C.teal}, #3a7a8a)`, color: 'white', fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'Cairo',sans-serif" }}>
                    {submitting ? '⏳ جاري الحفظ...' : '✅ إنشاء الفعالية'}
                  </button>
                  <button type="button" onClick={() => setShowCreateEvent(false)} style={{ padding: '13px 24px', borderRadius: 12, border: `2px solid ${C.teal}40`, background: 'white', color: C.teal, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}>
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
