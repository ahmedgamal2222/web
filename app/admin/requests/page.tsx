'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── brand palette (matches admin dashboard) ────────────────────────────────
const C = {
  lightMint: '#EDF7BD',
  softGreen: '#85C79A',
  teal:      '#4E8D9C',
  darkNavy:  '#281C59',
};

// ─── types ───────────────────────────────────────────────────────────────────
interface InstitutionRequest {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  type: string;
  sub_type?: string;
  country: string;
  city: string;
  address?: string;
  email: string;
  phone?: string;
  website?: string;
  registration_number?: string;
  founded_year?: number;
  employees_count?: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by?: number;
  submitted_at?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  rejection_reason?: string;
  screen_password?: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const TYPE_LABELS: Record<string, string> = {
  educational:   'تعليمية',
  research:      'بحثية',
  cultural:      'ثقافية',
  charitable:    'خيرية',
  media:         'إعلامية',
  developmental: 'تنموية',
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fef3c7' },
  approved: { label: 'مقبول',         color: '#10b981', bg: '#d1fae5' },
  rejected: { label: 'مرفوض',         color: '#ef4444', bg: '#fee2e2' },
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ─── modal: full request detail + approve / reject ───────────────────────────
function RequestModal({
  req,
  onClose,
  onAction,
}: {
  req: InstitutionRequest;
  onClose: () => void;
  onAction: (id: number, action: 'approved' | 'rejected', reason?: string) => Promise<void>;
}) {
  const [busy, setBusy]   = useState(false);
  const [reason, setReason] = useState('');
  const [mode, setMode]   = useState<'idle' | 'rejecting'>('idle');

  async function handle(action: 'approved' | 'rejected') {
    setBusy(true);
    await onAction(req.id, action, action === 'rejected' ? reason : undefined);
    setBusy(false);
    onClose();
  }

  const m = STATUS_META[req.status];

  const row = (label: string, value?: string | number | null) =>
    value != null && value !== '' ? (
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: '0.9rem' }}>
        <span style={{ color: '#888', minWidth: 140, flexShrink: 0 }}>{label}</span>
        <span style={{ color: '#ddd', wordBreak: 'break-word' }}>{value}</span>
      </div>
    ) : null;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        background: '#0f1221', borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.08)',
        width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto',
        fontFamily: "'Segoe UI', Tahoma, sans-serif", direction: 'rtl',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
      }}>
        {/* header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#e0e8ff' }}>
              {req.name_ar || req.name}
            </div>
            {req.name_en && req.name_en !== req.name && (
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 3 }}>{req.name_en}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem',
              background: m.bg, color: m.color, fontWeight: 600,
            }}>
              {m.label}
            </span>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#666',
              fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: 2,
            }}>✕</button>
          </div>
        </div>

        {/* body */}
        <div style={{ padding: '20px 24px' }}>
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ color: C.teal, fontSize: '0.85rem', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: 12 }}>المعلومات الأساسية</h3>
            {row('النوع',            TYPE_LABELS[req.type] || req.type)}
            {row('النوع الفرعي',    req.sub_type)}
            {row('الدولة',          req.country)}
            {row('المدينة',         req.city)}
            {row('العنوان',         req.address)}
            {row('سنة التأسيس',    req.founded_year)}
            {row('عدد الموظفين',   req.employees_count)}
          </section>

          <section style={{ marginBottom: 20 }}>
            <h3 style={{ color: C.teal, fontSize: '0.85rem', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: 12 }}>معلومات الاتصال</h3>
            {row('البريد الإلكتروني', req.email)}
            {row('الهاتف',          req.phone)}
            {row('الموقع',          req.website)}
            {row('رقم التسجيل',    req.registration_number)}
          </section>

          {req.description && (
            <section style={{ marginBottom: 20 }}>
              <h3 style={{ color: C.teal, fontSize: '0.85rem', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: 10 }}>وصف المؤسسة</h3>
              <p style={{ color: '#bbb', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
                {req.description}
              </p>
            </section>
          )}

          <section style={{ marginBottom: 20 }}>
            <h3 style={{ color: C.teal, fontSize: '0.85rem', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: 12 }}>بيانات الطلب</h3>
            {row('تاريخ التقديم',   fmtDate(req.submitted_at))}
            {row('تاريخ المراجعة', fmtDate(req.reviewed_at))}
            {req.rejection_reason && row('سبب الرفض', req.rejection_reason)}
            {req.screen_password  && row('كلمة مرور الشاشة', req.screen_password)}
          </section>

          {/* rejection reason input */}
          {mode === 'rejecting' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: '#ccc' }}>
                سبب الرفض (اختياري)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="اكتب سبب الرفض…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: 8, color: '#ddd', fontSize: '0.88rem',
                  outline: 'none', resize: 'vertical',
                }}
              />
            </div>
          )}
        </div>

        {/* actions — only for pending */}
        {req.status === 'pending' && (
          <div style={{
            padding: '16px 24px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
          }}>
            {mode === 'idle' ? (
              <>
                <button
                  onClick={() => setMode('rejecting')}
                  disabled={busy}
                  style={btnStyle('reject')}
                >
                  رفض الطلب
                </button>
                <button
                  onClick={() => handle('approved')}
                  disabled={busy}
                  style={btnStyle('approve')}
                >
                  {busy ? '…' : 'قبول الطلب ✓'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setMode('idle')} style={btnStyle('neutral')}>إلغاء</button>
                <button
                  onClick={() => handle('rejected')}
                  disabled={busy}
                  style={btnStyle('reject')}
                >
                  {busy ? '…' : 'تأكيد الرفض'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle(variant: 'approve' | 'reject' | 'neutral'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '9px 20px', borderRadius: 8, fontWeight: 600,
    fontSize: '0.88rem', cursor: 'pointer', border: 'none', transition: 'opacity 0.15s',
  };
  if (variant === 'approve') return { ...base, background: '#10b981', color: '#fff' };
  if (variant === 'reject')  return { ...base, background: '#ef4444', color: '#fff' };
  return { ...base, background: 'rgba(255,255,255,0.08)', color: '#ccc' };
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function AdminRequestsPage() {
  const router = useRouter();
  const [requests, setRequests]     = useState<InstitutionRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filter, setFilter]         = useState<FilterStatus>('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<InstitutionRequest | null>(null);
  const [actionMsg, setActionMsg]   = useState<string | null>(null);

  // ── auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login?redirect=/admin/requests'); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'admin' && parsed.role !== 'super_admin') {
      router.push('/');
    }
  }, [router]);

  // ── fetch ─────────────────────────────────────────────────────────────────
  async function loadRequests() {
    setLoading(true);
    setError(null);
    try {
      const sid = localStorage.getItem('sessionId') || '';
      const res = await fetch('/api/institution-requests', {
        headers: { 'X-Session-ID': sid },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRequests(json.data ?? json.requests ?? []);
    } catch (e: any) {
      setError(e.message || 'فشل جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, []);

  // ── action (approve / reject) ─────────────────────────────────────────────
  async function handleAction(
    id: number,
    action: 'approved' | 'rejected',
    reason?: string,
  ) {
    const sid = localStorage.getItem('sessionId') || '';
    const res = await fetch(`/api/institution-requests/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
      body: JSON.stringify({
        action: action === 'approved' ? 'approve' : 'reject',
        notes: reason,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'فشل تحديث الطلب');
    }
    const label = action === 'approved' ? 'تم القبول' : 'تم الرفض';
    setActionMsg(label);
    setTimeout(() => setActionMsg(null), 3000);
    await loadRequests();
  }

  // ── filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return (
        (r.name_ar || r.name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.country || '').toLowerCase().includes(q)
      );
    });
  }, [requests, filter, search]);

  // ── counts ────────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#060810',
      color: '#e0e8ff',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      direction: 'rtl',
    }}>

      {/* ── top nav ── */}
      <header style={{
        background: 'rgba(6,8,16,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '0 24px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/admin" style={{
              fontSize: '0.82rem', color: '#888', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              ← لوحة التحكم
            </Link>
            <span style={{ color: '#333' }}>|</span>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#c8d4ff' }}>
              طلبات المؤسسات
            </span>
          </div>
          <button
            onClick={loadRequests}
            style={{
              padding: '7px 16px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#aaa', fontSize: '0.82rem', cursor: 'pointer',
            }}
          >
            ↺ تحديث
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── summary cards ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, marginBottom: 28,
        }}>
          {([
            { key: 'all',      label: 'إجمالي الطلبات', color: '#9BB0FF' },
            { key: 'pending',  label: 'قيد المراجعة',   color: '#f59e0b' },
            { key: 'approved', label: 'مقبولة',         color: '#10b981' },
            { key: 'rejected', label: 'مرفوضة',         color: '#ef4444' },
          ] as { key: FilterStatus; label: string; color: string }[]).map(card => (
            <button
              key={card.key}
              onClick={() => setFilter(card.key)}
              style={{
                background: filter === card.key
                  ? `${card.color}18`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filter === card.key ? card.color + '55' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 14, padding: '18px 20px',
                textAlign: 'right', cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: card.color }}>
                {counts[card.key]}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>{card.label}</div>
            </button>
          ))}
        </div>

        {/* ── search ── */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="search"
            placeholder="بحث باسم المؤسسة أو البريد أو الدولة…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '11px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: '#ddd', fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* ── action flash ── */}
        {actionMsg && (
          <div style={{
            marginBottom: 16,
            padding: '11px 18px', borderRadius: 8,
            background: '#10b98120', border: '1px solid #10b981',
            color: '#10b981', fontSize: '0.9rem',
          }}>
            ✓ {actionMsg}
          </div>
        )}

        {/* ── error ── */}
        {error && (
          <div style={{
            marginBottom: 16,
            padding: '11px 18px', borderRadius: 8,
            background: '#ef444420', border: '1px solid #ef4444',
            color: '#ef4444', fontSize: '0.9rem',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── table ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
            <div style={{
              width: 42, height: 42, margin: '0 auto 16px',
              border: '3px solid rgba(155,176,255,0.15)',
              borderTopColor: '#9BB0FF', borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            جاري التحميل…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0', color: '#444',
            background: 'rgba(255,255,255,0.02)', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            لا توجد طلبات مطابقة
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {/* table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 120px 120px 100px 90px',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '0.75rem', color: '#666',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>المؤسسة</span>
              <span>النوع</span>
              <span>الدولة</span>
              <span>البريد</span>
              <span>تاريخ الطلب</span>
              <span style={{ textAlign: 'left' }}>الحالة</span>
            </div>

            {/* rows */}
            {filtered.map((req, idx) => {
              const m = STATUS_META[req.status];
              return (
                <div
                  key={req.id}
                  onClick={() => setSelected(req)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 120px 120px 100px 90px',
                    padding: '14px 20px',
                    borderBottom: idx < filtered.length - 1
                      ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: 'pointer', transition: 'background 0.13s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(155,176,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#dde6ff' }}>
                      {req.name_ar || req.name}
                    </div>
                    {req.city && (
                      <div style={{ fontSize: '0.75rem', color: '#555', marginTop: 2 }}>
                        {req.city}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#999' }}>
                    {TYPE_LABELS[req.type] || req.type}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#999' }}>{req.country}</span>
                  <span style={{
                    fontSize: '0.78rem', color: '#666',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{req.email}</span>
                  <span style={{ fontSize: '0.78rem', color: '#555' }}>
                    {fmtDate(req.submitted_at)}
                  </span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    padding: '3px 10px', borderRadius: 20,
                    background: m.bg, color: m.color,
                    whiteSpace: 'nowrap', textAlign: 'center',
                  }}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* result count */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.78rem', color: '#444' }}>
            عرض {filtered.length} من {requests.length} طلب
          </div>
        )}
      </main>

      {/* ── detail modal ── */}
      {selected && (
        <RequestModal
          req={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
