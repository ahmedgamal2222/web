'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const C = {
  primary: '#281C59',
  teal: '#4E8D9C',
  green: '#85C79A',
  purple: '#C084FC',
};

const CAT_MAP: Record<string, { label: string; color: string }> = {
  success_story: { label: 'قصة نجاح',    color: '#FFD700' },
  experience:    { label: 'تجربة',        color: '#85C79A' },
  challenge:     { label: 'تحدي',         color: '#FF6B6B' },
  solution:      { label: 'حل',           color: '#4E8D9C' },
  general:       { label: 'عام',          color: '#C084FC' },
};

interface Thread {
  id: number;
  title: string;
  content: string;
  category: string;
  author_id?: number;
  author_name?: string;
  institution_name_ar?: string;
  views: number;
  replies_count: number;
  is_pinned: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminForumPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [success, setSuccess] = useState('');

  const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : '';
  const authH = { 'X-Session-ID': sid };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') { router.push('/login?redirect=/admin/forum'); return; }
    loadThreads();
  }, []);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forum?limit=200`, { headers: authH });
      const d = await res.json();
      setThreads(d.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`حذف "${title}"؟`)) return;
    try {
      await fetch(`${API_BASE}/api/forum/${id}`, { method: 'DELETE', headers: authH });
      setThreads(prev => prev.filter(t => t.id !== id));
      setSuccess('✓ تم الحذف');
      setTimeout(() => setSuccess(''), 2000);
    } catch { alert('فشل الحذف'); }
  };

  const handlePin = async (thread: Thread) => {
    const newPinned = thread.is_pinned ? 0 : 1;
    try {
      await fetch(`${API_BASE}/api/forum/${thread.id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({ is_pinned: newPinned }),
      });
      setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, is_pinned: newPinned } : t));
      setSuccess(newPinned ? '✓ تم تثبيت الموضوع' : '✓ تم إلغاء التثبيت');
      setTimeout(() => setSuccess(''), 2000);
    } catch { alert('فشلت العملية'); }
  };

  const handleStatusToggle = async (thread: Thread) => {
    const newStatus = thread.status === 'active' ? 'hidden' : 'active';
    try {
      await fetch(`${API_BASE}/api/forum/${thread.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({ status: newStatus }),
      });
      setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, status: newStatus } : t));
      setSuccess(`✓ تم تغيير الحالة إلى ${newStatus === 'active' ? 'نشط' : 'مخفي'}`);
      setTimeout(() => setSuccess(''), 2000);
    } catch { alert('فشلت العملية'); }
  };

  const filtered = threads.filter(t => {
    if (catFilter !== 'all' && t.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.author_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const relTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'منذ لحظات';
    if (m < 60) return `منذ ${m} د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} س`;
    return `منذ ${Math.floor(h / 24)} يوم`;
  };

  const stats = {
    total: threads.length,
    active: threads.filter(t => t.status === 'active').length,
    pinned: threads.filter(t => t.is_pinned).length,
    totalReplies: threads.reduce((s, t) => s + t.replies_count, 0),
    totalViews: threads.reduce((s, t) => s + t.views, 0),
  };

  return (
    <div className="admin-page" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>💬 إدارة منتدى المجرة</h1>
          <p style={{ opacity: 0.75, margin: '6px 0 0', fontSize: '0.9rem' }}>إشراف على المواضيع والمشاركات في منتدى الحضارة</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/forum" target="_blank" style={{ padding: '10px 18px', borderRadius: 30, background: 'rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none', fontSize: '0.88rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            🔗 فتح المنتدى
          </Link>
          <Link href="/admin" style={{ padding: '10px 20px', borderRadius: 30, background: 'rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            ← لوحة الأدمن
          </Link>
        </div>
      </div>

      {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#15803d', fontWeight: 600 }}>{success}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'إجمالي المواضيع', val: stats.total,        color: C.purple, icon: '💬' },
          { label: 'نشطة',            val: stats.active,        color: C.green,  icon: '✅' },
          { label: 'مثبتة',           val: stats.pinned,        color: '#FFD700', icon: '📌' },
          { label: 'إجمالي الردود',   val: stats.totalReplies,  color: C.teal,   icon: '↩️' },
          { label: 'إجمالي المشاهدات', val: stats.totalViews,   color: '#FF9B4E', icon: '👁️' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', boxShadow: `0 3px 12px ${C.primary}12`, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
            <div style={{ fontSize: '0.78rem', color: C.teal, marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: 'white', borderRadius: 14, padding: '14px 18px', marginBottom: 20, boxShadow: `0 3px 12px ${C.primary}08`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 بحث بالعنوان أو الكاتب..."
          style={{ flex: 1, padding: '9px 14px', borderRadius: 30, border: `1.5px solid ${C.teal}40`, fontSize: '0.9rem', outline: 'none', minWidth: 180 }}
        />
        <button onClick={() => setCatFilter('all')} style={{ padding: '7px 14px', borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: catFilter === 'all' ? 700 : 400, background: catFilter === 'all' ? C.purple : `${C.purple}15`, color: catFilter === 'all' ? 'white' : C.purple, fontSize: '0.82rem' }}>الكل</button>
        {Object.entries(CAT_MAP).map(([k, v]) => (
          <button key={k} onClick={() => setCatFilter(k)} style={{ padding: '7px 14px', borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: catFilter === k ? 700 : 400, background: catFilter === k ? v.color : `${v.color}18`, color: catFilter === k ? '#fff' : v.color, fontSize: '0.82rem' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Threads table */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /> جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 16, color: '#888' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>💭</div>
          <div>لا توجد مواضيع</div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: `0 4px 14px ${C.primary}10`, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الموضوع</th>
                  <th>الفئة</th>
                  <th>الكاتب</th>
                  <th>المشاهدات</th>
                  <th>الردود</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(thread => (
                  <tr key={thread.id}>
                    <td style={{ color: '#999', fontSize: '0.82rem' }}>{thread.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 260 }}>
                        {thread.is_pinned ? <span style={{ fontSize: '0.85rem' }}>📌</span> : null}
                        <span style={{ fontWeight: 700, color: C.primary, fontSize: '0.9rem' }}>{thread.title}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: `${CAT_MAP[thread.category]?.color || C.teal}20`, color: CAT_MAP[thread.category]?.color || C.teal, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {CAT_MAP[thread.category]?.label || thread.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#555' }}>{thread.author_name || `#${thread.author_id}` || '—'}</td>
                    <td style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>{thread.views}</td>
                    <td style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>{thread.replies_count}</td>
                    <td>
                      <button
                        onClick={() => handleStatusToggle(thread)}
                        style={{ padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                          background: thread.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: thread.status === 'active' ? '#15803d' : '#b91c1c' }}
                      >
                        {thread.status === 'active' ? '✅ نشط' : '🚫 مخفي'}
                      </button>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#999', whiteSpace: 'nowrap' }}>{relTime(thread.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handlePin(thread)}
                          title={thread.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                          style={{ padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.82rem',
                            background: thread.is_pinned ? '#fef9c3' : `${C.teal}12`,
                            color: thread.is_pinned ? '#a16207' : C.teal }}
                        >
                          {thread.is_pinned ? '📌 تثبيت' : '📍 ثبّت'}
                        </button>
                        <button
                          onClick={() => handleDelete(thread.id, thread.title)}
                          style={{ padding: '5px 10px', borderRadius: 20, border: 'none', background: '#ff505015', color: '#ff5050', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
