'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';

const COLORS = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal: '#4E8D9C',
  darkNavy: '#281C59',
};

const CATEGORIES = [
  { value: 'all', label: 'جميع المواضيع', icon: '🌐', color: COLORS.teal },
  { value: 'success_story', label: 'قصص النجاح', icon: '🌟', color: '#FFD700' },
  { value: 'experience', label: 'التجارب', icon: '🔬', color: '#85C79A' },
  { value: 'challenge', label: 'التحديات', icon: '⚡', color: '#FF6B6B' },
  { value: 'solution', label: 'الحلول', icon: '💡', color: '#4E8D9C' },
  { value: 'general', label: 'نقاش عام', icon: '💬', color: '#C084FC' },
];

const CAT_LABEL: Record<string, string> = {
  success_story: 'قصة نجاح', experience: 'تجربة', challenge: 'تحدي', solution: 'حل', general: 'نقاش',
};
const CAT_COLOR: Record<string, string> = {
  success_story: '#FFD700', experience: '#85C79A', challenge: '#FF6B6B', solution: '#4E8D9C', general: '#C084FC',
};

interface Thread {
  id: number;
  title: string;
  content: string;
  category: string;
  author_id?: number;
  author_name_ar?: string;
  author_name?: string;
  avatar_url?: string;
  institution_id?: number;
  institution_name_ar?: string;
  views: number;
  replies_count: number;
  is_pinned: number;
  created_at: string;
  updated_at: string;
}

interface Reply {
  id: number;
  content: string;
  author_name_ar?: string;
  author_name?: string;
  avatar_url?: string;
  institution_name_ar?: string;
  created_at: string;
}

