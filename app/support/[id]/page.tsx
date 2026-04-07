'use client';

import { useEffect, useState, useRef, use } from 'react';
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
const PRIORITY_MAP: Record<string, { label: string; emoji: string }> = {
  low: { label: 'منخفضة', emoji: '🟢' }, medium: { label: 'متوسطة', emoji: '🔵' },
  high: { label: 'عالية', emoji: '🟡' }, urgent: { label: 'عاجلة', emoji: '🔴' },
};
const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
  general: { label: 'عام', emoji: '💬' }, technical: { label: 'تقني', emoji: '🔧' },
  billing: { label: 'مالي', emoji: '💰' }, account: { label: 'الحساب', emoji: '👤' },
  suggestion: { label: 'اقتراح', emoji: '💡' }, complaint: { label: 'شكوى', emoji: '📋' },
};

function getSessionId() { return typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : ''; }

function formatDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { router.push('/login'); return; }
    fetch(`${API_BASE}/api/auth/me`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.user); else router.push('/login'); })
      .catch(() => router.push('/login'));
  }, []);

  const loadTicket = () => {
    fetch(`${API_BASE}/api/support/tickets/${id}`, { headers: { 'X-Session-ID': getSessionId() } })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setTicket(d.ticket); setMessages(d.messages || []); }
        else router.push('/support');
      })
      .catch(() => router.push('/support'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) loadTicket(); }, [user, id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(loadTicket, 15000);
    return () => clearInterval(iv);
  }, [user, id]);

  const handleReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() },
        body: JSON.stringify({ message: reply }),
      });
      const d = await res.json();
      if (d.success) { setReply(''); loadTicket(); }
    } catch {}
    finally { setSending(false); }
  };

  const handleClose = async () => {
    await fetch(`${API_BASE}/api/support/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() },
      body: JSON.stringify({ status: 'closed' }),
    });
    loadTicket();
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>جارٍ التحميل...</div>
    </div>
  );

  if (!ticket) return null;
  const st = STATUS_MAP[ticket.status] || STATUS_MAP.open;
  const pr = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
  const cat = CATEGORY_MAP[ticket.category] || CATEGORY_MAP.general;
  const isClosed = ticket.status === 'closed';
  const isResolved = ticket.status === 'resolved';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Tajawal, Cairo, sans-serif', direction: 'rtl', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0d1129 0%, #131842 50%, #0d1129 100%)',
        borderBottom: `1px solid ${C.border}`, padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/support" style={{ color: C.teal, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            → العودة للتذاكر
          </Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ color: C.textMuted, fontSize: '0.8rem' }}>#{ticket.id}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isClosed && !isResolved && (
            <button onClick={handleClose} style={{
              background: 'rgba(107,114,128,0.15)', border: `1px solid rgba(107,114,128,0.3)`,
              color: '#9ca3af', borderRadius: 10, padding: '7px 16px', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit',
            }}>إغلاق التذكرة</button>
          )}
        </div>
      </header>

      {/* Ticket Info Bar */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`, padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ color: C.textMain, fontSize: '1.05rem', fontWeight: 800, margin: '0 0 10px' }}>{ticket.subject}</h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: st.bg, color: st.color, borderRadius: 8,
              padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700,
            }}>{st.label}</span>
            <span style={{ fontSize: '0.72rem', color: pr.emoji === '🔴' ? '#ef4444' : C.textMuted, fontWeight: 600 }}>{pr.emoji} {pr.label}</span>
            <span style={{ fontSize: '0.72rem', color: C.textMuted }}>{cat.emoji} {cat.label}</span>
            <span style={{ fontSize: '0.68rem', color: C.textMuted }}>📅 {formatDate(ticket.created_at)}</span>
            {ticket.institution_name_ar && (
              <span style={{ fontSize: '0.68rem', color: C.teal }}>🏛️ {ticket.institution_name_ar}</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Automated welcome message */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'flex-start' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${C.teal}, ${C.softGreen})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: '#fff', fontWeight: 800,
            }}>🤖</div>
            <div style={{
              background: 'rgba(78,141,156,0.08)', border: `1px solid rgba(78,141,156,0.2)`,
              borderRadius: '4px 16px 16px 16px', padding: '12px 16px', maxWidth: '75%',
            }}>
              <div style={{ fontSize: '0.82rem', color: C.textMain, lineHeight: 1.7 }}>
                مرحباً بك في مركز دعم المجرة الحضارية 🌌<br/>
                تم استلام تذكرتك وسيقوم فريق الدعم بالرد عليك في أقرب وقت.
              </div>
              <div style={{ fontSize: '0.65rem', color: C.textMuted, marginTop: 6 }}>نظام آلي • {formatDate(ticket.created_at)}</div>
            </div>
          </div>

          {messages.map((m: any, i: number) => {
            const isAdmin = m.sender_role === 'admin';
            return (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 16,
                justifyContent: isAdmin ? 'flex-start' : 'flex-end',
                flexDirection: isAdmin ? 'row' : 'row-reverse',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: isAdmin
                    ? `linear-gradient(135deg, ${C.teal}, ${C.softGreen})`
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isAdmin ? '0.9rem' : '0.82rem', color: '#fff', fontWeight: 700,
                  overflow: 'hidden',
                }}>
                  {isAdmin ? '🛡️' : (m.sender_name_ar || m.sender_name || '👤').charAt(0)}
                </div>
                <div style={{
                  background: isAdmin ? 'rgba(78,141,156,0.08)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${isAdmin ? 'rgba(78,141,156,0.2)' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: isAdmin ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  padding: '12px 16px', maxWidth: '75%', minWidth: 120,
                }}>
                  <div style={{ fontSize: '0.7rem', color: isAdmin ? C.teal : '#8b5cf6', fontWeight: 700, marginBottom: 4 }}>
                    {isAdmin ? '🛡️ فريق الدعم' : (m.sender_name_ar || m.sender_name || 'أنت')}
                  </div>
                  <div style={{
                    fontSize: '0.88rem', color: C.textMain, lineHeight: 1.8,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>{m.message}</div>
                  <div style={{ fontSize: '0.62rem', color: C.textMuted, marginTop: 6, textAlign: isAdmin ? 'left' : 'right' }}>
                    {formatDate(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply input */}
      {!isClosed ? (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, #0d1129 60%, transparent)',
          padding: '16px 20px 20px', zIndex: 100,
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={reply} onChange={e => setReply(e.target.value)}
              placeholder={isResolved ? 'التذكرة محلولة. يمكنك إعادة فتحها بالرد...' : 'اكتب ردك هنا...'}
              rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
              style={{
                flex: 1, padding: '12px 16px', background: C.card,
                border: `1px solid ${C.border}`, borderRadius: 14, color: C.textMain,
                fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
                resize: 'none', minHeight: 48, maxHeight: 120,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = C.teal}
              onBlur={e => e.currentTarget.style.borderColor = C.border}
            />
            <button onClick={handleReply} disabled={sending || !reply.trim()} style={{
              background: (!reply.trim() || sending) ? C.border : `linear-gradient(135deg, ${C.teal}, ${C.softGreen})`,
              border: 'none', borderRadius: 14, width: 50, height: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: (!reply.trim() || sending) ? 'default' : 'pointer',
              fontSize: '1.2rem', color: '#fff', flexShrink: 0,
              transition: 'all 0.2s',
            }}>
              {sending ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.card, borderTop: `1px solid ${C.border}`,
          padding: '16px 20px', textAlign: 'center', zIndex: 100,
        }}>
          <span style={{ color: C.textMuted, fontSize: '0.85rem' }}>🔒 هذه التذكرة مغلقة</span>
        </div>
      )}
    </div>
  );
}
