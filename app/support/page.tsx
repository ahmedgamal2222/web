'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { lightMint: '#EDF7BD', softGreen: '#85C79A', teal: '#4E8D9C', darkNavy: '#281C59', bg: '#07091e', card: '#0d1129', border: '#1a1f3d', textMain: '#e2e8f0', textMuted: '#94a3b8', green: '#85C79A', danger: '#ff6b6b', warning: '#f59e0b' };

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'مفتوحة', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  in_progress: { label: 'قيد المعالجة', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  waiting: { label: 'بانتظار ردك', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  resolved: { label: 'تم الحل', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  closed: { label: 'مغلقة', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  low: { label: 'منخفضة', color: '#6b7280', emoji: '🟢' },
  medium: { label: 'متوسطة', color: '#3b82f6', emoji: '🔵' },
  high: { label: 'عالية', color: '#f59e0b', emoji: '🟡' },
  urgent: { label: 'عاجلة', color: '#ef4444', emoji: '🔴' },
};

const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
  general: { label: 'عام', emoji: '💬' },
  technical: { label: 'تقني', emoji: '🔧' },
  billing: { label: 'مالي', emoji: '💰' },
  account: { label: 'الحساب', emoji: '👤' },
  suggestion: { label: 'اقتراح', emoji: '💡' },
  complaint: { label: 'شكوى', emoji: '📋' },
};

function getSessionId() { return typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : ''; }
function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  return `منذ ${Math.floor(diff / 86400)} ي`;
}

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [giftNotif, setGiftNotif] = useState<any[]>([]);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { router.push('/login'); return; }
    fetch(`${API_BASE}/api/auth/me`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.user); else router.push('/login'); })
      .catch(() => router.push('/login'));
  }, []);

  // Fetch gift credit notifications
  useEffect(() => {
    if (!user) return;
    const sid = getSessionId();
    fetch(`${API_BASE}/api/notifications?type=gift_credit`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.length) setGiftNotif(d.data); })
      .catch(() => {});
  }, [user]);

  const loadTickets = () => {
    const sid = getSessionId();
    const params = filter !== 'all' ? `?status=${filter}` : '';
    fetch(`${API_BASE}/api/support/tickets${params}`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success) setTickets(d.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) loadTickets(); }, [user, filter]);

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Tajawal, Cairo, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0d1129 0%, #131842 50%, #0d1129 100%)',
        borderBottom: `1px solid ${C.border}`, padding: '18px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ color: C.teal, textDecoration: 'none', fontSize: '1.2rem', fontWeight: 800 }}>🌌 المجرة</Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ color: C.textMain, fontWeight: 700, fontSize: '1rem' }}>🎫 مركز الدعم</span>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          background: `linear-gradient(135deg, ${C.teal}, ${C.softGreen})`, color: '#fff',
          border: 'none', borderRadius: 12, padding: '10px 22px', fontWeight: 700,
          cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit',
        }}>
          + تذكرة جديدة
        </button>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>
        {/* Gift credit notification banner */}
        {giftNotif.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(133,199,154,0.15), rgba(78,141,156,0.12))',
            border: '1px solid rgba(133,199,154,0.35)', borderRadius: 16, padding: '18px 22px',
            marginBottom: 24, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -15, left: -15, fontSize: '4rem', opacity: 0.08 }}>🎁</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: C.green, marginBottom: 8 }}>🎁 رسالة من فريق العمل</div>
            {giftNotif.map((n: any, i: number) => (
              <div key={i} style={{ fontSize: '0.88rem', color: C.textMain, marginBottom: 4 }}>
                {n.message}
              </div>
            ))}
            <div style={{ fontSize: '0.72rem', color: C.textMuted, marginTop: 8 }}>فريق المجرة الحضارية 🌟</div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'جميع التذاكر', value: tickets.length, color: C.teal, emoji: '📊' },
            { label: 'نشطة', value: openCount, color: C.warning, emoji: '🔔' },
            { label: 'محلولة', value: resolvedCount, color: C.green, emoji: '✅' },
          ].map((s, i) => (
            <div key={i} style={{
              background: C.card, borderRadius: 14, padding: '16px 18px',
              border: `1px solid ${C.border}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: C.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'الكل' },
            { key: 'open', label: 'مفتوحة' },
            { key: 'in_progress', label: 'قيد المعالجة' },
            { key: 'waiting', label: 'بانتظار ردك' },
            { key: 'resolved', label: 'تم الحل' },
            { key: 'closed', label: 'مغلقة' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? `${C.teal}25` : 'transparent',
              border: `1px solid ${filter === f.key ? C.teal : C.border}`,
              color: filter === f.key ? C.teal : C.textMuted,
              borderRadius: 10, padding: '7px 16px', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            جارٍ التحميل...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>📭</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>لا توجد تذاكر</div>
            <div style={{ fontSize: '0.82rem' }}>أنشئ تذكرة جديدة إذا كنت بحاجة للمساعدة</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map((t: any) => {
              const st = STATUS_MAP[t.status] || STATUS_MAP.open;
              const pr = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
              const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.general;
              const hasNewReply = t.last_sender_role === 'admin' && t.status !== 'closed';
              return (
                <Link key={t.id} href={`/support/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: hasNewReply ? 'rgba(59,130,246,0.06)' : C.card,
                    border: `1px solid ${hasNewReply ? 'rgba(59,130,246,0.3)' : C.border}`,
                    borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
                    transition: 'all 0.2s', position: 'relative',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = 'translateX(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = hasNewReply ? 'rgba(59,130,246,0.3)' : C.border; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    {hasNewReply && (
                      <div style={{
                        position: 'absolute', top: 12, left: 14,
                        background: '#3b82f6', color: '#fff', borderRadius: 8,
                        padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700,
                      }}>رد جديد</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: '0.65rem', color: C.textMuted, fontWeight: 600 }}>#{t.id}</span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: C.textMain }}>{t.subject}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            background: st.bg, color: st.color, borderRadius: 8,
                            padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700,
                          }}>{st.label}</span>
                          <span style={{ fontSize: '0.7rem', color: pr.color, fontWeight: 600 }}>{pr.emoji} {pr.label}</span>
                          <span style={{ fontSize: '0.7rem', color: C.textMuted }}>{cat.emoji} {cat.label}</span>
                          <span style={{ fontSize: '0.68rem', color: C.textMuted }}>💬 {t.message_count || 0}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 65 }}>
                        <div style={{ fontSize: '0.68rem', color: C.textMuted }}>{timeAgo(t.updated_at || t.created_at)}</div>
                      </div>
                    </div>
                    {t.last_message && (
                      <div style={{
                        fontSize: '0.78rem', color: C.textMuted, marginTop: 6,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: '100%', paddingRight: 4,
                      }}>
                        {t.last_sender_role === 'admin' ? '🛡️ الدعم: ' : '👤 أنت: '}{t.last_message}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create ticket modal */}
      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadTickets(); }} />}
    </div>
  );
}

function CreateTicketModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ subject: '', message: '', category: 'general', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) { setErr('يرجى ملء جميع الحقول'); return; }
    setSubmitting(true); setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) onSuccess();
      else setErr(d.error || 'خطأ في إنشاء التذكرة');
    } catch { setErr('خطأ في الاتصال'); }
    finally { setSubmitting(false); }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: '#0d1129',
    border: '1px solid #1a1f3d', borderRadius: 10, color: '#e2e8f0',
    fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
    }} onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} style={{
        background: 'linear-gradient(135deg, #0d1129, #111638)',
        border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 26px',
        width: '92%', maxWidth: 520, direction: 'rtl',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ color: C.textMain, fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>🎫 تذكرة دعم جديدة</h2>
          <button type="button" onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', color: C.textMuted,
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
          }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.78rem', color: C.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>الموضوع</label>
          <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
            placeholder="وصف مختصر للمشكلة..."
            style={inputStyle} maxLength={200} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: C.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>التصنيف</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: C.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>الأولوية</label>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.78rem', color: C.textMuted, fontWeight: 600, display: 'block', marginBottom: 6 }}>تفاصيل المشكلة</label>
          <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            placeholder="اشرح مشكلتك بالتفصيل..."
            rows={5} style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }} maxLength={5000} />
        </div>

        {err && <div style={{ color: C.danger, fontSize: '0.82rem', marginBottom: 14, fontWeight: 600 }}>⚠️ {err}</div>}

        <button type="submit" disabled={submitting} style={{
          width: '100%', padding: '13px', border: 'none', borderRadius: 12,
          background: submitting ? C.border : `linear-gradient(135deg, ${C.teal}, ${C.softGreen})`,
          color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: submitting ? 'default' : 'pointer',
          fontFamily: 'inherit', transition: 'all 0.2s',
        }}>
          {submitting ? '⏳ جارٍ الإرسال...' : '📨 إرسال التذكرة'}
        </button>
      </form>
    </div>
  );
}