function GalaxyLogo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', userSelect: 'none' }}>
      <svg width="42" height="42" viewBox="0 0 54 54" fill="none">
        <defs>
          <radialGradient id="rg_f" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EDF7BD" /><stop offset="42%" stopColor="#85C79A" /><stop offset="100%" stopColor="#4E8D9C" />
          </radialGradient>
        </defs>
        <circle cx="27" cy="27" r="26" fill="rgba(78,141,156,0.1)" />
        <ellipse cx="27" cy="27" rx="24.5" ry="9.5" stroke="#4E8D9C" strokeWidth="0.85" strokeDasharray="4 3" fill="none" opacity="0.6" transform="rotate(-22 27 27)" />
        <path d="M27 7.5 L29.8 18.5 L41.5 20.5 L33 29 L35.5 41 L27 34.5 L18.5 41 L21 29 L12.5 20.5 L24.2 18.5 Z" fill="url(#rg_f)" />
        <circle cx="27" cy="27" r="3.4" fill="white" opacity="0.92" />
      </svg>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, background: 'linear-gradient(130deg,#EDF7BD 0%,#85C79A 48%,#4E8D9C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>المجرة الحضارية</div>
        <div style={{ fontSize: '0.7rem', color: '#4E8D9C', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase' }}>Civilization Galaxy</div>
      </div>
    </Link>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'منذ لحظات';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

function Avatar({ name, avatarUrl, size = 36 }: { name?: string; avatarUrl?: string; size?: number }) {
  const initial = (name || '؟').charAt(0);
  if (avatarUrl) return <Image src={avatarUrl} alt={name || ''} width={size} height={size} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1240', fontWeight: 800, fontSize: size * 0.4, flexShrink: 0 }}>{initial}</div>
  );
}

function ThreadModal({ threadId, onClose }: { threadId: number; onClose: () => void }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forum/${threadId}`);
      const data = await res.json();
      if (data.success) {
        setThread(data.data.thread);
        setReplies(data.data.replies || []);
      }
    } catch { }
    setLoading(false);
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const sessionId = localStorage.getItem('sessionId');
      const res = await fetch(`${API_BASE}/api/forum/${threadId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId || '' },
        body: JSON.stringify({ content: replyText, author_id: user?.id || null }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        fetchThread();
      }
    } catch { }
    setSubmitting(false);
  };

  const catColor = thread ? CAT_COLOR[thread.category] || COLORS.teal : COLORS.teal;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div style={{ background: 'linear-gradient(145deg, #1a1240, #0f0a2e)', border: `1px solid ${catColor}35`, borderRadius: 24, maxWidth: 700, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: `0 32px 100px rgba(0,0,0,0.75), 0 0 60px ${catColor}15` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${catColor}, ${COLORS.softGreen})`, borderRadius: '24px 24px 0 0', flexShrink: 0 }} />

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${catColor}30`, borderTopColor: catColor, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : thread ? (
          <>
            {/* Thread Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ background: `${catColor}22`, color: catColor, padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                  {CAT_LABEL[thread.category] || thread.category}
                </span>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem' }}>✕</button>
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: '0 0 14px', lineHeight: 1.4 }}>{thread.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={thread.author_name_ar || thread.author_name} avatarUrl={thread.avatar_url} size={32} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{thread.author_name_ar || thread.author_name || 'مجهول'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>{timeAgo(thread.created_at)}</div>
                </div>
                <div style={{ marginRight: 'auto', display: 'flex', gap: 16, color: '#4b5563', fontSize: '0.78rem' }}>
                  <span>👁 {thread.views}</span>
                  <span>💬 {thread.replies_count}</span>
                </div>
              </div>
            </div>

            {/* Thread Content + Replies */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, lineHeight: 1.9, color: '#cbd5e1', fontSize: '0.93rem' }}>
                {thread.content}
              </div>

              {replies.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4E8D9C', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>الردود ({replies.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {replies.map(reply => (
                      <div key={reply.id} style={{ background: 'rgba(255,255,255,0.035)', borderRadius: 14, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <Avatar name={reply.author_name_ar || reply.author_name} avatarUrl={reply.avatar_url} size={28} />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>{reply.author_name_ar || reply.author_name || 'مجهول'}</div>
                            {reply.institution_name_ar && <div style={{ fontSize: '0.72rem', color: '#4E8D9C' }}>{reply.institution_name_ar}</div>}
                          </div>
                          <span style={{ marginRight: 'auto', fontSize: '0.72rem', color: '#4b5563' }}>{timeAgo(reply.created_at)}</span>
                        </div>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>{reply.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply Form */}
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              {success && <div style={{ background: 'rgba(133,199,154,0.1)', border: '1px solid rgba(133,199,154,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 12, color: '#85C79A', fontSize: '0.85rem' }}>✓ تم إضافة ردك بنجاح</div>}
              <form onSubmit={submitReply} style={{ display: 'flex', gap: 10 }}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="أضف ردك هنا..."
                  rows={3}
                  style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(78,141,156,0.25)', borderRadius: 14, color: '#fff', fontSize: '0.9rem', fontFamily: "'Cairo', sans-serif", resize: 'none', outline: 'none' }}
                />
                <button type="submit" disabled={submitting || replyText.trim().length < 5} style={{ padding: '0 20px', background: submitting ? 'rgba(78,141,156,0.3)' : `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.softGreen})`, border: 'none', borderRadius: 14, cursor: submitting ? 'not-allowed' : 'pointer', color: '#1a1240', fontWeight: 800, fontSize: '0.9rem', fontFamily: "'Cairo', sans-serif", alignSelf: 'stretch', minWidth: 80 }}>
                  {submitting ? '...' : 'رد'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>الموضوع غير موجود</div>
        )}
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.length < 10) return setError('العنوان يجب أن يكون 10 أحرف على الأقل');
    if (form.content.length < 30) return setError('المحتوى يجب أن يكون 30 حرفاً على الأقل');
    setSubmitting(true); setError('');
    try {
      const sessionId = localStorage.getItem('sessionId');
      const res = await fetch(`${API_BASE}/api/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId || '' },
        body: JSON.stringify({ ...form, author_id: user?.id || null, institution_id: user?.institution_id || null }),
      });
      const data = await res.json();
      if (data.success) { onCreated(); onClose(); }
      else setError(data.error || 'حدث خطأ');
    } catch { setError('تعذّر الاتصال بالخادم'); }
    setSubmitting(false);
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'linear-gradient(145deg, #1a1240, #0f0a2e)', border: '1px solid rgba(78,141,156,0.3)', borderRadius: 24, maxWidth: 620, width: '100%', boxShadow: '0 32px 100px rgba(0,0,0,0.75)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #4E8D9C, #85C79A)', borderRadius: '24px 24px 0 0' }} />
        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0 }}>موضوع جديد</h3>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 13px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
          </div>
          {error && <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</div>}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#4E8D9C', fontWeight: 700, marginBottom: 6 }}>التصنيف</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(78,141,156,0.3)', borderRadius: 12, color: '#fff', fontFamily: "'Cairo', sans-serif", fontSize: '0.9rem', outline: 'none' }}>
                {CATEGORIES.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value} style={{ background: '#1a1240' }}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#4E8D9C', fontWeight: 700, marginBottom: 6 }}>عنوان الموضوع</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="اكتب عنواناً واضحاً ومعبّراً..." style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(78,141,156,0.3)', borderRadius: 12, color: '#fff', fontFamily: "'Cairo', sans-serif", fontSize: '0.9rem', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#4E8D9C', fontWeight: 700, marginBottom: 6 }}>المحتوى</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="شارك تجربتك أو أطرح سؤالك بتفصيل كافٍ..." rows={6} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(78,141,156,0.3)', borderRadius: 12, color: '#fff', fontFamily: "'Cairo', sans-serif", fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
            </div>
            <button type="submit" disabled={submitting} style={{ padding: '14px 24px', background: submitting ? 'rgba(78,141,156,0.3)' : 'linear-gradient(135deg, #4E8D9C, #85C79A)', border: 'none', borderRadius: 14, cursor: submitting ? 'not-allowed' : 'pointer', color: '#1a1240', fontWeight: 800, fontSize: '0.95rem', fontFamily: "'Cairo', sans-serif", boxShadow: '0 8px 24px rgba(78,141,156,0.35)' }}>
              {submitting ? '...جارٍ النشر' : '✦ نشر الموضوع'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ForumPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const limit = 20;

  useEffect(() => { fetchThreads(); }, [activeCategory, search, page]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page), ...(activeCategory !== 'all' && { category: activeCategory }), ...(search && { search }) });
      const res = await fetch(`${API_BASE}/api/forum?${params}`);
      const data = await res.json();
      setThreads(data.data || []);
      setTotal(data.total || 0);
    } catch { setThreads([]); }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / limit);
  const pinnedThreads = threads.filter(t => t.is_pinned);
  const normalThreads = threads.filter(t => !t.is_pinned);

  return (
    <div style={{ minHeight: '100dvh', background: '#080520', color: '#fff', fontFamily: "'Cairo', sans-serif", direction: 'rtl' }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(60)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'white', opacity: Math.random() * 0.4 + 0.05, width: Math.random() * 2 + 1, height: Math.random() * 2 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animation: `twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 3}s infinite alternate` }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 5%, rgba(192,132,252,0.08) 0%, transparent 70%)' }} />
      </div>

      <header style={{ position: 'sticky', top: 0, zIndex: 100, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'rgba(8,5,32,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(78,141,156,0.2)', boxShadow: '0 2px 32px rgba(0,0,0,0.5)' }}>
        <GalaxyLogo />
        <nav style={{ display: 'flex', gap: 6 }}>
          {[{ href: '/news', label: 'الأخبار' }, { href: '/services', label: 'الخدمات' }, { href: '/library', label: 'المكتبة' }, { href: '/forum', label: 'المنتدى', active: true }, { href: '/podcast', label: 'البودكاست' }].map(link => (
            <Link key={link.href} href={link.href} style={{ padding: '8px 16px', borderRadius: 24, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, color: (link as any).active ? COLORS.darkNavy : '#9ca3af', background: (link as any).active ? 'linear-gradient(135deg, #85C79A, #4E8D9C)' : 'transparent', border: (link as any).active ? 'none' : '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}>{link.label}</Link>
          ))}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.25)', borderRadius: 40, padding: '8px 20px', marginBottom: 24 }}>
            <span style={{ fontSize: '1.2rem' }}>💬</span>
            <span style={{ fontSize: '0.85rem', color: '#C084FC', fontWeight: 700, letterSpacing: '0.1em' }}>GALAXY FORUM</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', background: 'linear-gradient(135deg, #fff 0%, #EDF7BD 40%, #C084FC 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            منتدى المجرة الحضارية
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
            مجتمع تعلّم مؤسسي — شارك تجربتك، تعلّم من غيرك، وابنِ معاً
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{ marginTop: 24, padding: '14px 36px', background: 'linear-gradient(135deg, #C084FC, #9333ea)', border: 'none', borderRadius: 40, cursor: 'pointer', color: '#fff', fontWeight: 800, fontSize: '0.95rem', fontFamily: "'Cairo', sans-serif", boxShadow: '0 8px 28px rgba(192,132,252,0.4)', transition: 'all 0.2s', letterSpacing: '0.02em' }}
          >
            ✦ نشر موضوع جديد
          </button>
        </div>

        {/* Filter + Search */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} style={{ flex: 1, minWidth: 240, display: 'flex', gap: 10 }}>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="ابحث في المنتدى..." style={{ flex: 1, padding: '11px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(78,141,156,0.25)', borderRadius: 40, color: '#fff', fontSize: '0.9rem', fontFamily: "'Cairo', sans-serif", outline: 'none' }} />
            <button type="submit" style={{ padding: '11px 20px', background: 'rgba(78,141,156,0.2)', border: '1px solid rgba(78,141,156,0.4)', borderRadius: 40, cursor: 'pointer', color: COLORS.teal, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>بحث</button>
          </form>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => { setActiveCategory(cat.value); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: activeCategory === cat.value ? `${cat.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${activeCategory === cat.value ? cat.color + '55' : 'rgba(255,255,255,0.07)'}`, borderRadius: 40, cursor: 'pointer', color: activeCategory === cat.value ? cat.color : '#6b7280', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Cairo', sans-serif", transition: 'all 0.2s' }}>
              <span>{cat.icon}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Threads */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(5)].map((_, i) => <div key={i} style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 16, animation: 'pulse 2s infinite' }} />)}
          </div>
        ) : threads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4b5563' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>💬</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>لا توجد مواضيع بعد</p>
            <p style={{ fontSize: '0.9rem', marginTop: 8 }}>كن أول من يفتح نقاشاً في مجتمع المجرة</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pinnedThreads.map(t => <ThreadRow key={t.id} thread={t} onClick={() => setSelectedThreadId(t.id)} pinned />)}
            {normalThreads.map(t => <ThreadRow key={t.id} thread={t} onClick={() => setSelectedThreadId(t.id)} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 48 }}>
            {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: '10px 22px', background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 40, color: '#C084FC', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>السابق</button>}
            <span style={{ padding: '10px 20px', color: '#6b7280', fontSize: '0.9rem' }}>صفحة {page} من {totalPages}</span>
            {page < totalPages && <button onClick={() => setPage(p => p + 1)} style={{ padding: '10px 22px', background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 40, color: '#C084FC', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>التالي</button>}
          </div>
        )}
      </main>

      {selectedThreadId && <ThreadModal threadId={selectedThreadId} onClose={() => setSelectedThreadId(null)} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchThreads} />}

      <style>{`
        @keyframes twinkle { from { opacity: 0.1; transform: scale(1); } to { opacity: 0.6; transform: scale(1.2); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::placeholder { color: rgba(156,163,175,0.5); }
      `}</style>
    </div>
  );
}

function ThreadRow({ thread, onClick, pinned }: { thread: Thread; onClick: () => void; pinned?: boolean }) {
  const catColor = CAT_COLOR[thread.category] || COLORS.teal;
  return (
    <div
      onClick={onClick}
      style={{ background: `linear-gradient(135deg, rgba(26,18,64,0.97), rgba(15,10,46,0.9))`, border: `1px solid ${pinned ? '#FFD70030' : catColor + '22'}`, borderRadius: 16, padding: '18px 24px', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: pinned ? '0 0 24px rgba(255,215,0,0.06)' : 'none' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(-4px)'; e.currentTarget.style.borderColor = catColor + '55'; e.currentTarget.style.boxShadow = `0 8px 32px ${catColor}18`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = pinned ? '#FFD70030' : catColor + '22'; e.currentTarget.style.boxShadow = pinned ? '0 0 24px rgba(255,215,0,0.06)' : 'none'; }}
    >
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <Avatar name={thread.author_name_ar || thread.author_name} avatarUrl={thread.avatar_url} size={42} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {pinned && <span style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>📌 مثبّت</span>}
          <span style={{ background: `${catColor}18`, color: catColor, padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{CAT_LABEL[thread.category] || thread.category}</span>
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', lineHeight: 1.4 }}>{thread.title}</h3>
        <p style={{ fontSize: '0.83rem', color: '#64748b', margin: '0 0 12px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{thread.content}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.78rem', color: '#4b5563', flexWrap: 'wrap' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>{thread.author_name_ar || thread.author_name || 'مجهول'}</span>
          <span style={{ color: '#374151' }}>•</span>
          <span>{timeAgo(thread.updated_at)}</span>
          <span style={{ marginRight: 'auto', display: 'flex', gap: 14 }}>
            <span>👁 {thread.views}</span>
            <span>💬 {thread.replies_count}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
