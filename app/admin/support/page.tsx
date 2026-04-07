'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { uploadFile } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hadmaj-api.info1703.workers.dev';
const C = { lightMint: '#EDF7BD', softGreen: '#85C79A', teal: '#4E8D9C', darkNavy: '#281C59', bg: '#07091e', card: '#0d1129', border: '#1a1f3d', textMain: '#e2e8f0', textMuted: '#94a3b8', green: '#85C79A', danger: '#ff6b6b', warning: '#f59e0b' };

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'مفتوحة', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  in_progress: { label: 'قيد المعالجة', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  waiting: { label: 'بانتظار رد المستخدم', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
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
  general: { label: 'عام', emoji: '💬' }, technical: { label: 'تقني', emoji: '🔧' },
  billing: { label: 'مالي', emoji: '💰' }, account: { label: 'الحساب', emoji: '👤' },
  suggestion: { label: 'اقتراح', emoji: '💡' }, complaint: { label: 'شكوى', emoji: '📋' },
};

function getSessionId() { return typeof window !== 'undefined' ? localStorage.getItem('sessionId') || '' : ''; }
function formatDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return `${Math.floor(diff / 86400)} ي`;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth check
  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { router.push('/login'); return; }
    fetch(`${API_BASE}/api/auth/me`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (!d.success || d.user?.role !== 'admin') router.push('/login'); })
      .catch(() => router.push('/login'));
  }, []);

  const loadTickets = () => {
    const sid = getSessionId();
    const params = filter !== 'all' ? `?status=${filter}` : '';
    fetch(`${API_BASE}/api/support/tickets${params}`, { headers: { 'X-Session-ID': sid } })
      .then(r => r.json())
      .then(d => { if (d.success) setTickets(d.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTickets(); }, [filter]);

  // Auto refresh (every 30s)
  useEffect(() => {
    const iv = setInterval(loadTickets, 30000);
    return () => clearInterval(iv);
  }, [filter]);

  const loadTicketDetail = (ticketId: number) => {
    setTicketLoading(true);
    fetch(`${API_BASE}/api/support/tickets/${ticketId}`, { headers: { 'X-Session-ID': getSessionId() } })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setSelectedTicket(d.ticket); setMessages(d.messages || []); }
      })
      .catch(() => {})
      .finally(() => setTicketLoading(false));
  };

  // Auto refresh selected ticket (every 20s)
  useEffect(() => {
    if (!selectedTicket) return;
    const iv = setInterval(() => loadTicketDetail(selectedTicket.id), 20000);
    return () => clearInterval(iv);
  }, [selectedTicket?.id]);

  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  const handleReply = async () => {
    if ((!reply.trim() && !attachFile) || sending || !selectedTicket) return;
    setSending(true);
    try {
      let attachment_url: string | undefined;
      let attachment_name: string | undefined;
      if (attachFile) {
        setUploadProgress(0);
        const res = await uploadFile(attachFile, setUploadProgress);
        attachment_url = res.url;
        attachment_name = attachFile.name;
      }
      const res = await fetch(`${API_BASE}/api/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() },
        body: JSON.stringify({ message: reply || (attachment_name ? `📎 ${attachment_name}` : ''), attachment_url, attachment_name }),
      });
      const d = await res.json();
      if (d.success) { setReply(''); setAttachFile(null); setUploadProgress(0); loadTicketDetail(selectedTicket.id); loadTickets(); }
    } catch {}
    finally { setSending(false); }
  };

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;
    await fetch(`${API_BASE}/api/support/tickets/${selectedTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() },
      body: JSON.stringify({ status }),
    });
    loadTicketDetail(selectedTicket.id);
    loadTickets();
  };

  const updateTicketPriority = async (priority: string) => {
    if (!selectedTicket) return;
    await fetch(`${API_BASE}/api/support/tickets/${selectedTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() },
      body: JSON.stringify({ priority }),
    });
    loadTicketDetail(selectedTicket.id);
    loadTickets();
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    waiting: tickets.filter(t => t.status === 'waiting').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Tajawal, Cairo, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0d1129 0%, #131842 50%, #0d1129 100%)',
        borderBottom: `1px solid ${C.border}`, padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/admin" style={{ color: C.teal, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>← لوحة التحكم</Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ color: C.textMain, fontWeight: 800, fontSize: '1rem' }}>🎫 إدارة تذاكر الدعم</span>
          {stats.urgent > 0 && (
            <span style={{
              background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8,
              padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, animation: 'pulse 2s infinite',
            }}>🔴 {stats.urgent} عاجلة</span>
          )}
        </div>
      </header>

      {/* Stats Row */}
      <div style={{ maxWidth: 1400, margin: '20px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'الكل', value: stats.total, color: C.teal, emoji: '📊' },
            { label: 'مفتوحة', value: stats.open, color: '#3b82f6', emoji: '📬' },
            { label: 'قيد المعالجة', value: stats.inProgress, color: C.warning, emoji: '⚙️' },
            { label: 'بانتظار الرد', value: stats.waiting, color: '#a855f7', emoji: '⏳' },
            { label: 'محلولة', value: stats.resolved, color: C.green, emoji: '✅' },
            { label: 'عاجلة', value: stats.urgent, color: '#ef4444', emoji: '🔴' },
          ].map((s, i) => (
            <div key={i} style={{
              background: C.card, borderRadius: 12, padding: '12px 14px',
              border: `1px solid ${C.border}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.1rem' }}>{s.emoji}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: C.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout: Ticket List + Chat Panel */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px 40px', display: 'grid', gridTemplateColumns: selectedTicket ? '380px 1fr' : '1fr', gap: 16, height: 'calc(100vh - 180px)' }}>
        {/* Ticket List Panel */}
        <div style={{
          background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Filters */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'open', 'in_progress', 'waiting', 'resolved', 'closed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? `${C.teal}20` : 'transparent',
                border: `1px solid ${filter === f ? C.teal : 'transparent'}`,
                color: filter === f ? C.teal : C.textMuted, borderRadius: 8,
                padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {f === 'all' ? 'الكل' : (STATUS_MAP[f]?.label || f)}
              </button>
            ))}
          </div>

          {/* Ticket Items */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>⏳ جارٍ التحميل...</div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>📭 لا توجد تذاكر</div>
            ) : (
              tickets.map((t: any) => {
                const st = STATUS_MAP[t.status] || STATUS_MAP.open;
                const pr = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
                const isSelected = selectedTicket?.id === t.id;
                const hasUserReply = t.last_sender_role === 'user' && (t.status === 'waiting' || t.status === 'in_progress');
                return (
                  <div key={t.id} onClick={() => loadTicketDetail(t.id)} style={{
                    padding: '14px 16px', cursor: 'pointer',
                    borderBottom: `1px solid ${C.border}`,
                    background: isSelected ? `${C.teal}12` : (hasUserReply ? 'rgba(59,130,246,0.04)' : 'transparent'),
                    borderRight: isSelected ? `3px solid ${C.teal}` : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = `${C.teal}08`; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = hasUserReply ? 'rgba(59,130,246,0.04)' : 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.62rem', color: C.textMuted }}>#{t.id}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.textMain }}>{t.subject}</span>
                      </div>
                      <span style={{ fontSize: '0.62rem', color: C.textMuted, whiteSpace: 'nowrap' }}>{timeAgo(t.updated_at)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        background: st.bg, color: st.color, borderRadius: 6,
                        padding: '2px 8px', fontSize: '0.62rem', fontWeight: 700,
                      }}>{st.label}</span>
                      <span style={{ fontSize: '0.62rem', color: pr.color }}>{pr.emoji}</span>
                      <span style={{ fontSize: '0.62rem', color: C.textMuted }}>{t.user_name_ar || t.user_email}</span>
                      <span style={{ fontSize: '0.62rem', color: C.textMuted }}>💬{t.message_count}</span>
                      {hasUserReply && <span style={{ fontSize: '0.58rem', background: '#3b82f620', color: '#3b82f6', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>رد جديد</span>}
                    </div>
                    {t.last_message && (
                      <div style={{
                        fontSize: '0.72rem', color: C.textMuted,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {t.last_sender_role === 'admin' ? '🛡️ ' : '👤 '}{t.last_message}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {selectedTicket && (
          <div style={{
            background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Ticket header */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: `${C.bg}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', color: C.textMain, fontSize: '0.95rem', fontWeight: 800 }}>
                    #{selectedTicket.id} — {selectedTicket.subject}
                  </h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: C.textMuted }}>👤 {selectedTicket.user_name_ar || selectedTicket.user_email}</span>
                    {selectedTicket.institution_name_ar && <span style={{ fontSize: '0.7rem', color: C.teal }}>🏛️ {selectedTicket.institution_name_ar}</span>}
                    <span style={{ fontSize: '0.68rem', color: C.textMuted }}>📅 {formatDate(selectedTicket.created_at)}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTicket(null)} style={{
                  background: 'transparent', border: 'none', color: C.textMuted,
                  cursor: 'pointer', fontSize: '1.1rem', padding: 4,
                }}>✕</button>
              </div>

              {/* Status & Priority controls */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <select value={selectedTicket.status} onChange={e => updateTicketStatus(e.target.value)} style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: (STATUS_MAP[selectedTicket.status] || STATUS_MAP.open).color,
                  padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k} style={{ color: C.textMain, background: C.card }}>{v.label}</option>
                  ))}
                </select>
                <select value={selectedTicket.priority} onChange={e => updateTicketPriority(e.target.value)} style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: (PRIORITY_MAP[selectedTicket.priority] || PRIORITY_MAP.medium).color,
                  padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                    <option key={k} value={k} style={{ color: C.textMain, background: C.card }}>{v.emoji} {v.label}</option>
                  ))}
                </select>
                <span style={{
                  background: (CATEGORY_MAP[selectedTicket.category] || CATEGORY_MAP.general).emoji ? `${C.teal}10` : 'transparent',
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '4px 10px', fontSize: '0.72rem', color: C.textMuted,
                }}>
                  {(CATEGORY_MAP[selectedTicket.category] || CATEGORY_MAP.general).emoji} {(CATEGORY_MAP[selectedTicket.category] || CATEGORY_MAP.general).label}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px' }}>
              {ticketLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>⏳</div>
              ) : (
                <>
                  {messages.map((m: any, i: number) => {
                    const isAdmin = m.sender_role === 'admin';
                    return (
                      <div key={i} style={{
                        display: 'flex', gap: 10, marginBottom: 14,
                        justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                        flexDirection: isAdmin ? 'row-reverse' : 'row',
                      }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: isAdmin
                            ? `linear-gradient(135deg, ${C.teal}, ${C.softGreen})`
                            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', color: '#fff',
                        }}>
                          {isAdmin ? '🛡️' : '👤'}
                        </div>
                        <div style={{
                          background: isAdmin ? 'rgba(78,141,156,0.08)' : 'rgba(99,102,241,0.06)',
                          border: `1px solid ${isAdmin ? 'rgba(78,141,156,0.18)' : 'rgba(99,102,241,0.15)'}`,
                          borderRadius: isAdmin ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          padding: '10px 14px', maxWidth: '72%',
                        }}>
                          <div style={{ fontSize: '0.65rem', color: isAdmin ? C.teal : '#8b5cf6', fontWeight: 700, marginBottom: 3 }}>
                            {isAdmin ? `🛡️ ${m.sender_name_ar || 'الإدارة'}` : `👤 ${m.sender_name_ar || m.sender_name || 'المستخدم'}`}
                          </div>
                          <div style={{
                            fontSize: '0.85rem', color: C.textMain, lineHeight: 1.7,
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          }}>{m.message}</div>
                          {m.attachment_url && (
                            <div style={{ marginTop: 6 }}>
                              {/\.(jpg|jpeg|png|gif|webp)$/i.test(m.attachment_name || '') ? (
                                <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                                  <img src={m.attachment_url} alt={m.attachment_name} style={{ maxWidth: 220, maxHeight: 180, borderRadius: 8, cursor: 'pointer' }} />
                                </a>
                              ) : (
                                <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  background: 'rgba(78,141,156,0.1)', border: `1px solid ${C.border}`,
                                  borderRadius: 8, padding: '6px 12px', color: C.teal,
                                  fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none',
                                }}>📎 {m.attachment_name || 'ملف مرفق'}</a>
                              )}
                            </div>
                          )}
                          <div style={{ fontSize: '0.58rem', color: C.textMuted, marginTop: 4 }}>{formatDate(m.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Reply input */}
            {selectedTicket.status !== 'closed' && (
              <div style={{ borderTop: `1px solid ${C.border}` }}>
                {/* Attachment preview */}
                {attachFile && (
                  <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: C.teal, fontWeight: 600 }}>📎 {attachFile.name}</span>
                    <span style={{ fontSize: '0.65rem', color: C.textMuted }}>({(attachFile.size / 1024).toFixed(0)} KB)</span>
                    <button onClick={() => setAttachFile(null)} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: '0.8rem', padding: 2 }}>✕</button>
                    {sending && uploadProgress > 0 && uploadProgress < 100 && (
                      <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2 }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: C.teal, borderRadius: 2, transition: 'width 0.2s' }} />
                      </div>
                    )}
                  </div>
                )}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setAttachFile(e.target.files[0]); e.target.value = ''; }} />
                  <button onClick={() => fileInputRef.current?.click()} title="إرفاق ملف" style={{
                    background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10,
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '1rem', color: C.textMuted, flexShrink: 0,
                  }}>📎</button>
                  <textarea
                    value={reply} onChange={e => setReply(e.target.value)}
                    placeholder="اكتب ردك كمسؤول دعم..."
                    rows={2}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                    style={{
                      flex: 1, padding: '10px 14px', background: C.bg,
                      border: `1px solid ${C.border}`, borderRadius: 12, color: C.textMain,
                      fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
                      resize: 'none', minHeight: 44,
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = C.teal}
                    onBlur={e => e.currentTarget.style.borderColor = C.border}
                  />
                  {/* Quick status buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button onClick={() => { handleReply(); setTimeout(() => updateTicketStatus('waiting'), 500); }} disabled={(!reply.trim() && !attachFile) || sending}
                      title="رد + بانتظار المستخدم"
                      style={{
                        background: (reply.trim() || attachFile) ? 'rgba(168,85,247,0.15)' : C.border,
                        border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8,
                        color: '#a855f7', padding: '6px 10px', cursor: (reply.trim() || attachFile) ? 'pointer' : 'default',
                        fontSize: '0.65rem', fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap',
                      }}>⏳ رد+انتظار</button>
                    <button onClick={() => { handleReply(); setTimeout(() => updateTicketStatus('resolved'), 500); }} disabled={(!reply.trim() && !attachFile) || sending}
                      title="رد + تم الحل"
                      style={{
                        background: (reply.trim() || attachFile) ? 'rgba(34,197,94,0.15)' : C.border,
                        border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8,
                        color: '#22c55e', padding: '6px 10px', cursor: (reply.trim() || attachFile) ? 'pointer' : 'default',
                        fontSize: '0.65rem', fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap',
                      }}>✅ رد+حل</button>
                  </div>
                  <button onClick={handleReply} disabled={sending || (!reply.trim() && !attachFile)} style={{
                    background: ((!reply.trim() && !attachFile) || sending) ? C.border : `linear-gradient(135deg, ${C.teal}, ${C.softGreen})`,
                    border: 'none', borderRadius: 12, width: 44, height: 44,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: ((!reply.trim() && !attachFile) || sending) ? 'default' : 'pointer',
                    fontSize: '1rem', color: '#fff', flexShrink: 0,
                  }}>
                    {sending ? '⏳' : '📤'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        select option { background: #0d1129 !important; color: #e2e8f0 !important; }
      `}</style>
    </div>
  );
}
